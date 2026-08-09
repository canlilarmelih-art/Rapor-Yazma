const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
assert.match(appSource, /filter\(\(record\) => \(record\.type \|\| record\.description\) && !isTakbisEncumbranceNoiseRecord/);

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Function not found: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Function body not closed: ${name}`);
}

const functionNames = ["foldTurkish", "getTakbisEncumbranceGroups"];
const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function row(text) {
  return { text };
}

{
  const rows = [
    row("MULKIYETE AIT REHIN BILGILERI"),
    row("IPOTEK BILGILERI"),
    row("Ipotek Lehdari: Nurol Yatirim Bankasi Ipotek Derecesi: 1"),
    row("Ipotek Tutari: 109.260.000,00 TL Tarih: 29.05.2025 Yevmiye No: 28866"),
  ];
  const groups = fns.getTakbisEncumbranceGroups(rows);
  const ipotekGroup = groups.find((group) => group.key === "ipotek");
  assert.ok(ipotekGroup, "Ipotek group should exist.");
  assert.equal(ipotekGroup.rows.length, 3, "Without a next-record marker, the group should reach the end.");
}

{
  const rows = [
    row("MULKIYETE AIT REHIN BILGILERI"),
    row("IPOTEK BILGILERI"),
    row("Ipotek Lehdari: Nurol Yatirim Bankasi Ipotek Derecesi: 1"),
    row("Ipotek Tutari: 109.260.000,00 TL Tarih: 29.05.2025 Yevmiye No: 28866"),
    row("TAPU KAYIT BILGISI"),
    row("Bu belge 12.06.2026 18:29:32 tarihinde alinmistir. Sira No: 18"),
    row("Tasinmaz Kimlik No: 222222"),
  ];
  const groups = fns.getTakbisEncumbranceGroups(rows);
  const ipotekGroup = groups.find((group) => group.key === "ipotek");
  assert.ok(ipotekGroup, "Ipotek group should still exist.");
  assert.equal(ipotekGroup.rows.length, 3, "The group should stop at TAPU KAYIT BILGISI.");
  assert.ok(!ipotekGroup.rows.some((item) => item.text.includes("12.06.2026") || item.text.includes("222222")));
}

{
  const rows = [
    row("IPOTEK BILGILERI"),
    row("Ipotek Lehdari: Nurol Yatirim Bankasi"),
    row("Ipotek Tutari: 109.260.000,00 TL Tarih: 29.05.2025 Yevmiye No: 28866"),
    row("BU BELGE 12.06.2026 TARİHİNDE ALINMIŞTIR"),
    row("Sira No: 18"),
  ];
  const groups = fns.getTakbisEncumbranceGroups(rows);
  const ipotekGroup = groups.find((group) => group.key === "ipotek");
  assert.equal(ipotekGroup.rows.length, 3, "The group should stop at next-record metadata without a section heading.");
  assert.ok(!ipotekGroup.rows.some((item) => item.text.includes("12.06.2026") || item.text.includes("18")));
}

{
  const rows = [
    row("IPOTEK BILGILERI"),
    row("Ipotek Lehdari: X Bankasi"),
    row("EKLENTI BILGILERI"),
    row("Eklenti sistem no: 999999"),
  ];
  const groups = fns.getTakbisEncumbranceGroups(rows);
  const ipotekGroup = groups.find((group) => group.key === "ipotek");
  assert.equal(ipotekGroup.rows.length, 2, "The existing EKLENTI BILGILERI boundary must remain active.");
}

console.log("TAKBIS next-property encumbrance boundary tests passed.");
