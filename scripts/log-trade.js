const fs = require("fs");

const [, , date, symRaw, side, amtStr, priceStr] = process.argv;
const sym = symRaw.toUpperCase();
const amt = parseFloat(amtStr);
const price = parseFloat(priceStr);
const qty = amt / price;

let html = fs.readFileSync("index.html", "utf8");

// ── Append to TRADES (drives holdings/return calc) ───────────────────────────
const tradesEntry = `  {date:"${date}",sym:"${sym}",side:"${side}",qty:${qty.toFixed(9)},price:${price.toFixed(4)}},\n`;
const tradesRegex = /(const TRADES\s*=\s*\[)([\s\S]*?)(\n\];)/;
const tradesMatch = html.match(tradesRegex);
if (!tradesMatch) throw new Error("Could not find TRADES array");
html = html.replace(tradesRegex, `$1$2${tradesEntry}$3`);

// ── Prepend to TRADE_LOG (drives the Trade History table, newest-first) ─────
const logEntry = `  {date:"${date}",action:"${side}",sym:"${sym}",amt:${amt.toFixed(2)}},\n`;
const logRegex = /(const TRADE_LOG\s*=\s*\[)([\s\S]*?)/;
const logMatch = html.match(logRegex);
if (!logMatch) throw new Error("Could not find TRADE_LOG array");
html = html.replace(logRegex, `$1\n${logEntry}$2`);

fs.writeFileSync("index.html", html);
console.log(`Logged: ${side} ${sym} — ${qty.toFixed(6)} shares @ $${price.toFixed(2)} ($${amt})`);
