"use strict";

/*
  Kullanıcı bildirimi (2026-09-13, devam — ekran görüntüsü, "Kat Bazında
  Hesaplama Tablosu"): "bu tablo aşağıda yer alan Yasal Durum Değeri
  Mevcut Durum Değeri Yasal Kira Değeri Mevcut Kira Değeri bölümleri ile
  dinamik bir şekilde senkronize olmalı".

  ÖNCEKİ İKİ TUR (0.0.756/0.0.757, bu dosyanın ESKİ hali): "Kat Bazında
  Hesaplama Tablosu"nun (getExplanationsFloorValuationMetrics) kendisi
  legalValue/currentValue'yu OKUMAK YERİNE emsal ortalamasından KENDİ
  BAŞINA (İLERİYE DOĞRU, indirgenmiş alan × emsal ortalaması, 50.000'e
  yuvarlanarak) yeniden hesaplıyordu. Bu, TEK BAŞINA doğru sonucu
  veriyordu AMA "Piyasa Değeri" paneli legalValue/currentValue'yu
  (syncComparableValuationMarketValue üzerinden) HAM (indirgenmemiş)
  toplam alanla hesaplamaya DEVAM ediyordu — asma kat gibi indirgeme
  UYGULANAN raporlarda İKİ TABLO FARKLI Piyasa Değeri gösteriyordu (ör.
  Kat Bazında 3.750.000 TL derken Piyasa Değeri paneli HAM alan 110 m²
  ile 4.800.000 TL diyordu) — kullanıcı bunu "senkron değil" bildirdi.

  KÖK DÜZELTME (bu tur): sorunun asıl kaynağı getExplanationsFloorValuationMetrics
  DEĞİL, syncValuationAreasFromUnitAreas()'ın legalValueArea/currentValueArea/
  legalRentArea/currentRentArea'yı HAM (indirgenmemiş) toplam alanla
  doldurmasıydı. Düzeltme YUKARI TAŞINDI:
  - Yeni getValuationUnitReducedAreaTotals() — calculateReducedUnitFloorTotal
    (Kat Bazında Hesaplama Tablosu'nun DA kullandığı GERÇEK indirgeme
    fonksiyonu) ile İNDİRGENMİŞ (etkili) toplam alanı hesaplar; kat/
    indirgeme verisi yoksa getValuationUnitAreaTotals()'ın (HAM) kendi
    legacy-alan yedeğine düşer.
  - syncValuationAreasFromUnitAreas() artık legalValueArea/currentValueArea/
    legalRentArea/currentRentArea'yı BU İNDİRGENMİŞ toplamla dolduruyor —
    insuranceValueArea BİLEREK HAM kalıyor (sigorta/yeniden inşa maliyeti
    GERÇEK fiziksel inşaat alanına bağlıdır, indirgeme yöntemiyle İLGİSİZ).
  - getExplanationsFloorValuationMetrics() BASİTLEŞTİRİLDİ — artık KENDİ
    BAŞINA bir hesaplama İCAT ETMİYOR, doğrudan state.fields[legalValue/
    currentValue/legalRent/currentRent]'i okuyup İNDİRGENMİŞ alana bölüyor
    (0.0.756 ÖNCESİ formülün AYNISI) — AMA artık DOĞRU sonucu verir, çünkü
    legalValue/currentValue'nun KENDİSİ (syncComparableValuationMarketValue
    ile otomatik hesaplanan) ARTIK indirgenmiş alan tabanlı. Eksper elle
    geçersiz kılmışsa (hasUserDefinedLandMarketValue/...ComparableAutoManual)
    o zaman da KENDİ girdiği resmi değeri (yine indirgenmiş alana bölünerek
    "ima edilen" birim değer gösterilir) taşır.
  - Sonuç: Kat Bazında Hesaplama Tablosu + Piyasa Değeri paneli artık
    GERÇEKTEN TEK bir kaynaktan (aynı legalValue/currentValue alanı,
    aynı indirgenmiş alan tabanı) besleniyor — iki ayrı yerde ayrı ayrı
    HESAPLANMIYOR, senkronizasyon garanti.

  Bu test dosyası:
  1) getValuationUnitReducedAreaTotals(): kullanıcının GERÇEK örneğiyle
     (Zemin 75/%100, Asma 35/%30) Mevcut için İNDİRGENMİŞ toplamın 85,50
     (HAM 110 DEĞİL) olduğunu; kat/indirgeme verisi yokken HAM yedeğe
     düştüğünü doğrular.
  2) syncValuationAreasFromUnitAreas(): legalValueArea/currentValueArea/
     legalRentArea/currentRentArea İNDİRGENMİŞ toplamı, insuranceValueArea
     İSE HAM toplamı almalı (regresyon kilidi — sigorta alanı BİLEREK
     DEĞİŞMEMELİ).
  3) UÇTAN UCA SENKRONİZASYON: syncValuationAreasFromUnitAreas() +
     syncComparableValuationMarketValue() (GERÇEK, indirgenmiş alan
     tabanlı otomatik hesap) çalıştırıldıktan SONRA
     getExplanationsFloorValuationMetrics()'in ürettiği marketValue/
     rentValue, state.fields.currentValue/currentRent İLE BİREBİR AYNI
     olmalı (kullanıcının gerçek sayılarıyla: emsal ortalaması 43.689,90
     TL/m² → Yasal 3.300.000 TL, Mevcut 3.750.000 TL — İKİ TABLO DA AYNI).
  4) getExplanationsFloorValuationMetrics(): basit bölme formülüne
     (0.0.756 ÖNCESİ) GERİ DÖNDÜĞÜ, emsal ortalamasını KENDİ BAŞINA
     YENİDEN HESAPLAMADIĞI kaynak-düzeyinde doğrulanır (regresyon kilidi
     — bu fonksiyon artık calculateComparableValuationAverages/
     getComparableValuationRows'u HİÇ ÇAĞIRMAMALI).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  return extractFunctionBodyFrom(start);
}
function extractFunctionBodyFrom(start) {
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") { parenDepth -= 1; if (parenDepth === 0) break; }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") { depth -= 1; if (depth === 0) return appSource.slice(start + 1, index + 1); }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "parseReportNumber",
  "parseUnitReductionRate",
  "calculateReducedUnitFloorArea",
  "calculateReducedUnitFloorTotal",
  "parseValuationNumber",
  "parseValuationNumberOrZero",
  "formatValuationArea",
  "formatValuationMoney",
  "createEmptyUnitFloorRow",
  "getUnitFloorRows",
  "getValuationUnitAreaTotals",
  "getValuationUnitReducedAreaTotals",
  "syncValuationAreasFromUnitAreas",
  "buildExplanationsFloorValuationRows",
  "getExplanationsFloorValuationMetrics",
  "hasUserDefinedLandMarketValue",
  "isComparableValuationTotalKey",
  "hasComparableValuationManualOverride",
  "syncComparableValuationMarketValue",
  "roundComparableValuationValue",
];

function buildContext(state) {
  const context = {
    state,
    isLandOwnershipType: () => false,
    comparableValuationRoundStep: 50000,
    comparableValuationRentRoundStep: 1000,
    // getUnitFloorRows()'un legacy (tekil kat) yedek dalının bağımlılığı —
    // bu testin kapsamı DIŞINDA, boş dizi yeterli (yalnızca .map çağrılıyor).
    unitInteriorFeatureFields: [],
  };
  const source = functionNames.map(extractFunction).join("\n");
  const vm = require("node:vm");
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

// Kullanıcının gerçek örneği: Zemin 75 m² (%100), Asma 35 m² (%30) ->
// Mevcut indirgenmiş toplam = 85,50 m² (HAM 110 m² DEĞİL). Yasal
// tarafta sadece Zemin (75 m², %100) var -> Yasal indirgenmiş = 75 m²
// (ham ile AYNI, asma kat yok).
const legalFloorRows = [{ floor: "Zemin kat", legalArea: "75", currentArea: "75", areaReductionRate: "100" }];
const currentFloorRows = [
  { floor: "Zemin kat", legalArea: "75", currentArea: "75", areaReductionRate: "100" },
  { floor: "", currentArea: "35", areaReductionRate: "30" },
];
const allFloorRows = [
  { floor: "Zemin kat", legalArea: "75", currentArea: "75", areaReductionRate: "100" },
  { floor: "Asma kat", legalArea: "", currentArea: "35", areaReductionRate: "30" },
];

// --- 1) getValuationUnitReducedAreaTotals() -----------------------------
{
  const context = buildContext({ tables: { unitFloors: allFloorRows }, fields: {} });
  const totals = context.getValuationUnitReducedAreaTotals();
  assert.equal(totals.legal, "75", `Yasal indirgenmiş toplam 75 olmalı (asma kat yasalda yok): ${totals.legal}`);
  assert.equal(totals.current, "85,50", `Mevcut indirgenmiş toplam 85,50 olmalı (110 HAM DEĞİL): ${totals.current}`);

  // Kat/indirgeme verisi hiç yokken (legacy tekil alan) HAM yedeğe düşer.
  const legacyContext = buildContext({ tables: {}, fields: { legalArea: "60", currentArea: "60" } });
  const legacyTotals = legacyContext.getValuationUnitReducedAreaTotals();
  assert.equal(legacyTotals.legal, "60", `Kat verisi yokken HAM (legacy) yedeğe düşmeli: ${legacyTotals.legal}`);
  assert.equal(legacyTotals.current, "60", `Kat verisi yokken HAM (legacy) yedeğe düşmeli: ${legacyTotals.current}`);

  console.log("getValuationUnitReducedAreaTotals(): kullanıcının gerçek örneğiyle indirgenmiş toplam testi tamam.");
}

// --- 2) syncValuationAreasFromUnitAreas(): value/rent İNDİRGENMİŞ, ------
// insurance HAM kalmalı (regresyon kilidi) ------------------------------
{
  const context = buildContext({ tables: { unitFloors: allFloorRows }, fields: {} });
  context.syncValuationAreasFromUnitAreas();
  assert.equal(context.state.fields.legalValueArea, "75", `legalValueArea indirgenmiş (75) olmalı: ${context.state.fields.legalValueArea}`);
  assert.equal(context.state.fields.currentValueArea, "85,50", `currentValueArea indirgenmiş (85,50) olmalı, HAM 110 DEĞİL: ${context.state.fields.currentValueArea}`);
  assert.equal(context.state.fields.legalRentArea, "75", `legalRentArea indirgenmiş (75) olmalı: ${context.state.fields.legalRentArea}`);
  assert.equal(context.state.fields.currentRentArea, "85,50", `currentRentArea indirgenmiş (85,50) olmalı: ${context.state.fields.currentRentArea}`);
  // NOT: insuranceValueArea her zaman "legal" (Yasal) HAM toplamdan gelir
  // (orijinal kod da SADECE totals.legal kullanıyordu) — bu senaryoda
  // Asma kat legalArea'sı BOŞ (yalnızca mevcut/currentArea'sı dolu,
  // asma kat yasal krokide yok) olduğundan Yasal HAM toplam 75'tir (110
  // DEĞİL — 110 yalnızca MEVCUT ham toplamı).
  assert.equal(
    context.state.fields.insuranceValueArea,
    "75",
    `insuranceValueArea BİLEREK HAM Yasal toplamdan (75) gelmeli, İNDİRGENMİŞ olarak DEĞİŞMEMELİ (sigorta/yeniden inşa maliyeti indirgemeyle İLGİSİZ) — REGRESYON: ${context.state.fields.insuranceValueArea}`
  );

  // Yukarıdaki senaryoda Yasal HAM (75) = Yasal İNDİRGENMİŞ (75) olduğundan
  // (asma kat yasalda yok) bu TEK BAŞINA HAM/İNDİRGENMİŞ ayrımını KANITLAMAZ.
  // Yasal tarafın KENDİSİ de indirgeme İÇEREN AYRI bir senaryo: Zemin 75
  // (%100) + Üst kat 20 (%50, YASAL krokide de var) -> Yasal HAM = 95,
  // Yasal İNDİRGENMİŞ = 75+10=85. insuranceValueArea BURADA da HAM (95)
  // kalmalı, İNDİRGENMİŞ (85) OLMAMALI.
  const reducedLegalRows = [
    { floor: "Zemin kat", legalArea: "75", currentArea: "75", areaReductionRate: "100" },
    { floor: "Üst kat", legalArea: "20", currentArea: "20", areaReductionRate: "50" },
  ];
  const reducedLegalContext = buildContext({ tables: { unitFloors: reducedLegalRows }, fields: {} });
  reducedLegalContext.syncValuationAreasFromUnitAreas();
  assert.equal(reducedLegalContext.state.fields.legalValueArea, "85", `legalValueArea İNDİRGENMİŞ (85) olmalı: ${reducedLegalContext.state.fields.legalValueArea}`);
  assert.equal(
    reducedLegalContext.state.fields.insuranceValueArea,
    "95",
    `insuranceValueArea Yasal İNDİRGEME olsa BİLE HAM (95) kalmalı, İNDİRGENMİŞ (85) OLMAMALI — GERÇEK regresyon kilidi: ${reducedLegalContext.state.fields.insuranceValueArea}`
  );

  console.log("syncValuationAreasFromUnitAreas(): value/rent alanı indirgenmiş, insurance alanı HAM (regresyon kilidi) testi tamam.");
}

// --- 3) UÇTAN UCA SENKRONİZASYON: Kat Bazında Hesaplama Tablosu === -----
// Piyasa Değeri paneli (kullanıcının GERÇEK sayılarıyla) ----------------
{
  const context = buildContext({ tables: { unitFloors: allFloorRows }, fields: {} });
  context.syncValuationAreasFromUnitAreas();
  // Emsal Değerleme Tablosu'ndaki GERÇEK ortalama (kullanıcının ekran
  // görüntüsü): 43.689,90 TL/m².
  const comparableAverage = 43689.9;
  context.syncComparableValuationMarketValue("legalValue", "legalValueArea", comparableAverage);
  context.syncComparableValuationMarketValue("currentValue", "currentValueArea", comparableAverage);

  assert.equal(context.state.fields.legalValue, "3.300.000", `Yasal Piyasa Degeri 75 × 43.689,90 -> 50.000'e yuvarlanınca 3.300.000 olmalı: ${context.state.fields.legalValue}`);
  assert.equal(context.state.fields.currentValue, "3.750.000", `Mevcut Piyasa Degeri 85,50 × 43.689,90 -> 50.000'e yuvarlanınca 3.750.000 olmalı (ONCEKI hatalı 4.800.000 DEĞİL): ${context.state.fields.currentValue}`);

  // Kat Bazında Hesaplama Tablosu'nun KENDİ hesabı — AYRI bir emsal
  // ortalaması ARAMADAN, doğrudan state.fields.legalValue/currentValue'yu
  // okuyup AYNI indirgenmiş alana böler.
  const legalDetailRows = context.buildExplanationsFloorValuationRows(legalFloorRows, "legal");
  const legalMetrics = context.getExplanationsFloorValuationMetrics(legalDetailRows, "legal");
  const currentDetailRows = context.buildExplanationsFloorValuationRows(currentFloorRows, "current");
  const currentMetrics = context.getExplanationsFloorValuationMetrics(currentDetailRows, "current");

  assert.equal(
    legalMetrics.marketValue,
    context.parseValuationNumber(context.state.fields.legalValue),
    `Kat Bazında Tablosu'nun Yasal Piyasa Değeri, Piyasa Değeri paneliyle (legalValue) BİREBİR AYNI olmalı (senkron): ${legalMetrics.marketValue} vs ${context.state.fields.legalValue}`
  );
  assert.equal(
    currentMetrics.marketValue,
    context.parseValuationNumber(context.state.fields.currentValue),
    `Kat Bazında Tablosu'nun Mevcut Piyasa Değeri, Piyasa Değeri paneliyle (currentValue) BİREBİR AYNI olmalı (senkron — kullanıcının bildirdiği "senkron değil" sorunu): ${currentMetrics.marketValue} vs ${context.state.fields.currentValue}`
  );
  // Birim değer de İKİ satırda AYNI emsal ortalamasına (43.689,90) yakın
  // olmalı — kullanıcının önceki bildirdiği "56.140,35 gibi yapay şişme"
  // ARTIK OLMAMALI.
  // 50.000'e yuvarlama nedeniyle birim değer emsal ortalamasından KÜÇÜK
  // bir miktar (bu örnekte ~170 TL/m²) sapabilir — asıl kanıt ESKİ yapay
  // şişmenin (56.140,35, aşağıda) ARTIK OLMAMASI.
  assert.ok(Math.abs(currentMetrics.marketUnitValue - comparableAverage) < 500, `Mevcut birim değer emsal ortalamasına yakın olmalı, yapay şişmemeli: ${currentMetrics.marketUnitValue}`);
  assert.notEqual(Math.round(currentMetrics.marketUnitValue * 100) / 100, 56140.35, "Mevcut birim değer ESKİ hatalı (56.140,35 TL/m²) değerine DÖNMEMELİ.");

  console.log("UÇTAN UCA: Kat Bazında Hesaplama Tablosu artık Piyasa Değeri paneliyle GERÇEKTEN senkron (kullanıcının tam sayılarıyla) testi tamam.");
}

// --- 4) getExplanationsFloorValuationMetrics(): kaynak-düzeyi regresyon -
// kilidi — artık emsal ortalamasını KENDİ BAŞINA hesaplamıyor ------------
{
  const fnStart = appSource.indexOf("\nfunction getExplanationsFloorValuationMetrics(");
  const fnBody = extractFunctionBodyFrom(fnStart);
  assert.ok(!fnBody.includes("calculateComparableValuationAverages"), "getExplanationsFloorValuationMetrics() artık calculateComparableValuationAverages() ÇAĞIRMAMALI (basitleştirildi, kaynak yukarı taşındı).");
  assert.ok(!fnBody.includes("getComparableValuationRows"), "getExplanationsFloorValuationMetrics() artık getComparableValuationRows() ÇAĞIRMAMALI.");
  assert.ok(fnBody.includes("parseValuationNumber(state.fields[marketKey])"), "getExplanationsFloorValuationMetrics() doğrudan state.fields[marketKey]'i okumalı (basit, 0.0.756 ÖNCESİ formül).");
  console.log("getExplanationsFloorValuationMetrics(): kaynak-düzeyi basitleştirme regresyon kilidi testi tamam.");
}

console.log("Kat Bazında Hesaplama Tablosu <-> Piyasa Değeri paneli dinamik senkronizasyon testi başarılı.");
