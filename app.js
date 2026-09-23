/* TR Portfolio Visualizer — 100% static, no dependencies, no network calls */
'use strict';

const $ = (s) => document.querySelector(s);
const els = {
  upload: $('#uploadCard'), drop: $('#dropZone'), file: $('#fileInput'), errors: $('#uploadErrors'),
  empty: $('#emptyState'), dash: $('#dashboard'),
  topControls: $('#topControls'),
  equity: $('#equityChart'), equitySub: $('#equitySub'), equityNet: $('#equityNet'),
  symbolBreakdown: $('#symbolBreakdown'), symbolHeadMeta: $('#symbolHeadMeta'),
  heatmap: $('#heatmap'), tip: $('#heatmapTip'), heatWindow: $('#heatWindow'),
  heatPrev: $('#heatPrev'), heatNext: $('#heatNext'), heatStats: $('#heatStats'),
  dowLabels: $('#dowLabels'),
  closedTable: $('#closedTable'), closedCount: $('#closedCount'), closedHeadMeta: $('#closedHeadMeta'),
  monthChart: $('#monthChart'), monthMeta: $('#monthMeta'),
  openTable: $('#openTable'), openCount: $('#openCount'),
  assetGrid: $('#assetGrid'), assetHeadMeta: $('#assetHeadMeta'),
  opsTable: $('#opsTable'), opsCount: $('#opsCount'),
  rowCount: $('#rowCount'),
  presets: $('#presets'), dateFrom: $('#dateFrom'), dateTo: $('#dateTo'), dateClear: $('#dateClear'),
  dashView: $('#dashView'), statsView: $('#statsView'), tabDash: $('#tabDash'), tabStats: $('#tabStats'),
  viewTabs: $('#viewTabs'), langToggle: $('#langToggle'),
  statsRange: $('#statsRange'), statsHeadlines: $('#statsHeadlines'), tradeSummary: $('#tradeSummary'),
  mxToggle: $('#mxToggle'), matrix: $('#matrix'), matrixCaption: $('#matrixCaption'), matrixTip: $('#matrixTip'),
  openWd: $('#openWd'), closeWd: $('#closeWd'), openHr: $('#openHr'), closeHr: $('#closeHr'),
  winLossWd: $('#winLossWd'), winLossHr: $('#winLossHr'),
  activityMeta: $('#activityMeta'), outcomeMeta: $('#outcomeMeta'),
  durationMeta: $('#durationMeta'), durationBuckets: $('#durationBuckets'),
};

