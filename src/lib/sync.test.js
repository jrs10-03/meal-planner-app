import { describe, it, expect } from 'vitest'
import { sanitizeForSync } from './sync.js'

describe('sanitizeForSync', () => {
  it('strips all settings (tokens/keys are device-local, never synced)', () => {
    const state = {
      schemaVersion: 1,
      lastModified: '2026-07-02T00:00:00Z',
      recipes: [{ id: 'r1' }],
      settings: { gistToken: 'ghp_secret', apiKey: 'sk-ant-secret', gistId: 'g1', aiEnabled: true },
    }
    const out = sanitizeForSync(state)
    expect(out.settings).toEqual({})
    expect(JSON.stringify(out)).not.toContain('ghp_secret')
    expect(JSON.stringify(out)).not.toContain('sk-ant-secret')
    // data unaffected
    expect(out.recipes).toEqual(state.recipes)
    expect(out.lastModified).toBe(state.lastModified)
    // original untouched
    expect(state.settings.gistToken).toBe('ghp_secret')
  })
})
