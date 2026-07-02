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

// Create a new private gist holding the state. Returns the new gist id.
export async function createGist(token, state) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Meal Planner app data (do not edit by hand)',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } },
    }),
  })
  if (!res.ok) throw new Error(`Create gist failed (${res.status})`)
  const data = await res.json()
  return data.id
}

// Push local state to an existing gist (overwrite the file).
export async function pushGist(token, gistId, state) {
  const res = await fetch(`${API}/${gistId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } } }),
  })
  if (!res.ok) throw new Error(`Push failed (${res.status})`)
  return true
}

// Pull remote state. Returns the parsed state object, or null if the gist/file is empty.
export async function pullGist(token, gistId) {
  const res = await fetch(`${API}/${gistId}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`Pull failed (${res.status})`)
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
