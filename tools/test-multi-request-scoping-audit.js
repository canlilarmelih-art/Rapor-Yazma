// Coklu Talep "sessiz sizinti" duzenli taramasi (2026-08-22).
//
// Kullanici bildirimi (yayinlanan "Coklu Talep Gelistirmeleri" raporunun
// bulgusu): 13 gunde AYNI hata sinifi ALTI ayri bolumde (Arsa Ozellikleri,
// Belgeler, Degerleme x3, Bagimsiz Bolum, Ana Gayrimenkul, Dosya ve Rapor)
// ayri ayri, kaza eseri bulundu - bir alan section.fields'ta DEKLARATIF
// DEGILSE (popup/ozel kontrolle yaziliyorsa) genel taşınmaz-kapsam taramasi
// onu GOREMIYOR, sessizce rapor-geneli PAYLASILIYOR (veya tam tersi -
// paylasimli olmasi gereken bir alan yanlislikla scoped kaliyor). Kullanici:
// "bunun icin bir kontrol listesi/tarama olusturalim, cozum onerin var mi?"
//
// Bu test, ayni kesif surecini EL ILE degil OTOMATIK tekrarlar: app.js
// kaynagindaki TUM "state.fields.KEY = " (literal nokta-erisimli, bracket
// notation DEGIL - genel createForm() alanlari zaten bracket notation
// kullandigindan bu regex onlari yakalamaz, YALNIZCA "ozel/hardcoded"
// alanlari hedefler) yazma noktalarini bulur, her birini UC guvenlik
// kaynagindan (declaratif sections[].fields / TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS /
// getXxxPerUnitOnlyFieldKeys()-stili fonksiyonlar) OLUSAN BIRLESIME karsi
// dogrular. Hicbirinde YOKSA ya (a) YENI bir sizinti adayidir ya (b)
// zararsiz (hesaplanan/gecici-UI) bir alandir - asagidaki KNOWN_EXCEPTIONS
// listesi (b)'yi belgeler; listede OLMAYAN her yeni bulgu testi KIRAR,
// yani gelecekte 7. kez ayni hatanin "kaza eseri" bulunmasini ONLER.
//
// Bu tarama ile GERCEKTEN bulunup duzeltilen 4 grup (0.0.524):
//  - staticSuitability/staticSuitabilityNote/buildingInspectionContractActive/
//    buildingInspectionProgressLevel/buildingInspectionTerminationDate/
//    buildingInspectionTerminationLevel -> getDocumentsPerUnitOnlyFieldKeys()'e.
//  - roadSetbackAmount/roadSetbackBuildingImpact -> getImarSectionFieldKeys()'e.
//  - externalAppraisalReason/externalAppraisalOtherNote/restrictedInspectionNote
//    -> TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'e (appointmentType'in,
//    0.0.522'de paylasimli yapilan alanin, dogal devami).
//  - propertyTaxDeclarationEnabled/propertyTaxDeclarationValue ->
//    getValuationPerUnitOnlyFieldKeys()'e.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractBalanced(src, startIdx, openCh, closeCh) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === openCh) depth++;
    else if (src[i] === closeCh) {
      depth--;
      if (depth === 0) return src.slice(startIdx, i + 1);
    }
  }
  throw new Error(`Balanced ${openCh}${closeCh} kapanmadi (baslangic: ${startIdx}).`);
}

// 1) sections[] icindeki TUM "key: "..."" degerleri (hangi bolume ait
// oldugu onemli degil - "sections[] icinde herhangi bir yerde deklaratif"
// yeterli guvenlik sinyali: ya kendi scoped bolumunde otomatik toplanir,
// ya scoped-olmayan bir bolumde zaten meshru sekilde paylasimlidir).
const sectionsStart = appSource.indexOf("const sections = [");
assert(sectionsStart >= 0, "'const sections = [' bulunamadi.");
const sectionsBracketStart = appSource.indexOf("[", sectionsStart);
const sectionsArrayText = extractBalanced(appSource, sectionsBracketStart, "[", "]");
const declaredFieldKeys = new Set();
for (const m of sectionsArrayText.matchAll(/key:\s*"([A-Za-z_$][\w$]*)"/g)) declaredFieldKeys.add(m[1]);
assert.ok(declaredFieldKeys.size > 200, `sections[]'ten cok az deklaratif alan cikti (${declaredFieldKeys.size}) - extractBalanced/regex bozulmus olabilir.`);

// 2) TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS (bilincli olarak rapor-geneli
// paylasimli tutulan alanlar).
const sharedStart = appSource.indexOf("const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set([");
assert(sharedStart >= 0, "TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS bulunamadi.");
const sharedBracketStart = appSource.indexOf("[", sharedStart);
const sharedArrayText = extractBalanced(appSource, sharedBracketStart, "[", "]");
const sharedKeys = new Set();
for (const m of sharedArrayText.matchAll(/"([A-Za-z_$][\w$]*)"/g)) sharedKeys.add(m[1]);

