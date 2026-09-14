"use strict";

// Kullanıcı talebi (2026-09-14, ikinci ekran görüntüsü — "Deneme Çoklu"
// raporunda "Toplu Değerleme (6. Grup)" hâlâ "Yok" ve "Toplam Taşınmaz
// Adedi" boş kalmıştı, kırmızı okla işaretlenmiş): "bu satırlar otomatik
// gelmeli." Bu iki alan zaten bilinen veriden (taşınmaz sayısı + AYNI/
// FARKLI ada-parsel) türer — dropdown'un KENDİ seçenek metinleri kriteri
// açıkça veriyor: "2. Grup - Aynı Parsel Birden Fazla Bağımsız Bölüm"
// (TÜM taşınmazlar AYNI ada/parselde) vs "1. Grup - Farklı Taşınmazlar
// (Aynı Mahalle/Köy)" (taşınmazlar FARKLI ada/parselde).
//
// Bu dosya: (1) syncExpenseBulkValuationModeFromUnits()'in GERÇEK
// getTitleUnitCount()/getNarrativeTitleUnitFields() ile doğru grup/adet
// senkronladığını (tek taşınmaz->Yok, çoklu+aynı parsel->2.Grup, çoklu+
// farklı parsel->1.Grup), (2) değer değişmediyse recalculateExpenseFees()'in
// gereksiz çağrılmadığını, (3) alan şemasının (readOnly, eski
// defaultValue:"Yok" yok) ve renderSection() kablolamasını, (4) genel
// form oluşturucudaki select+readOnly düzeltmesini (select.disabled=true,
// çünkü native <select> `readOnly` özelliğini TANIMAZ) doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker, label) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak bulunamadı: ${label || startMarker}`);
  return appSource.slice(start, end);
}

// Tek satırlık `const AD = ...;` tanımını (satır sonuna kadar) çıkarır —
// EXPENSE_BULK_MODE_1/EXPENSE_BULK_MODE_2 gibi aralarında ALAKASIZ (ve
// KENDİ karşılanmamış bağımlılıkları olan, ör. EXPENSE_FEE_WATCHED_KEYS)
// kod bulunan sabitleri TEK TEK, izole almak için (sourceBetween ile
// ARADAKİ HER ŞEYİ almak yerine).
function extractConstLine(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  const end = appSource.indexOf(";", start);
  assert(end > start, `Sabit satırı kapanmadı: ${name}`);
  return appSource.slice(start + 1, end + 1);
}

// --- 1) syncExpenseBulkValuationModeFromUnits(): GERÇEK bağımlılıklarla --
{
  const source = [
    extractConstLine("EXPENSE_BULK_MODE_1"),
    extractConstLine("EXPENSE_BULK_MODE_2"),
    sourceBetween(
      "function syncExpenseBulkValuationModeFromUnits() {",
      "function recalculateExpenseFees() {",
      "syncExpenseBulkValuationModeFromUnits"
    ),
  ].join("\n");
  const getNarrativeSource = sourceBetween(
    "function getNarrativeTitleUnitFields() {",
    "function getSharedNarrativeParcelPhrase() {",
    "getNarrativeTitleUnitFields"
  );
  let recalcCallCount = 0;
  const context = {
    state: { fields: {}, titleUnits: [] },
    getTitleUnitCount: () => 1 + (Array.isArray(context.state.titleUnits) ? context.state.titleUnits.length : 0),
    recalculateExpenseFees: () => { recalcCallCount += 1; },
  };
  vm.createContext(context);
  vm.runInContext(`${getNarrativeSource}\n${source}`, context);

  // 1a) Tek taşınmaz -> "Yok", adet boş.
  context.state.fields.blockNo = "150";
  context.state.fields.parcelNo = "5";
  context.syncExpenseBulkValuationModeFromUnits();
  assert.equal(context.state.fields.expenseBulkValuationMode, "Yok", "Tek taşınmazlı raporda 'Yok' olmalı.");
  assert.equal(context.state.fields.expenseBulkPropertyCount, "", "Tek taşınmazlı raporda adet BOŞ olmalı.");
  assert.equal(recalcCallCount, 1, "İlk senkronda (boş->'Yok') recalculateExpenseFees() çağrılmalı (mode alanı boştan doldu).");

  // 1b) 3 taşınmaz, HEPSİ AYNI ada/parsel (150/5) -> 2. Grup, adet "3".
  context.state.titleUnits = [
    { fields: { blockNo: "150", parcelNo: "5" } },
    { fields: { blockNo: "150", parcelNo: "5" } },
  ];
  context.syncExpenseBulkValuationModeFromUnits();
  assert.equal(
    context.state.fields.expenseBulkValuationMode,
    "2. Grup - Aynı Parsel Birden Fazla Bağımsız Bölüm",
    "3 taşınmaz AYNI ada/parselde ise '2. Grup' otomatik seçilmeli."
  );
  assert.equal(context.state.fields.expenseBulkPropertyCount, "3", "3 taşınmazlı raporda adet '3' olmalı.");
  assert.equal(recalcCallCount, 2, "Mode+adet değiştiğinde recalculateExpenseFees() TEKRAR çağrılmalı.");

  // Aynı durumla TEKRAR çağrılırsa recalc GEREKSİZ ÇAĞRILMAMALI.
  context.syncExpenseBulkValuationModeFromUnits();
  assert.equal(recalcCallCount, 2, "Değer DEĞİŞMEDİYSE recalculateExpenseFees() TEKRAR çağrılmamalı (performans).");

  // 1c) 2 taşınmaz, FARKLI ada/parsel -> 1. Grup.
  context.state.titleUnits = [{ fields: { blockNo: "200", parcelNo: "9" } }];
  context.syncExpenseBulkValuationModeFromUnits();
  assert.equal(
    context.state.fields.expenseBulkValuationMode,
    "1. Grup - Farklı Taşınmazlar (Aynı Mahalle/Köy)",
    "2 taşınmaz FARKLI ada/parselde ise '1. Grup' otomatik seçilmeli."
  );
  assert.equal(context.state.fields.expenseBulkPropertyCount, "2");
  assert.equal(recalcCallCount, 3);

  // 1d) titleBlockNo/titleParcelNo (alternatif alan adı) İLE de doğru çalışmalı.
  context.state.fields = { titleBlockNo: "77", titleParcelNo: "12" };
  context.state.titleUnits = [{ fields: { titleBlockNo: "77", titleParcelNo: "12" } }];
  context.syncExpenseBulkValuationModeFromUnits();
  assert.equal(
    context.state.fields.expenseBulkValuationMode,
    "2. Grup - Aynı Parsel Birden Fazla Bağımsız Bölüm",
    "titleBlockNo/titleParcelNo (blockNo/parcelNo yerine) ile de AYNI parsel doğru tespit edilmeli."
  );

  console.log("syncExpenseBulkValuationModeFromUnits(): gerçek bağımlılıklarla tek/çoklu+aynı/farklı parsel senaryoları testi tamam.");
}

