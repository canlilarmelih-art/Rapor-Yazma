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
    /shouldHideField\(section\.id, field\.key\)\s*&&\s*\(!isCurrentUserAdmin\(\)\s*\|\|\s*\(section\.id === "case" && field\.key === "currentUsageNature"\)\s*\|\|\s*\(section\.id === "documents" && isCadastralProjectVisibilityField\(field\.key\)\)\s*\|\|\s*\(section\.id === "address" && isEnvironmentRegionTypeFilteredField\(field\.key\)\)[\s\S]{0,2500}?\|\|\s*\(section\.id === "address" && landAddressHiddenKeys\.includes\(field\.key\)\)[\s\S]{0,800}?\|\|\s*\(section\.id === "documents" && isLandHiddenDocumentsField\(field\.key\)\)[\s\S]{0,900}?\|\|\s*\(section\.id === "documents" && !shouldShowArchitecturalProjectFields\(\) && isArchitecturalProjectDependentField\(field\.key\)\)[\s\S]{0,1000}?\|\|\s*\(section\.id === "documents" && field\.key === "projectDifference" && !shouldShowProjectDifferenceField\(\)\)[\s\S]{0,1100}?\|\|\s*section\.id === "title"\)\)/,
    "Admin diger alan filtresi istisnalarini korurken mevcut kullanim, kadastro gorunurlugu, arazi adres alanlari, projectDifference (Musterek Bina/Arsa/Tarla) VE tapu (title) bagimsiz bolum kurallarini uygulamali.",
  );
  assert.match(
    appSource,
    /function isCadastralProjectVisibilityField\(fieldKey\)\s*\{[\s\S]*?fieldKey === "projectRegisteredInCadastre"[\s\S]*?isCadastralRegistrationDetailField\(fieldKey\)/,
    "Mimari proje secimine bagli kadastro alanlari admin istisnasindan ayrilmali.",
  );
  assert.match(
    appSource,
    /function isEnvironmentRegionTypeFilteredField\(fieldKey\)\s*\{[\s\S]*?commercialFunctionDensity[\s\S]*?agriculturalActivityDensity[\s\S]*?regionUsePurpose[\s\S]*?\}\s*\n\s*\n\s*function createForm[\s\S]*?section\.id === "address" && isEnvironmentRegionTypeFilteredField\(field\.key\)/,
    "Cevresel bolge turu filtresi admin gorunurluk istisnasindan ayrilmali.",
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
    /Number\.isFinite\(numericValue\)\s*&&\s*numericValue > 0/,
    "Sıfır/geçersiz masraf değerleri bozuk kayıt kabul edilmeli.",
  );
  assert.match(
    appSource,
    /function ensureExpenseFeeDefaultsInState\(\)[\s\S]*?function createExpenseFeesSummaryPanel\(\)[\s\S]*?ensureExpenseFeeDefaultsInState\(\);/,
    "Masraf paneli acilirken yerel state ucret tarifesiyle doldurulmali.",
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

// --- c) Kullanıcı bildirimi (2026-09-15, çoklu Tarla talebi): Tapu (title)
// bölümünde Ana Taşınmaz/Kat İrtifakı-dışı mülkiyette gizlenmesi gereken
// bağımsız bölüm alanları YÖNETİCİ hesabında görünmeye devam ediyordu —
// case/documents/address'teki "admin'e bile gösterme" istisnası "title"e
// hiç eklenmemişti. createForm'un GERÇEK karar ifadesi (kaynaktan aynen
// çıkarılır, YENİDEN YAZILMAZ) çalıştırılıp admin/normal kullanıcı VE
// title/case bölümleri için davranışsal olarak doğrulanır.
{
  const startMarker = "shouldHideField(section.id, field.key) && (!isCurrentUserAdmin()";
  const endMarker = '|| section.id === "title"))';
  const startIndex = appSource.indexOf(startMarker);
  assert(startIndex >= 0, "createForm admin-bypass ifadesi bulunamadı.");
  const endIndex = appSource.indexOf(endMarker, startIndex);
  assert(endIndex >= 0, "createForm admin-bypass ifadesinin sonu bulunamadı.");
  // Son ")" ifadenin KENDİSİNE ait (shouldHideField(...) && (...)  şeklindeki
  // dış parantez), endMarker'ın kendi kapanışına DAHİL değil — bu yüzden
  // endMarker'ın uzunluğu + 1 (dış parantez) ile kesilir.
  const decisionExpr = appSource.slice(startIndex, endIndex + endMarker.length - 1);

  function computeHideDecision({ sectionId, fieldKey, hideResult, isAdmin, cadastralVisible = false, environmentFiltered = false, landAddressField = false, landDocumentsField = false, architecturalProjectDependent = false, showArchitecturalProjectFields = true, showProjectDifferenceField = true }) {
    const context = {
      section: { id: sectionId },
      field: { key: fieldKey },
      shouldHideField: () => hideResult,
      isCurrentUserAdmin: () => isAdmin,
      isCadastralProjectVisibilityField: () => cadastralVisible,
      isEnvironmentRegionTypeFilteredField: () => environmentFiltered,
      landAddressHiddenKeys: { includes: () => landAddressField },
      isLandHiddenDocumentsField: () => landDocumentsField,
      isArchitecturalProjectDependentField: () => architecturalProjectDependent,
      shouldShowArchitecturalProjectFields: () => showArchitecturalProjectFields,
      shouldShowProjectDifferenceField: () => showProjectDifferenceField,
    };
    vm.createContext(context);
    return vm.runInContext(decisionExpr, context);
  }

  // Yönetici + Tapu bölümü + shouldHideField true (Ana Taşınmaz/Kat
  // İrtifakı-dışı mülkiyet) -> ARTIK yöneticide de GİZLENMELİ.
  assert.equal(
    computeHideDecision({ sectionId: "title", fieldKey: "unitNo", hideResult: true, isAdmin: true }),
    true,
    "KULLANICI BİLDİRİMİ: yönetici hesabında Tapu bölümünde Ana Taşınmaz/Tarla gibi durumlarda 'Bağımsız Bölüm No' vb. alanlar GİZLENMELİ."
  );
  // Normal kullanıcı + Tapu + shouldHideField true -> zaten gizliydi (regresyon).
  assert.equal(
    computeHideDecision({ sectionId: "title", fieldKey: "unitNo", hideResult: true, isAdmin: false }),
    true,
    "Normal kullanıcıda Tapu bölümü gizleme davranışı DEĞİŞMEMELİ (regresyon)."
  );
  // shouldHideField false (ör. Kat İrtifakı + bağımsız bölüm) -> kimse için gizlenmemeli.
  assert.equal(
    computeHideDecision({ sectionId: "title", fieldKey: "unitNo", hideResult: false, isAdmin: true }),
    false,
    "shouldHideField false iken (ör. gerçek bağımsız bölüm) Tapu alanı yöneticide de GİZLENMEMELİ."
  );
  // Diğer bölümler (case/documents/address) YÖNETİCİ istisnası regresyon
  // kontrolü — "title" eklemesi bunları BOZMAMALI.
  assert.equal(
    computeHideDecision({ sectionId: "case", fieldKey: "currentUsageNature", hideResult: true, isAdmin: true }),
    true,
    "REGRESYON: 'case' bölümünün admin istisnası bozulmuş olabilir."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectRegisteredInCadastre", hideResult: true, isAdmin: true, cadastralVisible: false }),
    false,
    "REGRESYON: 'documents' bölümünün admin istisnası (kadastro GÖRÜNÜR alan) bozulmuş olabilir."
  );
  assert.equal(
    computeHideDecision({ sectionId: "address", fieldKey: "commercialFunctionDensity", hideResult: true, isAdmin: true, environmentFiltered: false }),
    false,
    "REGRESYON: 'address' bölümünün admin istisnası bozulmuş olabilir."
  );
  console.log("KULLANICI BİLDİRİMİ: Tapu (title) bölümü admin-bypass düzeltmesi (gerçek karar ifadesi) testi tamam.");

  // --- d) Kullanıcı bildirimi (2026-09-15): "adres ve konum bölümünde arsa
  // ve arazi raporlarında uavt kat site apartman blok gibi kısımlar
  // gizlensin" — 0.0.343'ten beri VAR olan shouldHideField()'ın "address"
  // dalındaki landAddressHiddenKeys kuralı (site/blok/giriş/dış-iç kapı/
  // kat/UAVT/posta kodu) AYNI "title" kusuruna sahipti: yalnızca
  // isEnvironmentRegionTypeFilteredField eşleşen alanlar admin'e bile
  // gizli kalıyordu, bu 8 alan İSTİSNAYA HİÇ dahil değildi.
  assert.equal(
    computeHideDecision({ sectionId: "address", fieldKey: "uavt", hideResult: true, isAdmin: true, landAddressField: true }),
    true,
    "KULLANICI BİLDİRİMİ: yönetici hesabında Arsa/Arazi raporlarında UAVT/Kat/Site/Apartman/Blok gibi alanlar GİZLENMELİ."
  );
  assert.equal(
    computeHideDecision({ sectionId: "address", fieldKey: "uavt", hideResult: true, isAdmin: false, landAddressField: true }),
    true,
    "Normal kullanıcıda Arsa/Arazi adres alanı gizleme davranışı DEĞİŞMEMELİ (regresyon)."
  );
  assert.equal(
    computeHideDecision({ sectionId: "address", fieldKey: "uavt", hideResult: false, isAdmin: true, landAddressField: true }),
    false,
    "shouldHideField false iken (ör. Kat İrtifakı, gerçek bağımsız bölüm) UAVT alanı yöneticide de GİZLENMEMELİ."
  );
  console.log("KULLANICI BİLDİRİMİ: Adres (arazi adres alanları) bölümü admin-bypass düzeltmesi (gerçek karar ifadesi) testi tamam.");

  // --- e) Kullanıcı talebi (2026-09-15): "arsa ve arazi raporlarında
  // enerji kimlik belgesi cezai karar bölümlerini gizle" — Belgeler ve
  // Proje (documents) bölümünde hasEkb + EKB detay alanları (isLandHiddenDocumentsField)
  // için de landAddressHiddenKeys/title ile AYNI desende bir admin-bypass
  // istisnası eklendi.
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "hasEkb", hideResult: true, isAdmin: true, landDocumentsField: true }),
    true,
    "KULLANICI BİLDİRİMİ: yönetici hesabında Arsa/Arazi raporlarında Enerji Kimlik Belgesi alanı GİZLENMELİ."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "hasEkb", hideResult: true, isAdmin: false, landDocumentsField: true }),
    true,
    "Normal kullanıcıda Arsa/Arazi EKB gizleme davranışı DEĞİŞMEMELİ (regresyon)."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "hasEkb", hideResult: false, isAdmin: true, landDocumentsField: true }),
    false,
    "shouldHideField false iken (ör. Müstakil Bina) EKB alanı yöneticide de GİZLENMEMELİ."
  );
  console.log("KULLANICI BİLDİRİMİ: Belgeler ve Proje (EKB) bölümü admin-bypass düzeltmesi (gerçek karar ifadesi) testi tamam.");

  // --- g) Kullanıcı talebi (2026-09-15): "mimari proje yok seçildiğinde
  // Tapu Projesi Ve Belediye Projesi Arasında Fark Var Mı? bu şık
  // saklanacak" — isArchitecturalProjectDependentField (projectDifference
  // DAHİL 13 alan) için de landAddressHiddenKeys/isLandHiddenDocumentsField
  // ile AYNI desende bir admin-bypass istisnası eklendi.
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectDifference", hideResult: true, isAdmin: true, architecturalProjectDependent: true, showArchitecturalProjectFields: false }),
    true,
    "KULLANICI BİLDİRİMİ: yönetici hesabında mimari proje YOK iken 'Tapu Projesi Ve Belediye Projesi Arasında Fark Var Mı?' GİZLENMELİ."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectDifference", hideResult: true, isAdmin: false, architecturalProjectDependent: true, showArchitecturalProjectFields: false }),
    true,
    "Normal kullanıcıda mimari proje YOK iken gizleme davranışı DEĞİŞMEMELİ (regresyon)."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectDifference", hideResult: false, isAdmin: true, architecturalProjectDependent: true, showArchitecturalProjectFields: true }),
    false,
    "Mimari proje VARKEN (shouldShowArchitecturalProjectFields true) projectDifference yöneticide de GİZLENMEMELİ."
  );
  console.log("KULLANICI BİLDİRİMİ: Belgeler ve Proje (mimari proje YOK -> projectDifference) admin-bypass düzeltmesi (gerçek karar ifadesi) testi tamam.");

  // --- h) Kullanıcı talebi (2026-09-19): "müstakil formatta tapu proje
  // arasında farklılık var mı kısmını kaldıralım" — shouldShowProjectDifferenceField()
  // (isOwnershipProjectDifferenceComparable() ile Müstakil Bina/Arsa/Tarla'yı
  // ZATEN dışlıyordu) için de AYNI desende bir admin-bypass istisnası
  // eklendi. Mimari proje VARKEN (yukarıdaki "g" dalı devrede DEĞİLKEN)
  // bile, mülkiyet türü karşılaştırılamaz olduğunda GİZLENMELİ.
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectDifference", hideResult: true, isAdmin: true, showArchitecturalProjectFields: true, showProjectDifferenceField: false }),
    true,
    "KULLANICI BİLDİRİMİ: yönetici hesabında Müstakil Bina/Arsa/Tarla'da (mimari proje VARKEN bile) 'Tapu Projesi Ve Belediye Projesi Arasında Fark Var Mı?' GİZLENMELİ."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectDifference", hideResult: true, isAdmin: false, showArchitecturalProjectFields: true, showProjectDifferenceField: false }),
    true,
    "Normal kullanıcıda Müstakil Bina/Arsa/Tarla gizleme davranışı DEĞİŞMEMELİ (regresyon)."
  );
  assert.equal(
    computeHideDecision({ sectionId: "documents", fieldKey: "projectDifference", hideResult: false, isAdmin: true, showArchitecturalProjectFields: true, showProjectDifferenceField: true }),
    false,
    "Karşılaştırılabilir mülkiyette (ör. Kat İrtifakı) projectDifference yöneticide de GİZLENMEMELİ."
  );
  console.log("KULLANICI BİLDİRİMİ: Belgeler ve Proje (Müstakil Bina/Arsa/Tarla -> projectDifference) admin-bypass düzeltmesi (gerçek karar ifadesi) testi tamam.");
}

