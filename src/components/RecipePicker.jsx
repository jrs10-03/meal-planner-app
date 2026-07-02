import { useMemo, useState } from 'react'
import { Icon } from './Icons.jsx'
import { Chip, EmptyState } from './ui.jsx'
import { SORTS, filterRecipes, sortRecipes } from '../lib/recipes.js'
import { relativeTime } from '../lib/util.js'

// Picker body (render inside a Modal). onPick(recipeId) can be called repeatedly.
export default function RecipePicker({ state, onPick }) {
  const { recipes, categories } = state
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('stale') // surface neglected favorites by default
  const [justAdded, setJustAdded] = useState(null)

  const visible = useMemo(
    () => sortRecipes(filterRecipes(recipes, { category, query }), sort),
    [recipes, category, query, sort]
  )

  function pick(id) {
    onPick(id)
    setJustAdded(id)
    setTimeout(() => setJustAdded((v) => (v === id ? null : v)), 900)
  }

  if (recipes.length === 0) {
    return <EmptyState title="No recipes to add" hint="Add recipes in the Recipes tab first." />
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><Icon.Search /></span>
        <input className="input pl-9" placeholder="Search recipes…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={category === 'All'} onClick={() => setCategory('All')}>All</Chip>
        {categories.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-faint">Sort</span>
        <select className="rounded-lg border border-line bg-surface px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <ul className="max-h-[52vh] space-y-2 overflow-y-auto">
        {visible.map((r) => (
          <li key={r.id}>
            <button onClick={() => pick(r.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-accent/40">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.name}</div>
                <div className="text-xs text-ink-faint">{r.category} · cooked ×{r.timesCooked} · {relativeTime(r.lastCookedAt)}</div>
              </div>
              {justAdded === r.id
                ? <span className="chip border-green-200 bg-green-50 text-green-600"><Icon.Check /> Added</span>
                : <span className="btn-primary !py-1.5 !px-2.5"><Icon.Plus /></span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
