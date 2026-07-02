// Single-key, versioned localStorage persistence for the whole app.
// The entire app state is one JSON object so sync (Gist) can round-trip it wholesale.

import { seedRecipes } from './seed.js'

export const STORAGE_KEY = 'mealplan:v1'
export const SCHEMA_VERSION = 1

export const DEFAULT_CATEGORIES = [
  'Chicken',
  'Beef',
  'Pork',
  'Pasta',
  'Vegetarian',
  'Soup',
  'Other',
]

export const DEFAULT_STAPLES = [
  'salt',
  'pepper',
  'black pepper',
  'olive oil',
  'oil',
  'water',
  'butter',
]

export function nowISO() {
  return new Date().toISOString()
}

export function makeDefaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    lastModified: nowISO(),
    recipes: seedRecipes(),
    categories: [...DEFAULT_CATEGORIES],
    currentWeek: null, // { id, label, startDate, slots: [] }
    weekHistory: [], // [{ id, label, startDate, endedAt, slots: [{recipeId, recipeName, type, day}] }]
    // Shopping list overlay state. The list itself is derived from currentWeek,
    // but checked state + manual one-off items are persisted here.
    list: {
      checked: {}, // normalizedName -> true
      manual: [], // [{ id, name, checked }]
    },
    staples: [...DEFAULT_STAPLES],
    settings: {
      apiKey: '',
      gistToken: '',
      gistId: '',
      lastSyncedAt: null,
      lastSyncedModified: null, // the lastModified value at the moment of last successful sync
    },
  }
}

// Migration registry, keyed by the version you are migrating FROM.
const migrations = {
  // 1: (state) => { ...transform to v2...; state.schemaVersion = 2; return state },
}

function migrate(state) {
  let s = state
  while (s.schemaVersion < SCHEMA_VERSION && migrations[s.schemaVersion]) {
    s = migrations[s.schemaVersion](s)
  }
  // If versions still mismatch (unknown/older with no path), backfill missing keys.
  const def = makeDefaultState()
  return { ...def, ...s, schemaVersion: SCHEMA_VERSION, list: { ...def.list, ...(s.list || {}) }, settings: { ...def.settings, ...(s.settings || {}) } }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const fresh = makeDefaultState()
      saveState(fresh)
      return fresh
    }
    const parsed = JSON.parse(raw)
    return migrate(parsed)
  } catch (err) {
    console.error('Failed to load state, starting fresh:', err)
    const fresh = makeDefaultState()
    return fresh
  }
}

export function saveState(state, { touch = true } = {}) {
  const next = touch ? { ...state, lastModified: nowISO() } : state
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    console.error('Failed to save state:', err)
  }
  return next
}

// Import replaces the entire state (used by Backup import + sync "use remote").
export function importState(obj) {
  const migrated = migrate(obj)
  return saveState(migrated, { touch: false })
}

export function exportState(state) {
  return JSON.stringify(state, null, 2)
}
