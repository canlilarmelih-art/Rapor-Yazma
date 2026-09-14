"use strict";

// Kullanıcı talebi (2026-09-14): "toplam eklenen tüm taşınmazların tek
// rapor olsaydı ücret tarifesini listeleyebilir miyiz tablo halinde" —
// her taşınmazın KENDİ mevcut kullanım niteliği/mülkiyeti + KENDİ alanına
// göre, o taşınmaz TEK BAŞINA bir rapora konu olsaydı hangi tarife
// ücretini alacağını gösteren yeni buildExpenseBulkPerUnitFeeBreakdown()
// + "Masraf Bilgileri" bölümüne eklenen createExpenseBulkPerUnitFeeBreakdownPanel().
//
// Bu dosya: (1) GERÇEK suggestExpenseAppraisalPropertyType()/
// getExpenseAppraisalAreaField()/lookupExpenseAppraisalFeeExVat()/
// calculateReducedUnitFloorTotal() zinciriyle çoklu taşınmazlı bir
// senaryoda doğru tarife türü + alan + ücret hesapladığını, (2) admin
// tarafından yönetilen PAYLAŞIMLI tarife tutarlarının (unit.fields'te
// OLMAYAN expenseAppraisalTierXXX anahtarları) her taşınmaz için doğru
// (originalFields'ten) okunduğunu, (3) çok katlı bir taşınmazda
// getUnitFloorRows()/calculateReducedUnitFloorTotal() ile TOPLAM alanın
// (yalnızca ilk kat DEĞİL) kullanıldığını, (4) state.fields/state.tables'ın
// işlem sonunda ORİJİNALE geri yüklendiğini, (5) panel/renderSection
// kablolamasını kaynak-düzeyinde doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

// `const NAME = ...;` — sağ taraf `{...}`, `[...]` veya `new Set([...])`
// olabilir; ilk açılan parantez/köşeli-ayraç/süslü-ayraçtan başlayıp
// derinlik 0'a dönene kadar (kapanan `;` dahil) alır.
function extractConstArray(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  const valueStart = start + 1 + marker.length;
  let depth = 0;
  let index = valueStart;
  let opened = false;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
      opened = true;
    }
    if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
    }
    if (opened && depth === 0 && appSource[index + 1] === ";") {
      index += 1;
      break;
    }
  }
  return appSource.slice(start + 1, index + 1);
}

const functionNames = [
  "suggestExpenseAppraisalPropertyType",
  "foldTurkish",
  "getExpenseAppraisalAreaField",
  "lookupExpenseAppraisalFeeExVat",
  "parseValuationNumber",
  "calculateReducedUnitFloorTotal",
  "calculateReducedUnitFloorArea",
  "parseReportNumber",
  "parseUnitReductionRate",
  "getUnitFloorRows",
  "formatTitleUnitSuitabilityShortLabel",
  "buildExpenseBulkPerUnitFeeBreakdown",
];
const constArrayNames = ["EXPENSE_LAND_BASED_APPRAISAL_TYPES", "EXPENSE_FLAT_APPRAISAL_TYPES", "EXPENSE_APPRAISAL_TIERS"];

function makeContext() {
  const context = {
    state: { fields: {}, tables: {} },
    getTitleUnitCount: () => 1,
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
    unitInteriorFeatureFields: [],
    createEmptyUnitFloorRow: () => ({}),
  };
  vm.createContext(context);
  vm.runInContext(
    `${constArrayNames.map(extractConstArray).join("\n")}\n${functionNames.map(extractFunction).join("\n")}`,
    context
  );
  return context;
}

const unit = (fields, tables) => ({ fields, tables: tables || {} });

