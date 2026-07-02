import { useState } from 'react'
import { Icon } from './Icons.jsx'
import { parseRecipe, aiParseRecipe } from '../lib/parser.js'
import { scaleIngredients } from '../lib/scale.js'

const blankIng = () => ({ name: '', quantity: null, unit: null })

// Editable form used for manual entry, paste-parse preview, and editing.
// onSave receives a recipe patch { name, category, sourceUrl, ingredients, steps, servings }.
export default function RecipeForm({ recipe, categories, apiKey, onSave, onCancel }) {
  const editing = !!recipe
  const [mode, setMode] = useState(editing ? 'form' : 'paste') // 'paste' | 'form'

  // Paste state
  const [raw, setRaw] = useState('')
  const [pasteUrl, setPasteUrl] = useState('')
  const [origServings, setOrigServings] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseErr, setParseErr] = useState('')

  // Form (editable preview) state
  const [name, setName] = useState(recipe?.name || '')
  const [category, setCategory] = useState(recipe?.category || categories[0] || 'Other')
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl || '')
  const [ingredients, setIngredients] = useState(recipe?.ingredients?.length ? recipe.ingredients : [blankIng()])
  const [steps, setSteps] = useState(recipe?.steps?.length ? recipe.steps : [''])
  const [scaledFrom, setScaledFrom] = useState(null)

  function applyParsed(parsed, { aiScaled = false } = {}) {
    if (parsed.title) setName(parsed.title)
    setIngredients(parsed.ingredients.length ? parsed.ingredients : [blankIng()])
    setSteps(parsed.steps.length ? parsed.steps : [''])
    if (pasteUrl) setSourceUrl(pasteUrl)
    if (aiScaled && origServings) setScaledFrom(Number(origServings))
    setMode('form')
  }

  function doHeuristic() {
    setParseErr('')
    const parsed = parseRecipe(raw)
    if (!parsed.ingredients.length && !parsed.steps.length) {
      setParseErr('Could not find much to parse — try the manual form.')
    }
    applyParsed(parsed)
  }

  async function doAI() {
    setParsing(true)
    setParseErr('')
    try {
      const parsed = await aiParseRecipe(raw, { apiKey, originalServings: origServings ? Number(origServings) : null })
      applyParsed(parsed, { aiScaled: !!origServings })
    } catch (err) {
      setParseErr(`AI parse failed (${err.message}). Falling back to the offline parser.`)
      applyParsed(parseRecipe(raw))
    } finally {
      setParsing(false)
    }
  }

  function scaleToTwo() {
    const from = Number(origServings)
    if (!from || from <= 0) { setParseErr('Enter the original serving count first.'); return }
    setIngredients((prev) => scaleIngredients(prev, from, 2))
    setScaledFrom(from)
    setParseErr('')
  }

  function save() {
    const clean = {
      name: name.trim() || 'Untitled recipe',
      category,
      sourceUrl: sourceUrl.trim() || null,
      ingredients: ingredients.map((i) => ({ name: i.name.trim(), quantity: i.quantity, unit: i.unit || null })).filter((i) => i.name),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      servings: 2,
    }
    onSave(clean)
  }

  // ---- Paste view ----
  if (mode === 'paste') {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 text-sm">
          <button className="btn bg-accent-soft text-accent-hover">Paste & Parse</button>
          <button className="btn-ghost" onClick={() => setMode('form')}>Enter manually</button>
        </div>
        <div>
          <label className="label">Paste a recipe from anywhere</label>
          <textarea className="input min-h-[180px] font-mono text-[13px] leading-relaxed" value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'Grandma\'s Tomato Pasta\n\n2 tbsp olive oil\n1 lb chicken thighs\n1 can crushed tomatoes\n\nBrown the chicken, then simmer in the sauce for 20 minutes...'} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Source URL (optional)</label>
            <input className="input" value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="label">Original servings</label>
            <input className="input" inputMode="numeric" value={origServings} onChange={(e) => setOrigServings(e.target.value)} placeholder="e.g. 4" />
          </div>
        </div>
        {parseErr && <p className="text-sm text-red-500">{parseErr}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={doHeuristic} disabled={!raw.trim()}>Parse</button>
          {apiKey ? (
            <button className="btn-outline" onClick={doAI} disabled={!raw.trim() || parsing}>
              <Icon.Spark /> {parsing ? 'AI parsing…' : 'AI Parse'}
            </button>
          ) : (
            <span className="self-center text-xs text-ink-faint">Add an API key in settings to enable AI parsing</span>
          )}
          <button className="btn-ghost ml-auto" onClick={onCancel}>Cancel</button>
        </div>
        <p className="text-xs text-ink-faint">Parsing is a first pass — you'll get an editable preview to fix anything before saving.</p>
      </div>
    )
  }

  // ---- Form / editable preview view ----
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Recipe name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Recipe name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Source URL</label>
          <input className="input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      {/* Serving scaler */}
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Scale from original servings → 2</label>
            <input className="input" inputMode="numeric" value={origServings} onChange={(e) => setOrigServings(e.target.value)} placeholder="original servings, e.g. 4" />
          </div>
          <button className="btn-outline" onClick={scaleToTwo} type="button">Scale to 2</button>
        </div>
        {scaledFrom && <p className="mt-2 text-xs text-green-600">Scaled from {scaledFrom} → 2 servings. Stored as a 2-serving recipe.</p>}
      </div>

      {/* Ingredients */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="label !mb-0">Ingredients</label>
          <button className="btn-ghost text-xs !px-2" onClick={() => setIngredients((p) => [...p, blankIng()])}><Icon.Plus /> Add</button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-1.5">
              <input className="input w-16 text-center" value={ing.quantity ?? ''} placeholder="qty"
                onChange={(e) => { const v = e.target.value; setIngredients((p) => p.map((x, j) => j === i ? { ...x, quantity: v === '' ? null : Number(v) } : x)) }} />
              <input className="input w-20" value={ing.unit ?? ''} placeholder="unit"
                onChange={(e) => setIngredients((p) => p.map((x, j) => j === i ? { ...x, unit: e.target.value || null } : x))} />
              <input className="input flex-1" value={ing.name} placeholder="ingredient"
                onChange={(e) => setIngredients((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <button className="btn-ghost text-ink-faint !px-1.5" onClick={() => setIngredients((p) => p.filter((_, j) => j !== i))}><Icon.Close /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="label !mb-0">Steps</label>
          <button className="btn-ghost text-xs !px-2" onClick={() => setSteps((p) => [...p, ''])}><Icon.Plus /> Add</button>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-1.5">
              <span className="mt-2 w-5 shrink-0 text-right text-sm text-ink-faint">{i + 1}.</span>
              <textarea className="input min-h-[42px] flex-1" value={step}
                onChange={(e) => setSteps((p) => p.map((x, j) => j === i ? e.target.value : x))} />
              <button className="btn-ghost text-ink-faint !px-1.5" onClick={() => setSteps((p) => p.filter((_, j) => j !== i))}><Icon.Close /></button>
            </div>
          ))}
        </div>
      </div>

      {parseErr && <p className="text-sm text-red-500">{parseErr}</p>}
      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur">
        <button className="btn-primary flex-1" onClick={save}>{editing ? 'Save changes' : 'Save recipe'}</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
