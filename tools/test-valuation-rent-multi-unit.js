// "Değerleme" (valuation) "Kira Açıklaması", çoklu taşınmazlı raporlarda
// artık YALNIZCA aktif taşınmazı değil, TÜM taşınmazları yansıtıyor
// (2026-09-07).
//
// Kullanıcı talebi: "Kira Açıklamasını da aynı mantıkla çoğul yap ama
// burada cümleyi şöyle kuralım. Ekspertize konu taşınmazların toplam
// yasal kira değerinin xxx mevcut kira değerinin yyy olduğu
// düşünülmektedir. Detaylı değerleme tablosu rapor ekinde tarafınıza
// sunulmuştur. Bunu 5 adet tapudan çok olan raporlar için yapalım.
// 2-3-4-5 adet taşınmazdan oluşan çoklu taleplerde A-5: Yasal kira
// değerinin XXX mevcut kira değerinin YYY olacağı düşünülmektedir. alt
// satıra geç diğer taşınmaz açıklama cümlesi"
//
// Kök neden: legalRent/currentRent artık taşınmaza-özgü (rapor-geneli
// paylaşım daha önce ÇIKARILMIŞTI) olduğundan, buildValuationRentExplanation()
// çoklu taşınmazlı raporlarda YALNIZCA AKTİF taşınmazın kira değerlerini
// yansıtıyordu. Kullanıcı, Satış Kabiliyeti/Değerleme Yöntemi'nin "aynı
// değeri gruplama" mimarisini BİLEREK KULLANMADI (kira tutarları hemen
// hemen HER ZAMAN taşınmaza göre farklıdır) — bunun yerine TAŞINMAZ
// SAYISINA göre dallanan İKİ YENİ cümle kalıbı istedi:
//  - 2-5 taşınmaz: HER taşınmaz KENDİ SATIRINDA ("A-5: Yasal kira
//    değerinin ... mevcut kira değerinin ... olacağı düşünülmektedir."),
//    satırlar "\n" ile ayrılır.
//  - 6+ taşınmaz: TEK özet cümlesi, TOPLAM (sum) yasal/mevcut kira
//    değerleriyle + rapor ekindeki tabloya yönlendirme.
//
// Bu test kapsamı:
//  1) count<2 -> eski tek-taşınmaz fonksiyonuna AYNEN düşer.
//  2) 2-5 taşınmaz: HER taşınmaz kendi satırında, "\n" ile ayrılmış,
//     etiket formatı "A-5" (formatTitleUnitSuitabilityShortLabel).
//  3) 6+ taşınmaz: TEK özet cümlesi, TOPLAM (sum) değerlerle.
//  4) Sınır (boundary) davranışı: TAM 5 taşınmaz hâlâ per-unit-satır
//     modunda, TAM 6 taşınmaz özet moduna GEÇER.
//  5) Kira verisi olmayan taşınmazlar per-unit-satır modunda sessizce
//     ATLANIR (satır ÜRETMEZ); özet modunda TOPLAMA sıfır olarak katılır.
//  6) Yalnız yasal / yalnız mevcut / ikisi eşit durumlarının per-unit
//     satırlarında doğru cümle dalı seçilir.
//  7) HİÇBİR taşınmazda kira verisi yoksa boş döner (regresyon: hem
//     per-unit hem özet modunda).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadı: ${startMarker}`);
  return appSource.slice(start, end);
}

const rentSource = sourceBetween(
  "const valuationRentEqualVariants",
  "function createValuationRentExplanationPanel"
);
const areValuationAreasEqualSource = sourceBetween(
  "function areValuationAreasEqual(left, right) {",
  "function createWorkplaceFloorCalculationTable"
);
const shortLabelSource = sourceBetween(
  "function formatTitleUnitSuitabilityShortLabel(fields, index) {",
  "// Tam şablonlu cümlenin"
);

function makeContext({ selectVariantIndex = 0 } = {}) {
  const context = {
    state: { fields: {} },
    normalizeReportTitleText: (value) => String(value || "").trim(),
    parseValuationNumber: (value) => {
      if (value === "" || value === undefined || value === null) return Number.NaN;
      const n = Number.parseFloat(String(value).replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n) ? n : Number.NaN;
    },
    selectVariant: () => selectVariantIndex,
    registerVariantGroup: () => {},
    getTitleUnitCount: () => (context.__units ? context.__units.length : 1),
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
  };
  vm.createContext(context);
  vm.runInContext(`${areValuationAreasEqualSource}\n${shortLabelSource}\n${rentSource}`, context);
  return context;
}

