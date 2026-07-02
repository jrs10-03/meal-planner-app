# Meal Planner

A local-first, single-user meal planning web app. No accounts, no backend. All data
lives in your browser (`localStorage`), with an optional GitHub Gist sync layer for
using it across devices. Fully functional offline and unsynced.

## Features

- **Recipes** — a searchable, categorized library. Paste any messy recipe and parse it
  into structured ingredients + steps with an offline heuristic parser, or an optional
  AI parser (your own Anthropic API key). Scale any recipe down to 2 servings. Sort by
  A–Z, most cooked, or "haven't made in a while."
- **Plan** — build the week as a flexible list of meal slots, each flagged Dinner or
  Lunch. Each week runs 7 days from a start date you pick when creating it; slot day
  labels show the actual dates. Quick-add **Eating out** and **Leftovers** slots (with an
  optional note) to notate non-cooking nights — they never touch the shopping list. Mark
  meals "Cooked it" to bump a per-recipe counter. Past weeks archive automatically.
- **List** — an auto-generated shopping list grouped by aisle. Shows quantities only
  when the amount is large (3+ recipes or over a per-unit threshold); otherwise just the
  item name. Check items off, add one-offs, copy to clipboard. Swipe an item left to
  delete it or promote it to the staples list; Clear removes everything for the next
  week (a new week also resets the list).
- **Settings** (gear) — pantry staples to exclude, JSON backup export/import, Anthropic
  API key, and GitHub Gist sync.

## Run locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test        # runs the parser / scaler / aggregation unit tests
```

## Build

```bash
npm run build   # outputs static files to dist/
npm run preview # preview the production build
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every
   push to `main`. The Vite `base` is `./` (relative), so it works from any Pages path.
4. On your iPhone, open the deployed URL in Safari and **Add to Home Screen** — the web
   manifest + icons make it feel app-like.

## Optional: device sync via GitHub Gist

1. Create a GitHub personal access token with **only the `gist` scope**.
2. Open **Settings (gear) → Device sync**, paste the token, tap **Sync now**. The first
   sync creates a private gist and stores its ID.
3. On another device, paste the same token and Sync now to pull. Conflicts (both sides
   changed since the last sync) prompt you to keep this device or use the synced copy —
   no silent field merging.

The token and API key are stored only in your browser's localStorage and are never
committed anywhere.

## Architecture

- `src/lib/parser.js` — heuristic + AI recipe parsing (pure functions, unit-tested)
- `src/lib/scale.js` — serving scaler with sensible rounding
- `src/lib/aggregate.js` — shopping-list aggregation + the quantity-display rule
- `src/lib/sync.js` — GitHub Gist create/push/pull
- `src/lib/storage.js` — versioned localStorage schema + migrations
- `src/useAppState.js` — single state owner: actions + persistence + sync
- `src/components/*` — the three tabs and shared UI
