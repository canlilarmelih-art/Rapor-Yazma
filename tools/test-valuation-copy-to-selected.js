// "Değerleme" (valuation): Seçili taşınmazlara kopyala (2026-08-21).
// Kullanıcı talebi: "Değerleme bölümünde Seçili Taşınmazlara Kopyala
// butonu olsun burada zaten alan bilgisi bağımsız bölüm özellikleri
// kısmından geliyor. kalan kısımları kullanıcı kopyalayabilsin hesaplama
// ile ulaşılan kısımlar hariç yapı değeri zaten yapı sınıfından geliyor
// yıpranma payı yapı yaşından geliyor bunlar otomatik gelmeli." —
// test-unit-copy-to-selected.js/test-land-copy-to-selected.js'in AYNI
// "bir kez snapshot al, seçili hedeflere yaz" mekaniği, TEK gerçek fark:
// getValuationCopyableFieldKeys() ÇOK DAR bir liste (yalnızca 4 ana
// "Değer" alanı + eşleşen manuel-geçersiz-kılma bayrakları) — alan/M2
// birim/Yapı Değeri ailesi BİLEREK KAPSAM DIŞI (bkz. app.js'teki
// getValuationCopyableFieldKeys yorumu).
//
// Bu test kapsamı:
//  1) Yalnızca getValuationCopyableFieldKeys()'teki alanlar kopyalanır;
//     alan (legalValueArea), M2 birim değeri (legalValueUnit), Yapı
//     Değeri (legalBuildingValue) gibi HARİÇ tutulan alanlar KOPYALANMAZ.
//  2) Manuel-geçersiz-kılma bayrağı (legalValueComparableAutoManual),
//     eşleştiği değerle (legalValue) BİRLİKTE kopyalanır — bayraksız
//     kopya, hedefte bir sonraki otomatik senkronun değeri SESSİZCE
//     ezmesine yol açardı.
//  3) Aktif/kaynak taşınmaz listede olsa bile ETKİLENMEZ.
//  4) Aktif taşınmaz index 0 DEĞİLKEN hedef index 0 -> primaryTitleUnitShadow.
//  5) Geçersiz/aralık-dışı/tekrarlı index'ler sessizce atlanır.
//  6) appliedCount doğru (boş/undefined/null girişte 0 dahil).
//  7) renderSection() gate'i kaynak-düzeyinde doğru kablolu.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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

const functionNames = [
  "createEmptyTitleUnit",
  "getTitleUnitCount",
  "resolveTitleUnitWriteTarget",
  "getValuationCopyableFieldKeys",
  "applyValuationDataToSelectedTitleUnits",
];