// --- f) isLandHiddenDocumentsField() kaynak-düzeyi tanım kontrolü ----------
// (hasEkb + isEkbFieldKey'in TÜMÜNÜ kapsamalı, iki ayrı listeye BÖLÜNMEMELİ).
{
  assert.match(
    appSource,
    /function isLandHiddenDocumentsField\(fieldKey\)\s*\{\s*return fieldKey === "hasEkb" \|\| isEkbFieldKey\(fieldKey\);\s*\}/,
    "isLandHiddenDocumentsField() hasEkb VE isEkbFieldKey() alanlarının TÜMÜNÜ kapsamalı."
  );
  assert.match(
    appSource,
    /if \(sectionId === "documents" && isLandHiddenDocumentsField\(fieldKey\) && isLandProjectReview\(\)\) \{\s*return true;\s*\}/,
    "shouldHideField() 'documents' dalında EKB alanları Arsa\\/Arazi\\/Tarla'da (isLandProjectReview) HER ZAMAN gizlemeli."
  );
  console.log("isLandHiddenDocumentsField() kaynak-düzeyi tanım testi tamam.");

  // --- g) createForm() admin-bypass istisnasının kaynak-düzeyi varlığı ------
  assert.match(
    appSource,
    /\|\|\s*\(section\.id === "documents" && !shouldShowArchitecturalProjectFields\(\) && isArchitecturalProjectDependentField\(field\.key\)\)/,
    "createForm() admin-bypass istisnası isArchitecturalProjectDependentField (mimari proje YOK) için de eklenmeli."
  );
  console.log("isArchitecturalProjectDependentField() admin-bypass kaynak-düzeyi kablolama testi tamam.");
}

console.log("Ayrıcalıklı görünürlük düzeltmeleri (transport/nearby/environment/Halkbank) testi tamam.");
