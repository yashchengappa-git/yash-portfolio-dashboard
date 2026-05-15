const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

const symbols = [
  "MSFT", "NVDA", "AMZN", "CRWD", "MU",
  "VRT", "GEV", "NBIS", "VIAV", "PENG",
  "COHR", "SPY", "QQQ"
];

async function getPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  const price = parseFloat(res.data["Global Quote"]["05. price"]);
  console.log(symbol, price);
  return price;
}

function appendHistory(html, portfolioValue, spyValue, qqqValue) {
  const today = new Date();
  const label = today.toLocaleString("en-US", { month: "short", day: "numeric" });
  const newEntry = `{ d:"${label}", port:${portfolioValue}, spy:${spyValue}, qqq:${qqqValue} }`;

  return html.replace(
    /const HIST = \[(.*?)\]/s,
    (match, existing) => {
      return `const HIST = [${existing}, ${newEntry}]`;
    }
  );
}

async function run() {
  let html = fs.readFileSync("index.html", "utf8");

  let portfolioValue = 0;
  let spyPrice = 0;
  let qqqPrice = 0;

  for (const symbol of symbols) {
    const price = await getPrice(symbol);

    // Update the price in the SK object in the HTML
    const regex = new RegExp(`(sym:"${symbol}".*?price:)\\s*[0-9.]+`, "g");
    html = html.replace(regex, `$1 ${price}`);

    // Track SPY and QQQ benchmark prices
    if (symbol === "SPY") spyPrice = price;
    if (symbol === "QQQ") qqqPrice = price;

    // Find the quantity held and add to portfolio value
    const qtyMatch = html.match(new RegExp(`sym:"${symbol}".*?qty:\\s*([0-9.]+)`));
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      portfolioValue += qty * price;
    }

    // Alpha Vantage free tier allows ~5 calls/min, so wait 15s between calls
    await new Promise(r => setTimeout(r, 15000));
  }

  // Append today's values to the HIST array
  html = appendHistory(
    html,
    Math.round(portfolioValue),
    Math.round(spyPrice),
    Math.round(qqqPrice)
  );

  fs.writeFileSync("index.html", html);
  console.log("Done! Prices updated and history appended.");
}

run();
