import { useState } from 'react'
import { Icon } from './Icons.jsx'
import { Modal, EmptyState, Chip, Toast, ConfirmButton } from './ui.jsx'
import RecipePicker from './RecipePicker.jsx'
import RecipeDetail from './RecipeDetail.jsx'
import { parseDateInput, toDateInputValue, weekDayOptions, weekRangeLabel, todayStr } from '../lib/util.js'

// Non-recipe slot kinds.
const SPECIAL = {
  out: { name: 'Eating out', emoji: '🍴', notePlaceholder: 'Where / with whom…' },
  leftovers: { name: 'Leftovers', emoji: '♻️', notePlaceholder: 'Leftovers of what…' },
}

// Group slots by their assigned day, in week order; unassigned meals form the
// trailing "Any day" group. Day labels from other weeks keep their own group.
function groupSlots(slots, startDate) {
  const opts = startDate ? weekDayOptions(startDate) : []
  const byDay = new Map()
  const anyDay = []
  for (const s of slots) {
    if (s.day) {
      if (!byDay.has(s.day)) byDay.set(s.day, [])
      byDay.get(s.day).push(s)
    } else anyDay.push(s)
  }
  const groups = []
  for (const d of opts) {
    if (byDay.has(d)) { groups.push({ day: d, slots: byDay.get(d) }); byDay.delete(d) }
  }
  for (const [d, arr] of byDay) groups.push({ day: d, slots: arr })
  if (anyDay.length) groups.push({ day: null, slots: anyDay })
  return groups
}

