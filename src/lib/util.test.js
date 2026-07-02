import { describe, it, expect } from 'vitest'
import { parseDateInput, toDateInputValue, weekDayOptions, weekRangeLabel } from './util.js'

describe('parseDateInput', () => {
  it('parses as local midnight, not UTC', () => {
    const d = parseDateInput('2026-07-06')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(6)
    expect(d.getHours()).toBe(0)
  })
  it('round-trips with toDateInputValue', () => {
    expect(toDateInputValue(parseDateInput('2026-07-06'))).toBe('2026-07-06')
  })
})

describe('weekDayOptions', () => {
  it('returns 7 consecutive day labels from the start date', () => {
    const opts = weekDayOptions(parseDateInput('2026-07-06').toISOString()) // a Monday
    expect(opts).toHaveLength(7)
    expect(opts[0]).toBe('Mon, Jul 6')
    expect(opts[6]).toBe('Sun, Jul 12')
  })
  it('crosses month boundaries', () => {
    const opts = weekDayOptions(parseDateInput('2026-07-29').toISOString())
    expect(opts[3]).toMatch(/Aug 1/)
  })
})

describe('weekRangeLabel', () => {
  it('spans exactly 7 days', () => {
    expect(weekRangeLabel(parseDateInput('2026-07-06').toISOString())).toBe('Jul 6 – Jul 12')
  })
  it('crosses months', () => {
    expect(weekRangeLabel(parseDateInput('2026-07-29').toISOString())).toBe('Jul 29 – Aug 4')
  })
})