/* ---------- utils ---------- */
const num = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(',', '.');
  if (s === '' || s === '-') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const fmtEUR = (n, dp = 2) =>
  (n < 0 ? '−' : '') + Math.abs(n).toLocaleString(lang === 'it' ? 'it-IT' : 'en-IE', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + ' €';
const fmtQty = (n) => Number(n).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US', { maximumFractionDigits: 6 });
const fmtDate = (d) => d || '—';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* Trade Republic exports funds as FUND — display them as ETF */
const normAsset = (ac) => {
  const u = String(ac ?? '').trim().toUpperCase();
  if (!u) return '';
  if (u === 'FUND' || u === 'FUNDS' || u === 'MUTUAL FUND' || u === 'MUTUAL_FUND' || u === 'MUTUALFUND') return 'ETF';
  return u;
};

/* ---------- i18n (EN/IT, memory-only, default follows browser) ---------- */
let lang = (navigator.language || 'en').toLowerCase().startsWith('it') ? 'it' : 'en';
const I18N = {
en: {
  brand_sub: 'Trade Republic CSV → P&L dashboard & daily heatmap · 100% local',
  tab_dash: 'Dashboard', tab_stats: 'Statistics', views_label: 'Views',
  p_1d: 'Last trading day', p_1w: 'Last 7 days', p_1m: 'Last 30 days', p_1y: 'Last 365 days',
  p_ytd: 'Year to date', p_all: 'Full range', p_all_btn: 'All', presets_label: 'Date range presets',
  from: 'From', to: 'To', clear_range: 'Clear custom range',
  up_title: 'Drop your Trade Republic CSV here', up_or: 'or', up_browse: 'browse files',
  up_rest: '· parsed locally, never uploaded or stored',
  pill_private: '✓ private', pill_static: '✓ static',
  exp_a: 'Expected file:', exp_b: '/ Trade Republic export with columns',
  drop_label: 'Upload CSV file',
  empty_title: 'No data yet', empty_a: 'Upload a CSV', empty_b: 'to see the dashboard.',
  step1: '<strong>1.</strong> Trade Republic app → Profile → Settings → Export operations (CSV)',
  step2: '<strong>2.</strong> Drop the file above — PII columns are stripped on load, everything stays in memory, refresh wipes all.',
  step3: '<strong>3.</strong> Publish this folder to GitHub Pages — no server, no build.',
  eq_title: 'Cumulative realized P&L',
  eq_note: 'Net of fees & taxes, ordered by sell date (FIFO). Open positions are <em>not</em> revalued — no market prices in the export.',
  heat_title: 'Heatmap', heat_prev: 'Previous months', heat_next: 'Next months',
  best_day: 'Best day', worst_day: 'Worst day', most_trades: 'Most trades',
  sell_one: '1 sell', sell_many: '{n} sells', heat_no: 'No sells in window.',
  inst_title: 'P&L by instrument', inst_sub: 'Realized net · fees & taxes split',
  th_instrument: 'Instrument', th_net: 'Net', th_fees: 'Fees', th_tax: 'Tax', th_trades: 'Trades',
  total: 'Total', more_one: '1 more instrument hidden', more_many: '{n} more instruments hidden',
  show_all: 'Show all ({n})', show_less: 'Show less — collapse to first {a} + last {b}',
  asset_title: 'By asset class', asset_meta0: 'realized · win rate',
  asset_meta: 'Net {n} · {t} trades', no_data: 'No data.',
  trade_one: 'trade', trade_many: 'trades',
  month_title: 'P&L by month',
  month_note: 'Realized net per calendar month (sell date, FIFO). Green = profitable month, red = losing month.',
  closed_title: 'Closed trades', open_title: 'Open positions', ops_title: 'All operations',
  ops_sub: 'raw CSV rows, newest first',
  method_title: 'How P&L is computed',
  m1: '<strong>FIFO matching</strong> per <code>symbol</code> (ISIN). Each SELL consumes the oldest open BUY lots.',
  m2: '<strong>Gross</strong> = qty × (sell price − buy price). <strong>Net</strong> = gross − allocated buy fees − sell fees − sell taxes.',
  m3: 'Fees/taxes of a BUY lot are split pro-rata when a SELL only closes part of it.',
  m4: '<strong>Daily heatmap</strong> groups net P&L by sell <code>date</code>. Deposits, withdrawals and interest are excluded from trading P&L but counted in cash stats.',
  m5: 'All parsing happens in <code>app.js</code> — inspect it, no trackers, no network calls. PII columns (<code>description</code>, <code>transaction_id</code>, counterparty data, IBANs, payment references, MCC) are dropped on load, cash-movement names are masked as <code>***</code>, <code>CARD</code> payment rows are discarded entirely, and nothing is ever written to browser storage.',
  sum_title: 'Summary', sum_sub: 'best & worst moments to act · hours 06–23 local · in range',
  act_title: 'Activity & profitability', mx_win: 'Win %', mx_trades: 'Trades',
  mx_label: 'Matrix view', matrix_role: 'Weekday by hour distribution matrix',
  oc_title: 'Open vs close activity', opened_buys: 'Opened (buys)', closed_sells: 'Closed (sells)',
  opened_wd: 'Opened · by weekday', closed_wd: 'Closed · by weekday',
  opened_hr: 'Opened · by hour (local, 06–23)', closed_hr: 'Closed · by hour (local, 06–23)',
  wl_title: 'Wins vs losses', wl_sub: 'closed sells only · green = win, red = loss',
  wins: 'Wins', losses: 'Losses', by_wd: 'By weekday', by_hr: 'By hour (local, 06–23)',
  dur_title: 'Position duration',
  hold_note: 'Holding period per closed SELL: sell date minus earliest matched BUY date (FIFO).',
  foot_text: 'TR Portfolio Visualizer · static HTML/CSS/JS · your CSV never leaves this browser.',
  err_parse: 'Could not parse file: ', err_empty: 'No rows found. Is this the Trade Republic CSV?',
  err_cols: 'Missing columns (expected symbol, type, shares, price…). Check you exported “operations”.',
  rowcount: '{f} · {r} rows · {t} trades · {c} sells closed',
  account: 'Deposits {d} · Cash ≈ {c} · Open {o}',
  no_data_filters: 'No data for current filters.',
  no_sells_range: 'no sells in range',
  gross_sub: 'Gross {g} · {n} sells · {a} → {b}',
  symbol_meta: 'Net {n} · Fees {f} · Tax {t}',
  closed_count: '{n} sells', open_count: '{n} positions', ops_count: '{n} rows',
  closed_meta: 'Win {p}% ({w}W/{l}L) · click a header to sort',
  closed_meta0: 'one row per SELL · click a header to sort',
  th_selldate: 'Sell date', th_symbol: 'Symbol', th_name: 'Name', th_qty: 'Qty',
  th_avgbuy: 'Avg buy', th_sell: 'Sell', th_gross: 'Gross', th_fee: 'Fee',
  th_ret: 'Return', th_hold: 'Hold d',
  th_date: 'Date', th_type: 'Type', th_price: 'Price', th_amount: 'Amount',
  th_cost: 'Cost', th_since: 'Since', open_empty: 'No open positions in filter.',
  stats_range: '{a} → {b} · {n} sells in range',
  buys: 'Buys', buys_l: 'buys', sells_closed: 'Sells closed', open_pos: 'Open positions',
  median_hold: 'Median hold', day_unit: '{n} d', best_wd: 'Best weekday', best_hr: 'Best hour',
  most_held: 'Most held', pos_days: '{n} position-days',
  open_day: 'To open · by day', open_hour: 'To open · by hour',
  close_day: 'To close · by day', close_hour: 'To close · by hour',
  best: 'Best', worst: 'Worst', no_data_range: 'No closed trades in range.',
  mx_cap_a: 'Rows = weekday, columns = hour 06–23 (local) of execution. Win % counts winning sells; trades count buys + sells.',
  mx_night_one: '1 night trade (00–06) hidden.', mx_night_many: '{n} night trades (00–06) hidden.',
  mx_cap_b: 'Hover any cell for the full breakdown.',
  act_meta_a: 'separate charts · shared scale per row · ',
  act_night_one: '1 night trade (00–06) hidden · ', act_night_many: '{n} night trades (00–06) hidden · ',
  act_meta_b: 'hours 06–23 local',
  outcome_meta: '{w} wins · {l} losses · {p}% win in range',
  dur_meta: 'min {a}d · median {m}d · avg {v}d · max {x}d',
  dur_meta0: 'no closed trades in range',
  bk0: 'Intraday (0 days)', bk1: '1–7 days', bk2: '8–30 days', bk3: '31+ days',
  month_meta: 'Net {n} · best {m} ({v})',
  no_sells_cell: 'no sells',
  wd_full: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  wd_short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
},
it: {
  brand_sub: 'CSV Trade Republic → dashboard P&L e heatmap giornaliera · 100% locale',
  tab_dash: 'Dashboard', tab_stats: 'Statistiche', views_label: 'Viste',
  p_1d: 'Ultimo giorno di trading', p_1w: 'Ultimi 7 giorni', p_1m: 'Ultimi 30 giorni', p_1y: 'Ultimi 365 giorni',
  p_ytd: 'Da inizio anno', p_all: 'Intero intervallo', p_all_btn: 'Tutto', presets_label: 'Preset intervallo date',
  from: 'Da', to: 'A', clear_range: 'Cancella intervallo personalizzato',
  up_title: 'Trascina qui il tuo CSV Trade Republic', up_or: 'oppure', up_browse: 'sfoglia i file',
  up_rest: '· analizzato in locale, mai caricato né salvato',
  pill_private: '✓ privato', pill_static: '✓ statico',
  exp_a: 'File atteso:', exp_b: '/ export Trade Republic con colonne',
  drop_label: 'Carica file CSV',
  empty_title: 'Ancora nessun dato', empty_a: 'Carica un CSV', empty_b: 'per vedere il dashboard.',
  step1: '<strong>1.</strong> App Trade Republic → Profilo → Impostazioni → Esporta operazioni (CSV)',
  step2: '<strong>2.</strong> Trascina il file sopra — le colonne PII vengono rimosse al caricamento, tutto resta in memoria, ricaricare cancella tutto.',
  step3: '<strong>3.</strong> Pubblica questa cartella su GitHub Pages — nessun server, nessuna build.',
  eq_title: 'P&L realizzato cumulato',
  eq_note: 'Al netto di commissioni e tasse, in ordine di data vendita (FIFO). Le posizioni aperte <em>non</em> sono rivalutate — l\u2019export non contiene prezzi di mercato.',
  heat_title: 'Heatmap', heat_prev: 'Mesi precedenti', heat_next: 'Mesi successivi',
  best_day: 'Giorno migliore', worst_day: 'Giorno peggiore', most_trades: 'Più trade',
  sell_one: '1 vendita', sell_many: '{n} vendite', heat_no: 'Nessuna vendita nella finestra.',
  inst_title: 'P&L per strumento', inst_sub: 'Netto realizzato · dettaglio commissioni e tasse',
  th_instrument: 'Strumento', th_net: 'Netto', th_fees: 'Commissioni', th_tax: 'Tasse', th_trades: 'Trade',
  total: 'Totale', more_one: '1 altro strumento nascosto', more_many: '{n} altri strumenti nascosti',
  show_all: 'Mostra tutti ({n})', show_less: 'Mostra meno — comprimi a primi {a} + ultimi {b}',
  asset_title: 'Per asset class', asset_meta0: 'realizzato · win rate',
  asset_meta: 'Netto {n} · {t} trade', no_data: 'Nessun dato.',
  trade_one: 'trade', trade_many: 'trade',
  month_title: 'P&L per mese',
  month_note: 'Netto realizzato per mese di calendario (data vendita, FIFO). Verde = mese profittevole, rosso = mese in perdita.',
  closed_title: 'Trade chiusi', open_title: 'Posizioni aperte', ops_title: 'Tutte le operazioni',
  ops_sub: 'righe CSV grezze, dalle più recenti',
  method_title: 'Come è calcolato il P&L',
  m1: 'Abbinamento <strong>FIFO</strong> per <code>symbol</code> (ISIN). Ogni VENDITA consuma i lotti di ACQUISTO più vecchi.',
  m2: '<strong>Lordo</strong> = qtà × (prezzo vendita − prezzo acquisto). <strong>Netto</strong> = lordo − commissioni di acquisto allocate − commissioni di vendita − tasse di vendita.',
  m3: 'Commissioni/tasse di un lotto di ACQUISTO sono ripartite pro-rata quando una VENDITA chiude solo parte del lotto.',
  m4: 'L\u2019<strong>heatmap giornaliera</strong> raggruppa il P&L netto per <code>date</code> di vendita. Depositi, prelievi e interessi sono esclusi dal P&L di trading ma conteggiati nelle statistiche di cassa.',
  m5: 'Tutta l\u2019analisi avviene in <code>app.js</code> — ispezionalo, nessun tracker, nessuna chiamata di rete. Le colonne PII (<code>description</code>, <code>transaction_id</code>, dati controparte, IBAN, riferimenti di pagamento, MCC) sono scartate al caricamento, i nomi dei movimenti di cassa sono mascherati come <code>***</code>, le righe di pagamento <code>CARD</code> sono eliminate del tutto e nulla viene mai scritto nello storage del browser.',
  sum_title: 'Riepilogo', sum_sub: 'momenti migliori e peggiori per agire · ore 06–23 locali · nell\u2019intervallo',
  act_title: 'Attività e redditività', mx_win: 'Win %', mx_trades: 'Trade',
  mx_label: 'Vista matrice', matrix_role: 'Matrice giorno-ora di distribuzione',
  oc_title: 'Attività aperture vs chiusure', opened_buys: 'Aperte (acquisti)', closed_sells: 'Chiuse (vendite)',
  opened_wd: 'Aperte · per giorno', closed_wd: 'Chiuse · per giorno',
  opened_hr: 'Aperte · per ora (locale, 06–23)', closed_hr: 'Chiuse · per ora (locale, 06–23)',
  wl_title: 'Vincite vs perdite', wl_sub: 'solo vendite chiuse · verde = vincita, rosso = perdita',
  wins: 'Vincite', losses: 'Perdite', by_wd: 'Per giorno', by_hr: 'Per ora (locale, 06–23)',
  dur_title: 'Durata posizioni',
  hold_note: 'Periodo di detenzione per VENDITA chiusa: data vendita meno data del primo ACQUISTO abbinato (FIFO).',
  foot_text: 'TR Portfolio Visualizer · HTML/CSS/JS statico · il tuo CSV non lascia mai questo browser.',
  err_parse: 'Impossibile analizzare il file: ', err_empty: 'Nessuna riga trovata. È questo il CSV Trade Republic?',
  err_cols: 'Colonne mancanti (attese symbol, type, shares, price…). Verifica di aver esportato le “operazioni”.',
  rowcount: '{f} · {r} righe · {t} trade · {c} vendite chiuse',
  account: 'Depositi {d} · Cassa ≈ {c} · Aperte {o}',
  no_data_filters: 'Nessun dato per i filtri attuali.',
  no_sells_range: 'nessuna vendita nell\u2019intervallo',
  gross_sub: 'Lordo {g} · {n} vendite · {a} → {b}',
  symbol_meta: 'Netto {n} · Commissioni {f} · Tasse {t}',
  closed_count: '{n} vendite', open_count: '{n} posizioni', ops_count: '{n} righe',
  closed_meta: 'Win {p}% ({w}W/{l}L) · clicca un\u2019intestazione per ordinare',
  closed_meta0: 'una riga per VENDITA · clicca un\u2019intestazione per ordinare',
  th_selldate: 'Data vendita', th_symbol: 'Simbolo', th_name: 'Nome', th_qty: 'Qtà',
  th_avgbuy: 'Acq. medio', th_sell: 'Vendita', th_gross: 'Lordo', th_fee: 'Commissione',
  th_ret: 'Rendimento', th_hold: 'Giorni',
  th_date: 'Data', th_type: 'Tipo', th_price: 'Prezzo', th_amount: 'Importo',
  th_cost: 'Costo', th_since: 'Dal', open_empty: 'Nessuna posizione aperta nel filtro.',
  stats_range: '{a} → {b} · {n} vendite nell\u2019intervallo',
  buys: 'Acquisti', buys_l: 'acquisti', sells_closed: 'Vendite chiuse', open_pos: 'Posizioni aperte',
  median_hold: 'Detenzione mediana', day_unit: '{n} g', best_wd: 'Giorno migliore', best_hr: 'Miglior ora',
  most_held: 'Più detenuto', pos_days: '{n} giorni-posizione',
  open_day: 'Per aprire · per giorno', open_hour: 'Per aprire · per ora',
  close_day: 'Per chiudere · per giorno', close_hour: 'Per chiudere · per ora',
  best: 'Migliore', worst: 'Peggiore', no_data_range: 'Nessun trade chiuso nell\u2019intervallo.',
  mx_cap_a: 'Righe = giorni, colonne = ore 06–23 (locali) di esecuzione. Il Win % conta le vendite in utile; i trade contano acquisti + vendite.',
  mx_night_one: '1 trade notturno (00–06) nascosto.', mx_night_many: '{n} trade notturni (00–06) nascosti.',
  mx_cap_b: 'Passa su una cella per il dettaglio completo.',
  act_meta_a: 'grafici separati · scala condivisa per riga · ',
  act_night_one: '1 trade notturno (00–06) nascosto · ', act_night_many: '{n} trade notturni (00–06) nascosti · ',
  act_meta_b: 'ore 06–23 locali',
  outcome_meta: '{w} vincite · {l} perdite · {p}% win nell\u2019intervallo',
  dur_meta: 'min {a}g · mediana {m}g · media {v}g · max {x}g',
  dur_meta0: 'nessun trade chiuso nell\u2019intervallo',
  bk0: 'Infragiornaliero (0 giorni)', bk1: '1–7 giorni', bk2: '8–30 giorni', bk3: '31+ giorni',
  month_meta: 'Netto {n} · migliore {m} ({v})',
  no_sells_cell: 'nessuna vendita',
  wd_full: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
  wd_short: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'],
},
};
const t = (k, vars) => {
  let s = I18N[lang][k] ?? I18N.en[k] ?? k;
  if (typeof s !== 'string') return s;
  if (vars) for (const [kk, vv] of Object.entries(vars)) s = s.replaceAll('{' + kk + '}', vv);
  return s;
};
const trW = (n) => (n === 1 ? t('trade_one') : t('trade_many'));
const sellW = (n) => (n === 1 ? t('sell_one') : t('sell_many', { n }));
function applyStaticLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  els.langToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.l === lang));
}
function setLang(l) {
  lang = l;
  applyStaticLang();
  renderAll();
}