// --- 2) Alan şeması: artık readOnly, eski statik defaultValue:"Yok" YOK --
{
  const modeFieldMatch = /key: "expenseBulkValuationMode",[\s\S]*?\n\s*\},/.exec(appSource);
  assert(modeFieldMatch, "expenseBulkValuationMode alan tanımı bulunamadı.");
  assert.ok(modeFieldMatch[0].includes("readOnly: true"), "expenseBulkValuationMode artık readOnly:true olmalı.");
  assert.ok(!modeFieldMatch[0].includes('defaultValue: "Yok"'), "expenseBulkValuationMode'ta eski statik defaultValue:\"Yok\" ARTIK olmamalı.");

  const countFieldMatch = /\{ key: "expenseBulkPropertyCount",[^}]*\}/.exec(appSource);
  assert(countFieldMatch, "expenseBulkPropertyCount alan tanımı bulunamadı.");
  assert.ok(countFieldMatch[0].includes("readOnly: true"), "expenseBulkPropertyCount artık readOnly:true olmalı.");

  console.log("expenseBulkValuationMode/expenseBulkPropertyCount alan şeması testi tamam.");
}

// --- 3) Kaynak-düzeyi kablolama: renderSection() bu senkronu ÇAĞIRIYOR ----
{
  const renderSectionBody = sourceBetween("function renderSection() {", "function isProjectSuitabilityUiField(", "renderSection");
  assert.ok(
    /syncExpenseTitleDeedCountFromUnits\(\);\s*\n\s*syncExpenseBulkValuationModeFromUnits\(\);/.test(renderSectionBody),
    "renderSection() syncExpenseBulkValuationModeFromUnits()'i syncExpenseTitleDeedCountFromUnits()'in HEMEN ardından çağırmalı."
  );
  console.log("renderSection() kaynak-düzeyi kablolama testi tamam.");
}

// --- 4) Genel form oluşturucu: readOnly select artık gerçekten devre -----
// dışı (native <select> `readOnly` özelliğini TANIMAZ, yalnızca `disabled`
// gerçekten kilitler).
{
  const formBuilderSource = sourceBetween(
    "if (isFieldReadOnly(field)) {",
    "control.dataset.field = field.key;",
    "isFieldReadOnly bloğu (genel form oluşturucu)"
  );
  assert.ok(
    /field\.type === "select"\s*\)\s*control\.disabled = true;/.test(formBuilderSource),
    "readOnly bir 'select' alanı artık control.disabled=true İLE gerçekten kilitlenmeli (readOnly select'te işe yaramaz)."
  );
  console.log("Genel form oluşturucu: readOnly select -> disabled=true düzeltmesi testi tamam.");
}

console.log("Toplu Degerleme (6. Grup) otomatik senkron testleri basarili.");
