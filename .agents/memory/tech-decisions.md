---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.
- Live market rates use `BrsApi.ir` Free Endpoint with Chrome User-Agent header and 15-minute in-memory/file cache (`prices.json`).
- Portfolio growth chart uses real daily closing prices synced from TGJU (gold/fiat) and Binance (crypto), stored locally in `data/market_history.json`. Daily snapshots are recorded on price updates.
