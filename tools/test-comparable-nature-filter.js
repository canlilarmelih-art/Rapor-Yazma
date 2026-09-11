const fs = require("fs");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extract(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`${label} kaynak koddan okunamadi.`);
  return match[0];
}

function main() {
  const appSource = fs.readFileSync("app.js", "utf8");
  assert(
    /function getComparableRows\(\)[\s\S]*?while \(rows\.length < comparableDefaultRowCount\)/.test(appSource),
    "Emsal satirlari dort bos varsayilan sutuna tamamlanmali."
  );
  const runtimeSource = [
    extract(appSource, /function foldTurkish\(value\) \{[\s\S]*?\n\}/, "foldTurkish"),
    extract(appSource, /const comparableLandNatureKeys = new Set\([^;]+;/, "arazi nitelik anahtarlari"),
    extract(appSource, /const comparableAgriculturalNatureKeys = new Set\([^;]+;/, "tarimsal nitelik anahtarlari"),
    extract(appSource, /function normalizeComparableNature\(row = \{\}\) \{[\s\S]*?\n\}/, "emsal nitelik normalizasyonu"),
    extract(appSource, /function isLandComparable\(row = \{\}\) \{[\s\S]*?\n\}/, "arazi emsal kontrolu"),
    extract(appSource, /function isAgriculturalComparable\(row = \{\}\) \{[\s\S]*?\n\}/, "tarimsal emsal kontrolu"),
    `function isComparableRowEmpty(row = {}) {
      return Object.keys(row).every((key) => key === "_comparablesVersion" || !String(row[key] || "").trim());
    }`,
    extract(appSource, /function getComparableRowsForView\(rows, viewMode\) \{[\s\S]*?\n\}/, "emsal gorunum filtresi"),
    `globalThis.result = {
      normalized: normalizeComparableNature({ c23: "Meyve Bahçesi" }),
      isLand: isLandComparable({ c23: "Meyve Bahçesi" }),
      isAgricultural: isAgriculturalComparable({ c23: "Meyve Bahçesi" }),
      visible: getComparableRowsForView([
        { c23: "Konut" },
        { c23: "Meyve Bahçesi" },
        { c23: "Tarla" },
        { c23: "Arsa" },
        { _comparablesVersion: 2 },
      ], "land").map(({ row }) => row.c23),
      emptyResidential: getComparableRowsForView([{ _comparablesVersion: 2 }], "residential").length,
    };`,
  ].join("\n\n");

  const context = {};
  vm.runInNewContext(runtimeSource, context);
  assert(context.result.normalized === "meyve bahcesi", "Meyve Bahçesi ASCII anahtara normallesmeli.");
  assert(context.result.isLand, "Meyve Bahçesi arazi emsali sayilmali.");
  assert(context.result.isAgricultural, "Meyve Bahçesi tarimsal emsal sayilmali.");
  assert(
    JSON.stringify(context.result.visible) === JSON.stringify(["Meyve Bahçesi", "Tarla", "Arsa", undefined]),
    "Meyve Bahçesi, Arsa / Tarla gorunum filtresinde gorunmeli; bos varsayilan sutun da korunmali."
  );
  assert(context.result.emptyResidential === 1, "Bos varsayilan sutun Konut / Yapi gorunumunde de korunmali.");
  console.log("Meyve bahcesi emsal gorunum filtresi testi tamam.");
}

main();
