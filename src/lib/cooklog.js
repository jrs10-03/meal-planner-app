// Cook history lives on each recipe as `cookLog`: an array of local calendar
// dates ("YYYY-MM-DD"), newest first, at most one entry per day. `timesCooked`
// and `lastCookedAt` are DERIVED from the log — the count always equals the
// number of dated entries shown in history (v2.0 behavior; v1 preserved legacy
// counts, which let counts drift from the visible history).

import { parseDateInput, toDateInputValue } from './util.js'

// Local-calendar date string for an ISO timestamp (or null if unparseable).
export function isoToDateStr(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return toDateInputValue(d)
}

// ISO timestamp (local midnight) for a "YYYY-MM-DD" date string.
export function dateStrToISO(dateStr) {
  return parseDateInput(dateStr).toISOString()
}

// Recompute the derived fields from the log, keeping it sorted + de-duped.
export function syncCookedFields(recipe) {
  const seen = new Set()
  const log = (recipe.cookLog || [])
    .filter((d) => d && !seen.has(d) && seen.add(d))
    .sort((a, b) => b.localeCompare(a)) // newest first
  recipe.cookLog = log
  recipe.timesCooked = log.length
  recipe.lastCookedAt = log.length ? dateStrToISO(log[0]) : null
  return recipe
}

// Backfill cookLog for recipes created before this feature existed, seeding a
// single entry from the old lastCookedAt so history isn't blank for them.
export function ensureCookLog(recipe) {
  if (!Array.isArray(recipe.cookLog)) {
    const seed = isoToDateStr(recipe.lastCookedAt)
    recipe.cookLog = seed ? [seed] : []
  }
  return syncCookedFields(recipe)
}

// Add one cooked day. Returns false if that day is already logged (one/day rule).
export function addCookDay(recipe, dateStr) {
  ensureCookLog(recipe)
  if (recipe.cookLog.includes(dateStr)) return false
  recipe.cookLog.push(dateStr)
  syncCookedFields(recipe)
  return true
}

// Remove a logged day. No-op if it wasn't logged.
export function removeCookDay(recipe, dateStr) {
  ensureCookLog(recipe)
  recipe.cookLog = recipe.cookLog.filter((d) => d !== dateStr)
  return syncCookedFields(recipe)
}