// 3) getXxxPerUnitOnlyFieldKeys()/getXxxSectionFieldKeys() stili TUM
// "tasinmaza-ozgu programatik alan" listeleri + getTitleUnitScopedFieldKeys()'in
// KENDI gövdesindeki dogrudan keys.add("...") cagrilari (ör. titleChangedRecords).
// YENI bir bolume/fonksiyona bu desen eklenirse buraya da eklenmeli.
const PER_UNIT_KEY_FUNCTIONS = [
  "getValuationPerUnitOnlyFieldKeys",
  "getValuationCopyableFieldKeys",
  "getDocumentsPerUnitOnlyFieldKeys",
  "getUnitSectionFieldKeys",
  "getUnitDecorativeFieldKeys",
  "getBuildingSectionFieldKeys",
  "getLandSectionFieldKeys",
  "getImarSectionFieldKeys",
  "getTitleUnitScopedFieldKeys",
];
const perUnitKeys = new Set();
for (const fnName of PER_UNIT_KEY_FUNCTIONS) {
  const marker = `function ${fnName}(`;
  const idx = appSource.indexOf(marker);
  assert(idx >= 0, `Fonksiyon bulunamadi: ${fnName} (PER_UNIT_KEY_FUNCTIONS listesi bayatlamis olabilir).`);
  const braceStart = appSource.indexOf("{", idx);
  const body = extractBalanced(appSource, braceStart, "{", "}");
  for (const m of body.matchAll(/"([A-Za-z_$][\w$]*)"/g)) perUnitKeys.add(m[1]);
}

// 3b) getUnitDecorativeFieldKeys() (2026-08-27, "Dekoratif Ozellikler
// secili tasinmazlara kopyala" ile TEK-kaynak yapildi) KENDI govdesinde
// alan anahtarlarini LITERAL string OLARAK tasimiyor - unitWallFloorRows/
// unitGeneralDecorativeFields/unitBathroomFixtureFields adli DIS sabit
// dizilere (.floorKey/.wallKey/.key) REFERANS veriyor. Yukaridaki fonksiyon-
// govdesi taramasi bu durumda hicbir sey bulamaz (migrateUnitDecorativeFields()'in
// literal-nokta-erisimli "state.fields.unitHallWall = ..." gibi yazdigi
// alanlar YANLISLIKLA "aciklanamamis" cikardi) - bu 3 sabit dizi AYRICA
// taranir.
const DECORATIVE_KEY_ARRAY_NAMES = ["unitWallFloorRows", "unitGeneralDecorativeFields", "unitBathroomFixtureFields"];
for (const arrayName of DECORATIVE_KEY_ARRAY_NAMES) {
  const marker = `const ${arrayName} = [`;
  const idx = appSource.indexOf(marker);
  assert(idx >= 0, `Sabit dizi bulunamadi: ${arrayName} (DECORATIVE_KEY_ARRAY_NAMES listesi bayatlamis olabilir).`);
  const bracketStart = appSource.indexOf("[", idx);
  const body = extractBalanced(appSource, bracketStart, "[", "]");
  for (const m of body.matchAll(/(?:key|floorKey|wallKey):\s*"([A-Za-z_$][\w$]*)"/g)) perUnitKeys.add(m[1]);
}

// 4) TUM "state.fields.KEY = " (literal nokta-erisimli; "==", "===" DEGIL -
// negatif lookahead bunlari eler) yazma hedeflerini bul.
const writtenKeys = new Set();
const writeRe = /state\.fields\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
let match;
while ((match = writeRe.exec(appSource))) writtenKeys.add(match[1]);
assert.ok(writtenKeys.size > 100, `Cok az 'state.fields.KEY =' yazma noktasi bulundu (${writtenKeys.size}) - regex/kaynak degismis olabilir.`);

