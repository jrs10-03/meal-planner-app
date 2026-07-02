import { useMemo, useState } from 'react'
import { Icon } from './Icons.jsx'
import { ConfirmButton, EmptyState, Toast } from './ui.jsx'
import { buildShoppingList, listToText } from '../lib/aggregate.js'

export default function ListTab({ state, actions }) {
  const { currentWeek, recipes, list, staples } = state
  const [manual, setManual] = useState('')
  const [toast, setToast] = useState('')

  const grouped = useMemo(() => {
    const slots = currentWeek?.slots || []
    const planned = slots.map((s) => recipes.find((r) => r.id === s.recipeId)).filter(Boolean)
    return buildShoppingList(planned, staples)
  }, [currentWeek, recipes, staples])

  const totalItems = grouped.reduce((n, g) => n + g.items.length, 0) + list.manual.length
  const checkedCount = grouped.reduce((n, g) => n + g.items.filter((i) => list.checked[i.key]).length, 0)
    + list.manual.filter((m) => m.checked).length

  async function copy() {
    const text = listToText(grouped, list.checked, list.manual)
    try {
      await navigator.clipboard.writeText(text)
      setToast('Copied to clipboard')
    } catch {
      setToast('Copy failed — select and copy manually')
    }
    setTimeout(() => setToast(''), 1500)
  }

  function addManual() {
    if (!manual.trim()) return
    actions.addManual(manual)
    setManual('')
  }

  if (totalItems === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <EmptyState title="Your list is empty" hint="Plan some meals and their ingredients show up here, grouped by aisle." />
        <div className="mx-auto flex max-w-sm gap-2">
          <input className="input" placeholder="Add a one-off item…" value={manual} onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManual()} />
          <button className="btn-primary" onClick={addManual}><Icon.Plus /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Shopping list</h2>
          <p className="text-xs text-ink-faint">{checkedCount}/{totalItems} checked</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={copy}><Icon.Copy /> Copy</button>
          <ConfirmButton className="btn-outline text-red-500" confirmLabel="Clear all" onConfirm={actions.clearList}>Clear</ConfirmButton>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Add a one-off item (paper towels…)" value={manual} onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManual()} />
        <button className="btn-primary" onClick={addManual}><Icon.Plus /></button>
      </div>

      <div className="space-y-5">
        {grouped.map((grp) => {
          const unchecked = grp.items.filter((i) => !list.checked[i.key])
          const checked = grp.items.filter((i) => list.checked[i.key])
          const ordered = [...unchecked, ...checked]
          return (
            <div key={grp.section}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{grp.section}</h3>
              <ul className="card divide-y divide-line overflow-hidden">
                {ordered.map((it) => {
                  const isChecked = !!list.checked[it.key]
                  return (
                    <li key={it.key}>
                      <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => actions.toggleChecked(it.key)}>
                        <span className="tick" data-checked={isChecked}>{isChecked && <Icon.Check />}</span>
                        <span className={isChecked ? 'flex-1 text-ink-faint line-through' : 'flex-1'}>
                          {it.name}
                          {it.note && <span className="ml-1.5 text-xs text-ink-faint">— {it.note}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        {/* Manual items */}
        {list.manual.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Added</h3>
            <ul className="card divide-y divide-line overflow-hidden">
              {[...list.manual].sort((a, b) => a.checked - b.checked).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                  <button className="tick" data-checked={m.checked} onClick={() => actions.toggleManual(m.id)}>{m.checked && <Icon.Check />}</button>
                  <span className={m.checked ? 'flex-1 text-ink-faint line-through' : 'flex-1'}>{m.name}</span>
                  <button className="btn-ghost text-ink-faint !px-1.5" onClick={() => actions.removeManual(m.id)}><Icon.Close /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        Only large quantities show a total — everything else is just "grab one."
      </p>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
