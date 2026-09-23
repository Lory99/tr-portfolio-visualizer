# TR Portfolio Visualizer (Unofficial)

**Live demo: https://lory99.github.io/tr-portfolio-visualizer/**

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
2. Explore the **Dashboard**: equity curve, daily heatmap, P&L by instrument / asset class / month, closed trades, open positions.
3. Switch to **Statistics** for win-rate by day/hour, activity charts, holding periods.

## How P&L is computed (`app.js`)

- **FIFO matching** per `symbol` (ISIN): each SELL consumes the oldest open BUY lots.
- **Gross** = qty × (sell price − buy price). **Net** = gross − allocated buy fees − sell fees − sell taxes.
- Daily heatmap groups **net** P&L by sell `date`. Open positions are not revalued — the export has no market prices.

## Files

| File | Purpose |
|---|---|
| `index.html` | Layout & dashboard structure |
| `styles.css` | Dark responsive theme |
| `app.js` | CSV parsing, FIFO engine, charts (hand-rolled SVG), heatmap, tables |
| `.nojekyll` | Serve the site as-is on Pages |