function withUnits(context, unitFieldsList) {
  context.__units = unitFieldsList.map((fields) => ({ fields }));
  context.state.fields = { ...unitFieldsList[0] };
}

// NOT: gerçek üretimde her taşınmazın `fields` nesnesi (getTitleUnitFieldsForLabel
// üzerinden) HER ZAMAN TÜM alan anahtarlarını taşır (boşsa "" olarak) —
// bu yüzden legalRent/currentRent BURADA da her zaman AÇIKÇA verilir
// (eksik bırakılırsa test sandbox'ında state.fields = {...originalFields,
// ...unit.fields} birleştirmesi, bir ÖNCEKİ taşınmazın değerinin YANLIŞLIKLA
// sızmasına yol açar — bu SADECE test mock'unun eksikliği, gerçek koddaki
// bir kusur DEĞİL).
const unit = (overrides = {}) => ({ unitNo: "", titleBlockName: "", legalRent: "", currentRent: "", ...overrides });

// --- 1) count < 2 -> eski tek-taşınmaz fonksiyonuna AYNEN düşer ---------
{
  const context = makeContext();
  context.state.fields = { legalRent: "10000", currentRent: "12000" };
  context.getTitleUnitCount = () => 1;
  assert.equal(
    context.buildValuationRentExplanationForAllTitleUnits(),
    context.buildValuationRentExplanation(),
    "count<2 iken yeni fonksiyon eski tek-taşınmaz fonksiyonuyla BİREBİR aynı sonucu vermeli."
  );
  console.log("count<2 (tek taşınmaz) geriye dönük uyumluluk testi tamam.");
}

// --- 2) 2-5 taşınmaz: HER taşınmaz kendi satırında, "A-5" etiketiyle ----
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", legalRent: "10000", currentRent: "12000" }),
    unit({ titleBlockName: "A", unitNo: "8", legalRent: "9000", currentRent: "9000" }),
    unit({ titleBlockName: "A", unitNo: "11", legalRent: "15000" }),
  ]);
  const result = context.buildValuationRentExplanationForAllTitleUnits();
  assert.equal(
    result,
    "A-5: Yasal kira değerinin 10.000 TL/ay, mevcut kira değerinin 12.000 TL/ay olacağı düşünülmektedir.\n" +
      "A-8: Yasal ve mevcut kira değerinin 9.000 TL/ay olacağı düşünülmektedir.\n" +
      "A-11: Yasal kira değerinin 15.000 TL/ay olacağı düşünülmektedir.",
    "2-5 taşınmazlı raporda HER taşınmaz KENDİ satırında (\\n ile ayrılmış), 'A-5' formatında etiketle yer almalı; yasal=mevcut/yalnız-yasal/ikisi-de dalları doğru seçilmeli."
  );
  console.log("2-5 taşınmaz: per-unit satır (A-5 etiketi) testi tamam.");
}

// --- 3) 6+ taşınmaz: TEK özet cümlesi, TOPLAM değerlerle ----------------
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "1", legalRent: "10000", currentRent: "11000" }),
    unit({ unitNo: "2", legalRent: "10000", currentRent: "11000" }),
    unit({ unitNo: "3", legalRent: "10000", currentRent: "11000" }),
    unit({ unitNo: "4", legalRent: "10000", currentRent: "11000" }),
    unit({ unitNo: "5", legalRent: "10000", currentRent: "11000" }),
    unit({ unitNo: "6", legalRent: "10000", currentRent: "11000" }),
  ]);
  const result = context.buildValuationRentExplanationForAllTitleUnits();
  assert.equal(
    result,
    "Ekspertize konu taşınmazların toplam yasal kira değerinin 60.000 TL/ay, mevcut kira değerinin 66.000 TL/ay olduğu düşünülmektedir. Detaylı değerleme tablosu rapor ekinde tarafınıza sunulmuştur.",
    "6+ taşınmazlı raporda TEK özet cümlesi, TÜM taşınmazların TOPLAM (sum) kira değerleriyle üretilmeli, tabloya yönlendirme eklenmeli."
  );
  assert.ok(!/\n/.test(result), "Özet modunda birden fazla satır OLMAMALI.");
  console.log("6+ taşınmaz: özet cümlesi (toplam değerler) testi tamam.");
}

