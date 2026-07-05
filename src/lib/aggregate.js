// Shopping-list aggregation from the current week's planned recipes.

// Per-unit "large" thresholds. Crossing one of these makes an item show its total.
export const DEFAULT_THRESHOLDS = {
  lb: 2,
  kg: 1,
  cup: 4,
  oz: 16,
  g: 500,
  ml: 1000,
  l: 1.5,
  clove: 6,
  can: 3,
  count: 6, // countable items with no unit
}

// Show the total when an ingredient appears in this many recipes or more.
export const RECIPE_COUNT_THRESHOLD = 3

// Preparation words describe what you DO to an item, not what you buy.
// Stripping them merges "onion, chopped" / "grated onion" / "onion" into one line.
// Product-defining words (ground, smoked, dried, canned, frozen, red, baby…) stay.
const PREP_WORDS = new Set([
  'chopped', 'diced', 'minced', 'sliced', 'shredded', 'grated', 'crushed', 'cubed',
  'julienned', 'torn', 'mashed', 'melted', 'softened', 'beaten', 'whisked', 'sifted',
  'peeled', 'seeded', 'cored', 'trimmed', 'halved', 'quartered', 'divided', 'packed',
  'rinsed', 'drained', 'washed', 'cooked', 'uncooked', 'raw', 'warmed', 'chilled',
  'fresh', 'freshly', 'finely', 'roughly', 'coarsely', 'thinly', 'thickly', 'lightly',
  'optional', 'large', 'medium', 'small', 'ripe', 'boneless', 'skinless', 'bone-in',
  'skin-on', 'lean', 'extra-lean', 'toasted',
])

// Named cheeses whose trailing "cheese" is redundant ("cheddar cheese" =
// "cheddar"). A whitelist so "cream cheese"/"cottage cheese" stay intact.
const CHEESES = new Set([
  'cheddar', 'parmesan', 'mozzarella', 'swiss', 'feta', 'gouda', 'provolone',
  'gruyere', 'asiago', 'romano', 'colby', 'monterey', 'jack', 'pepperjack',
])

// Quantity-ish nouns that pair with a product ("garlic cloves", "bunch cilantro");
// dropped when other words remain so the product word carries the line.
const CONTAINER_WORDS = new Set([
  'clove', 'cloves', 'stalk', 'stalks', 'sprig', 'sprigs', 'head', 'heads',
  'ear', 'ears', 'bunch', 'bunches', 'knob', 'knobs',
])

// Cuts/forms that reduce to the base protein: "chicken breasts" and
// "shredded chicken" are the same shopping line ("chicken").
const PROTEINS = new Set(['chicken', 'beef', 'pork', 'turkey', 'salmon', 'lamb'])
const CUT_WORDS = new Set([
  'breast', 'breasts', 'thigh', 'thighs', 'drumstick', 'drumsticks', 'tender',
  'tenders', 'tenderloin', 'tenderloins', 'cutlet', 'cutlets', 'wing', 'wings',
  'leg', 'legs', 'fillet', 'fillets', 'filet', 'filets', 'chop', 'chops',
  'strip', 'strips', 'chunk', 'chunks', 'piece', 'pieces',
])

// Reduce an ingredient name to the product you'd actually buy: drop
// parentheticals, trailing instructions, prep words (wherever they appear —
// "boneless, skinless chicken breasts, cut into pieces" puts them everywhere),
// protein cuts, and container nouns. Falls back to the plain name if
// stripping empties it.
const DANGLING = new Set(['or', 'and', 'of', 'with'])

export function cleanName(name) {
  let n = String(name || '').toLowerCase().trim()
  n = n.replace(/\([^)]*\)/g, ' ') // "(about 2 cups)"
  n = n.replace(/\s[—–].*$/, ' ') // em-dash asides: "monterey jack — or mexican blend"
  n = n.replace(/\b(cut into|for serving|to taste|plus more|at room temperature|to serve|to garnish|for garnish)\b.*$/, ' ')
  n = n.replace(/,/g, ' ')
  let words = n.split(/\s+/).filter(Boolean).filter((w) => !PREP_WORDS.has(w))
  if (words.some((w) => PROTEINS.has(w))) {
    words = words.filter((w) => !CUT_WORDS.has(w))
  }
  if (words.length > 1) {
    const rest = words.filter((w) => !CONTAINER_WORDS.has(w))
    if (rest.length) words = rest
  }
  while (words.length && DANGLING.has(words[0])) words.shift()
  while (words.length && DANGLING.has(words[words.length - 1])) words.pop()
  if (words.length > 1 && words[words.length - 1] === 'cheese' && CHEESES.has(words[words.length - 2])) {
    words.pop()
  }
  const out = words.join(' ').trim()
  return out || String(name || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

// Merge key: cleaned name plus singular/plural normalization ("onion"/"onions").
export function normalizeName(name) {
  let n = cleanName(name)
  if (n.length > 3) {
    if (/( churches|dishes|tomatoes|potatoes)$/.test(n)) n = n.replace(/es$/, '')
    else if (/[^aeiou]ies$/.test(n)) n = n.replace(/ies$/, 'y')
    else if (/(ss|us|is)$/.test(n)) { /* leave */ }
    else if (/s$/.test(n)) n = n.replace(/s$/, '')
  }
  return n
}

// Store-section grouping via a simple keyword map.
const SECTION_KEYWORDS = [
  ['Produce', ['onion', 'garlic', 'pepper', 'tomato', 'potato', 'lettuce', 'spinach', 'carrot', 'celery', 'cilantro', 'basil', 'parsley', 'lemon', 'lime', 'apple', 'avocado', 'cucumber', 'broccoli', 'mushroom', 'zucchini', 'ginger', 'scallion', 'kale', 'cabbage', 'herb', 'lettuce']],
  ['Meat', ['chicken', 'beef', 'pork', 'turkey', 'sausage', 'bacon', 'thigh', 'breast', 'ground', 'steak', 'chop']],
  ['Dairy & Eggs', ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'parmesan', 'cheddar', 'mozzarella', 'feta']],
  ['Bakery', ['bread', 'tortilla', 'bun', 'roll', 'bagel', 'pita', 'naan']],
  ['Frozen', ['frozen', 'ice cream', 'peas']],
  ['Pantry', ['flour', 'sugar', 'rice', 'pasta', 'spaghetti', 'bean', 'can', 'canned', 'oil', 'vinegar', 'sauce', 'stock', 'broth', 'spice', 'paprika', 'cumin', 'oregano', 'noodle', 'tomato paste', 'lentil', 'oat', 'cereal', 'honey', 'soy']],
]

