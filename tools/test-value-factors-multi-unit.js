// "Değeri Etkileyen Faktörler", çoklu taşınmazlı raporlarda "Taşınmaz
// Bazında" kategorideki faktörler için artık YALNIZCA aktif taşınmazı
// değil, TÜM taşınmazları yansıtıyor (2026-09-07).
//
// Kullanıcı talebi: "değere etki eden faktörlere geçelim bunlarda bazı
// faktörler ana yapı ile ilgili bazı faktörler bulunulan bölge ile ilgili
// bazı faktörler ise taşınmaz bazında. bunları önce gruplandırarak
// listele" — sohbette önerilen 3'lü sınıflandırma (Ana Yapı/Bölge/Taşınmaz
// Bazında, ID önekine göre: building-/document- | location- |
// title-/land-/unit-/planning-/valuation-) ONAYLANDI, ardından: "uygundur
// buna göre koda geç taşınmaz bazında olanların başına yine gruplandırma
// mantığı ile yap. Örnek A-5 ve A-8 Nolu taşınmazların ara katta yer
// alması gibi."
//
// Kök neden: value-factors-rules.js'in calculateValueFactors() fonksiyonu
// TEK bir { fields, tables } girdisinden hesaplama yapar — çoklu
// taşınmazlı raporlarda bu YALNIZCA aktif taşınmazı yansıtıyordu; diğer
// taşınmazların (farklı olabilecek) "taşınmaz bazında" özellikleri (kat
// konumu, cephe, manzara, malzeme kalitesi, arsa/parsel özellikleri, satış
// kabiliyeti vb.) TAMAMEN GÖRMEZDEN geliniyordu.
//
// Bu test kapsamı:
//  1) count<2 -> davranış DEĞİŞMEDİ (representative sonuç AYNEN döner).
//  2) Ana Yapı/Bölge (+ manuel eklenen) kalemler ÇOKLU raporda DAHİ
//     yalnızca TEK SEFER (representative/aktif taşınmazdan) hesaplanır,
//     "Taşınmaz Bazında" kalemlerle KARIŞTIRILMAZ.
//  3) AYNI "taşınmaz bazında" faktörü üreten 2+ taşınmaz TEK, atıflı
//     satırda birleşir — kullanıcının BİZZAT verdiği örnekle BİREBİR
//     eşleşir ("A-5 ve A-8 No'lu taşınmazların ara katta yer alıyor
//     olması").
//  4) YALNIZCA 1 taşınmazda tetiklenen bir faktör TEKİL atıfla (ör. "A-5
//     No'lu taşınmazın ...") görünür.
//  5) "Taşınmazın " ile BAŞLAYAN faktör metinlerinde (manzara gibi) önek
//     atıf öznesiyle DEĞİŞTİRİLİR, metnin GERİ KALANI KORUNUR.
//  6) manualPositive/manualNegative kalemleri HER taşınmaz turunda TEKRAR
//     EKLENMEZ (yalnızca TEK KEZ, representative sonuçtan gelir).
//  7) Bir taşınmazda HİÇ tetiklenmeyen bir faktör o taşınmaz İÇİN hiç
//     satır üretmez (yalnızca GERÇEKTEN tetiklenen taşınmazlar atfa dahil
//     olur).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ValueFactorsRules = require("../src/value-factors/value-factors-rules");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadı: ${startMarker}`);
  return appSource.slice(start, end);
}

const valueFactorsMultiUnitSource = sourceBetween(
  "function isPerUnitValueFactorId(id) {",
  "function createValueFactorsPanel"
);
const joinTurkishListSource = sourceBetween(
  "function joinTurkishList(items = []) {",
  "function fillWorkplaceFloorCalculationTableBody"
);
const shortLabelSource = sourceBetween(
  "function formatTitleUnitSuitabilityShortLabel(fields, index) {",
  "// Tam şablonlu cümlenin"
);
const lowercaseFirstLetterTrSource = sourceBetween(
  "function lowercaseFirstLetterTr(text) {",
  "// Türkçe \"bildirme eki\""
);

