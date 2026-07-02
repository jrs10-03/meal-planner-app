import { describe, it, expect } from 'vitest'
import { roundQuantity, scaleIngredients } from './scale.js'

describe('roundQuantity', () => {
  it('rounds countable to whole numbers', () => {
    expect(roundQuantity(1.5, null)).toBe(2)
    expect(roundQuantity(2, 'clove')).toBe(2)
  })
  it('never rounds a positive amount to zero', () => {
    expect(roundQuantity(0.3, null)).toBe(1)
    expect(roundQuantity(0.1, 'cup')).toBe(0.25)
  })
  it('rounds volumes to quarter increments', () => {
    expect(roundQuantity(0.4, 'cup')).toBe(0.5)
    expect(roundQuantity(1.1, 'tbsp')).toBe(1)
  })
})

describe('scaleIngredients', () => {
  it('scales 4 servings down to 2', () => {
    const ings = [
      { name: 'chicken', quantity: 2, unit: 'lb' },
      { name: 'eggs', quantity: 3, unit: null },
      { name: 'salt', quantity: null, unit: null },
    ]
    const scaled = scaleIngredients(ings, 4, 2)
    expect(scaled[0].quantity).toBe(1) // 2 lb -> 1 lb
    expect(scaled[1].quantity).toBe(2) // 3 eggs * 0.5 = 1.5 -> 2
    expect(scaled[2].quantity).toBeNull()
  })
  it('is a no-op when servings match', () => {
    const ings = [{ name: 'flour', quantity: 1, unit: 'cup' }]
    expect(scaleIngredients(ings, 2, 2)[0].quantity).toBe(1)
  })
  it('handles invalid original servings gracefully', () => {
    const ings = [{ name: 'flour', quantity: 1, unit: 'cup' }]
    expect(scaleIngredients(ings, 0, 2)[0].quantity).toBe(1)
  })
})