export function sectionFor(name) {
  const n = String(name).toLowerCase()
  for (const [section, words] of SECTION_KEYWORDS) {
    if (words.some((w) => n.includes(w))) return section
  }
  return 'Other'
}

function isStaple(name, staples) {
  const n = normalizeName(name)
  return staples.some((s) => normalizeName(s) === n || n.includes(normalizeName(s)))
}

function formatNum(v) {
  if (v == null) return ''
  const rounded = Math.round(v * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  // Render common fractions nicely.
  const frac = rounded - Math.floor(rounded)
  const map = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' }
  const whole = Math.floor(rounded)
  const fracStr = map[Math.round(frac * 100) / 100]
  if (fracStr) return (whole ? whole + fracStr : fracStr)
  return String(rounded)
}

// recipes: array of recipe objects that are planned this week (deduped by caller if needed).
// Returns grouped items: [{ section, items: [{ key, name, note, recipeCount }] }]
export function buildShoppingList(recipes, staples = [], thresholds = DEFAULT_THRESHOLDS) {
  const groups = new Map() // key -> { name, recipeIds:Set, byUnit: Map(unit->sum), hasUnitless }

  for (const r of recipes) {
    for (const ing of r.ingredients || []) {
      if (!ing.name) continue
      if (isStaple(ing.name, staples)) continue
      const key = normalizeName(ing.name)
      if (!groups.has(key)) {
        // Display the cleaned name ("onion", not "onion, chopped").
        groups.set(key, { name: cleanName(ing.name), recipeIds: new Set(), byUnit: new Map(), hadQty: false })
      }
      const g = groups.get(key)
      g.recipeIds.add(r.id)
      if (ing.quantity != null) {
        g.hadQty = true
        const u = ing.unit || 'count'
        g.byUnit.set(u, (g.byUnit.get(u) || 0) + ing.quantity)
      }
    }
  }

  const items = []
  for (const [key, g] of groups) {
    const recipeCount = g.recipeIds.size
    let note = ''

    // Determine whether to show a total.
    const units = [...g.byUnit.keys()]
    let crossesThreshold = false
    if (units.length === 1 && g.hadQty) {
      const u = units[0]
      const total = g.byUnit.get(u)
      const limit = thresholds[u]
      if (limit != null && total >= limit) crossesThreshold = true
      if (crossesThreshold) {
        note = u === 'count' ? `~${formatNum(total)}` : `~${formatNum(total)} ${u}`
      }
    }

    const showQty = recipeCount >= RECIPE_COUNT_THRESHOLD || crossesThreshold
    if (showQty && !note && units.length === 1 && g.hadQty) {
      const u = units[0]
      const total = g.byUnit.get(u)
      note = u === 'count' ? `~${formatNum(total)}` : `~${formatNum(total)} ${u}`
    }
    if (showQty && recipeCount >= RECIPE_COUNT_THRESHOLD && units.length !== 1) {
      note = `in ${recipeCount} recipes`
    }

    items.push({ key, name: g.name, note: showQty ? note : '', recipeCount, section: sectionFor(g.name) })
  }

  // Group by section, preserving a friendly section order.
  const order = ['Produce', 'Meat', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Frozen', 'Other']
  const bySection = new Map()
  for (const it of items) {
    if (!bySection.has(it.section)) bySection.set(it.section, [])
    bySection.get(it.section).push(it)
  }
  const grouped = []
  for (const section of order) {
    if (bySection.has(section)) {
      grouped.push({ section, items: bySection.get(section).sort((a, b) => a.name.localeCompare(b.name)) })
    }
  }
  return grouped
}

// Flatten to plain text for clipboard (unchecked only), quantities where present.
export function listToText(grouped, checked = {}, manual = []) {
  const lines = []
  for (const grp of grouped) {
    for (const it of grp.items) {
      if (checked[it.key]) continue
      lines.push(it.note ? `${it.name} — ${it.note}` : it.name)
    }
  }
  for (const m of manual) {
    if (!m.checked) lines.push(m.name)
  }
  return lines.join('\n')
}