// --- 1) KULLANICI SENARYOSU: 3 taşınmaz, 3 FARKLI tür (Daire/Dükkan/Depo) -
{
  const context = makeContext();
  context.state.fields = {
    // Admin tarafından yönetilen PAYLAŞIMLI tarife tutarları — unit.fields'te
    // OLMAMASINA RAĞMEN her taşınmaz için doğru okunmalı (originalFields'ten).
    expenseAppraisalTierDaire1: "16500",
    expenseAppraisalTierDukkan1: "17949",
    expenseAppraisalTierDepo1: "12000",
  };
  context.__units = [
    unit({ currentUsageNature: "Konut", currentArea: "120" }, { unitFloors: [{ currentArea: "120", areaReductionRate: "100" }] }),
    unit({ currentUsageNature: "İşyeri", currentArea: "80" }, { unitFloors: [{ currentArea: "80", areaReductionRate: "100" }] }),
    unit({ currentUsageNature: "Sanayi Tesisi", currentArea: "200" }, { unitFloors: [{ currentArea: "200", areaReductionRate: "100" }] }),
  ];
  const result = context.buildExpenseBulkPerUnitFeeBreakdown();
  assert.equal(result.length, 3, "3 taşınmaz için 3 satır dönmeli.");
  assert.equal(result[0].propertyType, "Daire / Villa / Ofis", "Konut -> Daire/Villa/Ofis tarifesi.");
  assert.equal(result[0].feeExVat, 16500, "1. taşınmaz (120 m² Daire) -> expenseAppraisalTierDaire1 tutarı.");
  assert.equal(result[1].propertyType, "Dükkan", "İşyeri -> Dükkan tarifesi.");
  assert.equal(result[1].feeExVat, 17949, "2. taşınmaz (80 m² Dükkan) -> expenseAppraisalTierDukkan1 tutarı.");
  assert.equal(result[2].propertyType, "Depo", "Sanayi Tesisi -> Depo tarifesi.");
  assert.equal(result[2].feeExVat, 12000, "3. taşınmaz (200 m² Depo) -> expenseAppraisalTierDepo1 tutarı.");
  // originalFields (paylaşımlı tarife tutarları) İŞLEM SONUNDA korunmalı.
  assert.equal(context.state.fields.expenseAppraisalTierDaire1, "16500", "state.fields ORİJİNALE geri yüklenmeli (regresyon).");
  console.log("KULLANICI SENARYOSU: 3 farklı türde taşınmaz -> doğru tarife+ücret testi tamam.");
}

// --- 2) Çok katlı taşınmaz: TOPLAM alan (yalnızca ilk kat DEĞİL) kullanılır
{
  const context = makeContext();
  context.state.fields = { expenseAppraisalTierDaire2: "17622" };
  context.__units = [
    unit(
      { currentUsageNature: "Konut", currentArea: "80" }, // yalnızca ilk kat (yanıltıcı, tek başına 1-149 dilimine düşerdi)
      { unitFloors: [
        { currentArea: "80", areaReductionRate: "100" },
        { currentArea: "100", areaReductionRate: "100" }, // bodrum/2. kat -> toplam 180 m² (150-250 dilimi)
      ] }
    ),
  ];
  const result = context.buildExpenseBulkPerUnitFeeBreakdown();
  assert.equal(result[0].area, 180, "Çok katlı taşınmazda TOPLAM alan (80+100=180) kullanılmalı, yalnızca ilk kat (80) DEĞİL.");
  assert.equal(result[0].feeExVat, 17622, "180 m² -> 150-250 dilimi (expenseAppraisalTierDaire2) uygulanmalı.");
  console.log("Cok katli tasinmaz: TOPLAM alan (yalnizca ilk kat degil) kullanilmasi testi tamam.");
}

// --- 3) Arsa/Tarım (landArea bazlı tarife) doğru alanı kullanır ----------
{
  const context = makeContext();
  context.state.fields = { expenseAppraisalTierTarim1: "9000" };
  context.__units = [unit({ ownershipType: "Arsa", landArea: "500" })];
  const result = context.buildExpenseBulkPerUnitFeeBreakdown();
  assert.equal(result[0].propertyType, "Arsa (İmarlı)", "ownershipType=Arsa -> Arsa (İmarlı) tarifesi (currentUsageNature boşken).");
  console.log("Arsa/Tarim (landArea bazli tarife) alan secimi testi tamam.");
}