/* ---------- CSV parser (quoted fields, commas, newlines) ---------- */
function parseCSV(text) {
  const rows = [];
  let cur = [''], inQ = false, r = 0, c = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur[c] += '"'; i++; }
        else inQ = false;
      } else cur[c] += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { cur.push(''); c++; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { rows.push(cur); cur = ['']; r++; c = 0; }
      else cur[c] += ch;
    }
  }
  if (cur.length > 1 || cur[0] !== '') rows.push(cur);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ''));
  // Privacy: PII columns are dropped at parse time and never kept anywhere.
  const PII = ['description', 'transaction_id', 'counterparty_name', 'counterparty_iban', 'payment_reference', 'mcc_code'];
  return rows.slice(1).filter((row) => row.some((x) => String(x).trim() !== '')).map((row) => {
    const o = {};
    header.forEach((h, i) => { if (!PII.includes(h)) o[h] = (row[i] ?? '').trim(); });
    return o;
  // Card payments are spending, not investing: dropped entirely on import.
  }).filter((o) => {
    const t = String(o.type || '').toUpperCase();
    return t !== 'CARD' && t !== 'CARD_TRANSACTION';
  });
}

/* ---------- core analysis: FIFO ---------- */
function analyze(rawRows) {
  const rows = rawRows.map((r, i) => ({
    i,
    datetime: r.datetime || '', date: (r.date || '').slice(0, 10),
    category: r.category || '', type: r.type || '',
    asset_class: normAsset(r.asset_class), name: r.category === 'CASH' ? '***' : (r.name || ''), symbol: r.symbol || '',
    shares: num(r.shares), price: num(r.price), amount: num(r.amount),
    fee: num(r.fee), tax: num(r.tax), currency: r.currency || 'EUR',
  })).filter((r) => r.datetime || r.date || r.type);

  rows.sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));

  const trading = rows.filter((r) => r.category === 'TRADING' && (r.type === 'BUY' || r.type === 'SELL'));
  const lots = new Map(); // symbol -> [{qty, origQty, price, fee, date, datetime}]
  const closed = [];

  for (const t of trading) {
    if (!lots.has(t.symbol)) lots.set(t.symbol, []);
    const q = lots.get(t.symbol);
    if (t.type === 'BUY') {
      const qty = Math.abs(t.shares);
      if (qty > 0) q.push({ qty, origQty: qty, price: t.price, fee: Math.abs(t.fee), date: t.date, datetime: t.datetime });
    } else {
      let need = Math.abs(t.shares);
      const sellFee = Math.abs(t.fee), sellTax = t.tax < 0 ? -t.tax : t.tax;
      let buyCost = 0, buyFees = 0, matchedQty = 0, earliest = null, earliestDt = null, latest = null;
      const buyDates = [];
      while (need > 1e-9 && q.length) {
        const lot = q[0];
        const take = Math.min(lot.qty, need);
        const frac = take / lot.origQty;
        buyCost += take * lot.price;
        buyFees += lot.fee * frac;
        matchedQty += take;
        buyDates.push({ date: lot.date, qty: take });
        if (!earliest || lot.date < earliest) earliest = lot.date;
        if (!earliestDt || (lot.datetime && lot.datetime < earliestDt)) earliestDt = lot.datetime || earliestDt;
        if (!latest || lot.date > latest) latest = lot.date;
        lot.qty -= take; need -= take;
        if (lot.qty <= 1e-9) q.shift();
      }
      const unmatched = need > 1e-9;
      const proceeds = matchedQty * t.price;
      const gross = proceeds - buyCost;
      // split sell fee/tax pro-rata across matched portion
      const totalSellQty = Math.abs(t.shares) || matchedQty || 1;
      const ratio = matchedQty / totalSellQty;
      const sFee = sellFee * ratio, sTax = sellTax * ratio;
      const net = gross - buyFees - sFee - sTax;
      const avgBuy = matchedQty ? buyCost / matchedQty : 0;
      const holdDays = earliest && t.date ? Math.max(0, Math.round((new Date(t.date) - new Date(earliest)) / 864e5)) : 0;
      const retPct = buyCost ? (gross - buyFees - sFee - sTax) / (buyCost + buyFees) * 100 : 0;
      closed.push({
        sellDate: t.date, sellDatetime: t.datetime, symbol: t.symbol, name: t.name,
        qty: matchedQty, buyPrice: avgBuy, sellPrice: t.price,
        buyDate: earliest || '', buyDatetime: earliestDt || '', holdDays, gross, buyFees, sellFee: sFee, sellTax: sTax,
        fees: buyFees + sFee,
        ac: normAsset(t.asset_class) || 'OTHER',
        side: /^\s*(short|put)\b/i.test(t.name || '') ? 'Short' : 'Long',
        net, retPct, unmatched, txId: t.i,
      });
    }
  }

  // open positions
  const open = [];
  for (const [symbol, q] of lots) {
    const qty = q.reduce((s, l) => s + l.qty, 0);
    if (qty <= 1e-9) continue;
    const cost = q.reduce((s, l) => s + l.qty * l.price, 0);
    const fees = q.reduce((s, l) => s + l.fee * (l.qty / l.origQty), 0);
    const anyBuy = trading.filter((t) => t.symbol === symbol && t.type === 'BUY').slice(-1)[0];
    open.push({ symbol, name: anyBuy?.name || '', qty, avgPrice: cost / qty, cost, fees, since: q[0]?.date || '' });
  }

  // cash KPIs
  let deposits = 0, withdrawals = 0, interest = 0, feesPaid = 0, taxPaid = 0, cashNet = 0;
  for (const r of rows) {
    const netFlow = r.amount + (r.fee || 0) + (r.tax || 0);
    cashNet += netFlow;
    feesPaid += r.fee < 0 ? -r.fee : 0;
    taxPaid += r.tax < 0 ? -r.tax : 0;
    if (r.category === 'CASH') {
      if (/INBOUND|DEPOSIT|TRANSFER.*IN/i.test(r.type) && r.amount > 0) deposits += r.amount;
      else if (r.amount < 0 && /OUTBOUND|PAYOUT|TRANSFER|WITHDRAW/i.test(r.type)) withdrawals += -r.amount;
      if (/INTEREST/i.test(r.type)) interest += r.amount;
    }
  }

  // per-symbol realized
  const perSymbol = new Map();
  for (const c of closed) {
    if (!perSymbol.has(c.symbol)) perSymbol.set(c.symbol, { symbol: c.symbol, name: c.name, net: 0, gross: 0, fees: 0, tax: 0, trades: 0, wins: 0, qty: 0 });
    const s = perSymbol.get(c.symbol);
    s.net += c.net; s.gross += c.gross; s.fees += c.buyFees + c.sellFee; s.tax += c.sellTax;
    s.trades++; s.qty += c.qty; if (c.net > 0) s.wins++;
  }

  // daily
  const perDay = new Map();
  for (const c of closed) {
    if (!perDay.has(c.sellDate)) perDay.set(c.sellDate, { date: c.sellDate, net: 0, gross: 0, trades: 0 });
    const d = perDay.get(c.sellDate);
    d.net += c.net; d.gross += c.gross; d.trades++;
  }

  return { rows, trading, closed, open, perSymbol, perDay, deposits, withdrawals, interest, feesPaid, taxPaid, cashNet };
}

/* ---------- filtering (range only — presets + custom range in the top bar) ---------- */
let rangeFrom = '', rangeTo = '';
function getFilters() {
  return { from: rangeFrom, to: rangeTo };
}
function passClosed(c, f) {
  if (f.from && c.sellDate < f.from) return false;
  if (f.to && c.sellDate > f.to) return false;
  return true;
}

/* ---------- renderers ---------- */
let STATE = null;
const sortState = { key: 'sellDate', dir: -1 };

function renderAll() {
  if (!STATE) return;
  const f = getFilters();
  const closed = STATE.closed.filter((c) => passClosed(c, f)).sort((a, b) => {
    const k = sortState.key, d = sortState.dir;
    const va = a[k], vb = b[k];
    return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * d;
  });

  renderEquity(closed);
  renderSymbolBreakdown(closed);
  renderHeatmap(closed);
  renderClosed(closed);
  renderAsset(closed);
  renderOpen();
  renderOps(f);
  renderStats(closed);
  paintRanges();
  renderMonthly(closed);
}

