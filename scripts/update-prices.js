const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

// ── Fetch live quote ──────────────────────────────────────────────────────────
async function getPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  const price = parseFloat(res.data["Global Quote"]["05. price"]);
  if (isNaN(price)) throw new Error(`Bad price for ${symbol}: ${JSON.stringify(res.data)}`);
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
function deriveHoldings(html) {
  const tradesMatch = html.match(/const TRADES=\[([\s\S]*?)\];/);
  if (!tradesMatch) throw new Error("Could not find TRADES array in index.html");

  const qty = {};
  const tradeRegex = /\{date:"([\d-]+)",sym:"(\w+)",side:"(buy|sell)",qty:([\d.]+)/g;
  let m;
  while ((m = tradeRegex.exec(tradesMatch[1])) !== null) {
    const [, , sym, side, q] = m;
    if (!qty[sym]) qty[sym] = 0;
    qty[sym] += side === "buy" ? parseFloat(q) : -parseFloat(q);
    if (qty[sym] < 0.000001) qty[sym] = 0;
  }

  return Object.entries(qty)
    .filter(([, q]) => q > 0.000001)
    .map(([sym, q]) => ({ sym, qty: q }));
}

// ── Append a price entry to a stock's SK block ───────────────────────────────
function appendSkPrice(html, symbol, date, price) {
  // Match the symbol's block inside SK: e.g. MSFT:{...},
  const blockRegex = new RegExp(
    `(\\b${symbol}:\\s*\\{)([\\s\\S]*?)(\\s*\\}(?:\\s*,|\\s*\\n\\s*\\}))`
  );
  const match = html.match(blockRegex);

  if (!match) {
    // New ticker — insert a block before the closing }; of SK
    console.log(`${symbol} not in SK yet, adding new block.`);
    const newBlock = `  ${symbol}:{\n    "${date}":${price.toFixed(2)}\n  },\n`;
    return html.replace(/(\nconst SK=\{[\s\S]*?)(\n\};)/, `$1${newBlock}$2`);
  }

  const body = match[2];
  if (body.includes(`"${date}"`)) {
    console.log(`SK.${symbol} already has ${date}, skipping.`);
    return html;
  }

  const trimmed = body.trimEnd().replace(/,\s*$/, "");
  return html.replace(
    blockRegex,
    `$1${trimmed},\n    "${date}":${price.toFixed(2)}$3`
  );
}

// ── Replace SPY/QQQ objects wholesale from start date ────────────────────────
function replaceBenchmarkObject(html, symbol, series, startDate) {
  const objectRegex = new RegExp(
    `(const\\s+${symbol}\\s*=\\s*\\{)([\\s\\S]*?)(\\n\\s*\\};)`
  );
  const dates = Object.keys(series).sort().filter(date => date >= startDate);
  const lines = dates.map(date => {
    const close = Number(series[date]["4. close"]);
    return `  "${date}":${close.toFixed(2)}`;
  });
  if (!lines.length) throw new Error(`No ${symbol} prices found from ${startDate}`);
  return html.replace(objectRegex, `$1\n${lines.join(",\n")}\n$3`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  let html = fs.readFileSync("index.html", "utf8");

  // Derive which symbols are currently held from TRADES
  const holdings = deriveHoldings(html);
  const symbols = holdings.map(h => h.sym);
  console.log("Active holdings:", symbols.join(", "));

  const prices = {};
  const today = new Date().toISOString().slice(0, 10);

  for (const symbol of symbols) {
    try {
      const price = await getPrice(symbol);
      prices[symbol] = price;
      html = appendSkPrice(html, symbol, today, price);
    } catch (err) {
      console.error(`Failed to update ${symbol}:`, err.message);
    }
    // Alpha Vantage free tier: ~5 calls/min, wait 15s between calls
    await new Promise(r => setTimeout(r, 15000));
  }

  // Update SPY
  const spyData = await getDailyClose("SPY");
  await new Promise(r => setTimeout(r, 15000));

  // Update QQQ
  const qqqData = await getDailyClose("QQQ");
  await new Promise(r => setTimeout(r, 15000));

  html = replaceBenchmarkObject(html, "SPY", spyData.series, "2026-01-07");
  html = replaceBenchmarkObject(html, "QQQ", qqqData.series, "2026-01-07");

  // Log portfolio value for reference
  const portfolioValue = holdings.reduce((sum, h) => {
    return sum + h.qty * (prices[h.sym] || 0);
  }, 0);
  console.log(`\nEstimated portfolio value: $${portfolioValue.toFixed(2)}`);

  fs.writeFileSync("index.html", html);
  console.log("Done. index.html updated.");
}

run();
