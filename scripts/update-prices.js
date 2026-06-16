const fs = require("fs");
const axios = require("axios");
 
const API_KEY = process.env.ALPHA_VANTAGE_KEY;
 
// ── Fetch live quote ──────────────────────────────────────────────────────────
async function getPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  const quote = res.data["Global Quote"];
  if (!quote || !quote["05. price"]) {
    throw new Error(`Bad response for ${symbol}: ${JSON.stringify(res.data)}`);
  }
  const price = parseFloat(quote["05. price"]);
  if (isNaN(price)) throw new Error(`NaN price for ${symbol}`);
  console.log(`${symbol}: $${price}`);
  return price;
}
 
// ── Fetch full daily series ───────────────────────────────────────────────────
async function getDailyClose(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}&outputsize=compact`;
  const res = await axios.get(url);
  const series = res.data["Time Series (Daily)"];
  if (!series) {
    console.log(JSON.stringify(res.data, null, 2));
    throw new Error(`No daily series returned for ${symbol}`);
  }
  const dates = Object.keys(series).sort();
  const latestDate = dates[dates.length - 1];
  const close = Number(series[latestDate]["4. close"]);
  return { date: latestDate, close, series };
}
 
// ── Derive active holdings by replaying TRADES in the HTML ───────────────────
// Robust regex: allows arbitrary whitespace between fields
function deriveHoldings(html) {
  const tradesMatch = html.match(/const TRADES\s*=\s*\[([\s\S]*?)\];/);
  if (!tradesMatch) throw new Error("Could not find TRADES array in index.html");
 
  const qty = {};
 
  // Loose match — handles spaces, comments, any field order after the 4 required ones
  const tradeRegex = /\{\s*date\s*:\s*"([\d-]+)"\s*,\s*sym\s*:\s*"(\w+)"\s*,\s*side\s*:\s*"(buy|sell)"\s*,\s*qty\s*:\s*([\d.]+)/g;
  let m;
  while ((m = tradeRegex.exec(tradesMatch[1])) !== null) {
    const [, , sym, side, q] = m;
    if (!qty[sym]) qty[sym] = 0;
    qty[sym] += side === "buy" ? parseFloat(q) : -parseFloat(q);
    if (qty[sym] < 0.000001) qty[sym] = 0;
  }
 
  const holdings = Object.entries(qty)
    .filter(([, q]) => q > 0.000001)
    .map(([sym, q]) => ({ sym, qty: q }));
 
  console.log(`Derived ${holdings.length} active holdings:`, holdings.map(h => h.sym).join(", "));
  return holdings;
}
 
// ── Append (or overwrite) a price entry in a stock's SK block ────────────────
function appendSkPrice(html, symbol, date, price, force = false) {
  const blockRegex = new RegExp(
    `(\\b${symbol}:\\s*\\{)([\\s\\S]*?)(\\s*\\}(?:\\s*,|\\s*\\n\\s*\\}))`
  );
  const match = html.match(blockRegex);
 
  if (!match) {
    console.log(`${symbol} not in SK yet, adding new block.`);
    const newBlock = `  ${symbol}:{\n    "${date}":${price.toFixed(2)}\n  },\n`;
    return html.replace(/(\nconst SK=\{[\s\S]*?)(\n\};)/, `$1${newBlock}$2`);
  }
 
  const body = match[2];
 
  if (body.includes(`"${date}"`)) {
    if (!force) {
      console.log(`SK.${symbol} already has ${date}, skipping.`);
      return html;
    }
    // Force: overwrite the existing price for this date
    console.log(`SK.${symbol} overwriting ${date} -> $${price.toFixed(2)}`);
    const updated = body.replace(
      new RegExp(`("${date}"\\s*:\\s*)[0-9.]+`),
      `$1${price.toFixed(2)}`
    );
    return html.replace(blockRegex, `$1${updated}$3`);
  }
 
  const trimmed = body.trimEnd().replace(/,\s*$/, "");
  return html.replace(
    blockRegex,
    `$1${trimmed},\n    "${date}":${price.toFixed(2)}$3`
  );
}
 
// ── Merge SPY/QQQ: preserve existing prices, add/update from API response ─────
// This prevents Alpha Vantage's 100-day compact window from wiping early history.
function mergeBenchmarkObject(html, symbol, series) {
  const objectRegex = new RegExp(
    `(const\\s+${symbol}\\s*=\\s*\\{)([\\s\\S]*?)(\\n\\s*\\};)`
  );
  const match = html.match(objectRegex);
  if (!match) throw new Error(`Could not find ${symbol} object in HTML`);
 
  // Parse existing prices already baked into the HTML
  const existing = {};
  const entryRegex = /"(\d{4}-\d{2}-\d{2})":\s*([\d.]+)/g;
  let m;
  while ((m = entryRegex.exec(match[2])) !== null) {
    existing[m[1]] = parseFloat(m[2]);
  }
 
  // Merge API data on top — API wins for overlapping dates (keeps today fresh)
  for (const [date, bar] of Object.entries(series)) {
    existing[date] = parseFloat(Number(bar["4. close"]).toFixed(2));
  }
 
  if (!Object.keys(existing).length) throw new Error(`No ${symbol} prices to write`);
 
  // Write back sorted chronologically, clean formatting
  const lines = Object.keys(existing).sort().map(date =>
    `  "${date}":${existing[date].toFixed(2)}`
  );
  console.log(`  ${symbol}: ${Object.keys(existing).length} total dates after merge`);
  return html.replace(objectRegex, `$1\n${lines.join(",\n")}\n$3`);
}
 
// ── Wait helper ───────────────────────────────────────────────────────────────
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const RATE_LIMIT_MS = 15000; // Alpha Vantage free: 5/min, 15s gap to be safe
 
// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  // Pass --force to always overwrite today's prices (useful for manual reruns)
  const force = process.argv.includes("--force");
  if (force) console.log("⚡ Force mode: overwriting today's prices.\n");
 
  let html = fs.readFileSync("index.html", "utf8");
 
  const holdings = deriveHoldings(html);
  const symbols = holdings.map(h => h.sym);
 
  const totalCalls = symbols.length + 2; // +2 for SPY and QQQ
  const estimatedMins = ((totalCalls * RATE_LIMIT_MS) / 1000 / 60).toFixed(1);
  console.log(`\nTotal API calls: ${totalCalls} (${symbols.length} stocks + SPY + QQQ)`);
  console.log(`Estimated runtime: ~${estimatedMins} minutes\n`);
 
  const today = new Date().toISOString().slice(0, 10);
  const prices = {};
 
  // Update each stock price
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    try {
      const price = await getPrice(symbol);
      prices[symbol] = price;
      html = appendSkPrice(html, symbol, today, price, force);
    } catch (err) {
      console.error(`  ✗ Failed ${symbol}: ${err.message}`);
    }
    console.log(`  Waiting ${RATE_LIMIT_MS / 1000}s...`);
    await wait(RATE_LIMIT_MS);
  }
 
  // SPY
  console.log("Fetching SPY...");
  const spyData = await getDailyClose("SPY");
  html = mergeBenchmarkObject(html, "SPY", spyData.series);
  console.log(`  Waiting ${RATE_LIMIT_MS / 1000}s...`);
  await wait(RATE_LIMIT_MS);
 
  // QQQ
  console.log("Fetching QQQ...");
  const qqqData = await getDailyClose("QQQ");
  html = mergeBenchmarkObject(html, "QQQ", qqqData.series);
  await wait(RATE_LIMIT_MS);
 
  // Summary
  const portfolioValue = holdings.reduce((sum, h) => sum + h.qty * (prices[h.sym] || 0), 0);
  console.log(`\nEstimated portfolio value: $${portfolioValue.toFixed(2)}`);
 
  const failed = symbols.filter(s => !prices[s]);
  if (failed.length) console.warn(`\n⚠ Prices NOT updated for: ${failed.join(", ")}`);
 
  fs.writeFileSync("index.html", html);
  console.log("\nDone. index.html updated.");
}
 
run();