function renderEquity(closed) {
  const sorted = [...closed].sort((a, b) => String(a.sellDatetime).localeCompare(String(b.sellDatetime)));
  let cum = 0;
  const pts = sorted.map((c) => (cum += c.net, { d: c.sellDate, cum }));
  const last = pts.length ? pts[pts.length - 1].cum : 0;
  els.equityNet.textContent = pts.length ? fmtEUR(last) : '—';
  els.equityNet.className = 'eq-net ' + (last >= 0 ? 'pos' : 'neg');
  const gross = sorted.reduce((s, c) => s + c.gross, 0);
  els.equitySub.textContent = sorted.length ? t('gross_sub', { g: fmtEUR(gross), n: sorted.length, a: sorted[0].sellDate, b: sorted[sorted.length - 1].sellDate }) : t('no_sells_range');
  if (!pts.length) { els.equity.innerHTML = `<p class="muted">${t('no_data_filters')}</p>`; return; }
  const W = 620, H = 220, P = 28;
  const vals = pts.map((p) => p.cum);
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const span = hi - lo || 1;
  const X = (i) => P + (i / Math.max(1, pts.length - 1)) * (W - 2 * P);
  const Y = (v) => H - P - ((v - lo) / span) * (H - 2 * P);
  const Y0 = Y(0);
  const f1 = (n) => n.toFixed(1);
  let posLine = '', negLine = '', posArea = '', negArea = '';
  const pushSeg = (x1, y1, x2, y2, pos) => {
    const line = `M${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)} `;
    const area = `M${f1(x1)},${f1(Y0)} L${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)} L${f1(x2)},${f1(Y0)} Z `;
    if (pos) { posLine += line; posArea += area; } else { negLine += line; negArea += area; }
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const x1 = X(i), x2 = X(i + 1), y1 = Y(a.cum), y2 = Y(b.cum);
    if ((a.cum >= 0) === (b.cum >= 0)) pushSeg(x1, y1, x2, y2, a.cum >= 0);
    else {
      // split the segment exactly where it crosses zero
      const t = Math.abs(a.cum) / (Math.abs(a.cum) + Math.abs(b.cum));
      const x0 = x1 + (x2 - x1) * t;
      pushSeg(x1, y1, x0, Y0, a.cum >= 0);
      pushSeg(x0, Y0, x2, y2, b.cum >= 0);
    }
  }
  els.equity.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('eq_title')}">
    <line x1="${P}" y1="${f1(Y0)}" x2="${W - P}" y2="${f1(Y0)}" stroke="#33406a" stroke-dasharray="4 4"/>
    <path d="${posArea}" fill="#22c55e22"/>
    <path d="${negArea}" fill="#ef444422"/>
    <path d="${posLine}" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${negLine}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="${P}" y="${H - 6}" fill="#9aa4bd" font-size="11">${esc(pts[0].d)}</text>
    <text x="${W - P}" y="${H - 6}" fill="#9aa4bd" font-size="11" text-anchor="end">${esc(pts[pts.length - 1].d)}</text>
    <text x="${W - P}" y="${f1(Y(last) - 8)}" fill="${last >= 0 ? '#22c55e' : '#ef4444'}" font-size="13" font-weight="bold" text-anchor="end">${esc(fmtEUR(last))}</text>
  </svg>`;
  // hover anywhere: crosshair snaps to the nearest sell, value highlighted in a tooltip
  let tip = els.equity.querySelector('.eq-tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'eq-tip'; tip.hidden = true; els.equity.appendChild(tip); }
  const svg = els.equity.querySelector('svg');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const cross = document.createElementNS(NS, 'line');
    cross.setAttribute('y1', 8); cross.setAttribute('y2', H - P);
    cross.setAttribute('stroke', '#5b8cff'); cross.setAttribute('stroke-dasharray', '3 3');
    cross.style.display = 'none';
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', '5'); dot.setAttribute('stroke', '#0b0e14'); dot.setAttribute('stroke-width', '2');
    dot.style.display = 'none';
    const cap = document.createElementNS(NS, 'rect');
    cap.setAttribute('x', P); cap.setAttribute('y', 0);
    cap.setAttribute('width', W - 2 * P); cap.setAttribute('height', H);
    cap.setAttribute('fill', 'transparent');
    cap.style.cursor = 'crosshair';
    svg.appendChild(cross); svg.appendChild(dot); svg.appendChild(cap);
    const XS = pts.map((_, i) => X(i));
    cap.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * W;
      let bi = 0;
      for (let i = 1; i < XS.length; i++) if (Math.abs(XS[i] - px) < Math.abs(XS[bi] - px)) bi = i;
      const p = pts[bi], up = p.cum >= 0;
      cross.setAttribute('x1', XS[bi]); cross.setAttribute('x2', XS[bi]);
      cross.style.display = '';
      dot.setAttribute('cx', XS[bi]); dot.setAttribute('cy', Y(p.cum));
      dot.setAttribute('fill', up ? '#22c55e' : '#ef4444');
      dot.style.display = '';
      tip.hidden = false;
      tip.innerHTML = `<strong>${esc(p.d)}</strong> · <span class="${up ? 'pos' : 'neg'}">${fmtEUR(p.cum)}</span>`;
      tip.style.left = (XS[bi] / W * 100) + '%';
      tip.style.top = (Y(p.cum) / H * 100) + '%';
    });
    cap.addEventListener('mouseleave', () => {
      cross.style.display = 'none'; dot.style.display = 'none'; tip.hidden = true;
    });
  }
}

function monthsBetween(a, b) {
  const out = [];
  if (!a || !b || a > b) return out;
  let [y, m] = a.slice(0, 7).split('-').map(Number);
  const [ey, em] = b.slice(0, 7).split('-').map(Number);
  let g = 0;
  while ((y < ey || (y === ey && m <= em)) && g++ < 240) {
    out.push(y + '-' + String(m).padStart(2, '0'));
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}
const monthLastDay = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

let heatEndIdx = -1, heatRangeKey = '';

function renderHeatmap(closed) {
  if (els.dowLabels) els.dowLabels.innerHTML = I18N[lang].wd_short.map((d) => `<span>${esc(d)}</span>`).join('');
  const perDay = new Map();
  for (const c of closed) {
    if (!perDay.has(c.sellDate)) perDay.set(c.sellDate, { date: c.sellDate, net: 0, trades: 0 });
    const d = perDay.get(c.sellDate);
    d.net += c.net; d.trades++;
  }
  const f = getFilters();
  let months = monthsBetween(f.from, f.to);
  if (!months.length) months = [...new Set(STATE.rows.map((r) => r.date).filter(Boolean).map((d) => d.slice(0, 7)))].sort();
  const key = months.join(',');
  if (key !== heatRangeKey) { heatRangeKey = key; heatEndIdx = -1; }
  const M = months.length;
  let fromI = 0, toI = Math.max(0, M - 1), paged = false;
  if (M > 4) {
    paged = true;
    if (heatEndIdx < 0 || heatEndIdx >= M) heatEndIdx = M - 1;
    heatEndIdx = Math.min(Math.max(heatEndIdx, 3), M - 1);
    toI = heatEndIdx; fromI = toI - 3;
  }
  els.heatPrev.style.display = els.heatNext.style.display = paged ? '' : 'none';
  els.heatPrev.disabled = !(paged && toI > 3);
  els.heatNext.disabled = !(paged && toI < M - 1);
  if (!M) {
    els.heatmap.innerHTML = '<p class="muted">No data.</p>';
    els.heatWindow.textContent = '';
    return;
  }
  const start = months[fromI] + '-01', end = monthLastDay(months[toI]);
  els.heatWindow.textContent = fromI === toI ? prettyMonth(months[toI]) : prettyMonth(months[fromI]) + ' – ' + prettyMonth(months[toI]);
  const winDays = [...perDay.values()].filter((d) => d.date >= start && d.date <= end);
  const maxAbs = Math.max(0.01, ...winDays.map((d) => Math.abs(d.net)));
  const cls = (v) => {
    if (!v) return 'zero';
    const t = Math.abs(v) / maxAbs;
    const b = t < 0.33 ? '1' : t < 0.66 ? '2' : '3';
    return (v > 0 ? 'g' : 'l') + b;
  };
  const d0 = new Date(start + 'T12:00:00'), d1 = new Date(end + 'T12:00:00');
  const monday0 = new Date(d0); monday0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
  const fmtLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let html = '', cur = new Date(monday0), guard = 0;
  // weekdays only (Mon–Fri): weekends are skipped entirely, no cells emitted
  while ((cur <= d1 || (cur.getDay() + 6) % 7 !== 0) && guard++ < 500) {
    const wd = (cur.getDay() + 6) % 7;
    const iso = fmtLocal(cur);
    const inRange = iso >= start && iso <= end;
    if (wd < 5) {
      const d = perDay.get(iso);
      if (!inRange || cur > d1) { html += '<span class="day empty"></span>'; }
      else {
        const v = d ? d.net : 0;
        html += `<span class="day sw ${cls(v)}" data-date="${iso}" data-net="${v.toFixed(2)}" data-trades="${d ? d.trades : 0}" title="${iso}: ${fmtEUR(v)}"></span>`;
      }
    }
    cur.setDate(cur.getDate() + 1);
    if ((cur.getDay() + 6) % 7 === 0 && cur > d1) break;
  }
  els.heatmap.innerHTML = html;
  // tooltip (hover on desktop, tap on mobile)
  els.heatmap.querySelectorAll('.day[data-date]').forEach((el) => {
    const showTip = () => {
      els.tip.hidden = false;
      const v = Number(el.dataset.net);
      els.tip.innerHTML = `<strong>${esc(el.dataset.date)}</strong> · <span class="${v >= 0 ? 'pos' : 'neg'}">${fmtEUR(v)}</span> · ${sellW(Number(el.dataset.trades))}`;
    };
    el.addEventListener('mouseenter', showTip);
    el.addEventListener('click', showTip);
  });
  // compact foot stats refer to the whole selected range (top bar), not the 4-month window
  const traded = [...perDay.values()].filter((d) => d.trades > 0);
  if (traded.length) {
    const best = traded.reduce((a, d) => (d.net > a.net ? d : a));
    const worst = traded.reduce((a, d) => (d.net < a.net ? d : a));
    const most = traded.reduce((a, d) => (d.trades > a.trades ? d : a));
    els.heatStats.innerHTML =
      `<span><span class="muted">${t('best_day')}</span> <strong>${best.date}</strong> <span class="pos"><strong>${fmtEUR(best.net)}</strong></span></span>` +
      `<span><span class="muted">${t('worst_day')}</span> <strong>${worst.date}</strong> <span class="neg"><strong>${fmtEUR(worst.net)}</strong></span></span>` +
      `<span><span class="muted">${t('most_trades')}</span> <strong>${most.date}</strong> <span class="muted">${sellW(most.trades)}</span></span>`;
  } else els.heatStats.innerHTML = `<span class="muted">${t('heat_no')}</span>`;
}

function renderSymbolBreakdown(closed) {
  const m = new Map();
  for (const c of closed) {
    if (!m.has(c.symbol)) m.set(c.symbol, { symbol: c.symbol, name: c.name, net: 0, gross: 0, fees: 0, tax: 0, trades: 0 });
    const s = m.get(c.symbol);
    s.net += c.net; s.gross += c.gross; s.fees += c.fees; s.tax += c.sellTax; s.trades++;
  }
  const arr = [...m.values()].sort((a, b) => b.net - a.net);
  const tot = (k) => arr.reduce((s, x) => s + x[k], 0);
  els.symbolHeadMeta.textContent = arr.length
    ? t('symbol_meta', { n: fmtEUR(tot('net')), f: fmtEUR(-tot('fees')), t: fmtEUR(-tot('tax')) })
    : '';
  const rowHtml = (s) => `<tr><td class="mono">${esc(s.symbol)} <span class="muted">${esc((s.name || '').slice(0, 24))}</span></td>` +
    `<td style="text-align:right" class="${s.net >= 0 ? 'pos' : 'neg'}"><strong>${fmtEUR(s.net)}</strong></td>` +
    `<td style="text-align:right">${fmtEUR(-s.fees)}</td><td style="text-align:right">${fmtEUR(-s.tax)}</td>` +
    `<td style="text-align:right">${s.trades}</td></tr>`;
  const totalHtml = arr.length ? `<tr><td><strong>${t('total')}</strong></td><td style="text-align:right" class="${tot('net') >= 0 ? 'pos' : 'neg'}"><strong>${fmtEUR(tot('net'))}</strong></td><td style="text-align:right"><strong>${fmtEUR(-tot('fees'))}</strong></td><td style="text-align:right"><strong>${fmtEUR(-tot('tax'))}</strong></td><td style="text-align:right"><strong>${arr.reduce((s, x) => s + x.trades, 0)}</strong></td></tr>` : '';
  let bodyHtml;
  const COLLAPSED_EDGE = 4;
  if (!arr.length) {
    bodyHtml = `<tr><td colspan="5" class="muted">${t('no_data')}</td></tr>`;
  } else if (arr.length <= COLLAPSED_EDGE * 2 || symbolExpanded) {
    // expanded (or too few rows to collapse): all rows + a center "collapse" toggle when collapsible
    if (arr.length > COLLAPSED_EDGE * 2 && symbolExpanded) {
      const mid = Math.ceil(arr.length / 2);
      const top = arr.slice(0, mid).map(rowHtml).join('');
      const bot = arr.slice(mid).map(rowHtml).join('');
      bodyHtml = top +
        `<tr class="expand-row"><td colspan="5"><button type="button" class="expand-btn" id="symbolToggle" aria-expanded="true">▲ ${t('show_less', { a: COLLAPSED_EDGE, b: COLLAPSED_EDGE })}</button></td></tr>` +
        bot + totalHtml;
    } else {
      bodyHtml = arr.map(rowHtml).join('') + totalHtml;
    }
  } else {
    // collapsed: first 4 + center toggle + last 4
    const top = arr.slice(0, COLLAPSED_EDGE).map(rowHtml).join('');
    const bot = arr.slice(-COLLAPSED_EDGE).map(rowHtml).join('');
    const hidden = arr.length - COLLAPSED_EDGE * 2;
    const moreTxt = hidden === 1 ? t('more_one') : t('more_many', { n: hidden });
    bodyHtml = top +
      `<tr class="expand-row"><td colspan="5"><button type="button" class="expand-btn" id="symbolToggle" aria-expanded="false">··· ${moreTxt} ··· &nbsp; ▼ ${t('show_all', { n: arr.length })}</button></td></tr>` +
      bot + totalHtml;
  }
  els.symbolBreakdown.innerHTML = `<h3 class="muted">${t('inst_sub')}</h3>
    <table class="mini-tbl"><thead><tr><th>${t('th_instrument')}</th><th style="text-align:right">${t('th_net')}</th><th style="text-align:right">${t('th_fees')}</th><th style="text-align:right">${t('th_tax')}</th><th style="text-align:right">${t('th_trades')}</th></tr></thead><tbody>` +
    bodyHtml +
    `</tbody></table>`;
  const tgl = $('#symbolToggle');
  if (tgl) tgl.addEventListener('click', () => {
    symbolExpanded = !symbolExpanded;
    // re-render only this section to avoid flicker in the other charts
    const f = getFilters();
    renderSymbolBreakdown(STATE.closed.filter((c) => passClosed(c, f)));
  });
}

/* ---------- statistics tab ---------- */
function renderStats(closed) {
  const f = getFilters();
  els.statsRange.textContent = t('stats_range', { a: f.from || '…', b: f.to || '…', n: closed.length });
  const wdNames = I18N[lang].wd_full.slice();
  const wdShort = I18N[lang].wd_short.slice();
  // readable hours only: night (00–05 local) is hidden from heatmap + hour charts
  const H0 = 6, H1 = 23;
  const HOURS = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i);
  // local-timezone weekday index for a YYYY-MM-DD date (local noon avoids DST edges)
  const widx = (date) => {
    if (!date) return -1;
    const d = new Date(date + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return -1;
    return (d.getDay() + 6) % 7;
  };
  // 5 x 24 distribution cells keyed by execution timestamp (local time, Mon–Fri only)
  const cells = Array.from({ length: 5 }, () =>
    Array.from({ length: 24 }, () => ({ buys: 0, sells: 0, n: 0, wins: 0, net: 0 })));
  const trading = STATE.trading.filter((t) => (!f.from || t.date >= f.from) && (!f.to || t.date <= f.to));
  const place = (iso, cb) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    const w = (d.getDay() + 6) % 7;
    if (w >= 5) return; // weekends hidden
    cb(w, d.getHours());
  };
  for (const t of trading) {
    if (!t.datetime) continue;
    place(t.datetime, (w, h) => { if (t.type === 'BUY') cells[w][h].buys++; else cells[w][h].sells++; });
  }
  for (const c of closed) {
    if (!c.sellDatetime) continue;
    place(c.sellDatetime, (w, h) => { cells[w][h].net += c.net; cells[w][h].n++; if (c.net > 0) cells[w][h].wins++; });
  }
  // exposure (headline only): every weekday (Mon–Fri) a position was held counts once, local time
  const exposure = [0, 0, 0, 0, 0];
  const through = f.to || maxSellDate();
  const sweep = (a, b) => {
    if (!a || !b || a > b) return;
    const d = new Date(a + 'T12:00:00'), end = new Date(b + 'T12:00:00');
    let guard = 0;
    while (d <= end && guard++ < 1200) {
      const w = (d.getDay() + 6) % 7;
      if (w < 5) exposure[w]++;
      d.setDate(d.getDate() + 1);
    }
  };
  for (const c of closed) sweep(c.buyDate, c.sellDate);
  for (const o of STATE.open) sweep(o.since, through);
  const buys = trading.filter((t) => t.type === 'BUY').length;
  const holds = closed.map((c) => c.holdDays).sort((a, b) => a - b);
  const median = holds.length ? (holds.length % 2 ? holds[(holds.length - 1) / 2] : (holds[holds.length / 2 - 1] + holds[holds.length / 2]) / 2) : 0;
  const avg = holds.length ? holds.reduce((s, v) => s + v, 0) / holds.length : 0;
  const pad = (h) => String(h).padStart(2, '0') + ':00';
  // win rate decides best/worst everywhere (ties broken by net)
  const rateFmt = (x) => `${(x.wins / x.ops * 100).toFixed(0)}% (${x.wins}/${x.ops})`;
  const pickRate = (arr) => {
    const okArr = arr.filter((x) => x.ops > 0);
    if (!okArr.length) return null;
    const rate = (x) => x.wins / x.ops;
    return {
      b: okArr.reduce((a, x) => (rate(x) > rate(a) || (rate(x) === rate(a) && x.net > a.net) ? x : a)),
      w: okArr.reduce((a, x) => (rate(x) < rate(a) || (rate(x) === rate(a) && x.net < a.net) ? x : a)),
    };
  };
  // P&L attributed to open vs close side (wins tracked for win-rate picks)
  // weekday buckets are Mon–Fri only (local); hour buckets are local time, all days included
  const oWdP = wdNames.map((n) => ({ n, net: 0, ops: 0, wins: 0 }));
  const oHrP = Array.from({ length: 24 }, (_, h) => ({ n: pad(h), net: 0, ops: 0, wins: 0 }));
  const cWdP = wdNames.map((n) => ({ n, net: 0, ops: 0, wins: 0 }));
  const cHrP = Array.from({ length: 24 }, (_, h) => ({ n: pad(h), net: 0, ops: 0, wins: 0 }));
  for (const c of closed) {
    const won = c.net > 0 ? 1 : 0;
    const owIdx = widx(c.buyDate);
    if (owIdx >= 0 && owIdx < 5) { const ow = oWdP[owIdx]; ow.net += c.net; ow.ops++; ow.wins += won; }
    if (c.buyDatetime) {
      const h = new Date(c.buyDatetime).getHours();
      if (Number.isFinite(h)) { oHrP[h].net += c.net; oHrP[h].ops++; oHrP[h].wins += won; }
    }
    const cwIdx = widx(c.sellDate);
    if (cwIdx >= 0 && cwIdx < 5) { const cw = cWdP[cwIdx]; cw.net += c.net; cw.ops++; cw.wins += won; }
    if (c.sellDatetime) {
      const h = new Date(c.sellDatetime).getHours();
      if (Number.isFinite(h)) { cHrP[h].net += c.net; cHrP[h].ops++; cHrP[h].wins += won; }
    }
  }
  const bwWd = pickRate(cWdP), bwHr = pickRate(cHrP.slice(H0));
  const mostHeld = exposure.indexOf(Math.max(...exposure));
  els.statsHeadlines.innerHTML =
    `<span><span class="muted">${t('buys')}</span> <strong>${buys}</strong></span>` +
    `<span><span class="muted">${t('sells_closed')}</span> <strong>${closed.length}</strong></span>` +
    `<span><span class="muted">${t('open_pos')}</span> <strong>${STATE.open.length}</strong></span>` +
    `<span><span class="muted">${t('median_hold')}</span> <strong>${t('day_unit', { n: median })}</strong></span>` +
    (bwWd ? `<span><span class="muted">${t('best_wd')}</span> <strong>${bwWd.b.n}</strong> <strong>${rateFmt(bwWd.b)}</strong> <span class="${bwWd.b.net >= 0 ? 'pos' : 'neg'}">${fmtEUR(bwWd.b.net)}</span></span>` : '') +
    (bwHr ? `<span><span class="muted">${t('best_hr')}</span> <strong>${bwHr.b.n}</strong> <strong>${rateFmt(bwHr.b)}</strong> <span class="${bwHr.b.net >= 0 ? 'pos' : 'neg'}">${fmtEUR(bwHr.b.net)}</span></span>` : '') +
    (exposure.some((v) => v > 0) ? `<span><span class="muted">${t('most_held')}</span> <strong>${wdNames[mostHeld]}</strong> <span class="muted">${t('pos_days', { n: exposure[mostHeld] })}</span></span>` : '');
  // summary: 4 graphic best-vs-worst duel cards (open/close × day/hour) — by win rate
  const duelRow = (kind, x) => {
    const pct = x.ops ? (x.wins / x.ops * 100) : 0;
    const up = x.net >= 0;
    return `<div class="duel-row ${kind}"><span class="duel-tag">${kind === 'best' ? t('best') : t('worst')}</span>` +
      `<span class="duel-name">${esc(x.n)}</span>` +
      `<span class="duel-rate">${pct.toFixed(0)}% <span class="muted">(${x.wins}/${x.ops})</span></span>` +
      `<span class="duel-bar" title="${pct.toFixed(1)}% win"><span style="width:${pct.toFixed(1)}%"></span></span>` +
      `<span class="duel-foot"><span>${x.ops} ${trW(x.ops)}</span>` +
      `<span class="duel-net ${up ? 'pos' : 'neg'}">${fmtEUR(x.net)}</span></span></div>`;
  };
  const insightCard = (icon, eyebrow, side, pair) => {
    if (!pair) return `<div class="insight ${side}"><div class="insight-head"><span class="insight-icon" aria-hidden="true">${icon}</span><span class="insight-eyebrow">${eyebrow}</span></div><div class="insight-empty">${t('no_data_range')}</div></div>`;
    return `<div class="insight ${side}"><div class="insight-head"><span class="insight-icon" aria-hidden="true">${icon}</span><span class="insight-eyebrow">${eyebrow}</span></div>` +
      `<div class="duel">${duelRow('best', pair.b)}${duelRow('worst', pair.w)}</div></div>`;
  };
  els.tradeSummary.innerHTML =
    insightCard('📥', t('open_day'), 'open', pickRate(oWdP)) +
    insightCard('🕙', t('open_hour'), 'open', pickRate(oHrP.slice(H0))) +
    insightCard('📤', t('close_day'), 'close', pickRate(cWdP)) +
    insightCard('🕙', t('close_hour'), 'close', pickRate(cHrP.slice(H0))) ||
    `<span class="muted">${t('no_data_range')}</span>`;
  // activity + outcomes: weekday charts Mon–Fri, hour charts 06–23 local (night hidden)
  const oWd = [0, 0, 0, 0, 0], cWd = [0, 0, 0, 0, 0];
  const wWd = [0, 0, 0, 0, 0], lWd = [0, 0, 0, 0, 0];
  const oHr = Array(24).fill(0), cHr = Array(24).fill(0);
  const wHr = Array(24).fill(0), lHr = Array(24).fill(0);
  let nightTrades = 0;
  for (const t of trading) {
    if (t.type !== 'BUY' || !t.datetime) continue;
    const d = new Date(t.datetime);
    if (Number.isNaN(d.getTime())) continue;
    const w = (d.getDay() + 6) % 7, h = d.getHours();
    if (h < H0) nightTrades++;
    if (w < 5) oWd[w]++;
    oHr[h]++;
  }
  for (const c of closed) {
    if (!c.sellDatetime) continue;
    const d = new Date(c.sellDatetime);
    if (Number.isNaN(d.getTime())) continue;
    const w = (d.getDay() + 6) % 7, h = d.getHours();
    if (h < H0) nightTrades++;
    if (w < 5) {
      cWd[w]++;
      if (c.net > 0) wWd[w]++; else lWd[w]++;
    }
    cHr[h]++;
    if (c.net > 0) wHr[h]++; else lHr[h]++;
  }
  // single-series bars (one side per chart — no more squinting at paired skinny bars)
  const singleHist = (labels, V, color, sharedMax) => {
    const W = 640, H = 190, P = 26, n = labels.length;
    const max = Math.max(1, sharedMax ?? Math.max(...V));
    const slot = (W - P - 10) / n, bw = Math.min(44, Math.max(8, slot - 14));
    const Y = (v) => H - P - (v / max) * (H - 2 * P - 14);
    const peak = V.indexOf(Math.max(...V));
    let s = `<line x1="${P}" y1="${H - P}" x2="${W - 10}" y2="${H - P}" stroke="#33406a"/>`;
    labels.forEach((lb, i) => {
      const x = P + slot * i + slot / 2;
      const y = Y(V[i]);
      const isPeak = V[i] > 0 && i === peak;
      s += `<rect x="${(x - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - P - y).toFixed(1)}" fill="${color}" rx="3"${isPeak ? ' stroke="#e8ecf4" stroke-width="1.5"' : ''}><title>${esc(lb)}: ${V[i]}</title></rect>`;
      if (V[i]) s += `<text x="${x.toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="10" fill="#9aa4bd" text-anchor="middle">${V[i]}</text>`;
      if (lb) s += `<text x="${x.toFixed(1)}" y="${H - 8}" font-size="10" fill="#9aa4bd" text-anchor="middle">${esc(lb)}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img">${s}</svg>`;
  };
  const groupedHist = (labels, A, B, colorA = '#22c55e', colorB = '#ef4444', titleA = null, titleB = null) => {
    titleA = titleA ?? t('wins'); titleB = titleB ?? t('losses');
    const W = 640, H = 190, P = 26, n = labels.length;
    const max = Math.max(1, ...A, ...B);
    const slot = (W - P - 10) / n, bw = Math.min(24, Math.max(3, slot / 2 - 3));
    const Y = (v) => H - P - (v / max) * (H - 2 * P - 14);
    let s = `<line x1="${P}" y1="${H - P}" x2="${W - 10}" y2="${H - P}" stroke="#33406a"/>`;
    labels.forEach((lb, i) => {
      const x = P + slot * i + slot / 2;
      const ya = Y(A[i]), yb = Y(B[i]);
      s += `<rect x="${(x - bw - 2).toFixed(1)}" y="${ya.toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - P - ya).toFixed(1)}" fill="${colorA}" rx="2"><title>${esc(lb)} ${titleA.toLowerCase()}: ${A[i]}</title></rect>`;
      s += `<rect x="${(x + 2).toFixed(1)}" y="${yb.toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - P - yb).toFixed(1)}" fill="${colorB}" rx="2"><title>${esc(lb)} ${titleB.toLowerCase()}: ${B[i]}</title></rect>`;
      const top = Math.max(A[i], B[i]);
      if (top) s += `<text x="${x.toFixed(1)}" y="${(Y(top) - 4).toFixed(1)}" font-size="10" fill="#9aa4bd" text-anchor="middle">${top}</text>`;
      if (lb) s += `<text x="${x.toFixed(1)}" y="${H - 8}" font-size="10" fill="#9aa4bd" text-anchor="middle">${esc(lb)}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img">${s}</svg>`;
  };
  // openings vs closings — separated, shared scale per pair so heights stay comparable
  const wdMax = Math.max(1, ...oWd, ...cWd);
  if (els.openWd) els.openWd.innerHTML = singleHist(wdShort, oWd, '#5b8cff', wdMax);
  if (els.closeWd) els.closeWd.innerHTML = singleHist(wdShort, cWd, '#f59e0b', wdMax);
  const hrLabels = HOURS.map((h) => (h % 2 === 0 ? h + 'h' : ''));
  const oHrV = HOURS.map((h) => oHr[h]), cHrV = HOURS.map((h) => cHr[h]);
  const hrMax = Math.max(1, ...oHrV, ...cHrV);
  if (els.openHr) els.openHr.innerHTML = singleHist(hrLabels, oHrV, '#5b8cff', hrMax);
  if (els.closeHr) els.closeHr.innerHTML = singleHist(hrLabels, cHrV, '#f59e0b', hrMax);
  // wins vs losses — the surprise: outcomes get their own stage, not a tooltip footnote
  if (els.winLossWd) els.winLossWd.innerHTML = groupedHist(wdShort, wWd, lWd);
  if (els.winLossHr) els.winLossHr.innerHTML = groupedHist(hrLabels, HOURS.map((h) => wHr[h]), HOURS.map((h) => lHr[h]));
  if (els.activityMeta) els.activityMeta.textContent =
    t('act_meta_a') + (nightTrades ? t(nightTrades === 1 ? 'act_night_one' : 'act_night_many', { n: nightTrades }) : '') + t('act_meta_b');
  if (els.outcomeMeta) {
    const w = wWd.reduce((s, v) => s + v, 0), l = lWd.reduce((s, v) => s + v, 0);
    els.outcomeMeta.textContent = w + l
      ? t('outcome_meta', { w, l, p: (w / (w + l) * 100).toFixed(0) })
      : t('wl_sub');
  }
  // matrix (win-rate mode by default) — hours 06–23 only, roomier cells
  const visCells = cells.map((row) => HOURS.map((h) => row[h]));
  const maxT = Math.max(1, ...visCells.flat().map((c) => c.buys + c.sells));
  const lvl = (v, m) => (v < 0.34 * m ? '1' : v < 0.67 * m ? '2' : '3');
  let mx = '<span></span>';
  for (const h of HOURS) mx += `<span class="mx-h">${h % 2 === 0 ? h + 'h' : ''}</span>`;
  visCells.forEach((row, wi) => {
    mx += `<span class="mx-r">${wdShort[wi]}</span>`;
    row.forEach((c, k) => {
      const h = HOURS[k];
      let cls;
      if (mxMode === 'win') {
        if (!c.n) cls = 'zero';
        else { const r = c.wins / c.n; cls = (r >= 0.5 ? 'g' : 'l') + lvl(Math.abs(r - 0.5) * 2, 1); }
      } else { const t = c.buys + c.sells; cls = !t ? 'zero' : 't' + lvl(t, maxT); }
      const rate = c.n ? `${(c.wins / c.n * 100).toFixed(0)}% win (${c.wins}/${c.n})` : t('no_sells_cell');
      mx += `<span class="mx-c ${cls}" title="${wdNames[wi]} ${pad(h)} — ${c.buys} ${t('buys_l')} · ${c.sells} ${trW(c.sells)} · ${rate} · ${fmtEUR(c.net)}"></span>`;
    });
  });
  els.matrix.innerHTML = mx;
  // matrix tooltip: native hover on desktop, tap-to-show on mobile
  if (els.matrixTip) {
    els.matrixTip.hidden = true;
    els.matrix.querySelectorAll('.mx-c').forEach((el) => {
      el.addEventListener('click', () => {
        els.matrixTip.textContent = el.getAttribute('title') || '';
        els.matrixTip.hidden = false;
      });
    });
  }
  if (els.matrixCaption) els.matrixCaption.textContent =
    t('mx_cap_a') +
    (nightTrades ? ' ' + (nightTrades === 1 ? t('mx_night_one') : t('mx_night_many', { n: nightTrades })) : '') +
    ' ' + t('mx_cap_b');
  els.mxToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.m === mxMode));
  els.durationMeta.textContent = holds.length ? t('dur_meta', { a: holds[0], m: median, v: avg.toFixed(1), x: holds[holds.length - 1] }) : t('dur_meta0');
  const bucketOf = (h) => (h === 0 ? 0 : h <= 7 ? 1 : h <= 30 ? 2 : 3);
  const bLabels = [t('bk0'), t('bk1'), t('bk2'), t('bk3')];
  const bData = bLabels.map(() => ({ n: 0, wins: 0, net: 0 }));
  for (const c of closed) {
    const b = bData[bucketOf(c.holdDays)];
    b.n++; if (c.net > 0) b.wins++; b.net += c.net;
  }
  const bmax = Math.max(1, ...bData.map((b) => b.n));
  const donut = (winPct) => {
    const r = 9, circ = 2 * Math.PI * r, w = (winPct / 100 * circ).toFixed(1);
    return `<svg width="26" height="26" viewBox="0 0 26 26" role="img"><circle cx="13" cy="13" r="${r}" fill="none" stroke="#ef4444" stroke-width="5"/>` +
      `<circle cx="13" cy="13" r="${r}" fill="none" stroke="#22c55e" stroke-width="5" stroke-dasharray="${w} ${circ.toFixed(1)}" transform="rotate(-90 13 13)"><title>${winPct.toFixed(0)}% win</title></circle></svg>`;
  };
  els.durationBuckets.innerHTML = bData.map((b, i) => {
    const pct = b.n ? (b.wins / b.n * 100) : 0;
    return `<div class="bk-row"><span class="sym">${bLabels[i]}<br><span class="muted">${b.n} ${trW(b.n)}</span></span>` +
      `<span class="bar-track"><span class="bar-fill" style="width:${(b.n / bmax * 100).toFixed(1)}%;background:linear-gradient(90deg,#5b8cff,#93b4ff)"></span></span>` +
      `<span class="bk-donut">${donut(pct)}</span>` +
      `<span class="bar-val"><span class="bv-rate">${pct.toFixed(0)}%</span> <span class="muted bv-rec">(${b.wins}W/${b.n - b.wins}L)</span> <span class="bv-net ${b.net >= 0 ? 'pos' : 'neg'}">${fmtEUR(b.net)}</span></span></div>`;
  }).join('');
}

