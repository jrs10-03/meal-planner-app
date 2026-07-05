import { useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { Modal, Chip } from './ui.jsx'
import { exportState } from '../lib/storage.js'
import { SyncStatus } from '../lib/sync.js'

function Section({ title, children, desc }) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="font-serif text-base font-semibold">{title}</h3>
        {desc && <p className="text-xs text-ink-faint">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

const STATUS_STYLE = {
  [SyncStatus.SYNCED]: 'bg-green-50 text-green-700 border-green-200',
  [SyncStatus.SYNCING]: 'bg-amber-50 text-amber-700 border-amber-200',
  [SyncStatus.OFFLINE]: 'bg-gray-100 text-gray-600 border-gray-200',
  [SyncStatus.CONFLICT]: 'bg-red-50 text-red-700 border-red-200',
  [SyncStatus.ERROR]: 'bg-red-50 text-red-700 border-red-200',
  [SyncStatus.IDLE]: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function GearPopover({ open, onClose, state, actions, sync }) {
  const fileRef = useRef(null)
  const [staplesText, setStaplesText] = useState(state.staples.join('\n'))
  const [importErr, setImportErr] = useState('')

  function saveStaples() {
    const arr = staplesText.split('\n').map((s) => s.trim()).filter(Boolean)
    actions.setStaples(arr)
  }

  function download() {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mealplan-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function onImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        if (!obj || typeof obj !== 'object') throw new Error('Not an object')
        actions.importState(obj)
        setImportErr('')
        onClose()
      } catch (err) {
        setImportErr('Invalid backup file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Appearance */}
        <Section title="Appearance" desc="System follows your device's light/dark setting.">
          <div className="flex gap-1.5">
            {['system', 'light', 'dark'].map((t) => (
              <Chip key={t} active={(state.settings.theme || 'system') === t} onClick={() => actions.setSetting('theme', t)}>
                {t === 'system' ? 'System' : t === 'light' ? '☀️ Light' : '🌙 Dark'}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Sync */}
        <Section title="Device sync" desc="Optional. Sync via a private GitHub Gist (token needs 'gist' scope only).">
          <div className="flex items-center gap-2">
            <span className={`chip ${STATUS_STYLE[sync.status] || STATUS_STYLE.idle}`}>
              {sync.status === SyncStatus.ERROR ? 'Sync error' : (sync.message || sync.status)}
            </span>
            <button className="btn-outline ml-auto" onClick={sync.syncNow}>Sync now</button>
          </div>
          {sync.status === SyncStatus.CONFLICT && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
              <p className="mb-2 font-medium text-red-700">This device and the synced copy both changed.</p>
              <div className="flex gap-2">
                <button className="btn-primary" onClick={() => sync.resolveConflict('local')}>Keep this device</button>
                <button className="btn-outline" onClick={() => sync.resolveConflict('remote')}>Use synced version</button>
              </div>
            </div>
          )}
          {sync.status === SyncStatus.ERROR && sync.message && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{sync.message}</p>
          )}
          <label className="label">GitHub token (classic, gist scope)</label>
          <input className="input" type="password" placeholder="ghp_…" value={state.settings.gistToken}
            onChange={(e) => actions.setSetting('gistToken', e.target.value.replace(/\s+/g, ''))} />
          {state.settings.gistId && <p className="text-xs text-ink-faint">Gist ID: {state.settings.gistId}</p>}
        </Section>

        {/* AI */}
        <Section title="AI recipe parsing" desc="Off by default — the built-in parser is free and works offline. Turning this on adds an 'AI Parse' option that uses your own Anthropic API key (stored only in this browser).">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-accent" checked={!!state.settings.aiEnabled}
              onChange={(e) => actions.setSetting('aiEnabled', e.target.checked)} />
            Enable AI parsing
          </label>
          {state.settings.aiEnabled && (
            <>
              <label className="label">Anthropic API key</label>
              <input className="input" type="password" placeholder="sk-ant-…" value={state.settings.apiKey}
                onChange={(e) => actions.setSetting('apiKey', e.target.value.replace(/\s+/g, ''))} />
            </>
          )}
        </Section>

        {/* Staples */}
        <Section title="Pantry staples" desc="Items to always exclude from the shopping list. One per line.">
          <textarea className="input min-h-[110px] font-mono text-[13px]" value={staplesText}
            onChange={(e) => setStaplesText(e.target.value)} onBlur={saveStaples} />
          <button className="btn-outline" onClick={saveStaples}>Save staples</button>
        </Section>

        {/* Backup */}
        <Section title="Backup" desc="Export or restore all data as a JSON file.">
          <div className="flex gap-2">
            <button className="btn-outline" onClick={download}><Icon.Copy /> Export JSON</button>
            <button className="btn-outline" onClick={() => fileRef.current?.click()}>Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
          </div>
          {importErr && <p className="text-sm text-red-500">{importErr}</p>}
        </Section>

        <p className="border-t border-line pt-3 text-center text-xs text-ink-faint">
          v{__APP_VERSION__} · Build {new Date(__BUILD_TIME__).toLocaleString()}
        </p>
      </div>
    </Modal>
  )
}
