const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function getMinimumAgriculturalParcelLimit()");
const end = appSource.indexOf("function refreshLandMinimumParcelAssessment()", start);
assert(start >= 0 && end > start, "5403 minimum parsel fonksiyonlari bulunamadi.");
const source = appSource.slice(start, end);

function evaluate(fields) {
  const context = {
    state: { fields },
    globalThis: {
      MinimumAgriculturalParcelSizes: [{
        city: "Bursa",
        district: "Karacabey",
        suluM2: 65000,
        kuruM2: 140000,
        dikiliM2: 10000,
      }],
    },
    shouldHideLandAgricultureControls: () => false,
    foldTurkish: (value) => String(value || "").toLocaleUpperCase("tr-TR")
      .replaceAll("İ", "I")
      .replaceAll("Ş", "S")
      .replaceAll("Ğ", "G")
      .replaceAll("Ü", "U")
      .replaceAll("Ö", "O")
      .replaceAll("Ç", "C"),
    parseReportNumber: (value) => Number(String(value).replaceAll(".", "").replace(",", ".")),
    normalizeReportTitleText: (value) => String(value || "").trim(),
  };
  vm.runInNewContext(source, context);
  return context.buildLandMinimumParcelAssessmentSentence();
}

const baseFields = {
  titleCity: "Bursa",
  titleDistrict: "Karacabey",
  landArea: "100000",
};

const sulu = evaluate({
  ...baseFields,
  landClassification: "Mutlak Tarım Arazisi",
  landAgricultureType: "Sulu Tarım",
});
assert.match(sulu, /Arazi Sınıflandırması Mutlak Tarım Arazisi/);
assert.match(sulu, /Tarım Türü Sulu Tarım/);
assert.match(sulu, /Sulu Arazi/);
assert.match(sulu, /65\.000 m²/);

const dikili = evaluate({
  ...baseFields,
  landClassification: "Dikili Tarım Arazisi",
  landAgricultureType: "Kuru Tarım",
});
assert.match(dikili, /Arazi Sınıflandırması Dikili Tarım Arazisi/);
assert.match(dikili, /Tarım Türü Kuru Tarım/);
assert.match(dikili, /Dikili Arazi/);
assert.match(dikili, /10\.000 m²/);

const missingClassification = evaluate({
  ...baseFields,
  landAgricultureType: "Kuru Tarım",
});
assert.match(missingClassification, /Arazi Sınıflandırması bilgisi girilmediğinden/);

console.log("minimum parcel classification tests passed");