function renderAsset(closed) {
  const m = new Map();
  for (const c of closed) {
    const ac = c.ac || 'OTHER';
    const k = `${ac} · ${c.side}`;
    if (!m.has(k)) m.set(k, { k, ac, side: c.side, net: 0, wins: 0, trades: 0 });
    const s = m.get(k);
    s.net += c.net; s.trades++; if (c.net > 0) s.wins++;
  }
  const arr = [...m.values()].sort((a, b) => b.net - a.net);
  const totalNet = arr.reduce((s, x) => s + x.net, 0);
  const totalTrades = arr.reduce((s, x) => s + x.trades, 0);
  if (els.assetHeadMeta) {
    els.assetHeadMeta.textContent = arr.length
      ? t('asset_meta', { n: fmtEUR(totalNet), t: totalTrades })
      : t('asset_meta0');
  }
  if (!arr.length) {
    els.assetGrid.innerHTML = `<p class="muted">${t('no_data')}</p>`;
    return;
  }
  const maxAbs = Math.max(0.01, ...arr.map((s) => Math.abs(s.net)));
  const iconFor = (ac) => ({
    STOCK: '📊', ETF: '📦', FUND: '📦', DERIVATIVE: '⚡', CRYPTO: '₿', BOND: '🏦', COMMODITY: '🛢️',
  }[String(ac || '').toUpperCase()] || '📁');
  els.assetGrid.innerHTML = arr.map((s) => {
    const wr = s.trades ? (s.wins / s.trades * 100) : 0;
    const up = s.net >= 0;
    return `<div class="asset-card ${up ? 'pos' : 'neg'}">` +
      `<div class="asset-top"><span class="asset-icon" aria-hidden="true">${iconFor(s.ac)}</span>` +
      `<span class="asset-name">${esc(s.ac)}</span>` +
      `<span class="asset-side">${esc(s.side)}</span></div>` +
      `<div class="asset-net ${up ? 'pos' : 'neg'}"><strong>${fmtEUR(s.net)}</strong></div>` +
      `<div class="asset-foot"><span class="asset-trades">${s.trades} ${trW(s.trades)}</span>` +
      `<span class="asset-win"><span class="asset-dot ${wr >= 50 ? 'up' : 'down'}"></span>${wr.toFixed(0)}% <span class="muted">(${s.wins}/${s.trades})</span></span></div>` +
      `<div class="asset-winbar-label"><span>Win rate</span><span>${wr.toFixed(0)}%</span></div>` +
      `<div class="asset-winbar" title="Win rate"><span style="width:${wr.toFixed(1)}%"></span></div>` +
      `</div>`;
  }).join('');
}

