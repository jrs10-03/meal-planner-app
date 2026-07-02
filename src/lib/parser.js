// Recipe parsing: a fully-offline heuristic parser plus an optional AI parser.
// The heuristic functions are pure and unit-tested (see parser.test.js).

// ---- Units -----------------------------------------------------------------

// Canonical unit -> list of accepted spellings/aliases (lowercase, no trailing dot).
const UNIT_ALIASES = {
  tsp: ['tsp', 'teaspoon', 'teaspoons', 't'],
  tbsp: ['tbsp', 'tbs', 'tablespoon', 'tablespoons', 'tbl'],
  cup: ['cup', 'cups', 'c'],
  oz: ['oz', 'ounce', 'ounces'],
  lb: ['lb', 'lbs', 'pound', 'pounds'],
  g: ['g', 'gram', 'grams'],
  kg: ['kg', 'kilogram', 'kilograms'],
  ml: ['ml', 'milliliter', 'milliliters'],
  l: ['l', 'liter', 'liters', 'litre', 'litres'],
  clove: ['clove', 'cloves'],
  can: ['can', 'cans'],
  pinch: ['pinch', 'pinches'],
  slice: ['slice', 'slices'],
  stick: ['stick', 'sticks'],
  bunch: ['bunch', 'bunches'],
  package: ['package', 'packages', 'pkg', 'pack'],
}

const UNIT_LOOKUP = (() => {
  const m = new Map()
  for (const [canon, aliases] of Object.entries(UNIT_ALIASES)) {
    for (const a of aliases) m.set(a, canon)
  }
  return m
})()

export function canonicalUnit(word) {
  if (!word) return null
  const w = String(word).toLowerCase().replace(/\.$/, '').trim()
  return UNIT_LOOKUP.get(w) || null
}

// ---- Quantities ------------------------------------------------------------

const UNICODE_FRACTIONS = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

