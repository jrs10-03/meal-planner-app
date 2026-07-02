import { useState } from 'react'
import { Icon } from './Icons.jsx'
import { ConfirmButton } from './ui.jsx'

// Inline add/rename/delete for the user-managed category list.
export default function CategoryManager({ state, actions }) {
  const [adding, setAdding] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')

  const counts = state.recipes.reduce((m, r) => { m[r.category] = (m[r.category] || 0) + 1; return m }, {})

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="input" value={adding} placeholder="New category…" onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && adding.trim()) { actions.addCategory(adding.trim()); setAdding('') } }} />
        <button className="btn-primary" disabled={!adding.trim()} onClick={() => { actions.addCategory(adding.trim()); setAdding('') }}><Icon.Plus /></button>
      </div>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {state.categories.map((c) => (
          <li key={c} className="flex items-center gap-2 px-3 py-2">
            {renaming === c ? (
              <>
                <input className="input flex-1" value={renameVal} autoFocus onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && renameVal.trim()) { actions.renameCategory(c, renameVal.trim()); setRenaming(null) } }} />
                <button className="btn-primary !px-2" onClick={() => { if (renameVal.trim()) { actions.renameCategory(c, renameVal.trim()); setRenaming(null) } }}><Icon.Check /></button>
                <button className="btn-ghost !px-2" onClick={() => setRenaming(null)}><Icon.Close /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{c}</span>
                <span className="text-xs text-ink-faint">{counts[c] || 0}</span>
                <button className="btn-ghost !px-2" onClick={() => { setRenaming(c); setRenameVal(c) }}><Icon.Edit /></button>
                <ConfirmButton onConfirm={() => actions.deleteCategory(c)} />
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-faint">Deleting a category moves its recipes to the first remaining category.</p>
    </div>
  )
}
