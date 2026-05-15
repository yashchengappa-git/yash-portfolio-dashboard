const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

const symbols = [
  "MSFT",
  "NVDA",
  "AMZN",
  "CRWD",
  "MU",
  "VRT",
  "GEV",
  "NBIS",
  "VIAV",
  "PENG",
  "COHR",
  "NOW",
  "SPY",
  "QQQ"
];

async function getPrice(symbol) {
  const url =
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

  const res = await axios.get(url);

  const price =
    parseFloat(
      res.data["Global Quote"]["05. price"]
    );

  console.log(symbol, price);

  return price;
}

async function run() {
  let html = fs.readFileSync("index.html", "utf8");

  for (const symbol of symbols) {
    const price = await getPrice(symbol);

    const regex = new RegExp(
      `(sym:"${symbol}".*?price:)\\s*[0-9.]+`,
      "g"
    );

    html = html.replace(
      regex,
      `$1 ${price}`
    );

    await new Promise(r => setTimeout(r, 15000));
  }

  fs.writeFileSync("index.html", html);

  console.log("Updated prices.");
}
function appendHistory(html, portfolioValue, spyValue, qqqValue) {
  const today = new Date();

  const label =
    today.toLocaleString("en-US", {
      month: "short",
      day: "numeric"
    });

  const newEntry =
    `{ d:"${label}", port:${portfolioValue}, spy:${spyValue}, qqq:${qqqValue} }`;

  return html.replace(
    /const HIST = \[(.*?)\]/s,
    (match, existing) => {
      return `const HIST = [${existing}, ${newEntry}]`;
    }
  );
}
run(let portfolioValue = 0;
let spyPrice = 0;
let qqqPrice = 0;
if (symbol === "SPY") {
  spyPrice = price;
}

if (symbol === "QQQ") {
  qqqPrice = price;
}
const qtyMatch =
  html.match(
    new RegExp(
      `sym:"${symbol}".*?qty:\\s*([0-9.]+)`
    )
  );

if (qtyMatch) {
  const qty = parseFloat(qtyMatch[1]);
  portfolioValue += qty * price;
}
  html = appendHistory(
  html,
  Math.round(portfolioValue),
  Math.round(spyPrice),
  Math.round(qqqPrice)
););