/* ---------- date range presets + custom range ---------- */
let activePreset = 'ALL';
let mxMode = 'win'; // stats matrix view: 'win' | 'trades'
let symbolExpanded = false; // P&L by instrument: collapsed shows first 4 + last 4

function isoAdd(iso, days) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function maxSellDate() {
  if (!STATE) return '';
  const d = STATE.closed.map((c) => c.sellDate).sort();
  if (d.length) return d[d.length - 1];
  const r = STATE.rows.map((x) => x.date).filter(Boolean).sort();
  return r.length ? r[r.length - 1] : '';
}
function applyPreset(p) {
  const anchor = maxSellDate();
  if (!anchor) return;
  if (p === '1D') { rangeFrom = anchor; rangeTo = anchor; }
  else if (p === '1W') { rangeFrom = isoAdd(anchor, -6); rangeTo = anchor; }
  else if (p === '1M') { rangeFrom = isoAdd(anchor, -29); rangeTo = anchor; }
  else if (p === '1Y') { rangeFrom = isoAdd(anchor, -364); rangeTo = anchor; }
  else if (p === 'YTD') { rangeFrom = anchor.slice(0, 4) + '-01-01'; rangeTo = anchor; }
  else if (p === 'ALL') {
    const ds = STATE.closed.map((c) => c.sellDate).sort();
    if (ds.length) { rangeFrom = ds[0]; rangeTo = ds[ds.length - 1]; }
  }
  activePreset = p;
  syncDateInputs();
  renderAll();
}
function applyCustomRange() {
  if (!STATE) return;
  let a = els.dateFrom.value || '', b = els.dateTo.value || '';
  if (!a && !b) { applyPreset('ALL'); return; }
  const ds = STATE.closed.map((c) => c.sellDate).sort();
  if (!a) a = ds[0] || b;
  if (!b) b = ds[ds.length - 1] || a;
  if (!a || !b) return;
  if (a > b) { const t = a; a = b; b = t; }
  rangeFrom = a; rangeTo = b;
  activePreset = 'CUSTOM';
  syncDateInputs();
  renderAll();
}
function syncDateInputs() {
  if (!els.dateFrom) return;
  if (activePreset === 'CUSTOM') {
    els.dateFrom.value = rangeFrom || '';
    els.dateTo.value = rangeTo || '';
  } else {
    els.dateFrom.value = '';
    els.dateTo.value = '';
  }
  document.querySelector('.date-range')?.classList.toggle('active', activePreset === 'CUSTOM');
}
function prettyMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString(lang, { month: 'long', year: 'numeric' });
}
function paintRanges() {
  els.presets.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.p === activePreset));
}

