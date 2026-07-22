const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const saleabilitySource = sourceBetween(
  "const tarlaSaleabilityRiskExplanation",
  "const valuationSaleabilityExplanationFallback"
);
const tarlaRiskSource = sourceBetween(
  "function buildTarlaValuationRiskExplanation",
  "function buildValuationRentExplanation"
);
const exportSource = sourceBetween(
  "function buildValuationSaleabilityExplanationForExport",
  "// \"Emlak Beyan Değeri Açıklaması\""
);

function evaluate({ tarla, saleability = "Satılabilir" }) {
  const context = {
    state: { fields: { saleability, saleabilityNote: "" } },
    saleabilityOptions: ["Satılabilir", "Zayıf"],
    isTarlaOwnershipType: () => tarla,
    normalizeReportDescriptionText: (value) => value.trim(),
  };
  vm.runInNewContext(`${saleabilitySource}\n${tarlaRiskSource}\n${exportSource}`, context);
  return {
    screen: context.buildValuationSaleabilityExplanation(),
    export: context.buildValuationSaleabilityExplanationForExport(),
    tarlaRisk: context.buildTarlaValuationRiskExplanation(),
  };
}

const requiredText = "Tarla / Bahçe vasıflı gayrimenkullerin herhangi bir sebeple satışa arz edilmesi halinde; tarım girdi maliyetlerinin çok yüksek olması nedeniyle cazip bir yatırım olarak görülmemesi, bu vasıftaki gayrimenkullerin alım satım piyasasının gelişmemiş olması, ancak aynı yerleşim biriminde yaşayan ya da bitişik komşu parsel maliklerince tercih edilmesi nedeniyle sınırlı tercih ve talebin söz konusu olması, bu tür gayrimenkullerin icra ve bunun gibi yollarla satışında ülkemizdeki örf - adet ve geleneklerden gelen nedenlerle kimsenin satışa iştirak etmemesi, bu vasıfta gayrimenkullerin doğal tesirlerden (kar-buz, don, dolu, haşerat, vb.) direk etkilenmesi, verimliliklerinin doğadaki gelişmelere bağlı olması, bahçe vasıflı gayrimenkuller üzerindeki ağaç vb. unsurların her türlü etki ve tehlikelere (tahrip edilme, hırsızlık, kesim, vb.) maruz kalmaları gibi olumsuz tüm faktörlerin dikkate alınması gerekmektedir.";

const tarlaResult = evaluate({ tarla: true });
assert.match(tarlaResult.screen, /SATILABİLİR olduğu kanaatine varılmıştır\.$/);
assert.equal(tarlaResult.export, "");
assert.equal(tarlaResult.tarlaRisk, requiredText);

const nonTarlaResult = evaluate({ tarla: false });
assert.equal(nonTarlaResult.export, "");
assert.equal(nonTarlaResult.tarlaRisk, "");

console.log("tarla saleability explanation tests passed");
