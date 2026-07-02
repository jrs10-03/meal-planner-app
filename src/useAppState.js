import { useCallback, useEffect, useRef, useState } from 'react'
import { loadState, saveState, importState as persistImport, nowISO } from './lib/storage.js'
import { uid, weekLabel } from './lib/util.js'
import { createGist, pushGist, pullGist, SyncStatus } from './lib/sync.js'

// One hook owns the whole app state, persistence, and sync. Components get a
// plain `state` object plus an `actions` bag of mutators.
export function useAppState() {
  const [state, setState] = useState(() => loadState())
  const [sync, setSync] = useState({ status: SyncStatus.IDLE, message: '', conflict: null })
  const pushTimer = useRef(null)
  const didInitialPull = useRef(false)

  // Apply a mutation, persist (bumping lastModified), and schedule a sync push.
  const mutate = useCallback((mutator) => {
    setState((prev) => {
      const draft = structuredClone(prev)
      mutator(draft)
      const persisted = saveState(draft) // returns object with fresh lastModified
      schedulePush(persisted)
      return persisted
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Sync -----------------------------------------------------------------

  const schedulePush = useCallback((current) => {
    const { gistToken, gistId } = current.settings
    if (!gistToken || !gistId) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => doPush(current), 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doPush = useCallback(async (current) => {
    const { gistToken, gistId } = current.settings
    if (!gistToken || !gistId) return
    if (!navigator.onLine) { setSync({ status: SyncStatus.OFFLINE, message: 'Offline' }); return }
    setSync({ status: SyncStatus.SYNCING, message: 'Syncing…' })
    try {
      await pushGist(gistToken, gistId, current)
      setState((prev) => {
        const next = { ...prev, settings: { ...prev.settings, lastSyncedAt: nowISO(), lastSyncedModified: current.lastModified } }
        saveState(next, { touch: false })
        return next
      })
      setSync({ status: SyncStatus.SYNCED, message: 'Synced' })
    } catch (err) {
      setSync({ status: SyncStatus.ERROR, message: err.message })
    }
  }, [])

  const syncNow = useCallback(async () => {
    const current = state
    const { gistToken, gistId } = current.settings
    if (!gistToken) { setSync({ status: SyncStatus.ERROR, message: 'No token configured' }); return }
    setSync({ status: SyncStatus.SYNCING, message: 'Syncing…' })
    try {
      // No gist yet -> create one from local state.
      if (!gistId) {
        const newId = await createGist(gistToken, current)
        mutate((d) => {
          d.settings.gistId = newId
          d.settings.lastSyncedAt = nowISO()
          d.settings.lastSyncedModified = d.lastModified
        })
        setSync({ status: SyncStatus.SYNCED, message: 'Created gist & synced' })
        return
      }
      const remote = await pullGist(gistToken, gistId)
      if (!remote) { await doPush(current); return }
      const remoteMod = remote.lastModified || ''
      const localMod = current.lastModified || ''
      const lastSynced = current.settings.lastSyncedModified || ''

      if (remoteMod === localMod) { setSync({ status: SyncStatus.SYNCED, message: 'Up to date' }); return }

      // Remote changed since we last synced AND local also changed -> conflict.
      if (remoteMod > lastSynced && localMod > lastSynced && remoteMod !== localMod) {
        setSync({ status: SyncStatus.CONFLICT, message: 'Conflict', conflict: remote })
        return
      }
      // Remote is newer -> take it. Else local is newer -> push.
      if (remoteMod > localMod) {
        applyRemote(remote)
        setSync({ status: SyncStatus.SYNCED, message: 'Pulled latest' })
      } else {
        await doPush(current)
      }
    } catch (err) {
      setSync({ status: SyncStatus.ERROR, message: err.message })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const applyRemote = useCallback((remote) => {
    const persisted = persistImport(remote)
    setState({ ...persisted, settings: { ...persisted.settings, lastSyncedAt: nowISO(), lastSyncedModified: persisted.lastModified } })
    saveState({ ...persisted, settings: { ...persisted.settings, lastSyncedModified: persisted.lastModified } }, { touch: false })
  }, [])

  const resolveConflict = useCallback((choice) => {
    setSync((s) => {
      const remote = s.conflict
      if (choice === 'remote' && remote) applyRemote(remote)
      else doPush(state) // keep this device
      return { status: SyncStatus.SYNCED, message: choice === 'remote' ? 'Used synced version' : 'Kept this device', conflict: null }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Pull once on load if configured.
  useEffect(() => {
    if (didInitialPull.current) return
    didInitialPull.current = true
    if (state.settings.gistToken && state.settings.gistId) syncNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Actions --------------------------------------------------------------

  const actions = {
    // Recipes
    addRecipe: (recipe) => {
      const id = uid()
      mutate((d) => {
        d.recipes.push({
          id, name: '', category: d.categories[0] || 'Other', sourceUrl: null,
          ingredients: [], steps: [], servings: 2, timesCooked: 0,
          createdAt: nowISO(), lastCookedAt: null, ...recipe,
        })
      })
      return id
    },
    updateRecipe: (id, patch) => mutate((d) => {
      const r = d.recipes.find((x) => x.id === id)
      if (r) Object.assign(r, patch)
    }),
    deleteRecipe: (id) => mutate((d) => { d.recipes = d.recipes.filter((r) => r.id !== id) }),
    markCooked: (id) => mutate((d) => {
      const r = d.recipes.find((x) => x.id === id)
      if (r) { r.timesCooked = (r.timesCooked || 0) + 1; r.lastCookedAt = nowISO() }
    }),

    // Categories
    addCategory: (name) => mutate((d) => { if (name && !d.categories.includes(name)) d.categories.push(name) }),
    renameCategory: (oldName, newName) => mutate((d) => {
      d.categories = d.categories.map((c) => (c === oldName ? newName : c))
      d.recipes.forEach((r) => { if (r.category === oldName) r.category = newName })
    }),
    deleteCategory: (name) => mutate((d) => {
      d.categories = d.categories.filter((c) => c !== name)
      d.recipes.forEach((r) => { if (r.category === name) r.category = d.categories[0] || 'Other' })
    }),

    // Plan / weeks
    // startDateISO: optional; the week runs 7 days from this date (defaults to today).
    startNewWeek: (startDateISO) => mutate((d) => {
      if (d.currentWeek && d.currentWeek.slots.length > 0) {
        d.weekHistory.unshift({
          id: d.currentWeek.id,
          label: d.currentWeek.label,
          startDate: d.currentWeek.startDate,
          endedAt: nowISO(),
          slots: d.currentWeek.slots.map((s) => {
            const r = d.recipes.find((x) => x.id === s.recipeId)
            return {
              recipeId: s.recipeId,
              recipeName: r ? r.name : s.recipeName,
              type: s.type,
              day: s.day,
              kind: s.kind || 'recipe',
              note: s.note || '',
            }
          }),
        })
      }
      const start = startDateISO ? new Date(startDateISO) : new Date()
      d.currentWeek = { id: uid(), label: weekLabel(start), startDate: start.toISOString(), slots: [] }
    }),
    addSlot: (recipeId) => mutate((d) => {
      if (!d.currentWeek) d.currentWeek = { id: uid(), label: weekLabel(new Date()), startDate: nowISO(), slots: [] }
      const r = d.recipes.find((x) => x.id === recipeId)
      d.currentWeek.slots.push({ id: uid(), kind: 'recipe', recipeId, recipeName: r ? r.name : 'Recipe', type: 'dinner', day: null, note: '' })
    }),
    // Non-recipe slots: 'out' (eating out) or 'leftovers'. No shopping-list impact.
    addSpecialSlot: (kind) => mutate((d) => {
      if (!d.currentWeek) d.currentWeek = { id: uid(), label: weekLabel(new Date()), startDate: nowISO(), slots: [] }
      const name = kind === 'out' ? 'Eating out' : 'Leftovers'
      d.currentWeek.slots.push({ id: uid(), kind, recipeId: null, recipeName: name, type: 'dinner', day: null, note: '' })
    }),
    setSlotNote: (slotId, note) => mutate((d) => {
      const s = d.currentWeek?.slots.find((x) => x.id === slotId)
      if (s) s.note = note
    }),
    removeSlot: (slotId) => mutate((d) => {
      if (d.currentWeek) d.currentWeek.slots = d.currentWeek.slots.filter((s) => s.id !== slotId)
    }),
    moveSlot: (slotId, dir) => mutate((d) => {
      if (!d.currentWeek) return
      const arr = d.currentWeek.slots
      const i = arr.findIndex((s) => s.id === slotId)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }),
    toggleSlotType: (slotId) => mutate((d) => {
      const s = d.currentWeek?.slots.find((x) => x.id === slotId)
      if (s) s.type = s.type === 'dinner' ? 'lunch' : 'dinner'
    }),
    setSlotDay: (slotId, day) => mutate((d) => {
      const s = d.currentWeek?.slots.find((x) => x.id === slotId)
      if (s) s.day = day || null
    }),

    // Shopping list
    toggleChecked: (key) => mutate((d) => {
      if (d.list.checked[key]) delete d.list.checked[key]
      else d.list.checked[key] = true
    }),
    addManual: (name) => mutate((d) => {
      if (name.trim()) d.list.manual.push({ id: uid(), name: name.trim(), checked: false })
    }),
    toggleManual: (id) => mutate((d) => {
      const m = d.list.manual.find((x) => x.id === id)
      if (m) m.checked = !m.checked
    }),
    removeManual: (id) => mutate((d) => { d.list.manual = d.list.manual.filter((m) => m.id !== id) }),
    clearList: () => mutate((d) => { d.list.checked = {}; d.list.manual = [] }),

    // Settings
    setStaples: (staples) => mutate((d) => { d.staples = staples }),
    setSetting: (key, value) => mutate((d) => { d.settings[key] = value }),

    // Backup
    importState: (obj) => { applyRemote(obj) },
  }

  return { state, actions, sync: { ...sync, syncNow, resolveConflict } }
}
