// Cook history lives on each recipe as `cookLog`: an array of local calendar
// dates ("YYYY-MM-DD"), newest first, at most one entry per day. `lastCookedAt`
// is derived from the log; `timesCooked` is the running count. For recipes that
// predate this feature we only know their last-cooked date, so the count is
// PRESERVED rather than recomputed from the (partial) log — we never silently
// shrink a user's existing "cooked ×N".

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

// De-dupe + sort newest-first.
function cleanLog(log) {
  const seen = new Set()
  return (log || [])
    .filter((d) => d && !seen.has(d) && seen.add(d))
    .sort((a, b) => b.localeCompare(a))
}

// Backfill/normalize a recipe's cook history. Seeds a single dated entry from
// the legacy lastCookedAt when no log exists, and keeps the count consistent
// (never fewer than the dated events we can actually show).
export function ensureCookLog(recipe) {
  if (!Array.isArray(recipe.cookLog)) {
    const seed = isoToDateStr(recipe.lastCookedAt)
    recipe.cookLog = seed ? [seed] : []
  }
  recipe.cookLog = cleanLog(recipe.cookLog)
  if (typeof recipe.timesCooked !== 'number' || recipe.timesCooked < recipe.cookLog.length) {
    recipe.timesCooked = recipe.cookLog.length
  }
  return recipe
}

// Add one cooked day. Returns false if that day is already logged (one/day rule).
export function addCookDay(recipe, dateStr) {
  ensureCookLog(recipe)
  if (recipe.cookLog.includes(dateStr)) return false
  recipe.cookLog = cleanLog([...recipe.cookLog, dateStr])
  recipe.timesCooked = (recipe.timesCooked || 0) + 1
  recipe.lastCookedAt = dateStrToISO(recipe.cookLog[0])
  return true
}

// Remove a logged day. No-op if it wasn't logged. Keeps count >= remaining log.
export function removeCookDay(recipe, dateStr) {
  ensureCookLog(recipe)
  if (!recipe.cookLog.includes(dateStr)) return recipe
  recipe.cookLog = recipe.cookLog.filter((d) => d !== dateStr)
  recipe.timesCooked = Math.max(recipe.cookLog.length, (recipe.timesCooked || 1) - 1)
  recipe.lastCookedAt = recipe.cookLog.length ? dateStrToISO(recipe.cookLog[0]) : null
  return recipe
}