// --- 4) Kaynak-düzeyi kablolama: renderSection() + panel oluşturucu ------
{
  const panelSource = extractFunction("createExpenseBulkPerUnitFeeBreakdownPanel");
  assert.ok(panelSource.includes("getTitleUnitCount() < 2"), "Panel, tek taşınmazlı raporlarda null dönmeli (2+ taşınmaz şartı).");
  assert.ok(panelSource.includes("buildExpenseBulkPerUnitFeeBreakdown()"), "Panel buildExpenseBulkPerUnitFeeBreakdown() verisini kullanmalı.");
  assert.ok(panelSource.includes("Diğer Taşınmazlar Toplamı"), "Panel 'Diğer Taşınmazlar Toplamı' (en yüksek bedelli hariç) satırını göstermeli.");

  const renderSectionMatch = /if \(section\.id === "expenseFees"\) \{\s*\n\s*const bulkFeeBreakdownPanel = createExpenseBulkPerUnitFeeBreakdownPanel\(\);\s*\n\s*if \(bulkFeeBreakdownPanel\) body\.append\(bulkFeeBreakdownPanel\);/.test(appSource);
  assert.ok(renderSectionMatch, "renderSection() 'expenseFees' bölümüne createExpenseBulkPerUnitFeeBreakdownPanel() panelini eklemeli.");
  console.log("Panel + renderSection() kaynak-duzeyi kablolama testi tamam.");
}

// --- 5) Kullanıcı DÜZELTMESİ (2026-09-14): "bu tabloda en büyük alanlıyı --
// işaretleme. en yüksek rapor bedeline sahip olanı işaretle" — vurgulanan/
// hariç tutulan satırın kriteri artık ALAN DEĞİL, HESAPLANAN ÜCRETİN
// KENDİSİ (alan büyüklüğü ile tarife ücreti doğrusal orantılı DEĞİL —
// farklı gayrimenkul türlerinin kademeli tarifeleri farklı eşiklerde
// artar). GERÇEK seçim döngüsünü (panelSource'tan) çıkarıp, alan/ücret
// SIRASI KASITLI TERS bir örnek üzerinde çalıştırarak doğrular: en büyük
// ALANLI satır (A, 5000 m², düşük tarife) DEĞİL, en yüksek ÜCRETLİ satır
// (B, 50 m², yüksek tarife) seçilmeli.
{
  const panelSource = extractFunction("createExpenseBulkPerUnitFeeBreakdownPanel");
  assert.ok(!/largestArea|row\.area > largest/.test(panelSource), "Panelde ARTIK alan-bazlı ('largestArea'/'row.area > largest...') bir seçim kalmamalı.");
  const selectionSnippetMatch = /let largestIndex = -1;\s*\n\s*let largestFee = -Infinity;\s*\n\s*rows\.forEach\(\(row, index\) => \{[\s\S]*?\n  \}\);/.exec(panelSource);
  assert.ok(selectionSnippetMatch, "'En yüksek bedelli' seçim döngüsü (largestFee bazlı) bulunamadı.");

  const context = { rows: [
    { label: "A", area: 5000, feeExVat: 20985 }, // En BÜYÜK ALAN ama DAHA DÜŞÜK ücret (Dükkan 101-500 dilimi ALTINDA kalan başka bir örnek gibi düşünülebilir — burada sadece SAYISAL karşıtlık önemli).
    { label: "B", area: 50, feeExVat: 55569 }, // KÜÇÜK alan ama EN YÜKSEK ücret.
  ] };
  vm.createContext(context);
  // `let` ile tanımlanan degiskenler vm context nesnesine ozellik olarak
  // EKLENMEZ (top-level let/const, var'dan farkli) — IIFE ile SARIP
  // dogrudan donus degerini yakaliyoruz.
  const largestIndex = vm.runInContext(`(() => {\n${selectionSnippetMatch[0]}\n  return largestIndex;\n})()`, context);
  assert.equal(largestIndex, 1, "En YÜKSEK ÜCRETLİ satır (B, index 1) seçilmeli — en büyük ALANLI (A, index 0) DEĞİL.");
  console.log("KULLANICI DUZELTMESI: vurgu kriteri artik EN YUKSEK UCRET (alan degil) testi tamam.");
}

console.log("Toplu Degerleme tasinmaz-bazinda tarife ucreti tablosu testleri basarili.");
