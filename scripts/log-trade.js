const fs = require("fs");
const axios = require("axios");

const [, , date, symRaw, side, amtStr] = process.argv;
const sym = symRaw.toUpperCase();
const amt = parseFloat(amtStr);
const API_KEY = process.env.ALPHA_VANTAGE_KEY;

async function getPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  const quote = res.data["Global Quote"];
  if (!quote || !quote["05. price"]) throw new Error(`Bad quote response for ${symbol}`);
  return parseFloat(quote["05. price"]);
}

async function run() {
  const price = await getPrice(sym);
  const qty = amt / price;

  let html = fs.readFileSync("index.html", "utf8");
  const entry = `  {date:"${date}",sym:"${sym}",side:"${side}",qty:${qty.toFixed(9)},price:${price.toFixed(4)}},\n`;

  const regex = /(const TRADES\s*=\s*\[)([\s\S]*?)(\n\];)/;
  const match = html.match(regex);
  if (!match) throw new Error("Could not find TRADES array");

  html = html.replace(regex, `$1$2${entry}$3`);
  fs.writeFileSync("index.html", html);
  console.log(`Logged: ${side} ${sym} — ${qty.toFixed(6)} shares @ $${price} ($${amt})`);
}

run();
