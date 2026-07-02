// Optional GitHub Gist sync. The whole app state is stored as one JSON file in a
// private gist. Conflict handling is timestamp-based (no field-level merge).

const GIST_FILENAME = 'mealplan.json'
const API = 'https://api.github.com/gists'

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function apiError(res, verb) {
  if (res.status === 401) {
    return new Error(`${verb} failed: GitHub rejected the token (401). Use a classic personal access token with the "gist" scope — fine-grained tokens don't work with the Gist API. Check the token copied over completely.`)
  }
  if (res.status === 404) {
    return new Error(`${verb} failed: gist not found (404). It may have been deleted on GitHub.`)
  }
  return new Error(`${verb} failed (${res.status})`)
}

// Find an existing Meal Planner gist on this account (so a second device attaches
// to the same gist instead of creating a duplicate). Returns the gist id or null.
export async function findExistingGist(token) {
  const res = await fetch(`${API}?per_page=100`, { headers: authHeaders(token) })
  if (!res.ok) throw apiError(res, 'Gist lookup')
  const gists = await res.json()
  const hit = gists.find((g) => g.files && g.files[GIST_FILENAME])
  return hit ? hit.id : null
}

// Create a new private gist holding the state. Returns the new gist id.
export async function createGist(token, state) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Meal Planner app data (do not edit by hand)',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(sanitizeForSync(state), null, 2) } },
    }),
  })
  if (!res.ok) throw apiError(res, 'Create gist')
  const data = await res.json()
  return data.id
}

// Settings are device-local: tokens/keys must never be synced. Pushing them broke
// sync badly — a pull would overwrite the device's (valid) token with whatever stale
// token was baked into the gist, causing unfixable 401s. It's also a secret in a gist.
export function sanitizeForSync(state) {
  return { ...state, settings: {} }
}

// Push local state to an existing gist (overwrite the file).
export async function pushGist(token, gistId, state) {
  const res = await fetch(`${API}/${gistId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(sanitizeForSync(state), null, 2) } } }),
  })
  if (!res.ok) throw apiError(res, 'Push')
  return true
}

// Pull remote state. Returns the parsed state object, or null if the gist/file is empty.
export async function pullGist(token, gistId) {
  const res = await fetch(`${API}/${gistId}`, { headers: authHeaders(token) })
  if (!res.ok) throw apiError(res, 'Pull')
  const data = await res.json()
  const file = data.files && data.files[GIST_FILENAME]
  if (!file) return null
  // Gists truncate large files; fetch raw_url in that case.
  let content = file.content
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url)
    content = await raw.text()
  }
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

export const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  OFFLINE: 'offline',
  CONFLICT: 'conflict',
  ERROR: 'error',
}
