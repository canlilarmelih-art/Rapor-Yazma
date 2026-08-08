const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("const agriculturalUsageNatureOptions");
const end = appSource.indexOf("function buildValuationConstructionLevelRiskText", start);
assert(start >= 0 && end > start, "Tarla kullanım niteliği açıklama fonksiyonları bulunamadı.");

function evaluate(fields, ownershipType = "Arsa") {
  const context = {
    state: { fields: { ownershipType, ...fields } },
    isTarlaOwnershipType: () => true,
    parseValuationNumber: () => Number.NaN,
    foldTurkish: (value) => String(value || "").toLocaleUpperCase("tr-TR"),
  };
  vm.runInNewContext(appSource.slice(start, end), context);
  return context.buildValuationUsageNatureDifferenceText();
}

// Not: buildAgriculturalUsageNatureDifferenceText() artik cumle
// VARYANTLARINA bagli (bkz. docs/cumle-envanteri.md, Bolum 6) — bu test
// gercek (mock'lanmamis) selectVariant ile calisiyor, dolayisiyla hangi
// varyantin secildigi (V0/V1) DETERMINISTIK ama testin kapsami disi; asagidaki
// assert'ler HER iki varyantta da ortak olan ICERIK unsurlarini (nitelik
// adlari, "ham toprak", "agac degeri", cumle sonu) kontrol eder — varyant
// SECIMinin kendisi ayrica tools/test-variant-selection.js'te test edilir.
const agriculturalText = evaluate({
  usageNatureDifference: "Evet",
  legalUsageNature: "Tarla",
  currentUsageNature: "Meyve Bahçesi",
});
assert.match(agriculturalText, /Tarla/);
assert.match(agriculturalText, /Meyve Bahçesi/);
assert.match(agriculturalText, /ham toprak/);
assert.match(agriculturalText, /ağaç değer/);
assert.match(agriculturalText, /takdir edilmiştir\.$/);

const fruitGardenText = evaluate({
  usageNatureDifference: "Evet",
  legalUsageNature: "Tarla",
  currentUsageNature: "Kayısı Bahçesi",
});
assert.match(fruitGardenText, /Kayısı Bahçesi/);

const pearGardenText = evaluate({
  usageNatureDifference: "Evet",
  legalUsageNature: "Tarla",
  currentUsageNature: "Armut Bahçesi",
});
assert.match(pearGardenText, /Tarla/);
assert.match(pearGardenText, /Armut Bahçesi/);

assert.equal(evaluate({
  usageNatureDifference: "Hayır",
  legalUsageNature: "Tarla",
  currentUsageNature: "Meyve Bahçesi",
}), "");

console.log("tarla usage nature difference tests passed");