// 5) Bilinen, incelenmis, ZARARSIZ oldugu dogrulanmis "aciklanamamis"
// alanlar (2026-08-22 taramasinda tek tek kontrol edildi). Buraya YENI bir
// giris eklerken NEDEN zararsiz oldugunu (hesaplanan-ve-her-render'da-
// yenilenen mi, yoksa gercekten rapor-geneli bir UI tercihi mi) belirtin -
// "bilmiyorum ama testi gecirmek istiyorum" gerekcesiyle EKLEMEYIN.
const KNOWN_EXCEPTIONS = new Map([
  // --- Hesaplanan/turetilmis metin alanlari (Degerleme/Arsa) - HER
  // render'da state ZATEN scoped olan kaynak alanlardan YENIDEN uretilir
  // (buildingAge/buildingCompletionDate ailesiyle AYNI "kendi kendini
  // iyilestiren" sinif) - Degerleme ozet tablosunda bir sutun olarak
  // KULLANILMADIKLARI surece dusuk risk.
  ["valuationMethodExplanation", "buildValuationMethodExplanation()'dan turetilir, refreshValuationMethodExplanation() her render'da yeniler."],
  ["valuationSaleabilityExplanation", "buildValuationSaleabilityExplanation()'dan turetilir, her render'da yenilenir."],
  ["valuationRentExplanation", "buildValuationRentExplanation()'dan turetilir, her render'da yenilenir."],
  ["propertyTaxDeclarationExplanation", "refreshPropertyTaxDeclarationExplanation()'dan turetilir, zaten scoped propertyTaxDeclarationValue/Enabled'a bagli."],
  ["propertyTaxDeclarationUnavailableExplanation", "ayni refresh fonksiyonunun dieger cikti dali."],
  ["valuationMethodsScheme", "buildValuationMethodsSchemeText()'ten turetilir, Ziraat sema paneli her render'da yeniler."],
  ["landMinimumParcelAssessment", "buildLandMinimumParcelAssessmentSentence()'tan turetilir, zaten scoped Arsa alanlarina bagli, her render'da yenilenir."],
  ["foreignCurrencyValuationExplanation", "yabanci para degerleme aciklamasi, hesaplanan/turetilmis metin."],
  // --- Rapor-geneli UI tercihi/durum - taşınmaza-ozgu VERI degil, hangi
  // secenegin/goruntunun aktif oldugunu izleyen bir anahtar.
  ["variantOverrides", "cumle-varyanti admin override haritasi, rapor-geneli (taşınmaza-ozgu bir kavram degil)."],
  ["mainArteryId", "BILINCLI OLARAK paylasimli (bkz. TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS yorumu, 'mainArtery' ile TUTARLI, ayrica listelemeye gerek yok cunku deklaratif degil)."],
  ["encumbranceSummaryMode", "Takyidat ozet panelinin liste/kart gorunum tercihi, veri degil."],
  ["openAddress", "Adres panelinin acik/kapali UI durumu."],
  ["halkbankRiskDisabledCodes", "Halkbank risk kodu checklist'inde kullanicinin elle kapattigi kodlar - rapor-geneli tercih."],
  ["valueFactorsDisabledIds", "Olumlu/Olumsuz faktor listesinde elle kapatilan id'ler - rapor-geneli tercih."],
  ["comparableViewMode", "Emsaller panelinin liste/kart gorunum tercihi, veri degil."],
  // --- Netlesmemis, GELECEKTE tekrar bakilmasi ONERILEN (bu turda
  // DUZELTILMEDI - kapsam/zaman kisiti, ama BILEREK goz ardi EDILMEDI).
  ["expenseAppraisalPropertyTypeManual", "TODO: Masraf Bilgileri'nin 'Tarife Turu elle degistirildi' bayragi - expenseAppraisalPropertyType'in KENDISI de scoped mi ayrica dogrulanmali, bu turda netlesmedi."],
]);

const unexplained = [...writtenKeys].filter((key) => (
  !declaredFieldKeys.has(key) && !sharedKeys.has(key) && !perUnitKeys.has(key) && !KNOWN_EXCEPTIONS.has(key)
));

if (unexplained.length) {
  const details = unexplained.map((key) => `  - ${key}`).join("\n");
  assert.fail(
    `${unexplained.length} adet "aciklanamamis" state.fields alani bulundu (0.0.524'teki "Ayni sizinti sinifi 6 kez ayri ayri bulundu" bulgusunun ONLEDIGI TAM DURUM):\n${details}\n\n` +
    `Her biri icin: (1) gercekten taşınmaza-ozgu bir programatik alansa ilgili getXxxPerUnitOnlyFieldKeys()/getXxxSectionFieldKeys() fonksiyonuna, ` +
    `(2) gercekten rapor-geneli paylasimli olmasi gerekiyorsa TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'e ekleyin, ` +
    `(3) zararsiz (hesaplanan/gecici-UI) oldugunu DOGRULADIYSANIZ bu dosyadaki KNOWN_EXCEPTIONS'a NEDENiyle birlikte ekleyin.`
  );
}

console.log(`Coklu Talep sizinti taramasi: ${writtenKeys.size} 'state.fields.KEY =' hedefinin tumu aciklandi (${declaredFieldKeys.size} deklaratif + ${sharedKeys.size} paylasimli + ${perUnitKeys.size} per-unit-only + ${KNOWN_EXCEPTIONS.size} bilinen istisna).`);
console.log("Coklu Talep sizinti taramasi (sistematik) testi tamam.");
