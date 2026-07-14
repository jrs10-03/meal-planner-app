import { useEffect, useState } from 'react'
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
  { id: 'plan', label: 'Plan', icon: Icon.Calendar, prominent: true },
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
  const [tab, setTab] = useState('plan')
  const [gearOpen, setGearOpen] = useState(false)
  const syncConfigured = !!state.settings.gistToken
  const theme = state.settings.theme || 'system'

  // Apply light/dark by toggling the .dark class; 'system' tracks the OS
  // preference live. The theme-color meta keeps the iOS status bar matching.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#201D1A' : '#FAF9F5')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  return (
    <div className="min-h-[100dvh]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur">
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
        {/* Tabs — Plan is emphasized as the app's primary action. */}
        <nav className="mx-auto flex max-w-3xl items-stretch gap-1 px-4 pb-2">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={classNames(
                  'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition',
                  t.prominent ? 'flex-[1.4] font-semibold' : 'flex-1 font-medium',
                  active
                    ? 'bg-accent text-white shadow-sm'
                    : t.prominent
                      ? 'bg-accent-soft text-accent-hover ring-1 ring-accent/25 hover:bg-accent-soft/70'
                      : 'text-ink-soft hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                )}>
                {t.icon && <t.icon />}
                {t.label}
              </button>
            )
          })}
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
