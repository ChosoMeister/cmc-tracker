---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.
- Live market rates use a 3-tier resilient pipeline: Tier 1 `BrsApi.ir` (with zero-price sanity check), Tier 2 `TGJU Live JSON` (`call1.tgju.org/ajax.json`) + `Binance 24hr Ticker` (with TGJU crypto fallback), and Tier 3 healthy local cache (`prices.json` protected against placeholder overwrites).
- Portfolio growth chart uses real daily closing prices synced from TGJU (gold/fiat) and Binance (crypto), stored locally in `data/market_history.json`. Daily snapshots are recorded on price updates.
