import { describe, it, expect } from 'vitest'
import {
  parseQuantity,
  canonicalUnit,
  parseIngredientLine,
  looksLikeIngredient,
  parseRecipe,
  extractJson,
} from './parser.js'

describe('parseQuantity', () => {
  it('parses integers and decimals', () => {
    expect(parseQuantity('2 cups flour').value).toBe(2)
    expect(parseQuantity('1.5 lb beef').value).toBe(1.5)
  })
  it('parses simple fractions', () => {
    expect(parseQuantity('1/2 tsp salt').value).toBe(0.5)
    expect(parseQuantity('3/4 cup').value).toBe(0.75)
  })
  it('parses unicode fractions', () => {
    expect(parseQuantity('½ cup').value).toBe(0.5)
    expect(parseQuantity('¼ tsp').value).toBe(0.25)
  })
  it('parses mixed numbers (space and glued)', () => {
    expect(parseQuantity('1 1/2 cups').value).toBe(1.5)
    expect(parseQuantity('1½ cups').value).toBe(1.5)
  })
  it('takes the low end of a range', () => {
    expect(parseQuantity('2-3 cloves').value).toBe(2)
    expect(parseQuantity('2 to 3 eggs').value).toBe(2)
  })
  it('returns null for no leading number', () => {
    expect(parseQuantity('salt to taste')).toBeNull()
  })
})

describe('canonicalUnit', () => {
  it('maps aliases to canonical', () => {
    expect(canonicalUnit('tablespoons')).toBe('tbsp')
    expect(canonicalUnit('Tbsp.')).toBe('tbsp')
    expect(canonicalUnit('pounds')).toBe('lb')
    expect(canonicalUnit('cloves')).toBe('clove')
  })
  it('returns null for non-units', () => {
    expect(canonicalUnit('chicken')).toBeNull()
  })
})

describe('parseIngredientLine', () => {
  it('splits quantity, unit, name', () => {
    expect(parseIngredientLine('2 tbsp olive oil')).toEqual({ name: 'olive oil', quantity: 2, unit: 'tbsp' })
  })
  it('handles countable nouns without unit', () => {
    expect(parseIngredientLine('3 eggs')).toEqual({ name: 'eggs', quantity: 3, unit: null })
  })
  it('strips bullets and "of"', () => {
    expect(parseIngredientLine('- 1 cup of milk')).toEqual({ name: 'milk', quantity: 1, unit: 'cup' })
  })
  it('handles no quantity', () => {
    expect(parseIngredientLine('salt to taste')).toEqual({ name: 'salt to taste', quantity: null, unit: null })
  })
})

describe('looksLikeIngredient', () => {
  it('true for qty-led short lines', () => {
    expect(looksLikeIngredient('2 tbsp olive oil')).toBe(true)
  })
  it('false for long sentences', () => {
    expect(looksLikeIngredient('Preheat the oven to 425 and roast the vegetables until they are golden brown all over')).toBe(false)
  })
})

describe('parseRecipe', () => {
  it('parses a messy recipe with headers', () => {
    const raw = `Grandma's Tomato Pasta

Ingredients:
- 8 oz spaghetti
- 2 cloves garlic
- 1 can crushed tomatoes
½ cup parmesan

Directions:
1. Boil the spaghetti in salted water until al dente, about nine minutes.
2. Saute the garlic in olive oil then add the tomatoes and simmer.`
    const r = parseRecipe(raw)
    expect(r.title).toBe("Grandma's Tomato Pasta")
    expect(r.ingredients).toHaveLength(4)
    expect(r.ingredients[0]).toEqual({ name: 'spaghetti', quantity: 8, unit: 'oz' })
    expect(r.ingredients[3]).toEqual({ name: 'parmesan', quantity: 0.5, unit: 'cup' })
    expect(r.steps).toHaveLength(2)
    expect(r.steps[0]).toMatch(/^Boil the spaghetti/)
  })

  it('auto-classifies without explicit headers', () => {
    const raw = `Quick Omelette
3 eggs
1 tbsp butter
Whisk the eggs thoroughly and cook them slowly in the butter over low heat.`
    const r = parseRecipe(raw)
    expect(r.title).toBe('Quick Omelette')
    expect(r.ingredients.length).toBe(2)
    expect(r.steps.length).toBe(1)
  })
})

describe('extractJson', () => {
  it('pulls JSON from fenced text', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })
  it('pulls a bare object', () => {
    expect(extractJson('Here you go: {"a":1} done')).toBe('{"a":1}')
  })
})