// Day labels look like "Mon, Jul 6" — split into weekday + date for the header.
function DayHeading({ day, isToday }) {
  const [weekday, date] = day ? day.split(', ') : []
  return (
    <div className="mb-2 flex items-center gap-2">
      {day ? (
        <>
          <span className={
            isToday
              ? 'grid min-w-[3rem] place-items-center rounded-lg bg-accent px-2 py-1 text-xs font-bold uppercase tracking-wide text-white'
              : 'grid min-w-[3rem] place-items-center rounded-lg bg-accent-soft px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-hover'
          }>
            {weekday}
          </span>
          <span className="text-sm font-semibold text-ink-soft">{date}</span>
          {isToday && <span className="text-xs font-medium text-accent">Today</span>}
        </>
      ) : (
        <>
          <span className="grid min-w-[3rem] place-items-center rounded-lg border border-dashed border-line bg-surface px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink-faint">Any</span>
          <span className="text-sm font-semibold text-ink-soft">Any day</span>
        </>
      )}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

export default function PlanTab({ state, actions }) {
  const { currentWeek, weekHistory, recipes } = state
  const [picking, setPicking] = useState(false)
  const [toast, setToast] = useState('')
  const [newWeekOpen, setNewWeekOpen] = useState(false)
  const [startInput, setStartInput] = useState(() => toDateInputValue(new Date()))
  const [viewId, setViewId] = useState(null) // recipe id being viewed from the plan
  // Week pager: 0 = current week, 1..N = weekHistory[viewIdx - 1] (newest first).
  const [viewIdx, setViewIdx] = useState(0)
  const viewRecipe = recipes.find((x) => x.id === viewId)

  const viewingPast = viewIdx > 0
  const pastWeek = viewingPast ? weekHistory[viewIdx - 1] : null
  const week = viewingPast ? pastWeek : currentWeek
  const slots = week?.slots || []
  const groups = week ? groupSlots(slots, week.startDate) : []
  const todayLabel = weekDayOptions(new Date().toISOString())[0]

  function cookedIt(recipeId) {
    const r = recipes.find((x) => x.id === recipeId)
    const alreadyToday = r && (r.cookLog || []).includes(todayStr())
    actions.markCooked(recipeId)
    setToast(alreadyToday ? 'Already logged today' : `Cooked ${r ? r.name : 'it'} 🔥`)
    setTimeout(() => setToast(''), 1500)
  }

  function startWeek() {
    actions.startNewWeek(parseDateInput(startInput).toISOString())
    setNewWeekOpen(false)
    setViewIdx(0)
  }

  function addSpecial(kind) {
    actions.addSpecialSlot(kind)
    setPicking(false)
  }

  function deletePastWeek() {
    actions.deleteWeek(pastWeek.id)
    setViewIdx((i) => Math.min(i, weekHistory.length - 1))
  }

  // Recipe slot card (current week only — past weeks render read-only rows).
  function SlotCard({ s, group, posInGroup }) {
    const special = SPECIAL[s.kind]
    const r = special ? null : recipes.find((x) => x.id === s.recipeId)
    const name = special ? special.name : r ? r.name : s.recipeName + ' (deleted)'
    const dayOpts = currentWeek ? weekDayOptions(currentWeek.startDate) : []
    const prev = group.slots[posInGroup - 1]
    const next = group.slots[posInGroup + 1]
    return (
      <li className={special ? 'card border-dashed p-3' : 'card p-3'}>
        {/* Row 1: reorder-within-day + name + remove */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <button className="text-ink-faint hover:text-accent disabled:opacity-20" disabled={!prev} onClick={() => prev && actions.swapSlots(s.id, prev.id)}><Icon.Up /></button>
            <button className="text-ink-faint hover:text-accent disabled:opacity-20" disabled={!next} onClick={() => next && actions.swapSlots(s.id, next.id)}><Icon.Down /></button>
          </div>
          <div className="min-w-0 flex-1">
            {r ? (
              <button
                className="flex max-w-full items-center gap-1 truncate text-left font-medium hover:text-accent"
                onClick={() => setViewId(r.id)}
                title="View recipe"
              >
                <span className="truncate">{name}</span>
                <Icon.Chevron className="shrink-0 text-ink-faint" />
              </button>
            ) : (
              <div className="truncate font-medium">{special && <span className="mr-1">{special.emoji}</span>}{name}</div>
            )}
            {special ? (
              <input
                className="mt-0.5 w-full bg-transparent text-xs text-ink-soft outline-none placeholder:text-ink-faint"
                value={s.note || ''}
                placeholder={special.notePlaceholder}
                onChange={(e) => actions.setSlotNote(s.id, e.target.value)}
              />
            ) : (
              r && r.timesCooked > 0 && <div className="text-xs text-ink-faint">cooked ×{r.timesCooked}</div>
            )}
          </div>
          <button className="btn-ghost text-ink-faint !px-1.5" onClick={() => actions.removeSlot(s.id)} aria-label="Remove"><Icon.Close /></button>
        </div>
        {/* Row 2: day + lunch/dinner + cooked */}
        <div className="mt-2 flex items-center gap-2 pl-8">
          <select className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm font-medium text-ink" value={s.day || ''} onChange={(e) => actions.setSlotDay(s.id, e.target.value)}>
            <option value="">Any day</option>
            {s.day && !dayOpts.includes(s.day) && <option value={s.day}>{s.day}</option>}
            {dayOpts.map((d) => <option key={d} value={d}>{d}</option>)}
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
  }

  // Read-only row for a past week's slot; recipe names still open the recipe.
  function PastSlotRow({ s }) {
    const special = SPECIAL[s.kind]
    const r = special ? null : recipes.find((x) => x.id === s.recipeId)
    return (
      <li className={special ? 'card border-dashed p-3' : 'card p-3'}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {r ? (
              <button className="flex max-w-full items-center gap-1 truncate text-left font-medium hover:text-accent" onClick={() => setViewId(r.id)} title="View recipe">
                <span className="truncate">{s.recipeName}</span>
                <Icon.Chevron className="shrink-0 text-ink-faint" />
              </button>
            ) : (
              <div className="truncate font-medium">{special && <span className="mr-1">{special.emoji}</span>}{s.recipeName}</div>
            )}
            {s.note && <div className="text-xs text-ink-faint">{s.note}</div>}
          </div>
          <Chip color="lunch" active={s.type === 'lunch'}>{s.type === 'lunch' ? 'Lunch' : 'Dinner'}</Chip>
        </div>
      </li>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4">
      {/* Header: week pager + start new week */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost !px-2"
            aria-label="Previous week"
            disabled={viewIdx >= weekHistory.length}
            onClick={() => setViewIdx((i) => Math.min(i + 1, weekHistory.length))}
          >
            <Icon.Chevron className="rotate-180" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{week ? week.label : 'This week'}</h2>
            {week && (
              <>
                <p className="mt-0.5 text-lg font-medium text-ink-soft">{weekRangeLabel(week.startDate)}</p>
                <p className="text-xs text-ink-faint">
                  {viewingPast
                    ? `${viewIdx} week${viewIdx !== 1 ? 's' : ''} back`
                    : `${slots.length} meal${slots.length !== 1 ? 's' : ''} planned`}
                </p>
              </>
            )}
          </div>
          <button
            className="btn-ghost !px-2"
            aria-label="Next week"
            disabled={viewIdx === 0}
            onClick={() => setViewIdx((i) => Math.max(i - 1, 0))}
          >
            <Icon.Chevron />
          </button>
        </div>
        <button className="btn-outline shrink-0" onClick={() => { setStartInput(toDateInputValue(new Date())); setNewWeekOpen(true) }}>
          Start new week
        </button>
      </div>

      {viewingPast ? (
        <>
          <div className="mb-3 flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
            <span className="text-xs font-medium text-ink-soft">Viewing a past week (read-only)</span>
            <ConfirmButton className="btn-ghost text-red-500 !py-1 text-xs" confirmLabel="Delete week" onConfirm={deletePastWeek}>
              <Icon.Trash /> Delete week
            </ConfirmButton>
          </div>
          {slots.length === 0 ? (
            <EmptyState title="No meals recorded" hint="This week was saved without any meals." />
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.day || 'any'}>
                  <DayHeading day={g.day} isToday={false} />
                  <ul className="space-y-2">
                    {g.slots.map((s, i) => <PastSlotRow key={i} s={s} />)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {(!currentWeek || slots.length === 0) ? (
            <EmptyState title="No meals planned" hint="Add recipes from your library to build this week's plan."
              action={<button className="btn-primary" onClick={() => { if (!currentWeek) actions.startNewWeek(); setPicking(true) }}><Icon.Plus /> Add a meal</button>} />
          ) : (
            <>
              <button className="btn-primary mb-4 w-full" onClick={() => setPicking(true)}><Icon.Plus /> Add a meal</button>
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.day || 'any'}>
                    <DayHeading day={g.day} isToday={g.day === todayLabel} />
                    <ul className="space-y-2">
                      {g.slots.map((s, i) => <SlotCard key={s.id} s={s} group={g} posInGroup={i} />)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Recipe picker + special quick-adds */}
      <Modal open={picking} onClose={() => setPicking(false)} title="Add a meal" wide>
        <div className="mb-3 flex gap-2">
          <button className="btn-outline flex-1" onClick={() => addSpecial('out')}>🍴 Eating out</button>
          <button className="btn-outline flex-1" onClick={() => addSpecial('leftovers')}>♻️ Leftovers</button>
        </div>
        <RecipePicker state={state} onPick={(id) => actions.addSlot(id)} />
      </Modal>

      {/* New week with a chosen start date */}
      <Modal open={newWeekOpen} onClose={() => setNewWeekOpen(false)} title="Start a new week">
        <div className="space-y-4">
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={startInput} onChange={(e) => setStartInput(e.target.value)} />
            {startInput && (
              <p className="mt-1.5 text-xs text-ink-faint">
                7 days: {weekRangeLabel(parseDateInput(startInput).toISOString())}
              </p>
            )}
          </div>
          {currentWeek && (currentWeek.slots || []).length > 0 && (
            <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-ink-soft">
              The current week ({currentWeek.label}) will be saved to Previous weeks.
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={startWeek} disabled={!startInput}>Start week</button>
            <button className="btn-ghost" onClick={() => setNewWeekOpen(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* View a planned recipe, then return to the plan */}
      <Modal open={!!viewRecipe} onClose={() => setViewId(null)} title={viewRecipe?.name || ''} wide>
        {viewRecipe && (
          <RecipeDetail
            recipe={viewRecipe}
            actions={actions}
            footer={
              <button className="btn-primary" onClick={() => setViewId(null)}>
                <Icon.Up className="-rotate-90" /> Back to plan
              </button>
            }
          />
        )}
      </Modal>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
