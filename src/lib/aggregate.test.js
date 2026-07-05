import { describe, it, expect } from 'vitest'
import { normalizeName, cleanName, buildShoppingList, listToText, sectionFor } from './aggregate.js'

describe('normalizeName', () => {
  it('merges singular/plural', () => {
    expect(normalizeName('Onions')).toBe(normalizeName('onion'))
    expect(normalizeName('tomatoes')).toBe('tomato')
    expect(normalizeName('berries')).toBe('berry')
  })

  it('merges prep variations of the same item', () => {
    expect(normalizeName('onion, chopped')).toBe('onion')
    expect(normalizeName('onion, grated')).toBe('onion')
    expect(normalizeName('grated onion')).toBe('onion')
  })

  it('merges protein cuts and preparations', () => {
    expect(normalizeName('chicken breasts, cut into bite-size pieces')).toBe('chicken')
    expect(normalizeName('shredded chicken')).toBe('chicken')
    expect(normalizeName('boneless skinless chicken thighs')).toBe('chicken')
    // Real-world names scatter prep words around multiple commas.
    expect(normalizeName('boneless, skinless chicken breasts, cut into bite-size pieces (10 oz)')).toBe('chicken')
    expect(normalizeName('cooked, shredded chicken')).toBe('chicken')
    expect(normalizeName('skinless, boneless chicken thighs, sliced')).toBe('chicken')
  })

  it('merges container nouns and grade adjectives', () => {
    expect(normalizeName('garlic cloves')).toBe('garlic')
    expect(normalizeName('garlic clove')).toBe('garlic')
    expect(normalizeName('lean ground beef')).toBe(normalizeName('ground beef'))
    expect(normalizeName('bunch cilantro')).toBe('cilantro')
  })

  it('keeps product-defining words', () => {
    expect(normalizeName('ground beef')).toBe('ground beef')
    expect(normalizeName('red onion')).toBe('red onion')
    expect(normalizeName('smoked paprika')).toBe('smoked paprika')
    expect(normalizeName('canned black beans')).toBe('canned black bean')
    // Cut words survive when there is no protein in the name.
    expect(normalizeName('chicken broth')).toBe('chicken broth')
  })
})

describe('cleanName', () => {
  it('strips parentheticals and trailing instructions', () => {
    expect(cleanName('parmesan (freshly grated)')).toBe('parmesan')
    expect(cleanName('cilantro, for serving')).toBe('cilantro')
    expect(cleanName('lime juice, plus more to taste')).toBe('lime juice')
    expect(cleanName('frozen broccoli to serve')).toBe('frozen broccoli')
    expect(cleanName('spring onions to garnish')).toBe('spring onions')
    expect(cleanName('hamburger buns toasted')).toBe('hamburger buns')
    expect(cleanName('monterey jack — or mexican blend')).toBe('monterey jack')
  })

  it('drops the redundant cheese suffix for named cheeses only', () => {
    expect(normalizeName('cheddar cheese')).toBe(normalizeName('cheddar'))
    expect(normalizeName('parmesan cheese')).toBe('parmesan')
    expect(normalizeName('cream cheese')).toBe('cream cheese')
    expect(normalizeName('cottage cheese')).toBe('cottage cheese')
  })

  it('falls back to the raw name if stripping empties it', () => {
    expect(cleanName('Chopped')).toBe('chopped')
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
    const item = grouped.flatMap((g) => g.items).find((i) => i.key === 'chicken')
    expect(item.note).toBe('~3 lb')
  })

  it('combines prep variants into one line under the cleaned name', () => {
    const recipes = [
      R('a', [{ name: 'onion, chopped', quantity: 1, unit: null }]),
      R('b', [{ name: 'onion, grated', quantity: 1, unit: null }]),
      R('c', [{ name: 'chicken breasts, cut into bite-size pieces', quantity: 1, unit: 'lb' }]),
      R('d', [{ name: 'shredded chicken', quantity: 2, unit: 'cup' }]),
    ]
    const items = buildShoppingList(recipes, []).flatMap((g) => g.items)
    expect(items.filter((i) => i.key === 'onion')).toHaveLength(1)
    expect(items.find((i) => i.key === 'onion').name).toBe('onion')
    expect(items.filter((i) => i.key === 'chicken')).toHaveLength(1)
    expect(items.find((i) => i.key === 'chicken').name).toBe('chicken')
  })

  it('excludes staples', () => {
    const grouped = buildShoppingList([R('a', [{ name: 'salt', quantity: 1, unit: 'tsp' }, { name: 'flour', quantity: 1, unit: 'cup' }])], ['salt'])
    const names = grouped.flatMap((g) => g.items).map((i) => i.name)
    expect(names).not.toContain('salt')
    expect(names).toContain('flour')
  })

  it('matches graded variants of a staple but not different products', () => {
    const recipes = [R('a', [
      { name: 'kosher salt', quantity: 1, unit: 'tsp' },
      { name: 'freshly ground black pepper', quantity: 1, unit: 'tsp' },
      { name: 'red bell pepper, seeded and chopped', quantity: 1, unit: null },
      { name: 'sesame oil', quantity: 1, unit: 'tbsp' },
      { name: 'extra-virgin olive oil', quantity: 1, unit: 'tbsp' },
    ])]
    const names = buildShoppingList(recipes, ['salt', 'pepper', 'oil', 'olive oil']).flatMap((g) => g.items).map((i) => i.name)
    expect(names).not.toContain('kosher salt') // grade of the salt staple
    expect(names).not.toContain('ground black pepper') // grade of the pepper staple
    expect(names).toContain('red bell pepper') // different product than "pepper"
    expect(names).toContain('sesame oil') // different product than "oil"
    expect(names).not.toContain('extra-virgin olive oil') // grade of olive oil
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
