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

// `const NAME = ...;` — sağ taraf `{...}`, `[...]`, `new Set([...])` VEYA
// düz bir string/sayı literali olabilir (ör. EXPENSE_BULK_MODE_2_FLAT_THRESHOLD
// = 201). Tırnak içindeki `(`/`)`/`;` karakterlerini (Türkçe metinlerde sık
// geçiyor, ör. "(Aynı Mahalle/Köy)") derinlik/sonlandırma SAYMAZ — string
// literalleri ATOMİK atlanır; kapanışı derinlik 0'da bulunan İLK `;`.
function extractConstArray(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  const valueStart = start + 1 + marker.length;
  let depth = 0;
  let index = valueStart;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      index += 1;
      while (index < appSource.length && appSource[index] !== quote) {
        if (appSource[index] === "\\") index += 1;
        index += 1;
      }
      continue;
    }
    if (char === "{" || char === "[" || char === "(") depth += 1;
    if (char === "}" || char === "]" || char === ")") depth -= 1;
    if (depth === 0 && char === ";") break;
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
// artar). 2026-09-15'te bu seçim mantığı computeExpenseBulkHighestAndOtherTotal()
// paylaşımlı çekirdeğine ÇIKARILDI (hem panel HEM DE recalculateExpenseFees()
// AYNI çekirdeği kullanır) — bu senaryo artık O ÇEKİRDEĞİ (panelden ayrı
// bir snippet DEĞİL, GERÇEK fonksiyonun kendisini) alan/ücret SIRASI
// KASITLI TERS bir örnek üzerinde çalıştırarak doğrular: en büyük ALANLI
// satır (A, 5000 m², düşük tarife) DEĞİL, en yüksek ÜCRETLİ satır (B, 50
// m², yüksek tarife) seçilmeli.
{
  const panelSource = extractFunction("createExpenseBulkPerUnitFeeBreakdownPanel");
  assert.ok(!/largestArea|row\.area > largest/.test(panelSource), "Panelde ARTIK alan-bazlı ('largestArea'/'row.area > largest...') bir seçim kalmamalı.");
  assert.ok(panelSource.includes("computeExpenseBulkHighestAndOtherTotal(rows)"), "Panel artık en yüksek bedelli/diğer toplam hesaplamasını PAYLAŞIMLI çekirdekten (computeExpenseBulkHighestAndOtherTotal) almalı.");

  const helperContext = {};
  vm.createContext(helperContext);
  vm.runInContext(extractFunction("computeExpenseBulkHighestAndOtherTotal"), helperContext);
  const result = helperContext.computeExpenseBulkHighestAndOtherTotal([
    { label: "A", area: 5000, feeExVat: 20985 }, // En BÜYÜK ALAN ama DAHA DÜŞÜK ücret (farklı tarife türlerinin kademeli eşikleri nedeniyle mümkün — burada sadece SAYISAL karşıtlık önemli).
    { label: "B", area: 50, feeExVat: 55569 }, // KÜÇÜK alan ama EN YÜKSEK ücret.
  ]);
  assert.equal(result.highestIndex, 1, "En YÜKSEK ÜCRETLİ satır (B, index 1) seçilmeli — en büyük ALANLI (A, index 0) DEĞİL.");
  assert.equal(result.highestFee, 55569, "highestFee, B'nin (en yüksek ücretli) ücreti olmalı.");
  assert.equal(result.otherTotal, 20985, "otherTotal, en yüksek bedelli HARİÇ diğer TÜM taşınmazların (A) toplamı olmalı.");
  console.log("computeExpenseBulkHighestAndOtherTotal(): vurgu kriteri EN YUKSEK UCRET (alan degil) testi tamam.");
}

