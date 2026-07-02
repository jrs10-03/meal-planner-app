// Small shared helpers.

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Human relative time, e.g. "3 weeks ago" / "never".
export function relativeTime(iso) {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'never'
  const diff = Date.now() - then
  const day = 86400000
  if (diff < day) return 'today'
  const days = Math.floor(diff / day)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

// "Week of Jun 29" style label from a Date.
export function weekLabel(date) {
  const d = date instanceof Date ? date : new Date(date)
  return 'Week of ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Local-timezone-safe parse of an <input type="date"> value ("2026-07-06").
// new Date("2026-07-06") would be UTC midnight and can land on the prior local day.
export function parseDateInput(str) {
  const [y, m, d] = String(str).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Format a Date for an <input type="date"> value.
export function toDateInputValue(date) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// The 7 day labels of a week starting at startISO, e.g. "Mon Jul 6".
export function weekDayOptions(startISO) {
  const s = new Date(startISO)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })
}

// "Jul 6 – Jul 12" for a 7-day week starting at startISO.
export function weekRangeLabel(startISO) {
  const s = new Date(startISO)
  const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}