/* ---------- monthly P&L bars (own data only, no denominators) ---------- */
const fmtShort = (n) => {
  const a = Math.abs(n);
  if (a >= 1000) return (n < 0 ? '−' : '') + (a / 1000).toFixed(1).replace(/\.0$/, '') + 'k €';
  return fmtEUR(n, 0);
};
const shortMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString(lang, { month: 'short' }) + ' ’' + String(y).slice(2);
};
function renderMonthly(closed) {
  const m = new Map();
  for (const c of closed) {
    const ym = c.sellDate.slice(0, 7);
    if (!m.has(ym)) m.set(ym, { ym, net: 0, trades: 0, wins: 0 });
    const s = m.get(ym);
    s.net += c.net; s.trades++; if (c.net > 0) s.wins++;
  }
  const arr = [...m.values()].sort((a, b) => a.ym.localeCompare(b.ym));
  if (!arr.length) {
    els.monthChart.innerHTML = `<p class="muted">${t('no_data_filters')}</p>`;
    els.monthMeta.textContent = '';
    return;
  }
  const tot = arr.reduce((s, x) => s + x.net, 0);
  const best = arr.reduce((a, x) => (x.net > a.net ? x : a));
  els.monthMeta.textContent = t('month_meta', { n: fmtEUR(tot), m: shortMonth(best.ym), v: fmtEUR(best.net) });
  const W = 620, H = 220, P = 30;
  const lo = Math.min(0, ...arr.map((x) => x.net)), hi = Math.max(0, ...arr.map((x) => x.net));
  const span = (hi - lo) || 1;
  const n = arr.length, slot = (W - P - 10) / n, bw = Math.min(52, Math.max(6, slot - 12));
  const Y = (v) => H - P - ((v - lo) / span) * (H - 2 * P - 10);
  const Y0 = Y(0);
  const step = Math.max(1, Math.ceil(n / 12));
  let s = `<line x1="${P}" y1="${Y0.toFixed(1)}" x2="${W - 10}" y2="${Y0.toFixed(1)}" stroke="#33406a" stroke-dasharray="4 4"/>`;
  arr.forEach((x, i) => {
    const cx = P + slot * i + slot / 2;
    const y = Y(x.net), up = x.net >= 0;
    const top = Math.min(y, Y0), hgt = Math.max(2, Math.abs(Y0 - y));
    s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}" rx="3" fill="${up ? '#22c55e' : '#ef4444'}">` +
      `<title>${shortMonth(x.ym)}: ${fmtEUR(x.net)} · ${x.trades} ${trW(x.trades)} · ${(x.trades ? x.wins / x.trades * 100 : 0).toFixed(0)}% win</title></rect>`;
    if (x.net) s += `<text x="${cx.toFixed(1)}" y="${(up ? top - 5 : top + hgt + 12).toFixed(1)}" font-size="10" fill="${up ? '#4ade80' : '#f87171'}" text-anchor="middle">${esc(fmtShort(x.net))}</text>`;
    if (i % step === 0 || i === n - 1) s += `<text x="${cx.toFixed(1)}" y="${H - 8}" font-size="10" fill="#9aa4bd" text-anchor="middle">${esc(shortMonth(x.ym))}</text>`;
  });
  els.monthChart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('month_title')}">${s}</svg>`;
}

