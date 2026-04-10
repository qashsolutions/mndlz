# Frontend Sub-Agent

## Scope
React single-page app with 6 interactive views for the Mondelez India GT Intelligence demo. Designed for a 5-minute executive walkthrough.

## Inputs
Analytics module outputs via `useData()` context hook (loads JSON data + runs `runFullPipeline()` on init).

## Outputs
Interactive browser-based prototype deployed as a static site.

## Constraints
- **Color palette**: background `#F7F5F0`, navy `#1B2A4A` (headings), orange `#D4532D` (risk/danger), teal `#2A7F62` (positive/success), gold `#C49A2A` (neutral/data)
- **Indian formatting**: ₹ symbol, lakhs (L), crores (Cr) via `utils/format.js`
- **Disclaimer footer**: "Prototype — synthetic data for demonstration purposes" on every view
- Mondelez brand names appear naturally (Dairy Milk, Silk, 5 Star, etc.)
- Premium, clean look — not a mockup, should feel like a real analytics tool

## Key Views

| View | File | Purpose |
|---|---|---|
| 1. Territory Overview | `TerritoryOverview.jsx` | Leaflet map of 500 outlets, health status pins, 5 summary cards |
| 2. Stockout Heatmap | `StockoutHeatmap.jsx` | D3 SKU×Beat matrix, filters (time/channel/archetype), revenue-at-risk table |
| 3. Outlet Archetypes | `OutletArchetypes.jsx` | Scatter plot (revenue vs breadth), 6 archetype cards, ideal basket drill-down |
| 4. Smart Basket | `SmartBasket.jsx` | Outlet search, current vs recommended basket, uplift estimate |
| 5. Outlet Detail | `OutletDetail.jsx` | Profile cards, weekly time series (actual vs forecast), stockout red dots |
| 6. Pilot Simulation | `PilotSimulation.jsx` | Test/control line chart, lift summary, scale/no-scale recommendation |

## Key Components
- `Layout.jsx` — sidebar navigation with 6 numbered links
- `SummaryCard.jsx` — metric card with title/value/subtitle and color variants
- `LoadingScreen.jsx` — spinner shown during data load

## How to Run
```bash
cd app
npm install
npm run dev
# Open http://localhost:5173/mndlz/
```
