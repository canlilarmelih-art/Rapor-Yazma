const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");
const definitions = new Map();
const pattern = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
let match;

while ((match = pattern.exec(source))) {
  const name = match[1];
  const line = source.slice(0, match.index).split("\n").length;
  const lines = definitions.get(name) || [];
  lines.push(line);
  definitions.set(name, lines);
}

const duplicates = [...definitions.entries()]
  .filter(([, lines]) => lines.length > 1)
  .map(([name, lines]) => `${name}: ${lines.join(", ")}`);

assert.deepEqual(
  duplicates,
  [],
  `app.js içinde üst kapsamda yinelenen fonksiyon tanımı bulundu:\n${duplicates.join("\n")}`,
);

console.log(`Üst kapsam fonksiyon benzersizlik testi tamam (${definitions.size} fonksiyon).`);