// Parse a leading quantity token like "1", "1/2", "½", "1 1/2", "1½", "2-3".
// Returns { value, rest } where rest is the remainder of the string, or null.
export function parseQuantity(input) {
  let s = String(input).trim()
  if (!s) return null

  // Expand any unicode fraction glued to a number, e.g. "1½" -> "1 ½".
  s = s.replace(/(\d)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1 $2')

  // Leading unicode fraction alone.
  const uni = s.match(/^([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*(.*)$/)
  if (uni) return { value: UNICODE_FRACTIONS[uni[1]], rest: uni[2] }

  // Whole + fraction: "1 1/2" or "1 ½"
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/)
  if (m) return { value: Number(m[1]) + Number(m[2]) / Number(m[3]), rest: m[4] }
  m = s.match(/^(\d+)\s+([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*(.*)$/)
  if (m) return { value: Number(m[1]) + UNICODE_FRACTIONS[m[2]], rest: m[3] }

  // Simple fraction: "1/2"
  m = s.match(/^(\d+)\/(\d+)\s*(.*)$/)
  if (m) return { value: Number(m[1]) / Number(m[2]), rest: m[3] }

  // Range "2-3" or "2 to 3" -> take the lower bound.
  m = s.match(/^(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*\d+(?:\.\d+)?\s*(.*)$/)
  if (m) return { value: Number(m[1]), rest: m[2] }

  // Decimal or integer.
  m = s.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (m) return { value: Number(m[1]), rest: m[2] }

  return null
}

// ---- Ingredient lines ------------------------------------------------------

// Turn one raw ingredient line into { name, quantity, unit }.
export function parseIngredientLine(raw) {
  let line = String(raw).trim().replace(/^[-*•·o]\s+/, '').replace(/^\d+[.)]\s+/, '')
  line = line.trim()
  if (!line) return null

  const q = parseQuantity(line)
  let quantity = null
  let unit = null
  let rest = line

  if (q) {
    quantity = q.value
    rest = q.rest.trim()
    // Try to peel a unit off the front of the remainder.
    const words = rest.split(/\s+/)
    const maybeUnit = canonicalUnit(words[0])
    if (maybeUnit) {
      unit = maybeUnit
      rest = words.slice(1).join(' ')
    }
  }

  // Strip a leading "of" ("2 cups of flour" -> "flour").
  rest = rest.replace(/^of\s+/i, '').trim()
  // Drop trailing parenthetical notes for the name, keep it readable.
  const name = rest.replace(/\s+/g, ' ').trim()

  if (!name) return null
  return { name, quantity: quantity ?? null, unit: unit ?? null }
}

// Heuristic: does this line read like an ingredient (short, starts with qty/unit)?
export function looksLikeIngredient(line) {
  const s = line.trim().replace(/^[-*•·o]\s+/, '')
  if (!s) return false
  const words = s.split(/\s+/)
  if (words.length > 12) return false // long => probably a step
  if (parseQuantity(s)) return true
  if (canonicalUnit(words[0])) return true
  // Bulleted short line with no terminal punctuation is likely an ingredient.
  if (/^[-*•·]/.test(line.trim()) && words.length <= 8) return true
  return false
}

function looksLikeStep(line) {
  const s = line.trim()
  if (!s) return false
  if (/^\d+[.)]\s+/.test(s)) return true // numbered
  const words = s.split(/\s+/)
  return words.length >= 6 // long sentence
}

const SECTION_HEADERS = {
  ingredients: /^(ingredients?|you(?:'| wi)ll need|shopping list)\s*:?\s*$/i,
  steps: /^(steps?|directions?|instructions?|method|preparation|how to make)\s*:?\s*$/i,
}

// Main entry: raw text -> { title, ingredients: [{name,quantity,unit}], steps: [string] }
export function parseRecipe(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const result = { title: '', ingredients: [], steps: [] }
  if (lines.length === 0) return result

  // Title: first line, unless it's a section header.
  let start = 0
  if (!Object.values(SECTION_HEADERS).some((re) => re.test(lines[0]))) {
    result.title = lines[0].replace(/^#+\s*/, '')
    start = 1
  }

  let mode = null // 'ingredients' | 'steps' | null (auto)
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]

    if (SECTION_HEADERS.ingredients.test(line)) { mode = 'ingredients'; continue }
    if (SECTION_HEADERS.steps.test(line)) { mode = 'steps'; continue }

    if (mode === 'ingredients') {
      const parsed = parseIngredientLine(line)
      if (parsed) result.ingredients.push(parsed)
      continue
    }
    if (mode === 'steps') {
      result.steps.push(line.replace(/^\d+[.)]\s+/, '').trim())
      continue
    }

    // Auto mode: classify each line.
    if (looksLikeStep(line) && !looksLikeIngredient(line)) {
      result.steps.push(line.replace(/^\d+[.)]\s+/, '').trim())
    } else if (looksLikeIngredient(line)) {
      const parsed = parseIngredientLine(line)
      if (parsed) result.ingredients.push(parsed)
    } else {
      // Ambiguous short line with no strong signal -> treat as ingredient.
      const parsed = parseIngredientLine(line)
      if (parsed) result.ingredients.push(parsed)
    }
  }

  return result
}

// ---- AI parser (optional) --------------------------------------------------

const AI_SYSTEM = `You extract structured recipe data from messy pasted text.
Return ONLY valid minified JSON, no markdown, matching exactly:
{"title": string, "ingredients": [{"name": string, "quantity": number|null, "unit": string|null}], "steps": [string]}
Rules:
- Separate each ingredient into quantity (number, null if none), unit (short lowercase like tsp, tbsp, cup, oz, lb, g, clove, can; null if none), and name.
- Fold countable nouns into the name (e.g. "garlic" with unit "clove").
- steps is an ordered array of instruction strings with no leading numbers.`

// Calls the Anthropic Messages API directly from the browser. Scales to `targetServings`
// when `originalServings` is provided. Throws on failure so callers can fall back.
export async function aiParseRecipe(rawText, { apiKey, originalServings = null, targetServings = 2 } = {}) {
  if (!apiKey) throw new Error('No API key configured')

  const scaleNote = originalServings
    ? `The original recipe serves ${originalServings}. Scale every ingredient quantity to serve ${targetServings}, rounding sensibly (quarter increments for volumes, whole numbers for countable items).`
    : `Do not scale quantities; return them as written.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: AI_SYSTEM,
      messages: [
        { role: 'user', content: `${scaleNote}\n\nRecipe text:\n"""\n${rawText}\n"""` },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = (data.content || []).map((b) => b.text || '').join('').trim()
  const jsonStr = extractJson(text)
  const parsed = JSON.parse(jsonStr)

  return {
    title: parsed.title || '',
    ingredients: Array.isArray(parsed.ingredients)
      ? parsed.ingredients.map((i) => ({
          name: String(i.name || '').trim(),
          quantity: typeof i.quantity === 'number' ? i.quantity : null,
          unit: i.unit ? String(i.unit).toLowerCase() : null,
        })).filter((i) => i.name)
      : [],
    steps: Array.isArray(parsed.steps) ? parsed.steps.map((s) => String(s).trim()).filter(Boolean) : [],
    _aiScaled: !!originalServings,
  }
}

// Pull the first {...} JSON object out of a possibly-fenced model response.
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1)
  return text
}
