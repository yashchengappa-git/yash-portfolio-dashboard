const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;
const BASE = "https://www.alphavantage.co/query";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const RATE_LIMIT_MS = 15000; // stay well under 5 calls/min

// Alpha Vantage returns HTTP 200 even past the daily cap — it swaps the real
// payload for a "Note"/"Information" field instead of an HTTP error. Guard
// against writing that text into index.html as if it were data.
function checkForLimitMessage(data, label) {
  if (data && (data.Note || data.Information || data["Error Message"])) {
    throw new Error(`Alpha Vantage limit/error on ${label}: ${data.Note || data.Information || data["Error Message"]}`);
  }
}

function deriveHoldings(html) {
  const tradesMatch = html.match(/const TRADES\s*=\s*\[([\s\S]*?)\];/);
  if (!tradesMatch) throw new Error("Could not find TRADES array in index.html");
  const qty = {};
  const tradeRegex = /\{\s*date\s*:\s*"([\d-]+)"\s*,\s*sym\s*:\s*"(\w+)"\s*,\s*side\s*:\s*"(buy|sell)"\s*,\s*qty\s*:\s*([\d.]+)/g;
  let m;
  while ((m = tradeRegex.exec(tradesMatch[1])) !== null) {
    const [, , sym, side, q] = m;
    qty[sym] = (qty[sym] || 0) + (side === "buy" ? parseFloat(q) : -parseFloat(q));
  }
  return Object.entries(qty).filter(([, q]) => q > 0.000001).map(([sym]) => sym);
}

// ── NEWS + SENTIMENT (one call, all tickers at once) ─────────────────────────
async function getNews(symbols) {
  const url = `${BASE}?function=NEWS_SENTIMENT&tickers=${symbols.join(",")}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  checkForLimitMessage(res.data, "NEWS_SENTIMENT");

  const feed = res.data.feed || [];
  const news = {};
  for (const sym of symbols) news[sym] = { articles: [], sentiment: "neutral" };

  for (const item of feed) {
    for (const ts of item.ticker_sentiment || []) {
      if (news[ts.ticker]) {
        news[ts.ticker].articles.push({ headline: item.title, url: item.url, source: item.source, label: ts.ticker_sentiment_label });
      }
    }
  }

  for (const sym of symbols) {
    const arts = news[sym].articles.slice(0, 3);
    const bullish = arts.filter(a => a.label && a.label.includes("Bullish")).length;
    const bearish = arts.filter(a => a.label && a.label.includes("Bearish")).length;
    news[sym].sentiment = bullish > bearish ? "positive" : bearish > bullish ? "negative" : "neutral";
    news[sym].articles = arts.map(a => ({ headline: a.headline, url: a.url, source: a.source }));
  }
  return news;
}

// ── EARNINGS CALENDAR (one call, CSV, filtered locally) ──────────────────────
async function getEarnings(symbols) {
  const url = `${BASE}?function=EARNINGS_CALENDAR&horizon=3month&apikey=${API_KEY}`;
  const res = await axios.get(url);
  if (typeof res.data === "string" && (res.data.includes("Note") || res.data.includes("Thank you for using Alpha Vantage"))) {
    throw new Error(`Alpha Vantage limit/error on EARNINGS_CALENDAR: ${res.data.slice(0, 200)}`);
  }
  const lines = res.data.trim().split("\n");
  const header = lines[0].split(",");
  const symIdx = header.indexOf("symbol");
  const dateIdx = header.indexOf("reportDate");
  const estIdx = header.indexOf("estimate");

  return lines.slice(1)
    .map(line => line.split(","))
    .filter(cols => symbols.includes(cols[symIdx]))
    .map(cols => ({ symbol: cols[symIdx], date: cols[dateIdx], epsEstimate: cols[estIdx] || null }));
}

async function run() {
  let html = fs.readFileSync("index.html", "utf8");
  const symbols = deriveHoldings(html);
  console.log(`Fetching news + earnings for: ${symbols.join(", ")}`);

  try {
    const news = await getNews(symbols);
    console.log(`  News: ${Object.values(news).reduce((s, n) => s + n.articles.length, 0)} articles across ${symbols.length} tickers`);
    html = html.replace(/const NEWS\s*=\s*\{[\s\S]*?\};/, `const NEWS=${JSON.stringify(news)};`);
  } catch (err) {
    console.error(`✗ News fetch failed: ${err.message}`);
    console.log("Leaving existing NEWS block untouched.");
  }

  await wait(RATE_LIMIT_MS);

  try {
    const earnings = await getEarnings(symbols);
    console.log(`  Earnings: ${earnings.length} upcoming reports`);
    html = html.replace(/const EARNINGS\s*=\s*\[[\s\S]*?\];/, `const EARNINGS=${JSON.stringify(earnings)};`);
  } catch (err) {
    console.error(`✗ Earnings fetch failed: ${err.message}`);
    console.log("Leaving existing EARNINGS block untouched.");
  }

  fs.writeFileSync("index.html", html);
  console.log("Done. index.html updated.");
}

run();