function makeContext() {
  const context = {
    globalThis: { ValueFactorsRules },
    state: { fields: {} },
    normalizeReportDescriptionText: (value) => String(value || "").trim().replace(/\s+/g, " "),
    getTitleUnitCount: () => (context.__units ? context.__units.length : 1),
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
  };
  vm.createContext(context);
  vm.runInContext(`${joinTurkishListSource}\n${shortLabelSource}\n${lowercaseFirstLetterTrSource}\n${valueFactorsMultiUnitSource}`, context);
  return context;
}

function withUnits(context, unitFieldsList) {
  context.__units = unitFieldsList.map((fields) => ({ fields, tables: {} }));
  context.state.fields = { ...unitFieldsList[0] };
}

// unit(): "unit-middle-floor" (Ara katta) tetiklenmesi için buildingFloorCounts.normal
// paylaşımlı (aktif/orijinal fields'tan "sızan") bir alan olduğundan burada
// ELLE verilmiyor — floor faktörleri tables.unitFloors + fields.elevator'a bağlı.
// Testte sade tutmak için doğrudan "unit-view-positive"/"unit-material-quality-high"
// gibi tables'a bağımlı OLMAYAN, saf `fields`-tabanlı kurallar kullanılıyor.
// NOT: gerçek üretimde her taşınmazın `fields` nesnesi (getTitleUnitFieldsForLabel
// üzerinden) HER ZAMAN TÜM alan anahtarlarını taşır (boşsa "" olarak) —
// bu yüzden test kullanılan alanlar BURADA da her zaman AÇIKÇA boş
// verilir (eksik bırakılırsa test sandbox'ında state.fields =
// {...originalFields, ...unit.fields} birleştirmesi bir ÖNCEKİ
// taşınmazın değerinin YANLIŞLIKLA sızmasına yol açar — bu SADECE test
// mock'unun eksikliği, gerçek koddaki bir kusur DEĞİL).
const unit = (overrides = {}) => ({
  unitNo: "",
  titleBlockName: "",
  elevator: "",
  infrastructureLevel: "",
  unitMaterialQuality: "",
  unitViewStatus: "",
  ...overrides,
});

function idsOf(items) {
  return items.map((item) => item.id);
}

// --- 1) count < 2 -> representative sonuç AYNEN döner -------------------
{
  const context = makeContext();
  context.state.fields = { unitViewStatus: "Geniş Deniz Manzarası" };
  context.getTitleUnitCount = () => 1;
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const direct = ValueFactorsRules.calculateValueFactors(baseInput);
  const wrapped = context.calculateValueFactorsForAllTitleUnits(baseInput);
  assert.deepEqual(idsOf(wrapped.positive), idsOf(direct.positive), "count<2 iken pozitif liste DEĞİŞMEMELİ.");
  assert.deepEqual(wrapped.positive.map((i) => i.text), direct.positive.map((i) => i.text), "count<2 iken metinler DEĞİŞMEMELİ (atıf eklenmemeli).");
  console.log("count<2 (tek taşınmaz) geriye dönük uyumluluk testi tamam.");
}

// --- 2) Ana Yapı/Bölge + manuel kalemler TEK SEFER (representative'ten) -
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", elevator: "Yok", infrastructureLevel: "iyi" }),
    unit({ unitNo: "8", elevator: "Yok", infrastructureLevel: "iyi" }),
  ]);
  const baseInput = {
    fields: context.state.fields,
    tables: {},
    disabledIds: [],
    manualPositive: [{ text: "Ek olumlu özellik" }],
    manualNegative: [],
  };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const manualEntries = result.positive.filter((item) => item.source === "manual");
  assert.equal(manualEntries.length, 1, "Manuel kalem HER taşınmaz turunda TEKRAR EKLENMEMELİ, TEK KEZ görünmeli.");
  const infraEntries = result.positive.filter((item) => item.id === "location-infrastructure-good");
  assert.equal(infraEntries.length, 1, "Bölge faktörü (paylaşımlı) TEK KEZ görünmeli, taşınmaz sayısı kadar TEKRARLANMAMALI.");
  assert.ok(!infraEntries[0].text.includes("No'lu"), "Bölge faktörüne ATIF EKLENMEMELİ (taşınmaza-özgü değil).");
  const elevatorEntries = result.negative.filter((item) => item.id === "building-no-elevator");
  assert.equal(elevatorEntries.length, 1, "Ana Yapı faktörü (paylaşımlı) TEK KEZ görünmeli.");
  console.log("Ana Yapı/Bölge/manuel kalemlerin tek sefer hesaplanması testi tamam.");
}

