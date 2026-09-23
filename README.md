# TR Portfolio Visualizer (Unofficial)

**Unofficial Trade Republic portfolio visualizer. Not affiliated with, endorsed by, or connected to Trade Republic Bank GmbH in any way.**

Static, privacy-friendly dashboard for **Trade Republic CSV exports**: realized P&L per trade (FIFO), cumulative equity curve, daily gain/loss **heatmap**, per-symbol stats, open positions, full operations table.

**100% HTML/CSS/JS. No build, no server, no trackers.** Your CSV is parsed locally and kept in memory only — PII columns (`description`, `transaction_id`, counterparty data, IBANs, payment references, MCC) are stripped on load, cash-movement names are masked as `***`, `CARD`/`CARD_TRANSACTION` rows are discarded entirely, nothing is ever written to browser storage, and refreshing the page wipes everything.

## Disclaimer — visualizer only

This tool only visualizes the transactions contained in *your own* CSV export. It is **not financial, investment, or tax advice**, and calculations (FIFO matching, fee/tax allocation) may not match your broker statement or tax report exactly. Always double-check with Trade Republic and/or a professional before making decisions.

## Getting your CSV from the Trade Republic app

1. Open the **Trade Republic app** on your phone.
2. Go to **Profile → Settings → Export operations** (or similar: look for *Export / Documents / Transactions*).
3. Choose the full transaction history / operations export as **CSV** and save the file.
4. That's the file you load below — no editing needed. Expected columns include `datetime,date,category,type,symbol,shares,price,amount,fee,tax…`.

## Use it locally

Just open `index.html` in a browser (double-click works), or serve the folder:

```bash
# any static server, e.g.
python3 -m http.server 8000
# → http://localhost:8000
```

1. Drag & drop your exported CSV onto the page.
2. Explore the **Dashboard** (EN/IT toggle in the header — default follows your browser): main graph (net + gross, two-tone above/below zero — hover anywhere for a crosshair with the value) beside the daily heatmap (capped to 4 months with best/worst/most-traded day footers, ◀ ▶ to page through longer ranges), compact P&L by instrument (net/fees/tax split) next to win-rate stats by asset class and direction (stock/derivative, long/short), monthly P&L bars (your own realized data, no denominators, no estimates), closed trades with win rate, open positions, all operations. Switch to the **Statistics** tab for the graphic best-vs-worst summary duels (day/hour to open/close, all by win rate), the weekday×hour win-rate/activity matrix (Mon–Fri, 06–23 local), separated opened/closed activity charts, wins-vs-losses charts, median holding period and duration buckets with per-bucket win/loss donuts. Range presets 1D/1W/1M/1Y/YTD/All plus a custom from/to date range live in the top bar and drive both tabs; account stats (deposits, cash, open) too. Click any table header to sort.

## How P&L is computed (`app.js`)

- **FIFO matching** per `symbol` (ISIN): each SELL consumes the oldest open BUY lots.
- **Gross** = qty × (sell price − buy price). **Net** = gross − allocated buy fees − sell fees − sell taxes (buy-lot fees split pro-rata on partial closes).
- Daily heatmap groups **net** P&L by sell `date`. Deposits/withdrawals/interest are excluded from trading P&L but counted in the cash KPIs.
- Open positions show remaining quantity × average buy price (not revalued — the export has no market prices).

## Publish to GitHub Pages

```bash
git add -A && git commit -m "TR portfolio visualizer" && git push
# GitHub → repo Settings → Pages → Deploy from branch → main, folder /(root)
```

That's it — the repo is already Pages-ready (`.nojekyll`, relative asset paths). To point the header button at your repo, set the `href` of `#githubLink` in `index.html`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Layout & dashboard structure |
| `styles.css` | Dark responsive theme |
| `app.js` | CSV parsing, FIFO engine, charts (hand-rolled SVG), heatmap, tables |
| `.nojekyll` | Serve the site as-is on Pages |
