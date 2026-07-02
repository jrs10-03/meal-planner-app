import { useMemo, useState } from 'react'
import { Icon } from './Icons.jsx'
import { Modal, ConfirmButton, EmptyState, Chip } from './ui.jsx'
import RecipeForm from './RecipeForm.jsx'
import CategoryManager from './CategoryManager.jsx'
import { SORTS, filterRecipes, sortRecipes } from '../lib/recipes.js'
import { relativeTime } from '../lib/util.js'

function fmtQty(i) {
  if (i.quantity == null) return ''
  const q = Number.isInteger(i.quantity) ? i.quantity : Math.round(i.quantity * 100) / 100
  return `${q}${i.unit ? ' ' + i.unit : ''} `
}

export default function RecipesTab({ state, actions }) {
  const { recipes, categories } = state
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent') // auto: newest by date added; dropdown = manual override
  const [editing, setEditing] = useState(null) // recipe object or 'new'
  const [detail, setDetail] = useState(null) // recipe id
  const [manageCats, setManageCats] = useState(false)

  const visible = useMemo(
    () => sortRecipes(filterRecipes(recipes, { category, query }), sort),
    [recipes, category, query, sort]
  )
  const detailRecipe = recipes.find((r) => r.id === detail)

  function handleSave(patch) {
    if (editing === 'new') actions.addRecipe(patch)
    else actions.updateRecipe(editing.id, patch)
    setEditing(null)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
      {/* Controls */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><Icon.Search /></span>
          <input className="input pl-9" placeholder="Search recipes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="btn-primary shrink-0" onClick={() => setEditing('new')}><Icon.Plus /> Add</button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Chip active={category === 'All'} onClick={() => setCategory('All')}>All</Chip>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
        <button className="btn-ghost text-xs !px-2 text-ink-faint" onClick={() => setManageCats(true)}>Edit</button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="text-ink-faint">Sort</span>
        <select className="rounded-lg border border-line bg-surface px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <span className="ml-auto text-ink-faint">{visible.length} recipe{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {recipes.length === 0 ? (
        <EmptyState title="No recipes yet" hint="Paste one in to get started — a website, a note, or a text from a friend."
          action={<button className="btn-primary" onClick={() => setEditing('new')}><Icon.Plus /> Add a recipe</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((r) => (
            <button key={r.id} onClick={() => setDetail(r.id)}
              className="card group p-4 text-left transition hover:border-accent/40 hover:shadow-pop">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{r.name}</h3>
                {r.sourceUrl && (
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 text-ink-faint hover:text-accent"><Icon.External /></a>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="chip border-accent/20 bg-accent-soft text-accent-hover">{r.category}</span>
                {r.timesCooked > 0 && <span className="text-xs text-ink-faint">cooked ×{r.timesCooked}</span>}
              </div>
              <p className="mt-2 text-xs text-ink-faint">Last made {relativeTime(r.lastCookedAt)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} wide
        title={editing === 'new' ? 'Add recipe' : 'Edit recipe'}>
        {editing && (
          <RecipeForm
            recipe={editing === 'new' ? null : editing}
            categories={categories}
            apiKey={state.settings.aiEnabled ? state.settings.apiKey : ''}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailRecipe} onClose={() => setDetail(null)} title={detailRecipe?.name || ''} wide>
        {detailRecipe && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-accent/20 bg-accent-soft text-accent-hover">{detailRecipe.category}</span>
              <span className="text-xs text-ink-faint">Serves 2 · cooked ×{detailRecipe.timesCooked} · last made {relativeTime(detailRecipe.lastCookedAt)}</span>
              {detailRecipe.sourceUrl && (
                <a href={detailRecipe.sourceUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline">
                  <Icon.External /> source
                </a>
              )}
            </div>
            <div>
              <h4 className="mb-2 font-serif text-base font-semibold">Ingredients</h4>
              <ul className="space-y-1 text-sm">
                {detailRecipe.ingredients.map((i, idx) => (
                  <li key={idx} className="flex gap-2"><span className="text-accent">•</span><span><span className="text-ink-soft">{fmtQty(i)}</span>{i.name}</span></li>
                ))}
              </ul>
            </div>
            {detailRecipe.steps.length > 0 && (
              <div>
                <h4 className="mb-2 font-serif text-base font-semibold">Steps</h4>
                <ol className="space-y-2 text-sm">
                  {detailRecipe.steps.map((s, idx) => (
                    <li key={idx} className="flex gap-2"><span className="font-semibold text-accent">{idx + 1}.</span><span>{s}</span></li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex gap-2 border-t border-line pt-4">
              <button className="btn-outline" onClick={() => { const r = detailRecipe; setDetail(null); setEditing(r) }}><Icon.Edit /> Edit</button>
              <ConfirmButton className="btn-outline text-red-500" onConfirm={() => { actions.deleteRecipe(detailRecipe.id); setDetail(null) }}>
                <Icon.Trash /> Delete
              </ConfirmButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={manageCats} onClose={() => setManageCats(false)} title="Categories">
        <CategoryManager state={state} actions={actions} />
      </Modal>
    </div>
  )
}