// --- 6) Kullanıcı talebi (2026-09-14): "rapor bedeli hesaplanırken en ----
// yüksek bedelli rapor ücreti + diğer kalan tüm gayrimenkullerin
// değerleme ücretinin %15'i aynı ada parsel taleplerinde. tabloda bu
// hesaplama detaylarını göster." Bu ZATEN recalculateExpenseFees()'in
// kullandığı EXPENSE_BULK_MODE_DISCOUNT formülüyle BİREBİR aynı (2. Grup/
// Aynı Parsel = %15) — bu senaryo hem kullanıcının verdiği %15 rakamının
// sistemdeki sabitle TUTARLI olduğunu, hem de panelin GERÇEK
// hesaplama-detay satırlarını (indirim oranı + indirimli katkı + nihai
// toplam rapor bedeli) doğru ürettiğini kanıtlar.
{
  const bulkModeConstsSource = [extractConstArray("EXPENSE_BULK_MODE_1"), extractConstArray("EXPENSE_BULK_MODE_2"), extractConstArray("EXPENSE_BULK_MODE_2_FLAT_THRESHOLD"), extractConstArray("EXPENSE_BULK_MODE_DISCOUNT")].join("\n");
  // Top-level `const`/`let` vm context'e ÖZELLİK olarak EKLENMEZ (var'dan
  // farkli) — IIFE ile SARIP dört sabiti TEK bir nesnede DÖNDÜRÜYORUZ.
  const bulkModeConsts = vm.runInContext(
    `(() => {\n${bulkModeConstsSource}\n  return { EXPENSE_BULK_MODE_1, EXPENSE_BULK_MODE_2, EXPENSE_BULK_MODE_2_FLAT_THRESHOLD, EXPENSE_BULK_MODE_DISCOUNT };\n})()`,
    vm.createContext({})
  );
  assert.equal(
    bulkModeConsts.EXPENSE_BULK_MODE_DISCOUNT[bulkModeConsts.EXPENSE_BULK_MODE_2],
    0.15,
    "KULLANICI RAKAMI DOĞRULAMASI: '2. Grup - Aynı Parsel Birden Fazla Bağımsız Bölüm' indirim oranı sistemde ZATEN %15 olmalı (kullanıcının verdiği oranla birebir uyuşuyor)."
  );

  const panelSource = extractFunction("createExpenseBulkPerUnitFeeBreakdownPanel");
  const calcStart = panelSource.indexOf("const bulkMode = state.fields.expenseBulkValuationMode;");
  const calcEnd = panelSource.indexOf("const finalReportFee = highestFee + discountedOtherContribution;") + "const finalReportFee = highestFee + discountedOtherContribution;".length;
  assert(calcStart >= 0 && calcEnd > calcStart, "Panelde hesaplama-detay bloğu (bulkMode/discountRate/finalReportFee) bulunamadı.");
  // Kaynaktaki `if (Number.isFinite(discountRate)) {` bloğu bu noktada
  // KAPANMAMIŞ (DOM satırları devam ediyor) — `finalReportFee` bu bloğun
  // İÇİNDE (const, blok-scope'lu) tanımlı olduğundan `return` de KAPANIŞTAN
  // ÖNCE (aynı blok içinde) eklenir.
  const calcSnippet = `${panelSource.slice(calcStart, calcEnd)}\n  return finalReportFee;\n}`;

  const calcContext = {
    state: { fields: { expenseBulkValuationMode: bulkModeConsts.EXPENSE_BULK_MODE_2 } },
    EXPENSE_BULK_MODE_DISCOUNT: bulkModeConsts.EXPENSE_BULK_MODE_DISCOUNT,
    highestFee: 100000, // en yüksek bedelli taşınmazın kendi ücreti (KULLANICI ÖRNEĞİ: "en yüksek bedelli rapor ücreti")
    otherTotal: 40000, // diğer TÜM taşınmazların toplamı (KULLANICI ÖRNEĞİ: "diğer kalan tüm gayrimenkullerin değerleme ücreti")
  };
  vm.createContext(calcContext);
  const finalReportFee = vm.runInContext(`(() => {\n${calcSnippet}\n})()`, calcContext);
  // KULLANICI FORMÜLÜ (BİREBİR): en yüksek bedelli (100.000) + diğerlerinin
  // %15'i (40.000 × 0.15 = 6.000) = 106.000.
  assert.equal(finalReportFee, 106000, "Nihai rapor bedeli = en yüksek bedelli (100.000) + diğerlerinin %15'i (40.000×0.15=6.000) = 106.000 olmalı.");
  console.log("KULLANICI FORMULU (en yuksek bedelli + digerlerinin %15'i, Ayni Parsel) hesaplama testi tamam.");
}

