import { useState } from 'react'
import { useAppState } from './useAppState.js'
import { useKeyboardInset } from './components/ui.jsx'
import { Icon } from './components/Icons.jsx'
import RecipesTab from './components/RecipesTab.jsx'
import PlanTab from './components/PlanTab.jsx'
import ListTab from './components/ListTab.jsx'
import GearPopover from './components/GearPopover.jsx'
import { SyncStatus } from './lib/sync.js'
import { classNames } from './lib/util.js'

const TABS = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'plan', label: 'Plan' },
  { id: 'list', label: 'List' },
]

const DOT = {
  [SyncStatus.SYNCED]: 'bg-green-500',
  [SyncStatus.SYNCING]: 'bg-amber-400 animate-pulse',
  [SyncStatus.OFFLINE]: 'bg-gray-400',
  [SyncStatus.CONFLICT]: 'bg-red-500',
  [SyncStatus.ERROR]: 'bg-red-500',
  [SyncStatus.IDLE]: 'bg-gray-300',
}

export default function App() {
  const { state, actions, sync } = useAppState()
  useKeyboardInset()
  const [tab, setTab] = useState('recipes')
  const [gearOpen, setGearOpen] = useState(false)
  const syncConfigured = !!state.settings.gistToken

  return (
    <div className="min-h-[100dvh]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            <Icon.Fire />
          </div>
          <h1 className="font-serif text-lg font-bold">Meal Planner</h1>
          <div className="ml-auto flex items-center gap-2">
            {syncConfigured && (
              <span className="flex items-center gap-1.5 text-xs text-ink-faint" title={sync.message}>
                <span className={classNames('h-2 w-2 rounded-full', DOT[sync.status] || DOT.idle)} />
              </span>
            )}
            <button className="btn-ghost !px-2" onClick={() => setGearOpen(true)} aria-label="Settings"><Icon.Gear /></button>
          </div>
        </div>
        {/* Tabs */}
        <nav className="mx-auto flex max-w-3xl gap-1 px-4 pb-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={classNames(
                'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
                tab === t.id ? 'bg-accent text-white shadow-sm' : 'text-ink-soft hover:bg-black/[0.04]'
              )}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ paddingBottom: 'var(--kb, 0px)' }}>
        {tab === 'recipes' && <RecipesTab state={state} actions={actions} />}
        {tab === 'plan' && <PlanTab state={state} actions={actions} />}
        {tab === 'list' && <ListTab state={state} actions={actions} />}
      </main>

      <GearPopover open={gearOpen} onClose={() => setGearOpen(false)} state={state} actions={actions} sync={sync} />
    </div>
  )
}
