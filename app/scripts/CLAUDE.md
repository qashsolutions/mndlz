# Data Generation Sub-Agent

## Scope
Synthetic data generation for the Mondelez India GT Intelligence prototype. Produces realistic data mimicking one ZSM territory (Hyderabad, ~500 kirana outlets).

## Inputs
None — generates all data from scratch using seeded randomness for reproducibility.

## Outputs
JSON files written to `../public/data/`:

| File | Records | Description |
|---|---|---|
| `outlets.json` | 500 | Kirana outlets with real Hyderabad pin codes, lat/lng, channel type |
| `skus.json` | 20 | Real Mondelez brands (Dairy Milk, Silk, 5 Star, Oreo, Bournvita, Tang, etc.) |
| `sales-monthly.json` | ~87K | 500 outlets × carried SKUs × 12 months |
| `sales-weekly-detail.json` | ~39K | Weekly granularity for first 50 outlets (drill-down) |
| `distributors.json` | 5 | Distributor master with served outlet lists |
| `distributor-stock.json` | 1,200 | Monthly closing stock by SKU per distributor |
| `returns.json` | ~50K | ~3% return rate, higher for summer chocolate |
| `schemes.json` | 8 | Promotional calendar (Valentine's, Diwali, Summer Tang, etc.) |
| `beats.json` | 40 | Weekly beat visit plan |

## Constraints
- Total compressed payload under 5MB (currently ~970KB gzip)
- Indian context: real Hyderabad areas/pin codes, realistic kirana shop names
- Real Mondelez brand names (Cadbury Dairy Milk, Silk, 5 Star, Oreo, Perk, Gems, Celebrations, Bournville, Chocobakes, Bournvita, Tang)
- Seasonal patterns: Valentine's wk 5-7, Diwali wk 43-45, Rakhi wk 32-34, Summer Tang wk 14-22
- Target return rate: 3.0% ± 0.2% of total volume
- Target stockout rate: 8.0% ± 0.3% of outlet-SKU-weeks
- Stockouts clustered: chronic outlets (~12%, 30% weekly rate) + summer chocolate melt + random

## Key Files
- `scripts/generate-data.js` — main generator script (seeded random, deterministic output)

## How to Run
```bash
cd app
npm run generate-data
```