const sandboxSource = `
  let state = {};
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getValuationCopyableFieldKeys,
    applyValuationDataToSelectedTitleUnits,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function freshState(overrides = {}) {
  return {
    fields: { requestType: "Çoklu Talep" },
    tables: {},
    titleUnits: [
      { fields: {}, tables: {} },
      { fields: {}, tables: {} },
    ],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) Yalnızca kopyalanabilir alanlar kopyalanır; alan/M2 birim/Yapı ----
// Değeri gibi hariç tutulanlar KOPYALANMAZ.
{
  const keys = fns.getValuationCopyableFieldKeys();
  assert.deepEqual(keys.sort(), [
    "currentRent", "currentRentComparableAutoManual",
    "currentValue", "currentValueComparableAutoManual", "currentValueUserDefined",
    "legalRent", "legalRentComparableAutoManual",
    "legalValue", "legalValueComparableAutoManual", "legalValueUserDefined",
  ].sort(), "getValuationCopyableFieldKeys() yalnızca 4 ana Değer alanı + eşleşen bayraklardan oluşmalı.");
  ["legalValueArea", "currentValueArea", "legalValueUnit", "currentValueUnit",
    "legalUrgentSaleValue", "currentUrgentSaleValue", "legalBuildingValue", "currentBuildingValue",
    "legalBuildingUnitCost", "legalBuildingDepreciationRate", "insuranceValue", "landValue", "landUnitValue"]
    .forEach((excludedKey) => {
      assert.ok(!keys.includes(excludedKey), `"${excludedKey}" kopyalanabilir alanlar listesinde OLMAMALI (hesaplama ile ulaşılıyor / Bağımsız Bölüm'den geliyor).`);
    });

  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      legalValue: "500.000", legalValueArea: "100", legalValueUnit: "5.000",
      legalBuildingValue: "300.000", legalBuildingUnitCost: "3.000",
    },
    titleUnits: [{ fields: { legalValue: "ESKI", legalValueArea: "ESKI-ALAN", legalBuildingValue: "ESKI-YAPI" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyValuationDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1, "Yalnizca 1 hedefe uygulanmali.");
  const targetFields = fns.getState().titleUnits[0].fields;
  assert.equal(targetFields.legalValue, "500.000", "legalValue kopyalanmali.");
  assert.equal(targetFields.legalValueArea, "ESKI-ALAN", "legalValueArea (Bagimsiz Bolum'den senkron) KOPYALANMAMALI, degismeden kalmali.");
  assert.equal(targetFields.legalValueUnit, undefined, "legalValueUnit (M2 birim degeri, computed) hic yazilmamali.");
  assert.equal(targetFields.legalBuildingValue, "ESKI-YAPI", "legalBuildingValue (Yapi Sinifi'ndan hesaplanan) KOPYALANMAMALI, degismeden kalmali.");

  console.log("Yalnizca kopyalanabilir alanlarin kopyalanmasi (alan/M2 birim/Yapi Degeri haric) testi tamam.");
}

// --- 2) Manuel-gecersiz-kilma bayragi, esleştigi degerle BIRLIKTE --------
// kopyalanir.
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      legalValue: "999.999", legalValueComparableAutoManual: "1", legalValueUserDefined: "1",
      currentValue: "1.111.111", // bayraksiz -> otomatik hesaplanmis, hedefte de bayraksiz kalmali
    },
    titleUnits: [{ fields: {}, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  fns.applyValuationDataToSelectedTitleUnits([1]);
  const targetFields = fns.getState().titleUnits[0].fields;
  assert.equal(targetFields.legalValue, "999.999", "legalValue kopyalanmali.");
  assert.equal(targetFields.legalValueComparableAutoManual, "1", "Manuel bayrak DEGERLE BIRLIKTE kopyalanmali (aksi halde hedefte sessizce ezilirdi).");
  assert.equal(targetFields.legalValueUserDefined, "1", "UserDefined bayragi da kopyalanmali.");
  assert.equal(targetFields.currentValue, "1.111.111", "currentValue kopyalanmali.");
  assert.equal(targetFields.currentValueComparableAutoManual, undefined, "Bayraksiz (otomatik) kaynak deger, hedefte de bayraksiz kalmali (hedef kendi comparables'indan hesaplamaya devam eder).");

  console.log("Manuel-gecersiz-kilma bayraginin degerle birlikte kopyalanmasi testi tamam.");
}

// --- 3) Aktif/kaynak tasinmaz listede olsa bile ETKILENMEZ ---------------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", legalValue: "500.000" },
    titleUnits: [{ fields: { legalValue: "ESKI-1" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyValuationDataToSelectedTitleUnits([0, 1]);
  assert.equal(appliedCount, 1, "Aktif/kaynak index sayilmamali, yalnizca gercek hedef (1) sayilmali.");
  assert.equal(fns.getState().fields.legalValue, "500.000", "REGRESYON: Aktif/kaynak tasinmazin KENDI verisi degismemeli.");

  console.log("Aktif/kaynak tasinmaz kendine kopyalamada etkilenmiyor testi tamam.");
}

// --- 4) Aktif taşınmaz index 0 DEĞİLKEN, hedef index 0 -> primaryTitleUnitShadow
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", legalValue: "500.000" },
    titleUnits: [
      { fields: {}, tables: {} }, // index 1 (aktif)
      { fields: {}, tables: {} }, // index 2
    ],
    activeTitleUnitIndex: 1,
    primaryTitleUnitShadow: null,
  });
  fns.setState(state);

  const appliedCount = fns.applyValuationDataToSelectedTitleUnits([0]);
  assert.equal(appliedCount, 1, "index 0 hedefine basariyla uygulanmali.");
  const afterState = fns.getState();
  assert.ok(afterState.primaryTitleUnitShadow, "primaryTitleUnitShadow lazy-create edilmeli.");
  assert.equal(afterState.primaryTitleUnitShadow.fields.legalValue, "500.000", "primaryTitleUnitShadow.fields'e kopyalanmali.");

  console.log("Aktif tasinmaz index 0 disindayken primaryTitleUnitShadow yazimi testi tamam.");
}

// --- 5) Gecersiz/araligi-disi/tekrarli index'ler sessizce atlanir --------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", legalValue: "500.000" },
    titleUnits: [{ fields: {}, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyValuationDataToSelectedTitleUnits([-1, 1.5, 99, 1, 1]);
  assert.equal(appliedCount, 1, "Yalnizca tek gecerli, tekil hedef (1) sayilmali; gecersiz/tekrarli olanlar atlanmali.");
  assert.equal(fns.getState().titleUnits[0].fields.legalValue, "500.000", "Gecerli hedefe (1) yine de dogru kopyalanmali.");

  console.log("Gecersiz/araligi-disi/tekrarli index'lerin sessizce atlanmasi testi tamam.");
}

// --- 6) appliedCount = 0 durumlari (bos/undefined/null girdi) -------------
{
  const state = freshState();
  fns.setState(state);
  assert.equal(fns.applyValuationDataToSelectedTitleUnits([]), 0, "Bos dizi girdisinde 0 donmeli.");
  assert.equal(fns.applyValuationDataToSelectedTitleUnits(undefined), 0, "undefined girdisinde 0 donmeli.");
  assert.equal(fns.applyValuationDataToSelectedTitleUnits(null), 0, "null girdisinde 0 donmeli.");
  console.log("Bos/undefined/null girdide appliedCount=0 testi tamam.");
}

// --- 7) renderSection() gate'i kaynak-duzeyinde dogru kablolu -------------
{
  assert.match(
    appSource,
    /if \(section\.id === "valuation" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createValuationCopyToSelectedControl\(\)\] \}\)\);\s*\n\s*body\.append\(createValuationUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'valuation' icin createValuationCopyToSelectedControl()'u createTitleUnitTabBar()'in extraActions'ina eklemiyor."
  );
  console.log("renderSection valuation seciliye-kopyala gate kaynak-duzeyi kablolama testi tamam.");
}

console.log("Degerleme secili-tasinmazlara-kopyala testleri basarili.");