/* ---------- tables ---------- */
function sortable(table, cols, rows, render) {
  table.innerHTML = `<thead><tr>${cols.map((c) =>
    `<th data-k="${c.k}" class="${c.n ? 'num' : ''}">${esc(c.l)} ${sortState.key === c.k ? (sortState.dir === 1 ? '▲' : '▼') : ''}</th>`).join('')}</tr></thead><tbody>${rows.map(render).join('')}</tbody>`;
  table.querySelectorAll('th').forEach((th) => th.addEventListener('click', () => {
    const k = th.dataset.k;
    if (sortState.key === k) sortState.dir *= -1; else { sortState.key = k; sortState.dir = -1; }
    renderAll();
  }));
}

function renderClosed(closed) {
  els.closedCount.textContent = t('closed_count', { n: closed.length });
  const wins = closed.filter((c) => c.net > 0).length;
  const wr = closed.length ? (wins / closed.length * 100) : 0;
  els.closedHeadMeta.textContent = closed.length
    ? t('closed_meta', { p: wr.toFixed(0), w: wins, l: closed.length - wins })
    : t('closed_meta0');
  const cols = [
    { k: 'sellDate', l: t('th_selldate') }, { k: 'symbol', l: t('th_symbol') }, { k: 'name', l: t('th_name') },
    { k: 'qty', l: t('th_qty'), n: 1 }, { k: 'buyPrice', l: t('th_avgbuy'), n: 1 }, { k: 'sellPrice', l: t('th_sell'), n: 1 },
    { k: 'gross', l: t('th_gross'), n: 1 }, { k: 'fees', l: t('th_fees'), n: 1 }, { k: 'sellTax', l: t('th_tax'), n: 1 },
    { k: 'net', l: t('th_net') + ' P&L', n: 1 },
    { k: 'retPct', l: t('th_ret'), n: 1 }, { k: 'holdDays', l: t('th_hold'), n: 1 },
  ];
  sortable(els.closedTable, cols, closed, (c) => `<tr>
    <td>${c.sellDate}</td><td class="mono">${esc(c.symbol)}${c.unmatched ? ' ⚠' : ''}</td><td>${esc(c.name)}</td>
    <td class="num">${fmtQty(c.qty)}</td><td class="num">${fmtEUR(c.buyPrice)}</td><td class="num">${fmtEUR(c.sellPrice)}</td>
    <td class="num ${c.gross >= 0 ? 'pos' : 'neg'}">${fmtEUR(c.gross)}</td>
    <td class="num">${fmtEUR(-c.fees)}</td>
    <td class="num">${fmtEUR(-c.sellTax)}</td>
    <td class="num ${c.net >= 0 ? 'pos' : 'neg'}"><strong>${fmtEUR(c.net)}</strong></td>
    <td class="num ${c.retPct >= 0 ? 'pos' : 'neg'}">${c.retPct.toFixed(1)}%</td>
    <td class="num">${c.holdDays}</td></tr>`);
}

function renderOpen() {
  const open = STATE.open;
  els.openCount.textContent = t('open_count', { n: open.length });
  els.openTable.innerHTML = `<thead><tr><th>${t('th_symbol')}</th><th>${t('th_name')}</th><th class="num">${t('th_qty')}</th><th class="num">${t('th_avgbuy')}</th><th class="num">${t('th_cost')}</th><th>${t('th_since')}</th></tr></thead><tbody>` +
    (open.map((o) => `<tr><td class="mono">${esc(o.symbol)}</td><td>${esc(o.name)}</td><td class="num">${fmtQty(o.qty)}</td><td class="num">${fmtEUR(o.avgPrice)}</td><td class="num">${fmtEUR(o.cost)}</td><td>${o.since}</td></tr>`).join('') || `<tr><td colspan="6" class="muted">${t('open_empty')}</td></tr>`) + `</tbody>`;
}

function renderOps(f) {
  const ops = STATE.rows.filter((r) => {
    if (f.from && r.date < f.from) return false;
    if (f.to && r.date > f.to) return false;
    return true;
  }).slice().reverse();
  els.opsCount.textContent = t('ops_count', { n: ops.length });
  els.opsTable.innerHTML = `<thead><tr><th>${t('th_date')}</th><th>${t('th_type')}</th><th>${t('th_symbol')}</th><th>${t('th_name')}</th><th class="num">${t('th_qty')}</th><th class="num">${t('th_price')}</th><th class="num">${t('th_amount')}</th><th class="num">${t('th_fee')}</th><th class="num">${t('th_tax')}</th></tr></thead><tbody>` +
    ops.map((r) => {
      const tag = r.category === 'TRADING' ? (r.type === 'BUY' ? 'buy' : 'sell') : 'cash';
      return `<tr><td>${r.date}</td><td><span class="tag ${tag}">${esc(r.type)}</span></td><td class="mono">${esc(r.symbol)}</td><td>${esc(r.name)}</td><td class="num">${r.shares ? fmtQty(r.shares) : ''}</td><td class="num">${r.price ? fmtEUR(r.price) : ''}</td><td class="num">${r.amount ? fmtEUR(r.amount) : ''}</td><td class="num">${r.fee ? fmtEUR(r.fee) : ''}</td><td class="num">${r.tax ? fmtEUR(r.tax) : ''}</td></tr>`;
    }).join('') + `</tbody>`;
}

/* ---------- load / export / persistence ---------- */
function setData(text, name) {
  try {
    const raw = parseCSV(text);
    if (!raw.length) throw new Error(t('err_empty'));
    if (!('symbol' in raw[0]) || !('type' in raw[0])) throw new Error(t('err_cols'));
    STATE = analyze(raw);
    STATE.fileName = name || 'upload.csv';
    // Nothing is ever written to browser storage: memory only, refresh wipes all.
    els.empty.hidden = true; els.dash.hidden = false;
    els.upload.hidden = true; // collapse the loader once data is on screen (↺ Change file brings it back)
    els.topControls.hidden = false;
    if (els.viewTabs) els.viewTabs.hidden = false;
    $('#btnReset').disabled = false;
    els.rowCount.textContent = t('rowcount', { f: STATE.fileName, r: raw.length, t: STATE.trading.length, c: STATE.closed.length });
    // full-range default
    const dates = STATE.closed.map((c) => c.sellDate).sort();
    if (dates.length) { rangeFrom = dates[0]; rangeTo = dates[dates.length - 1]; }
    activePreset = 'ALL';
    symbolExpanded = false;
    syncDateInputs();
    renderAll();
    els.errors.hidden = true;
  } catch (e) {
    els.errors.hidden = false;
    els.errors.textContent = t('err_parse') + e.message;
  }
}

/* ---------- events ---------- */
function bind() {
  const dz = els.drop;
  ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  });
  dz.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'LABEL') els.file.click(); });
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') els.file.click(); });
  els.file.addEventListener('change', () => { const f = els.file.files[0]; if (f) readFile(f); });

  $('#btnReset').addEventListener('click', () => {
    location.reload(); // memory-only: reload wipes everything
  });
  els.presets.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => applyPreset(b.dataset.p)));
  els.dateFrom.addEventListener('change', applyCustomRange);
  els.dateTo.addEventListener('change', applyCustomRange);
  els.dateClear.addEventListener('click', () => applyPreset('ALL'));
  const showTab = (which) => {
    const stats = which === 'stats';
    els.tabDash.classList.toggle('active', !stats);
    els.tabStats.classList.toggle('active', stats);
    els.tabDash.setAttribute('aria-selected', String(!stats));
    els.tabStats.setAttribute('aria-selected', String(stats));
    els.dashView.hidden = stats;
    els.statsView.hidden = !stats;
  };
  els.tabDash.addEventListener('click', () => showTab('dash'));
  els.tabStats.addEventListener('click', () => showTab('stats'));
  els.langToggle.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => setLang(b.dataset.l)));
  // mobile settings menu (gear button): toggle panel, close on outside click / Escape / selection
  const settingsToggle = $('#settingsToggle'), settingsGroup = $('#settingsGroup');
  if (settingsToggle && settingsGroup) {
    const closeSettings = () => {
      settingsGroup.classList.remove('open');
      settingsToggle.setAttribute('aria-expanded', 'false');
    };
    settingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = settingsGroup.classList.toggle('open');
      settingsToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (settingsGroup.classList.contains('open') && !settingsGroup.contains(e.target)) closeSettings();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsGroup.classList.contains('open')) {
        closeSettings();
        settingsToggle.focus();
      }
    });
    settingsGroup.addEventListener('click', (e) => {
      if (e.target.closest('button,a')) closeSettings();
    });
  }
  els.mxToggle.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { mxMode = b.dataset.m; renderAll(); }));
  els.heatPrev.addEventListener('click', () => { heatEndIdx -= 1; renderAll(); });
  els.heatNext.addEventListener('click', () => { heatEndIdx += 1; renderAll(); });
  applyStaticLang();
}

function readFile(f) {
  const rd = new FileReader();
  rd.onload = () => { els.file.value = ''; setData(String(rd.result || ''), f.name); }; // release the file handle immediately
  rd.readAsText(f);
}



bind();
(function init() {
  // Purge any data stored by older versions, then stay memory-only: refresh always starts clean.
  try { localStorage.removeItem('trpv.csv'); localStorage.removeItem('trpv.name'); } catch { /* storage unavailable — ideal */ }
})();
