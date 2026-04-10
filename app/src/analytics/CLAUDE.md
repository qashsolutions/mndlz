# Analytics Engine Sub-Agent

## Scope
Client-side analytics layer that processes synthetic data and produces outputs for the frontend. Heuristic engine — not real ML — but outputs must look like ML outputs.

## Inputs
JSON data files from `public/data/` (loaded by the frontend's `useData` hook and passed to `runFullPipeline()`).

## Outputs
Computed results object consumed by the 6 frontend views:
- `stockoutEvents` — array of detected stockout events with confidence and revenue-at-risk
- `stockoutStats` — rollups by SKU, outlet, week, and confidence
- `archetypeResult` — 6 outlet archetypes with assignments and features
- `idealBaskets` — per-archetype ranked SKU basket with weekly quantities
- `liftResult` — 90-day test/control simulation with weekly cumulative data
- `forecastStats` — backtest accuracy metrics (MAPE, accuracy %)

## Constraints
- All client-side, runs in the browser — no server, no API calls
- Deterministic given the same input data (seeded shuffle where needed)
- Heuristics are acceptable — moving averages, rule-based clustering, median-based baskets

## Confidence Thresholds (Stockout Detection)
- **HIGH**: average velocity >= 10 units/week
- **MEDIUM**: average velocity >= 3 units/week
- **LOW**: average velocity >= 2 units/week (minimum detection threshold)

## Key Modules

| Module | Purpose |
|---|---|
| `stockoutDetection.js` | Rolling 8-week velocity, flag zero-sales anomalies, revenue-at-risk, byWeek/bySku/byOutlet rollups |
| `demandForecast.js` | Trailing 8-wk avg + seasonality + 12-wk linear trend, backtest accuracy |
| `outletArchetypes.js` | Rule-based clustering into 6 archetypes (Premium Urban, Value Suburban, Impulse Transit, Steady Staples, Festival Spiker, Underperforming) |
| `smartBasket.js` | Per-archetype ideal basket (median), per-outlet gap analysis, uplift capped at 2× current |
| `liftSimulation.js` | 250/250 archetype-balanced split, 60% adoption rate, 13-week ramp-up simulation |
| `index.js` | Orchestrator — `runFullPipeline()` entry point, re-exports all module functions |

## How to Test
```bash
cd app
npx vite build   # type-checks all imports
```
Analytics run automatically when the app loads data. No separate test harness — verify via browser console or inline Node scripts.