// --- 3) KULLANICI ÖRNEĞİ: AYNI taşınmaz-bazında faktörü üreten 2 --------
// taşınmaz TEK atıflı satırda birleşir.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "8", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "11", unitMaterialQuality: "Vasat" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const qualityEntries = result.positive.filter((item) => item.id === "unit-material-quality-high");
  assert.equal(qualityEntries.length, 1, "AYNI metni üreten 2 taşınmaz TEK satırda birleşmeli.");
  assert.equal(
    qualityEntries[0].text,
    "A-5 ve A-8 No'lu taşınmazların lüks sınıf iç malzeme kalitesine sahip olması",
    "Birleşik atıflı metin, kullanıcının verdiği kalıpla (etiketler + küçük harfe çevrilmiş devam) BİREBİR eşleşmeli."
  );
  console.log("Aynı faktörü üreten taşınmazların TEK atıflı satırda birleşmesi testi tamam.");
}

// --- 4) YALNIZCA 1 taşınmazda tetiklenen faktör TEKİL atıfla görünür ----
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "8", unitMaterialQuality: "Vasat" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const qualityEntries = result.positive.filter((item) => item.id === "unit-material-quality-high");
  assert.equal(qualityEntries.length, 1, "Yalnızca 1 taşınmazda tetiklenen faktör TEK satır üretmeli.");
  assert.equal(
    qualityEntries[0].text,
    "A-5 No'lu taşınmazın lüks sınıf iç malzeme kalitesine sahip olması",
    "Tekil atıf 'taşınmazın' (tekil genitif) formunda olmalı."
  );
  console.log("Yalnızca 1 taşınmazda tetiklenen faktörün tekil atıfla görünmesi testi tamam.");
}

// --- 5) "Taşınmazın " ile BAŞLAYAN metinlerde önek atıf öznesiyle -------
// DEĞİŞTİRİLİR (manzara örneği).
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitViewStatus: "Geniş Deniz Manzarası" }),
    unit({ titleBlockName: "A", unitNo: "8", unitViewStatus: "Geniş Deniz Manzarası" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const viewEntries = result.positive.filter((item) => item.id === "unit-view-positive");
  assert.equal(viewEntries.length, 1);
  assert.ok(viewEntries[0].text.startsWith("A-5 ve A-8 No'lu taşınmazların"), "'Taşınmazın ' öneki atıf öznesiyle DEĞİŞTİRİLMELİ.");
  assert.ok(!viewEntries[0].text.includes("Taşınmazın"), "Orijinal 'Taşınmazın' öneki metinde ARTIK GEÇMEMELİ.");
  assert.ok(viewEntries[0].text.endsWith("geniş deniz manzarasına sahip olması"), "Önekten SONRAKİ kısım (küçük harfle) KORUNMALI.");
  console.log("'Taşınmazın ' onekinin atif oznesiyle degistirilmesi testi tamam.");
}

// --- 6) Bir taşınmazda hiç tetiklenmeyen faktör o taşınmaz için hiç -----
// satır üretmez.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "8" }), // unitMaterialQuality YOK -> tetiklenmez
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const qualityEntries = result.positive.filter((item) => item.id === "unit-material-quality-high");
  assert.equal(qualityEntries.length, 1);
  assert.equal(qualityEntries[0].text, "A-5 No'lu taşınmazın lüks sınıf iç malzeme kalitesine sahip olması", "Yalnızca GERÇEKTEN tetiklenen taşınmaz (A-5) atfa dahil olmalı.");
  console.log("Tetiklenmeyen taşınmazın atfa dahil edilmemesi testi tamam.");
}

console.log("Deger etkileyen faktorler coklu tasinmaz (taşınmaz bazinda gruplama) testleri basarili.");
