import { useState } from 'react'
import { Icon } from './Icons.jsx'
import { relativeTime, formatDayLabel, todayStr } from '../lib/util.js'

function fmtQty(i) {
  if (i.quantity == null) return ''
  const q = Number.isInteger(i.quantity) ? i.quantity : Math.round(i.quantity * 100) / 100
  return `${q}${i.unit ? ' ' + i.unit : ''} `
}

// Add/remove entries in a recipe's cook history. One entry per day is enforced
// by the action layer; the UI mirrors that by disabling an already-logged day.
function CookHistory({ recipe, actions }) {
  const [date, setDate] = useState(() => todayStr())
  const log = recipe.cookLog || []
  const alreadyLogged = log.includes(date)

  return (
    <div>
      <h4 className="mb-2 font-serif text-base font-semibold">
        Cook history
        {log.length > 0 && <span className="ml-2 text-xs font-normal text-ink-faint">{log.length} logged</span>}
      </h4>

      <div className="mb-3 flex items-center gap-2">
        <input
          type="date"
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="btn-outline !py-1.5 text-xs"
          disabled={!date || alreadyLogged}
          onClick={() => actions.logCooked(recipe.id, date)}
        >
          <Icon.Fire /> Log cook
        </button>
        {alreadyLogged && <span className="text-xs text-ink-faint">Already logged</span>}
      </div>

      {log.length === 0 ? (
        <p className="text-sm text-ink-faint">No cooks logged yet.</p>
      ) : (
        <ul className="space-y-1">
          {log.map((day) => (
            <li key={day} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
              <Icon.Fire />
              <span>{formatDayLabel(day)}</span>
              <button
                className="btn-ghost ml-auto text-ink-faint !px-1.5 !py-1 hover:text-red-500"
                onClick={() => actions.removeCookLog(recipe.id, day)}
                aria-label={`Remove ${formatDayLabel(day)}`}
              >
                <Icon.Close />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Shared read-only recipe view: meta, ingredients, steps, and cook history.
// `footer` lets the host add context-specific actions (Edit/Delete, Back to plan).
export default function RecipeDetail({ recipe, actions, footer }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-accent/20 bg-accent-soft text-accent-hover">{recipe.category}</span>
        <span className="text-xs text-ink-faint">Serves 2 · cooked ×{recipe.timesCooked} · last made {relativeTime(recipe.lastCookedAt)}</span>
        {recipe.sourceUrl && (
          <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline">
            <Icon.External /> source
          </a>
        )}
      </div>

      <div>
        <h4 className="mb-2 font-serif text-base font-semibold">Ingredients</h4>
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((i, idx) => (
            <li key={idx} className="flex gap-2"><span className="text-accent">•</span><span><span className="text-ink-soft">{fmtQty(i)}</span>{i.name}</span></li>
          ))}
        </ul>
      </div>

      {recipe.steps.length > 0 && (
        <div>
          <h4 className="mb-2 font-serif text-base font-semibold">Steps</h4>
          <ol className="space-y-2 text-sm">
            {recipe.steps.map((s, idx) => (
              <li key={idx} className="flex gap-2"><span className="font-semibold text-accent">{idx + 1}.</span><span>{s}</span></li>
            ))}
          </ol>
        </div>
      )}

      <CookHistory recipe={recipe} actions={actions} />

      {footer && <div className="flex flex-wrap gap-2 border-t border-line pt-4">{footer}</div>}
    </div>
  )
}
