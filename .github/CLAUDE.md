# Deploy Sub-Agent

## Scope
GitHub Pages deployment configuration for the Mondelez India GT Intelligence prototype.

## Inputs
Built frontend bundle from `npm run build` (output in `app/dist/`).

## Outputs
Static site deployed to GitHub Pages at `https://<org>.github.io/mndlz/`.

## Constraints
- No backend server — purely static files
- No environment variables or API keys
- All data bundled as JSON in `public/data/` (included in build output)
- OpenStreetMap tiles loaded from CDN (no API key required)
- Leaflet CSS loaded from unpkg CDN

## Key Files

| File | Purpose |
|---|---|
| `.github/workflows/deploy.yml` | GitHub Actions workflow — builds on push to `main`, deploys to Pages |
| `app/vite.config.js` | Vite config with `base: '/mndlz/'` for GitHub Pages path prefix |
| `app/index.html` | Entry point, includes Leaflet CSS from CDN |
| `app/package.json` | Build scripts: `dev`, `build`, `generate-data` |

## Workflow Trigger
Push to `main` branch or manual `workflow_dispatch`.

## How to Deploy
1. Merge changes to `main`
2. GitHub Actions runs automatically:
   - Checks out code
   - Installs dependencies (`npm ci`)
   - Builds (`npm run build`)
   - Uploads `app/dist/` as Pages artifact
   - Deploys to GitHub Pages
3. Site available at the Pages URL

## How to Build Locally
```bash
cd app
npm run build
npx vite preview   # preview at http://localhost:4173/mndlz/
```
