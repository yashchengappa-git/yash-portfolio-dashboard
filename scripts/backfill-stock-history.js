const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

const symbols = [
  "LMT", "NVDA", "CVX", "INTC", "AAPL", "URA",
  "KTOS", "XOM", "SNDK", "AMZN", "MU", "SPOT",
  "NBIS", "EWY", "VRT", "VIAV", "VLO", "GEV",
  "CRWD", "MSFT", "COHR", "PENG", "NOW"
];

const START_DATE = "2026-01-07";

async function getDailySeries(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}&outputsize=compact`;
  const res = await axios.get(url);

  const series = res.data["Time Series (Daily)"];

  if (!series) {
    console.log(symbol, JSON.stringify(res.data, null, 2));
    throw new Error(`No daily series returned for ${symbol}`);
  }

  return series;
}

function replaceSKObject(html, newSK) {
  const regex = /(const\s+SK\s*=\s*\{)([\s\S]*?)(\n\};)/;

  if (!regex.test(html)) {
    throw new Error("Could not find const SK object in index.html");
  }

  return html.replace(regex, `$1\n${newSK}\n$3`);
}

function formatSymbolBlock(symbol, series) {
  const dates = Object.keys(series)
    .sort()
    .filter(date => date >= START_DATE);

  const lines = dates.map(date => {
    const close = Number(series[date]["4. close"]);
    return `    "${date}":${close.toFixed(2)}`;
  });

  return `  ${symbol}:{\n${lines.join(",\n")}\n  }`;
}

async function run() {
  let html = fs.readFileSync("index.html", "utf8");

  const blocks = [];

  for (const symbol of symbols) {
    console.log(`Fetching ${symbol}...`);

    const series = await getDailySeries(symbol);
    blocks.push(formatSymbolBlock(symbol, series));

    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  const newSK = blocks.join(",\n");

  html = replaceSKObject(html, newSK);

  fs.writeFileSync("index.html", html);

  console.log("Done. SK historical stock prices backfilled.");
}

run();