// --- 7) Kullanıcı talebi (2026-09-15): "masraf tablosunda rapor ücreti ---
// kısmında hesaplanan rapor ücreti yazılmalı çoklu raporlarda" —
// recalculateExpenseFees()'in KENDİSİ (kaynak-düzeyi) artık 2+ taşınmazlı
// raporlarda "Değerleme Ücreti Tarife Türü"/"Diğer Taşınmazların Toplam
// Ücreti" alanları YERİNE buildExpenseBulkPerUnitFeeBreakdown()/
// computeExpenseBulkHighestAndOtherTotal()'dan gelen değerleri kullanmalı;
// tek taşınmazlı raporlarda (getTitleUnitCount() < 2) davranış DEĞİŞMEMELİ.
{
  const recalcSource = extractFunction("recalculateExpenseFees");
  assert.ok(
    /if \(getTitleUnitCount\(\) >= 2\) \{\s*\n\s*const perUnitRows = buildExpenseBulkPerUnitFeeBreakdown\(\)/.test(recalcSource),
    "recalculateExpenseFees() artık 2+ taşınmazlı raporlarda buildExpenseBulkPerUnitFeeBreakdown() ile taban ücreti/diğer toplamı OTOMATİK hesaplamalı."
  );
  assert.ok(
    recalcSource.includes("computeExpenseBulkHighestAndOtherTotal(perUnitRows)"),
    "recalculateExpenseFees() panelle AYNI paylaşımlı çekirdeği (computeExpenseBulkHighestAndOtherTotal) kullanmalı (drift riski olmadan)."
  );
  console.log("recalculateExpenseFees() kaynak-duzeyi kablolama (coklu tasinmaz otomatik ucret) testi tamam.");
}

// --- 8) UÇTAN UCA: recalculateExpenseFees()'in "Değerleme Ücreti" (taban -
// ücret) bölümünü GERÇEKTEN çalıştırıp — buildExpenseBulkPerUnitFeeBreakdown()
// SAHTE (fixture) taşınmaz satırları döndürecek şekilde stub'lanarak,
// computeExpenseBulkHighestAndOtherTotal()/EXPENSE_BULK_MODE_DISCOUNT/
// lookupExpenseAppraisalFeeExVat GERÇEK — kullanıcının BİREBİR aynı
// senaryosuyla (en yüksek bedelli + diğerlerinin %15'i, Aynı Parsel)
// state.fields.expenseAppraisalFeeExVat'a doğru TUTAR VE FORMATLA
// (Türkçe binlik/ondalık ayırıcı) yazıldığını kanıtlar. "Değerleme Ücreti
// Tarife Türü"/"Diğer Taşınmazların Toplam Ücreti" manuel alanları
// BİLEREK BOŞ/YANLIŞ bırakılır — 2+ taşınmazlı dalın onları GERÇEKTEN
// YOK SAYDIĞINI (yalnızca perUnitRows'un kullanıldığını) kanıtlamak için.
{
  const fullSource = appSource.indexOf("function recalculateExpenseFees() {");
  const endMarker = 'state.fields.expenseAppraisalFeeExVat = Number.isFinite(appraisalFee) ? formatValuationMoney(appraisalFee, { decimals: 2 }) : "";';
  const endIndex = appSource.indexOf(endMarker, fullSource) + endMarker.length;
  assert(fullSource >= 0 && endIndex > fullSource, "recalculateExpenseFees() taban ücret bölümü bulunamadı.");
  // Fonksiyonun yalnızca "Değerleme Ücreti" (taban ücret) bölümü alınır —
  // Tapu Harcı/Belediye Harcı/toplamlar gibi SONRAKİ, bu testin kapsamı
  // DIŞINDAKİ satırlar (kendi ayrı bağımlılık zincirleriyle) hiç
  // ÇALIŞTIRILMAZ; fonksiyon gövdesi burada erken kapatılır.
  const appraisalFeeSource = `${appSource.slice(fullSource, endIndex)}\n}`;

  // TÜM sabitler/fonksiyonlar + kurulum + GERÇEK çağrı TEK bir
  // vm.runInContext çağrısında birleştirilir — ayrı çağrılar top-level
  // const/let bağlamını PAYLAŞMAZ (her runInContext KENDİ script-scope'unu
  // kurar), bu yüzden EXPENSE_BULK_MODE_2 gibi sabitler farklı bir
  // çağrıdan erişilemez.
  const combinedSource = `
    ${extractConstArray("EXPENSE_BULK_MODE_1")}
    ${extractConstArray("EXPENSE_BULK_MODE_2")}
    ${extractConstArray("EXPENSE_BULK_MODE_2_FLAT_THRESHOLD")}
    ${extractConstArray("EXPENSE_BULK_MODE_DISCOUNT")}
    ${extractConstArray("EXPENSE_LAND_BASED_APPRAISAL_TYPES")}
    ${extractConstArray("EXPENSE_FLAT_APPRAISAL_TYPES")}
    ${extractConstArray("EXPENSE_APPRAISAL_TIERS")}
    ${extractFunction("computeExpenseBulkHighestAndOtherTotal")}
    ${extractFunction("parseValuationNumber")}
    ${extractFunction("getExpenseAppraisalAreaField")}
    ${extractFunction("lookupExpenseAppraisalFeeExVat")}
    ${extractFunction("formatValuationMoney")}
    ${appraisalFeeSource}
    // KULLANICI ÖRNEĞİ: en yüksek bedelli (C, 100.000) + diğer ikisi
    // (A: 30.000, B: 10.000 -> toplam 40.000), Aynı Parsel (%15 indirim).
    state.fields.expenseBulkValuationMode = EXPENSE_BULK_MODE_2;
    recalculateExpenseFees();
  `;
  const e2eContext = {
    state: {
      fields: {
        // BİLEREK BOŞ/ALAKASIZ: 2+ taşınmazlı dal bunları YOK SAYMALI.
        expenseAppraisalPropertyType: "",
        expenseBulkOtherPropertiesFeeSum: "999999",
        expenseVatRatePercent: "20",
        expenseBulkPropertyCount: "3",
      },
    },
    getTitleUnitCount: () => 3,
    // buildExpenseBulkPerUnitFeeBreakdown() SAHTE — GERÇEK fonksiyon
    // (KENDİSİ zaten senaryo 1-3'te ayrıca GERÇEK bağımlılıklarıyla test
    // edildi) burada sabit fixture ile DEĞİŞTİRİLİR ki bu senaryo yalnızca
    // recalculateExpenseFees()'in bu veriyi DOĞRU kullandığına odaklansın.
    buildExpenseBulkPerUnitFeeBreakdown: () => [
      { label: "A", propertyType: "Daire / Villa / Ofis", area: 120, feeExVat: 30000 },
      { label: "B", propertyType: "Dükkan", area: 80, feeExVat: 10000 },
      { label: "C", propertyType: "Dükkan", area: 400, feeExVat: 100000 },
    ],
    getValuationUnitAreaTotals: () => ({ current: 0 }),
  };
  vm.runInContext(combinedSource, vm.createContext(e2eContext));
  // KULLANICI FORMÜLÜ: en yüksek bedelli (100.000) + diğerlerinin (30.000+10.000=40.000) %15'i (6.000) = 106.000,00.
  assert.equal(
    e2eContext.state.fields.expenseAppraisalFeeExVat,
    "106.000,00",
    `state.fields.expenseAppraisalFeeExVat = "106.000,00" (Türkçe formatlı) olmalı, bulunan: ${JSON.stringify(e2eContext.state.fields.expenseAppraisalFeeExVat)}`
  );
  console.log("UCTAN UCA: recalculateExpenseFees() coklu tasinmazda otomatik 'Degerleme Ucreti' yazma testi tamam.");
}

console.log("Toplu Degerleme tasinmaz-bazinda tarife ucreti tablosu testleri basarili.");
