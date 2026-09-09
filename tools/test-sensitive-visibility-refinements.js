"use strict";

/*
  Kullanici test hesabiyla giris yapip normal-kullanici gorunumunu bizzat
  kontrol ettikten sonra verdigi düzeltme listesi:
  1) Adres ve Konum: Ulasim ana arteri / Yakin cevre secimi / Ulasim Tarifi
     GORUNMELI (bir onceki sensitiveOnly gecisi bunlari yanlislikla
     transport/nearby uzerinden gizlemisti — createTransportNearbyComposer
     TEK PARCA render edildigi icin mainArtery + Yakin cevre secimi de
     onunla birlikte kayboluyordu).
  2) Adres ve Konum: Cevresel Ozellikler Aciklamasi (environmentDescription)
     GIZLENMELI.
  3) Sol panel: Halkbank Risk Kodlari SADECE Halkbank raporlarinda gorunmeli.

  Bu test iki katmani dogrular:
  a) Deklaratif alan/bolum bayraklari - app.js kaynagini metin olarak
     tarayarak transport/nearby'de sensitiveOnly OLMADIGINI, environmentDescription'da
     sensitiveOnly OLDUGUNU dogrular (regresyon koruma - gelecekte biri
     transport/nearby'ye tekrar sensitiveOnly eklerse bu test kirilir).
  b) Banka bazli bolum gizleme - isHalkbankSelectedForReport/
     shouldHideSectionForBank fonksiyonlari gercek app.js kaynagindan izole
     calistirilir (foldTurkish bagimliligiyla birlikte).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

// --- a) Deklaratif alan bayraklari (metin taramasi) -----------------------
{
  const transportFieldLine = appSource
    .split("\n")
    .find((line) => line.includes('key: "transport"') && line.includes('label: "Ulaşım tarifi"'));
  assert.ok(transportFieldLine, "\"transport\" alan tanimi bulunamadi.");
  assert.ok(
    !transportFieldLine.includes("sensitiveOnly"),
    `"Ulaşım tarifi" (transport) alani sensitiveOnly OLMAMALI — createTransportNearbyComposer tum ariyer/yakin-cevre aracini birlikte gizler: ${transportFieldLine}`,
  );

  const nearbyFieldLine = appSource
    .split("\n")
    .find((line) => line.includes('key: "nearby"') && line.includes('label: "Yakın çevresi"'));
  assert.ok(nearbyFieldLine, "\"nearby\" alan tanimi bulunamadi.");
  assert.ok(
    !nearbyFieldLine.includes("sensitiveOnly"),
    `"Yakın çevresi" (nearby) alani sensitiveOnly OLMAMALI: ${nearbyFieldLine}`,
  );

  const environmentFieldBlock = sliceFn('key: "environmentDescription"', {
    toMarker: "},",
  });
  assert.ok(
    environmentFieldBlock.includes("sensitiveOnly: true"),
    `"Çevresel özellikler açıklaması" (environmentDescription) alani sensitiveOnly: true OLMALI: ${environmentFieldBlock}`,
  );

  // Proje uygunluğu, normal kullanicinin documents formunda da gorunmeli.
  // Bu alanlar sensitiveOnly olarak kalir; createForm bunlari ozel proje
  // uygunlugu arayuzune devrederken genel hassas alan filtresinden muaf tutar.
  assert.match(
    appSource,
    /function isProjectSuitabilityUiField\(sectionId, fieldKey\)\s*\{[\s\S]*?sectionId === "documents"[\s\S]*?projectReviewDescription[\s\S]*?projectConformity/,
    "Proje uygunlugu alanlari icin normal kullanici arayuzu istisnasi bulunmali.",
  );
  assert.match(
    appSource,
    /field\.sensitiveOnly\s*&&\s*!canViewSensitiveContent\(\)\s*&&\s*!isProjectSuitabilityUiField\(section\.id, field\.key\)/,
    "createForm, proje uygunlugu alanlarini hassas alan filtresinden muaf tutmali.",
  );
  assert.match(
    appSource,
    /shouldHideField\(section\.id, field\.key\)\s*&&\s*\(!isCurrentUserAdmin\(\)\s*\|\|\s*\(section\.id === "case" && field\.key === "currentUsageNature"\)\)/,
    "Admin diger alan filtresi istisnalarini korurken mevcut kullanim niteligini kosullu gostermeli.",
  );
  assert.match(
    appSource,
    /key: "reviewedDocumentsDescription"[\s\S]*?sensitiveOnly: true/,
    "Diger hassas belge aciklamalari koruma altinda kalmali.",
  );
  assert.match(
    appSource,
    /const hasConfiguredExpenseFee = EXPENSE_FEE_ADMIN_KEYS\.some\(/,
    "Bos ortak masraf kaydi tespit edilmeli.",
  );
  assert.match(
    appSource,
    /if \(!hasConfiguredExpenseFee\)[\s\S]*?EXPENSE_FEE_2026_DEFAULTS[\s\S]*?scheduleExpenseFeeCloudSave\(\)/,
    "Bos ortak masraf kaydi 2026 varsayilanlariyla geri yuklenmeli.",
  );
  assert.match(
    appSource,
    /function isUsageNatureDifferenceEnabled\(\)[\s\S]*?\["EVET", "TRUE", "1", "YES"\]\.includes\(value\)/,
    "Kullanım niteliği farkı işaretinin farklı kayıt biçimleri tanınmalı.",
  );
}

// --- b) Banka bazli bolum gizleme: Halkbank Risk Kodlari -------------------
{
  const foldSrc = sliceFn("function foldTurkish(");
  const isHalkbankSrc = sliceFn("function isHalkbankSelectedForReport(");
  const shouldHideForBankSrc = sliceFn("function shouldHideSectionForBank(");

  function evalForBank(bankName) {
    const context = { state: { fields: { bank: bankName } } };
    vm.createContext(context);
    vm.runInContext(foldSrc, context);
    vm.runInContext(isHalkbankSrc, context);
    vm.runInContext(shouldHideForBankSrc, context);
    return {
      isHalkbank: context.isHalkbankSelectedForReport(),
      hidesHalkbankRiskSection: context.shouldHideSectionForBank("halkbankRisk"),
      hidesOtherSection: context.shouldHideSectionForBank("address"),
    };
  }

  const halkbankResult = evalForBank("Türkiye Halk Bankası A.Ş.");
  assert.equal(halkbankResult.isHalkbank, true, "Halkbank secili iken isHalkbankSelectedForReport true donmeli.");
  assert.equal(halkbankResult.hidesHalkbankRiskSection, false, "Halkbank seciliyken 'Halkbank Risk Kodları' bolumu GİZLENMEMELİ.");

  const isbankResult = evalForBank("Türkiye İş Bankası A.Ş.");
  assert.equal(isbankResult.isHalkbank, false, "İş Bankası secili iken isHalkbankSelectedForReport false donmeli.");
  assert.equal(isbankResult.hidesHalkbankRiskSection, true, "Halkbank DIŞINDA bir banka seciliyken 'Halkbank Risk Kodları' bolumu GİZLENMELİ.");

  const emptyResult = evalForBank("");
  assert.equal(emptyResult.hidesHalkbankRiskSection, true, "Banka hic secilmemisken 'Halkbank Risk Kodları' bolumu GİZLENMELİ.");

  // Banka secimi diger bolumleri ETKİLEMEMELİ.
  assert.equal(halkbankResult.hidesOtherSection, false, "Banka bazli gizleme yalnizca 'halkbankRisk' bolumunu etkilemeli.");
  assert.equal(isbankResult.hidesOtherSection, false, "Banka bazli gizleme yalnizca 'halkbankRisk' bolumunu etkilemeli.");
}

console.log("Ayrıcalıklı görünürlük düzeltmeleri (transport/nearby/environment/Halkbank) testi tamam.");
