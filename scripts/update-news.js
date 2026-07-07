const fs = require("fs");
const axios = require("axios");

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// This script pulls NEWS + EARNINGS from Finnhub only.
// Stock PRICES are handled by a separate script using ALPHA_VANTAGE_KEY —
// that key is intentionally not referenced anywhere in this file.

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

// ── NEWS + SENTIMENT (Finnhub: genuine per-ticker company news) ─────────────
// Finnhub's /company-news is a true per-symbol lookup (unlike Alpha Vantage's
// tickers=A,B,C, which means "mentions A AND B AND C simultaneously" and
// returns 0 results for a multi-ticker portfolio). Free tier is 60 calls/min,
// so 15 sequential calls easily fit in one run.
function simpleSentiment(headline) {
  const positive = /surge|soar|beat|upgrade|record|rally|jump|gain|outperform/i;
  const negative = /plunge|miss|downgrade|cut|slump|fall|drop|lawsuit|probe/i;
  if (positive.test(headline)) return "positive";
  if (negative.test(headline)) return "negative";
  return "neutral";
}

async function getNews(symbols) {
  if (!FINNHUB_KEY) throw new Error("FINNHUB_API_KEY is not set in the environment.");

  const news = {};
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); // last 7 days
  const fmt = (d) => d.toISOString().slice(0, 10);

  for (const sym of symbols) {
    const url = `${FINNHUB_BASE}/company-news?symbol=${sym}&from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_KEY}`;
    const res = await axios.get(url);
    const items = Array.isArray(res.data) ? res.data : [];

    const arts = items.slice(0, 3).map(a => ({ headline: a.headline, url: a.url, source: a.source }));
    const sentiments = arts.map(a => simpleSentiment(a.headline));
    const positive = sentiments.filter(s => s === "positive").length;
    const negative = sentiments.filter(s => s === "negative").length;

    news[sym] = {
      articles: arts,
      sentiment: positive > negative ? "positive" : negative > positive ? "negative" : "neutral",
    };

    await wait(1100); // stay safely under 60 calls/min
  }

  return news;
}

// ── EARNINGS CALENDAR (Finnhub: one call, filtered locally) ──────────────────
async function getEarnings(symbols) {
  if (!FINNHUB_KEY) throw new Error("FINNHUB_API_KEY is not set in the environment.");

  const from = new Date();
  const to = new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000); // next ~3 months
  const fmt = (d) => d.toISOString().slice(0, 10);

  const url = `${FINNHUB_BASE}/calendar/earnings?from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_KEY}`;
  const res = await axios.get(url);
  const items = res.data && Array.isArray(res.data.earningsCalendar) ? res.data.earningsCalendar : [];

  return items
    .filter(item => symbols.includes(item.symbol))
    .map(item => ({
      symbol: item.symbol,
      date: item.date,
      epsEstimate: item.epsEstimate ?? null,
    }));
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
