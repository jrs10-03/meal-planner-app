import { describe, it, expect } from 'vitest'
import { sortRecipes } from './recipes.js'

const r = (name, createdAt, lastCookedAt = null) => ({ name, createdAt, lastCookedAt, timesCooked: 0, ingredients: [] })

describe('sortRecipes recent', () => {
  it('sorts newest createdAt first by default', () => {
    const out = sortRecipes([
      r('Old', '2026-01-01T00:00:00Z'),
      r('New', '2026-06-01T00:00:00Z'),
      r('Mid', '2026-03-01T00:00:00Z'),
    ])
    expect(out.map((x) => x.name)).toEqual(['New', 'Mid', 'Old'])
  })
  it('puts recipes missing createdAt last, tie-broken by name', () => {
    const out = sortRecipes([r('B', null), r('A', null), r('New', '2026-06-01T00:00:00Z')], 'recent')
    expect(out.map((x) => x.name)).toEqual(['New', 'A', 'B'])
  })
})
