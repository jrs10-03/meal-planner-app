import { describe, it, expect } from 'vitest'
import { normalizeName, buildShoppingList, listToText, sectionFor } from './aggregate.js'

describe('normalizeName', () => {
  it('merges singular/plural', () => {
    expect(normalizeName('Onions')).toBe(normalizeName('onion'))
    expect(normalizeName('tomatoes')).toBe('tomato')
    expect(normalizeName('berries')).toBe('berry')
  })
})

const R = (id, ingredients) => ({ id, name: id, ingredients })

describe('buildShoppingList quantity rule', () => {
  it('hides quantity for a normal single-recipe item', () => {
    const grouped = buildShoppingList([R('a', [{ name: 'basil', quantity: 0.25, unit: 'cup' }])], [])
    const item = grouped.flatMap((g) => g.items).find((i) => i.name === 'basil')
    expect(item.note).toBe('')
  })

  it('shows quantity when an item appears in 3+ recipes', () => {
    const recipes = [
      R('a', [{ name: 'onion', quantity: 1, unit: null }]),
      R('b', [{ name: 'onions', quantity: 1, unit: null }]),
      R('c', [{ name: 'Onion', quantity: 1, unit: null }]),
    ]
    const grouped = buildShoppingList(recipes, [])
    const item = grouped.flatMap((g) => g.items).find((i) => i.key === 'onion')
    expect(item.recipeCount).toBe(3)
    expect(item.note).not.toBe('')
  })

  it('shows quantity when the combined amount crosses a threshold', () => {
    const grouped = buildShoppingList([R('a', [{ name: 'chicken thighs', quantity: 3, unit: 'lb' }])], [])
    const item = grouped.flatMap((g) => g.items).find((i) => i.key === 'chicken thigh')
    expect(item.note).toBe('~3 lb')
  })

  it('excludes staples', () => {
    const grouped = buildShoppingList([R('a', [{ name: 'salt', quantity: 1, unit: 'tsp' }, { name: 'flour', quantity: 1, unit: 'cup' }])], ['salt'])
    const names = grouped.flatMap((g) => g.items).map((i) => i.name)
    expect(names).not.toContain('salt')
    expect(names).toContain('flour')
  })
})

describe('sectionFor', () => {
  it('buckets by keyword', () => {
    expect(sectionFor('chicken thighs')).toBe('Meat')
    expect(sectionFor('red onion')).toBe('Produce')
    expect(sectionFor('cheddar cheese')).toBe('Dairy & Eggs')
    expect(sectionFor('flour tortillas')).toBe('Bakery')
    expect(sectionFor('mystery item')).toBe('Other')
  })
})

describe('listToText', () => {
  it('excludes checked items and includes manual', () => {
    const grouped = buildShoppingList([R('a', [{ name: 'flour', quantity: 1, unit: 'cup' }, { name: 'sugar', quantity: 1, unit: 'cup' }])], [])
    const text = listToText(grouped, { flour: true }, [{ id: '1', name: 'paper towels', checked: false }])
    expect(text).toContain('sugar')
    expect(text).not.toContain('flour')
    expect(text).toContain('paper towels')
  })
})
