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

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}
