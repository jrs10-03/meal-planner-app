// Shared recipe filtering/sorting used by the Recipes tab and the plan picker.

export const SORTS = [
  { id: 'az', label: 'A–Z' },
  { id: 'cooked', label: 'Most cooked' },
  { id: 'stale', label: "Haven't made in a while" },
]

export function filterRecipes(recipes, { category = 'All', query = '' } = {}) {
  const q = query.trim().toLowerCase()
  return recipes.filter((r) => {
    if (category !== 'All' && r.category !== category) return false
    if (!q) return true
    if (r.name.toLowerCase().includes(q)) return true
    return (r.ingredients || []).some((i) => i.name.toLowerCase().includes(q))
  })
}

export function sortRecipes(recipes, sort = 'az') {
  const arr = [...recipes]
  if (sort === 'az') return arr.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'cooked') return arr.sort((a, b) => (b.timesCooked || 0) - (a.timesCooked || 0) || a.name.localeCompare(b.name))
  if (sort === 'stale') {
    // Never-cooked first, then oldest lastCookedAt first.
    return arr.sort((a, b) => {
      const at = a.lastCookedAt ? new Date(a.lastCookedAt).getTime() : -Infinity
      const bt = b.lastCookedAt ? new Date(b.lastCookedAt).getTime() : -Infinity
      return at - bt || a.name.localeCompare(b.name)
    })
  }
  return arr
}
