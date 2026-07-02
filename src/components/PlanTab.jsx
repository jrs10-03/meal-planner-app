import { useState } from 'react'
import { Icon } from './Icons.jsx'
import { Modal, EmptyState, Chip, Toast } from './ui.jsx'
import RecipePicker from './RecipePicker.jsx'

const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function PlanTab({ state, actions }) {
  const { currentWeek, weekHistory, recipes } = state
  const [picking, setPicking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [toast, setToast] = useState('')

  function cookedIt(recipeId) {
    actions.markCooked(recipeId)
    const r = recipes.find((x) => x.id === recipeId)
    setToast(`Cooked ${r ? r.name : 'it'} 🔥`)
    setTimeout(() => setToast(''), 1500)
  }

  const slots = currentWeek?.slots || []

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{currentWeek ? currentWeek.label : 'This week'}</h2>
          {currentWeek && <p className="text-xs text-ink-faint">{slots.length} meal{slots.length !== 1 ? 's' : ''} planned</p>}
        </div>
        <button className="btn-outline" onClick={actions.startNewWeek}>Start new week</button>
      </div>

      {!currentWeek || slots.length === 0 ? (
        <EmptyState title="No meals planned" hint="Add recipes from your library to build this week's plan."
          action={<button className="btn-primary" onClick={() => { if (!currentWeek) actions.startNewWeek(); setPicking(true) }}><Icon.Plus /> Add a meal</button>} />
      ) : (
        <ul className="space-y-2">
          {slots.map((s, idx) => {
            const r = recipes.find((x) => x.id === s.recipeId)
            const name = r ? r.name : s.recipeName + ' (deleted)'
            return (
              <li key={s.id} className="card p-3">
                {/* Row 1: reorder + name + remove */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button className="text-ink-faint hover:text-accent disabled:opacity-20" disabled={idx === 0} onClick={() => actions.moveSlot(s.id, -1)}><Icon.Up /></button>
                    <button className="text-ink-faint hover:text-accent disabled:opacity-20" disabled={idx === slots.length - 1} onClick={() => actions.moveSlot(s.id, 1)}><Icon.Down /></button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{name}</div>
                    {r && r.timesCooked > 0 && <div className="text-xs text-ink-faint">cooked ×{r.timesCooked}</div>}
                  </div>
                  <button className="btn-ghost text-ink-faint !px-1.5" onClick={() => actions.removeSlot(s.id)} aria-label="Remove"><Icon.Close /></button>
                </div>
                {/* Row 2: day + lunch/dinner + cooked */}
                <div className="mt-2 flex items-center gap-2 pl-8">
                  <select className="rounded-lg border border-line bg-surface px-1.5 py-1 text-xs text-ink-soft" value={s.day || ''} onChange={(e) => actions.setSlotDay(s.id, e.target.value)}>
                    {DAYS.map((d) => <option key={d} value={d}>{d || 'Any day'}</option>)}
                  </select>
                  <Chip color="lunch" active={s.type === 'lunch'} onClick={() => actions.toggleSlotType(s.id)}>
                    {s.type === 'lunch' ? 'Lunch' : 'Dinner'}
                  </Chip>
                  {r && (
                    <button className="btn-outline ml-auto !px-2.5 !py-1.5 text-xs" onClick={() => cookedIt(r.id)}><Icon.Fire /> Cooked</button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {currentWeek && slots.length > 0 && (
        <button className="btn-outline mt-3 w-full" onClick={() => setPicking(true)}><Icon.Plus /> Add a meal</button>
      )}

      {/* Week history */}
      {weekHistory.length > 0 && (
        <div className="mt-8">
          <button className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-semibold text-ink-soft" onClick={() => setShowHistory((v) => !v)}>
            <span>Previous weeks ({weekHistory.length})</span>
            {showHistory ? <Icon.Up /> : <Icon.Down />}
          </button>
          {showHistory && (
            <div className="space-y-3">
              {weekHistory.map((w) => (
                <div key={w.id} className="card p-3">
                  <div className="mb-2 text-sm font-semibold">{w.label}</div>
                  <ul className="space-y-1 text-sm text-ink-soft">
                    {w.slots.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={s.type === 'lunch' ? 'chip border-amber-200 bg-amber-50 text-amber-700 !py-0.5 !text-[10px]' : 'chip border-line bg-surface !py-0.5 !text-[10px]'}>{s.type}</span>
                        {s.day && <span className="text-xs text-ink-faint">{s.day}</span>}
                        <span>{s.recipeName}</span>
                      </li>
                    ))}
                    {w.slots.length === 0 && <li className="text-xs text-ink-faint">No meals recorded.</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={picking} onClose={() => setPicking(false)} title="Add a meal" wide>
        <RecipePicker state={state} onPick={(id) => actions.addSlot(id)} />
      </Modal>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
