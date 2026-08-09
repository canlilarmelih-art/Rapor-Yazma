const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    if (appSource[cursor] === "(") parenDepth += 1;
    if (appSource[cursor] === ")") {
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
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "encumbranceCleanText",
  "getEncumbranceRowJournalNo",
  "formatTitleUnitEncumbranceReference",
  "groupEncumbranceRowsAcrossTitleUnits",
  "formatEncumbranceTitleUnitScope",
];
const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

const rowsByUnit = [
  {
    index: 0,
    fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "2" },
    rows: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154" }],
  },
  {
    index: 1,
    fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "4" },
    rows: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154" }],
  },
  {
    index: 2,
    fields: { blockNo: "709", parcelNo: "2", titleBlockName: "B", unitNo: "7" },
    rows: [{ c0: "Şerh", c1: "Farklı kayıt", c2: "27.10.2021", c3: "40000" }],
  },
];

const grouped = fns.groupEncumbranceRowsAcrossTitleUnits(rowsByUnit, "encumbranceDeclarations");
assert.equal(grouped.length, 2, "Aynı yevmiye tek satıra, farklı yevmiye ayrı satıra inmeli.");
assert.deepEqual(grouped[0].__titleUnitReferences, ["A-2", "A-4"]);
assert.deepEqual(grouped[1].__titleUnitReferences, ["B-7"]);
assert.equal(fns.getEncumbranceRowJournalNo("encumbranceDeclarations", grouped[0]), "39154");
assert.equal(
  fns.formatEncumbranceTitleUnitScope(grouped[0], 2),
  " (Tüm Taşınmazlar üzerinde müştereken)",
);
assert.equal(
  fns.formatEncumbranceTitleUnitScope(grouped[0], 3),
  " (A-2 ve A-4 üzerinde)",
);
console.log("Coklu takyidat ayni yevmiye gruplama testi tamam.");
