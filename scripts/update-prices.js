const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

const symbols = [
  "MSFT", "NVDA", "AMZN", "CRWD", "MU",
  "VRT", "GEV", "NBIS", "VIAV", "PENG",
  "COHR", "NOW"
];

async function getPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  const price = parseFloat(res.data["Global Quote"]["05. price"]);
  console.log(symbol, price);
  return price;
}

function appendHistory(html, portfolioValue) {
  const today = new Date();

  const label = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  const newEntry =
    `{ d:"${label}", port:${portfolioValue} }`;

  return html.replace(
    /(const HIST = \[)([\s\S]*?)(\];)/,
    (match, start, existing, end) => {
      if (existing.includes(`d:"${label}"`)) {
        console.log(`History already contains ${label}, skipping append.`);
        return match;
      }

      return `${start}${existing},\n  ${newEntry}${end}`;
    }
  );
}
function appendBenchmarkPrice(html, symbol, date, price) {
  const objectRegex = new RegExp(`const ${symbol}=\\\\{([\\\\s\\\\S]*?)\\\\n\\\\};`);
  const match = html.match(objectRegex);

  if (!match) {
    throw new Error(`Could not find const ${symbol} object in index.html`);
  }

  const objectBody = match[1];

  if (objectBody.includes(`"${date}"`)) {
    console.log(`${symbol} already has ${date}, skipping.`);
    return html;
  }

  const newLine = `  "${date}":${Number(price).toFixed(2)},`;

  return html.replace(
    objectRegex,
    `const ${symbol}={${objectBody}\\n${newLine}\\n};`
  );
}
async function getDailyClose(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);

  const series = res.data["Time Series (Daily)"];

  if (!series) {
    throw new Error(`No daily series returned for ${symbol}`);
  }

  const dates = Object.keys(series).sort();
  const latestDate = dates[dates.length - 1];
  const close = Number(series[latestDate]["4. close"]);

  return {
    date: latestDate,
    close
  };
}

async function run() {
  let html = fs.readFileSync("index.html", "utf8");

  let portfolioValue = 0;

  for (const symbol of symbols) {
    const price = await getPrice(symbol);

    // Update the price in the SK object in the HTML
    const regex = new RegExp(`(sym:"${symbol}".*?price:)\\s*[0-9.]+`, "g");
    html = html.replace(regex, `$1 ${price}`);


    // Find the quantity held and add to portfolio value
    const qtyMatch = html.match(new RegExp(`sym:"${symbol}".*?qty:\\s*([0-9.]+)`));
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      portfolioValue += qty * price;
    }

    // Alpha Vantage free tier allows ~5 calls/min, so wait 15s between calls
await new Promise(r => setTimeout(r, 15000));
}

const spyData = await getLatestDailySeries("SPY");
await new Promise(r => setTimeout(r, 15000));

const qqqData = await getLatestDailySeries("QQQ");
await new Promise(r => setTimeout(r, 15000));

html = updateBenchmarkSeries(html, "SPY", spyData.series);
html = updateBenchmarkSeries(html, "QQQ", qqqData.series);

// Append today's values to the HIST array
html = appendHistory(
  html,
  portfolioValue.toFixed(2)
);

  fs.writeFileSync("index.html", html);
  console.log("Done! Prices updated and history appended.");
}

run();
