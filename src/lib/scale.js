// Serving scaler: scale ingredient quantities from an original serving count to a
// target (default 2), with sensible rounding.

// Units measured by volume/weight -> round to quarter increments.
const FRACTIONAL_UNITS = new Set(['tsp', 'tbsp', 'cup', 'oz', 'lb', 'ml', 'l', 'cups'])
// Countable things -> round to whole numbers (can't buy 1.5 eggs sensibly).
const COUNTABLE_UNITS = new Set([null, undefined, '', 'clove', 'can', 'slice', 'stick', 'bunch', 'package'])

export function roundQuantity(value, unit) {
  if (value == null || Number.isNaN(value)) return value
  if (COUNTABLE_UNITS.has(unit)) {
    // Round to whole, but never down to 0 for a positive amount.
    const r = Math.round(value)
    return r === 0 && value > 0 ? 1 : r
  }
  if (FRACTIONAL_UNITS.has(unit)) {
    const r = Math.round(value * 4) / 4
    return r === 0 && value > 0 ? 0.25 : r
  }
  // Grams/kg and unknown measured units: round to 1 decimal.
  return Math.round(value * 10) / 10
}

// Scale one ingredient object.
export function scaleIngredient(ing, factor) {
  if (ing.quantity == null) return { ...ing }
  return { ...ing, quantity: roundQuantity(ing.quantity * factor, ing.unit) }
}

// Scale a list of ingredients from originalServings -> targetServings.
export function scaleIngredients(ingredients, originalServings, targetServings = 2) {
  const from = Number(originalServings)
  if (!from || from <= 0) return ingredients.map((i) => ({ ...i }))
  const factor = targetServings / from
  if (factor === 1) return ingredients.map((i) => ({ ...i }))
  return ingredients.map((i) => scaleIngredient(i, factor))
}