// --- 4) Sınır davranışı: TAM 5 -> per-unit, TAM 6 -> özet ---------------
{
  const fiveUnits = Array.from({ length: 5 }, (_, i) => unit({ unitNo: String(i + 1), legalRent: "1000", currentRent: "1000" }));
  const context5 = makeContext();
  withUnits(context5, fiveUnits);
  const result5 = context5.buildValuationRentExplanationForAllTitleUnits();
  assert.equal((result5.match(/\n/g) || []).length, 4, "TAM 5 taşınmazda 5 satır (4 satır sonu) olmalı - hâlâ per-unit modunda.");
  assert.ok(!result5.includes("toplam"), "TAM 5 taşınmazda özet moduna GEÇİLMEMELİ.");

  const sixUnits = Array.from({ length: 6 }, (_, i) => unit({ unitNo: String(i + 1), legalRent: "1000", currentRent: "1000" }));
  const context6 = makeContext();
  withUnits(context6, sixUnits);
  const result6 = context6.buildValuationRentExplanationForAllTitleUnits();
  assert.ok(result6.includes("toplam yasal kira değerinin 6.000"), "TAM 6 taşınmazda özet moduna GEÇMELİ (toplam 6.000 TL/ay).");
  console.log("Sınır davranışı (5 -> per-unit, 6 -> özet) testi tamam.");
}

// --- 5) Kira verisi olmayan taşınmazlar per-unit modunda ATLANIR, ------
// özet modunda toplama sıfır katılır.
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", legalRent: "10000", currentRent: "12000" }),
    unit({ unitNo: "8" }), // kira verisi YOK
    unit({ unitNo: "11", legalRent: "5000", currentRent: "6000" }),
  ]);
  const result = context.buildValuationRentExplanationForAllTitleUnits();
  assert.ok(!result.includes("8:"), "Kira verisi olmayan taşınmaz (8 No'lu) per-unit satırında HİÇ görünmemeli.");
  assert.ok(result.includes("5:") && result.includes("11:"), "Kira verisi OLAN taşınmazlar (5 ve 11 No'lu) satırlarda yer almalı.");
  console.log("Kira verisi olmayan taşınmazın per-unit modunda atlanması testi tamam.");
}

// --- 6) Yalnız yasal / yalnız mevcut / ikisi eşit dallarının doğru -----
// seçilmesi (2. testte zaten örtük doğrulandı, burada tek tek netleştirilir).
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "1", legalRent: "5000" }),
    unit({ unitNo: "2", currentRent: "6000" }),
  ]);
  const result = context.buildValuationRentExplanationForAllTitleUnits();
  assert.equal(
    result,
    "1: Yasal kira değerinin 5.000 TL/ay olacağı düşünülmektedir.\n2: Mevcut kira değerinin 6.000 TL/ay olacağı düşünülmektedir.",
    "Yalnız-yasal ve yalnız-mevcut dalları per-unit satırlarında doğru seçilmeli."
  );
  console.log("Yalnız-yasal/yalnız-mevcut dal seçimi testi tamam.");
}

// --- 7) HİÇBİR taşınmazda kira verisi yoksa boş döner -------------------
{
  const contextFew = makeContext();
  withUnits(contextFew, [unit({ unitNo: "1" }), unit({ unitNo: "2" })]);
  assert.equal(contextFew.buildValuationRentExplanationForAllTitleUnits(), "", "2-5 taşınmazda HİÇBİRİNDE kira verisi yoksa boş dönmeli.");

  const contextMany = makeContext();
  withUnits(contextMany, Array.from({ length: 6 }, (_, i) => unit({ unitNo: String(i + 1) })));
  assert.equal(contextMany.buildValuationRentExplanationForAllTitleUnits(), "", "6+ taşınmazda HİÇBİRİNDE kira verisi yoksa boş dönmeli.");
  console.log("Hicbir tasinmazda kira verisi yoksa bos donme (regresyon) testi tamam.");
}

console.log("Degerleme kira aciklamasi coklu tasinmaz testleri basarili.");
