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

const agriculturalText = evaluate({
  usageNatureDifference: "Evet",
  legalUsageNature: "Tarla",
  currentUsageNature: "Meyve Bahçesi",
});
assert.match(agriculturalText, /Tarla nitelikli olup mevcut durumda Meyve Bahçesi niteliklidir/);
assert.match(agriculturalText, /yasal durum değeri olarak ham toprak değeri/);
assert.match(agriculturalText, /mevcut durum değeri olarak ise ham toprak \+ ağaç değeri takdir edilmiştir/);

const fruitGardenText = evaluate({
  usageNatureDifference: "Evet",
  legalUsageNature: "Tarla",
  currentUsageNature: "Kayısı Bahçesi",
});
assert.match(fruitGardenText, /Kayısı Bahçesi niteliklidir/);

const pearGardenText = evaluate({
  usageNatureDifference: "Evet",
  legalUsageNature: "Tarla",
  currentUsageNature: "Armut Bahçesi",
});
assert.match(pearGardenText, /Tarla nitelikli olup mevcut durumda Armut Bahçesi niteliklidir/);

assert.equal(evaluate({
  usageNatureDifference: "Hayır",
  legalUsageNature: "Tarla",
  currentUsageNature: "Meyve Bahçesi",
}), "");

console.log("tarla usage nature difference tests passed");
