const fs = require("fs");
const [, , date, amtStr] = process.argv;
const amt = parseFloat(amtStr);

let html = fs.readFileSync("index.html", "utf8");
const entry = `{date:"${date}",amt:${amt}},`;

const regex = /(const RAW_DEP\s*=\s*\[)([\s\S]*?)(\n\];)/;
const match = html.match(regex);
if (!match) throw new Error("Could not find RAW_DEP array");

html = html.replace(regex, `$1$2\n  ${entry}$3`);
fs.writeFileSync("index.html", html);
console.log(`Logged deposit: $${amt} on ${date}`);
