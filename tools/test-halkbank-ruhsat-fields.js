"use strict";

/*
  Kullanici talebi: "halkbank bu bölüm bu kadar seçenek varken bizde sadece
  3 satır veri var bunu düzeltelim" — Halkbank'in kendi sisteminde "Ruhsat
  Özellikleri ve Dosya İncelemeleri" ekraninda ~21 alan varken bizim
  halkbank.html sablonumuzda yalnizca 4 satir vardi. Kullanici, eksik
  alanlarin cogu icin MEVCUT verilerden turetme kurallari belirtti (yeni
  manuel giris alani EKLENMEDI):
    - Ruhsat Var mi -> Incelenen Belgeler'de en az 1 ruhsat satiri var mi
    - Ruhsat Iptali Var mi -> her zaman "Yok" (veri kaynagi yok)
    - Tad. Ruhsat Tarihi -> "Yeni Yapi Ruhsati" DISINDA baska bir ruhsat
      satirinin tarihi
    - Kat Irtifakina Esas Proje Incelendi mi -> incelenen proje turlerinden
      biri "Kat Irtifaki Projesi" ise Evet
    - Kira Sozlesmesi Var mi -> Kullanim Durumu "Kiraci" ise Evet
    - Fiilen Kullaniliyor mu -> Kullanim Durumu "Bos" varyantlarinda Hayir,
      digerlerinde Evet
    - Riskli Yapi mi -> her zaman "Hayir" (veri kaynagi yok)

  Bu test iki katmanli calisir:
  1) Bagimsiz (state.fields disinda hicbir app.js fonksiyonuna ihtiyac
     duymayan) turetme fonksiyonlarini GERCEK app.js kaynagindan izole VM'de
     calistirir: isKatIrtifakiProjectReviewed/Text, getUnitLeaseAgreementStatusText,
     getUnitActivelyUsedStatusText.
  2) Derin bagimliligi olan fonksiyonlarin (getReviewedBuildingPermitAvailabilityText,
     getLatestRenovationPermitDateText, getUnitProjectSuitabilityAreaMatchText,
     getUnitProjectSuitabilityLocationMatchText — Incelenen Belgeler tablosu ve
     proje uygunluk durumu zincirine bagli, tam izolasyon asiri karmasik) hala
     app.js'te tanimli oldugunu VE template-engine.js'in bunlari dogru
     isimlerle safeCall ettigini yapisal olarak dogrular — 147 dinamik cagri
     uyarisindaki "fonksiyon adi yeniden adlandirilirsa sessizce bos doner"
     riskine karsi bir koruma.
  3) template-engine.js'teki RUHSATIPTALIVARMI/RISKLIYAPIMI sabit (t:) donus
     degerlerini dogrudan kaynaktan cikarip calistirarak "Yok"/"Hayir"
     degerlerini dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

// --- 1) Bagimsiz turetme fonksiyonlari (izole VM) -----------------------
const shallowFnsSrc = sliceFn("function isKatIrtifakiProjectReviewed(", {
  toMarker: "\nconst PROJECT_SUITABILITY_AREA_MISMATCH_KEYS",
});

function runShallow(fields) {
  const context = { state: { fields } };
  vm.createContext(context);
  vm.runInContext(shallowFnsSrc, context);
  return context;
}

// Kat Irtifakina Esas Proje Incelendi mi?
{
  const evetCases = [
    { projectType: "Kat İrtifakı Projesi" },
    { titleProjectType: "Kat İrtifakı Projesi" },
    { municipalityProjectType: "Kat İrtifakı Projesi" },
  ];
  evetCases.forEach((fields, index) => {
    const ctx = runShallow(fields);
    assert.equal(
      ctx.getKatIrtifakiProjectReviewedText(),
      "Evet",
      `Kat irtifaki projesi durumu #${index} Evet donmeli: ${JSON.stringify(fields)}`
    );
  });

  const hayirCases = [{}, { projectType: "Onaylı Mimari Projesi" }, { projectType: "Tadilat Projesi" }];
  hayirCases.forEach((fields, index) => {
    const ctx = runShallow(fields);
    assert.equal(
      ctx.getKatIrtifakiProjectReviewedText(),
      "Hayır",
      `Kat irtifaki projesi durumu #${index} Hayir donmeli: ${JSON.stringify(fields)}`
    );
  });
}

// Kira Sozlesmesi Var mi?
{
  assert.equal(runShallow({ unitUsageStatus: "Kiracı" }).getUnitLeaseAgreementStatusText(), "Evet");
  ["", "Mal Sahibi", "İşgalci", "Boş (Hiç Kullanılmamış)"].forEach((status) => {
    assert.equal(
      runShallow({ unitUsageStatus: status }).getUnitLeaseAgreementStatusText(),
      "Hayır",
      `Kullanim durumu "${status}" icin kira sozlesmesi Hayir donmeli.`
    );
  });
}

// Fiilen Kullaniliyor mu?
{
  ["Boş (Hiç Kullanılmamış)", "Boş (Kullanılmış)"].forEach((status) => {
    assert.equal(
      runShallow({ unitUsageStatus: status }).getUnitActivelyUsedStatusText(),
      "Hayır",
      `"${status}" icin fiilen kullaniliyor Hayir donmeli.`
    );
  });
  ["Mal Sahibi", "Kiracı", "İşgalci"].forEach((status) => {
    assert.equal(
      runShallow({ unitUsageStatus: status }).getUnitActivelyUsedStatusText(),
      "Evet",
      `"${status}" icin fiilen kullaniliyor Evet donmeli.`
    );
  });
}

console.log("Halkbank Ruhsat bolumu - bagimsiz turetme fonksiyonlari testi tamam.");

// --- 2) Derin bagimlilikli fonksiyonlarin varligi + safeCall kablolamasi -
[
  "getReviewedBuildingPermitAvailabilityText",
  "getLatestRenovationPermitDateText",
  "getUnitProjectSuitabilityAreaMatchText",
  "getUnitProjectSuitabilityLocationMatchText",
  "isKatIrtifakiProjectReviewed",
  "getKatIrtifakiProjectReviewedText",
  "getUnitLeaseAgreementStatusText",
  "getUnitActivelyUsedStatusText",
].forEach((fnName) => {
  assert(
    new RegExp(`function ${fnName}\\(`).test(appSource),
    `app.js icinde ${fnName} fonksiyonu bulunamadi (silinmis/yeniden adlandirilmis olabilir).`
  );
});

[
  ["RUHSATVARMI", "getReviewedBuildingPermitAvailabilityText"],
  ["TADILATRUHSATTARIHI", "getLatestRenovationPermitDateText"],
  ["KATIRTIFAKIPROJEINCELENDIMI", "getKatIrtifakiProjectReviewedText"],
  ["KIRASOZLESMESIVARMI", "getUnitLeaseAgreementStatusText"],
  ["KONUTASINMAZALANUYGUNMU", "getUnitProjectSuitabilityAreaMatchText"],
  ["KONUTASINMAZKONUMUYGUNMU", "getUnitProjectSuitabilityLocationMatchText"],
  ["FIILENKULLANILIYORMU", "getUnitActivelyUsedStatusText"],
].forEach(([placeholder, fnName]) => {
  assert(
    engineSource.includes(`${placeholder}: { fn: () => safeCall("${fnName}") }`),
    `template-engine.js: ${placeholder} placeholder'i ${fnName} fonksiyonunu safeCall ile cagirmiyor.`
  );
});

// --- 3) Sabit (veri kaynagi olmayan) alanlarin literal donus degerleri --
function extractLiteralReturn(placeholderKey) {
  const pattern = new RegExp(`${placeholderKey}: \\{ t: \\(\\) => (.+?) \\}`);
  const match = engineSource.match(pattern);
  assert(match, `template-engine.js icinde bulunamadi: ${placeholderKey}`);
  return vm.runInNewContext(match[1]);
}

assert.equal(
  extractLiteralReturn("RUHSATIPTALIVARMI"),
  "Yok",
  "RUHSATIPTALIVARMI placeholder'i her zaman 'Yok' donmeli (veri kaynagi yok, kullanici talebi: 'ruhsat iptali default yok')."
);
assert.equal(
  extractLiteralReturn("RISKLIYAPIMI"),
  "Hayır",
  "RISKLIYAPIMI placeholder'i her zaman 'Hayır' donmeli (veri kaynagi yok, kullanici talebi: 'Riskli yapı mı default hayır')."
);

console.log("Halkbank Ruhsat bolumu - derin bagimlilikli fonksiyon kablolamasi ve sabit alanlar testi tamam.");
