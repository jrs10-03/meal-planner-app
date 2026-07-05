import { describe, it, expect } from 'vitest'
import { addCookDay, removeCookDay, ensureCookLog, syncCookedFields } from './cooklog.js'

describe('cooklog', () => {
  it('adds a cooked day and derives counters', () => {
    const r = { cookLog: [] }
    expect(addCookDay(r, '2026-07-02')).toBe(true)
    expect(r.cookLog).toEqual(['2026-07-02'])
    expect(r.timesCooked).toBe(1)
    expect(r.lastCookedAt).toBeTruthy()
  })

  it('allows only one entry per day per recipe', () => {
    const r = { cookLog: [] }
    expect(addCookDay(r, '2026-07-02')).toBe(true)
    expect(addCookDay(r, '2026-07-02')).toBe(false) // same day rejected
    expect(r.cookLog).toEqual(['2026-07-02'])
    expect(r.timesCooked).toBe(1)
  })

  it('keeps the log sorted newest-first', () => {
    const r = { cookLog: [] }
    addCookDay(r, '2026-07-01')
    addCookDay(r, '2026-07-05')
    addCookDay(r, '2026-07-03')
    expect(r.cookLog).toEqual(['2026-07-05', '2026-07-03', '2026-07-01'])
  })

  it('removes a day and recomputes count and lastCookedAt', () => {
    const r = { cookLog: ['2026-07-05', '2026-07-01'] }
    syncCookedFields(r)
    removeCookDay(r, '2026-07-05')
    expect(r.cookLog).toEqual(['2026-07-01'])
    expect(r.timesCooked).toBe(1)
    removeCookDay(r, '2026-07-01')
    expect(r.timesCooked).toBe(0)
    expect(r.lastCookedAt).toBeNull()
  })

  it('backfills cookLog from a legacy lastCookedAt', () => {
    const r = { lastCookedAt: '2026-06-20T12:00:00.000Z' }
    ensureCookLog(r)
    expect(r.cookLog).toEqual(['2026-06-20'])
    expect(r.timesCooked).toBe(1)
  })

  it('derives the count from history even when a legacy count disagrees', () => {
    // v1 preserved inflated legacy counts; v2 derives — ×3 with one dated entry becomes ×1.
    const r = { timesCooked: 3, lastCookedAt: '2026-06-20T12:00:00.000Z' }
    ensureCookLog(r)
    expect(r.cookLog).toEqual(['2026-06-20'])
    expect(r.timesCooked).toBe(1)
  })

  it('de-duplicates a legacy log', () => {
    const r = { cookLog: ['2026-07-02', '2026-07-02', '2026-07-01'] }
    ensureCookLog(r)
    expect(r.cookLog).toEqual(['2026-07-02', '2026-07-01'])
    expect(r.timesCooked).toBe(2)
  })
})
