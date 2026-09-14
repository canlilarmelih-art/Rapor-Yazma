"use strict";

// Kullanıcı talebi (2026-09-14): "MASRAF bilgilerinde tapu adedi zaten
// yüklediğim takbisten belli yada talebin aynı ada parsel mi farklı ada
// parsel mi talep olduğu belli şu an bunları kullanıcı manuel giriyor
// bunlar otomatik bir şekilde girilmeli." AskUserQuestion ile netleştirildi:
// "Tapu Adedi" raporda KAÇ taşınmaz/bağımsız bölüm varsa (getTitleUnitCount())
// o kadardır — AYNI ada/parselde olsalar bile HER bağımsız bölümün kendi
// tapu kaydı/senedi vardır, her biri AYRI sayılır.
//
// Bu dosya: (1) yeni syncExpenseTitleDeedCountFromUnits()'in GERÇEK
// getTitleUnitCount() ile doğru senkronladığını, (2) değer GERÇEKTEN
// değişmediyse recalculateExpenseFees()'i GEREKSİZ ÇAĞIRMADIĞINI
// (performans/regresyon), (3) alan artık readOnly (elle giriş devre
// dışı, tek taşınmazlı varsayılan "1" YERİNE), (4) renderSection()'ın bu
// senkronu KOŞULSUZ (syncMultiTitleUnitOwnershipType İLE AYNI desende)
// çağırdığını kaynak-düzeyinde doğrular.

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

// --- 1) syncExpenseTitleDeedCountFromUnits(): GERÇEK getTitleUnitCount() --
// ile doğru senkron + gereksiz recalculateExpenseFees() çağrısı YOK.
{
  const source = sourceBetween(
    "function syncExpenseTitleDeedCountFromUnits() {",
    "function recalculateExpenseFees() {",
    "syncExpenseTitleDeedCountFromUnits"
  );
  let recalcCallCount = 0;
  const context = {
    state: { fields: {}, titleUnits: [] },
    getTitleUnitCount: () => 1 + (Array.isArray(context.state.titleUnits) ? context.state.titleUnits.length : 0),
    recalculateExpenseFees: () => { recalcCallCount += 1; },
  };
  vm.createContext(context);
  vm.runInContext(source, context);

  // Tek taşınmazlı (titleUnits boş) -> "1".
  context.syncExpenseTitleDeedCountFromUnits();
  assert.equal(context.state.fields.expenseTitleDeedCount, "1", "Tek taşınmazlı raporda Tapu Adedi '1' olmalı.");
  assert.equal(recalcCallCount, 1, "İLK senkronda (boş->'1' DEĞİŞTİ) recalculateExpenseFees() BİR KEZ çağrılmalı.");

  // Aynı değerle TEKRAR çağrılırsa recalculateExpenseFees() GEREKSİZ ÇAĞRILMAMALI.
  context.syncExpenseTitleDeedCountFromUnits();
  assert.equal(recalcCallCount, 1, "Değer DEĞİŞMEDİYSE recalculateExpenseFees() TEKRAR çağrılmamalı (performans).");

  // 3 taşınmazlı (Çoklu Talep, KULLANICI SENARYOSU) -> "3".
  context.state.titleUnits = [{}, {}];
  context.syncExpenseTitleDeedCountFromUnits();
  assert.equal(context.state.fields.expenseTitleDeedCount, "3", "3 taşınmazlı (1 birincil + 2 ek) raporda Tapu Adedi '3' olmalı — AYNI ada/parselde olsalar bile.");
  assert.equal(recalcCallCount, 2, "Taşınmaz sayısı DEĞİŞTİĞİNDE recalculateExpenseFees() TEKRAR çağrılmalı.");

  // Taşınmaz silinip 1'e dönerse -> "1"'e geri döner.
  context.state.titleUnits = [];
  context.syncExpenseTitleDeedCountFromUnits();
  assert.equal(context.state.fields.expenseTitleDeedCount, "1", "Taşınmaz silinip tek taşınmaza dönüldüğünde Tapu Adedi '1'e geri dönmeli.");
  assert.equal(recalcCallCount, 3);

  console.log("syncExpenseTitleDeedCountFromUnits(): gerçek getTitleUnitCount() ile senkron + gereksiz recalc yok testi tamam.");
}

// --- 2) Alan şeması: artık readOnly, eski statik defaultValue:"1" YOK -----
{
  const fieldDefMatch = /\{ key: "expenseTitleDeedCount",[^}]*\}/.exec(appSource);
  assert(fieldDefMatch, "expenseTitleDeedCount alan tanımı bulunamadı.");
  const fieldDef = fieldDefMatch[0];
  assert.ok(fieldDef.includes("readOnly: true"), `expenseTitleDeedCount artık readOnly:true olmalı (elle giriş anlamsız, her render'da senkronlanıyor), bulunan: ${fieldDef}`);
  assert.ok(!fieldDef.includes('defaultValue: "1"'), `expenseTitleDeedCount'ta eski statik defaultValue:"1" ARTIK olmamalı (senkron fonksiyonu her zaman doğru değeri yazıyor), bulunan: ${fieldDef}`);
  console.log("expenseTitleDeedCount alan şeması (readOnly, statik defaultValue yok) testi tamam.");
}

// --- 3) Kaynak-düzeyi kablolama: renderSection() bu senkronu KOŞULSUZ, ----
// syncMultiTitleUnitOwnershipType() İLE AYNI yerde çağırıyor mu.
{
  const renderSectionBody = sourceBetween("function renderSection() {", "function isProjectSuitabilityUiField(", "renderSection");
  assert.ok(
    /syncMultiTitleUnitOwnershipType\(\);\s*\n\s*syncExpenseTitleDeedCountFromUnits\(\);/.test(renderSectionBody),
    "renderSection() syncExpenseTitleDeedCountFromUnits()'i syncMultiTitleUnitOwnershipType()'ın HEMEN ardından, KOŞULSUZ çağırmalı."
  );
  console.log("renderSection() kaynak-düzeyi kablolama testi tamam.");
}

console.log("Tapu Adedi otomatik senkron testleri basarili.");
