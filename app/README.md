# Mondelez India GT Intelligence — Interactive Prototype

A browser-based interactive prototype demonstrating AI-driven value for Mondelez India's General Trade (kirana) channel. Built for Hyderabad ZSM territory with 500 synthetic outlets.

> **All data is synthetic** — generated for demonstration purposes only.

## What This Does

Six interactive views covering two proposed POCs:

1. **Territory Overview** — Map of 500 outlets with health status (healthy / at-risk / stockout)
2. **Stockout Heatmap** — SKU x Beat matrix showing stockout concentration and revenue at risk
3. **Outlet Archetypes** — 6 behavioral clusters with ideal basket recommendations
4. **Smart Basket** — Per-outlet AI recommendation: current vs. ideal ordering pattern
5. **Outlet Detail** — Drill-down with time series (actual vs. forecast) and stockout markers
6. **Pilot Simulation** — 250 test vs. 250 control outlets, 90-day lift measurement

## Run Locally

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173/mndlz/ in your browser.

## Generate Synthetic Data

```bash
cd app
npm run generate-data
```

Outputs JSON files to `public/data/`.

## Build for Production

```bash
cd app
npm run build
```

Output in `app/dist/`.

## Deployment

Deployed via GitHub Actions to GitHub Pages. Push to `main` triggers automatic deployment.

## Architecture

- **Frontend**: React + Vite, Leaflet (maps), Recharts (charts), D3 (heatmap)
- **Analytics**: Client-side heuristic engine (5 modules) — no server required
- **Data**: Static JSON files bundled with the app (~18 MB uncompressed, ~2 MB gzip)

### Integration Hooks

Code contains `// HOOK:` comments marking where real systems would replace synthetic data:
- `// HOOK: Replace with real secondary sales API`
- `// HOOK: Replace with ML forecast model endpoint`
- `// HOOK: Replace with real clustering model`
- `// HOOK: Replace with real recommendation engine`
- `// HOOK: Replace with real A/B test framework`
