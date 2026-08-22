// "Arsa Özellikleri" (land): Seçili taşınmazlara kopyala (2026-08-21).
// Kullanıcı talebi: "bağımsız bölüm bilgileri için uyguladığımız bu
// yöntemi arsa özellikleri içinde aynı mantık ile uygulayalım" —
// tools/test-unit-copy-to-selected.js'in BİREBİR ikizi, TEK fark:
// getLandSectionFieldKeys()'in özel `landAgriculturalProductItems`
// istisnası (her hedefin KENDİ kopyalanmış landArea'sıyla totalCount
// yeniden hesaplanır — applyLandDataToAllTitleUnits ile TUTARLI).
//
// Bu test kapsamı:
//  1) Seçili hedeflere skaler + dizi (landRoadFrontageItems gibi, aynen
//     kopyalanan) alanlar doğru uygulanır; seçilmeyenler ETKİLENMEZ.
//  2) landAgriculturalProductItems: HER kaydın totalCount'u hedefin KENDİ
//     (yeni kopyalanmış) landArea'sına göre yeniden hesaplanır.
//  3) Aktif/kaynak taşınmaz listede olsa bile ETKİLENMEZ.
//  4) Aktif taşınmaz index 0 DEĞİLKEN hedef index 0 -> primaryTitleUnitShadow.
//  5) Geçersiz/aralık-dışı/tekrarlı index'ler sessizce atlanır.
//  6) appliedCount doğru (boş/undefined girişte 0 dahil).
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
  "getLandSectionFieldKeys",
  "parseReportNumber",
  "roundAgriculturalTreeCount",
  "calculateAgriculturalTotalCount",
  "applyLandDataToSelectedTitleUnits",
];

const sandboxSource = `
  let state = {};
  let sections = [
    { id: "land", fields: [{ key: "landShape" }, { key: "landArea" }] },
  ];
  const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["landNote", "landClimateEarthquakeExplanation"]);
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getLandSectionFieldKeys,
    applyLandDataToSelectedTitleUnits,
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

// --- 1) Skaler + "aynen kopyalanan" dizi alanları, secili hedeflere ------
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      landShape: "Dikdörtgen", landArea: "1000",
      landRoadFrontageItems: [{ type: "Asfalt Yol", length: "20" }],
    },
    titleUnits: [
      { fields: { landShape: "ESKI-1" }, tables: {} },
      { fields: { landShape: "ESKI-2" }, tables: {} },
    ],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyLandDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1, "Yalnizca 1 hedefe uygulanmali.");

  const afterState = fns.getState();
  assert.equal(afterState.titleUnits[0].fields.landShape, "Dikdörtgen", "Secili hedefe (index 1) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.landArea, "1000", "landArea da kopyalanmali.");
  assert.deepEqual(afterState.titleUnits[0].fields.landRoadFrontageItems, [{ type: "Asfalt Yol", length: "20" }], "landRoadFrontageItems (aynen kopyalanan dizi) hedefe uygulanmali.");
  assert.equal(afterState.titleUnits[1].fields.landShape, "ESKI-2", "REGRESYON: secilmeyen hedef (index 2) ETKILENMEMELI.");

  console.log("Skaler + aynen-kopyalanan dizi alanlarinin secili hedeflere uygulanmasi testi tamam.");
}

// --- 2) landAgriculturalProductItems: HEDEFIN KENDI landArea'siyla YENIDEN
// hesaplanan totalCount (applyLandDataToAllTitleUnits ile TUTARLI istisna)
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      landArea: "2000", // kaynak (aktif) tasinmazin alani
      landAgriculturalProductItems: [{ type: "Zeytin", unitCount: "10", totalCount: "ESKI-DEGER" }],
    },
    titleUnits: [
      { fields: {}, tables: {} }, // index 1: kopyalama SONRASI landArea = 2000 (kopyalanan) olacak
    ],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyLandDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1);

  const targetItems = fns.getState().titleUnits[0].fields.landAgriculturalProductItems;
  assert.equal(targetItems.length, 1);
  assert.equal(targetItems[0].type, "Zeytin", "Kayit alanlari (type vb.) aynen kopyalanmali.");
  // calculateAgriculturalTotalCount(10, 2000) = round((2000/1000)*10 / 10) * 10 = round(20/10)*10 = 20 -> "20"
  assert.equal(targetItems[0].totalCount, "20", "totalCount, HEDEFIN (yeni kopyalanmis) landArea'siyla YENIDEN hesaplanmali, kaynaktan AYNEN kopyalanmamali.");

  console.log("landAgriculturalProductItems hedef-landArea'siyla yeniden hesaplama testi tamam.");
}

// --- 3) Aktif/kaynak tasinmaz listede olsa bile ETKILENMEZ ---------------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", landShape: "Dikdörtgen" },
    titleUnits: [{ fields: { landShape: "ESKI-1" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyLandDataToSelectedTitleUnits([0, 1]);
  assert.equal(appliedCount, 1, "Aktif/kaynak index sayilmamali, yalnizca gercek hedef (1) sayilmali.");
  assert.equal(fns.getState().fields.landShape, "Dikdörtgen", "REGRESYON: Aktif/kaynak tasinmazin KENDI verisi degismemeli.");

  console.log("Aktif/kaynak tasinmaz kendine kopyalamada etkilenmiyor testi tamam.");
}

// --- 4) Aktif taşınmaz index 0 DEĞİLKEN, hedef index 0 -> primaryTitleUnitShadow
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", landShape: "Dikdörtgen" },
    titleUnits: [
      { fields: {}, tables: {} }, // index 1 (aktif)
      { fields: {}, tables: {} }, // index 2
    ],
    activeTitleUnitIndex: 1,
    primaryTitleUnitShadow: null,
  });
  fns.setState(state);

  const appliedCount = fns.applyLandDataToSelectedTitleUnits([0]);
  assert.equal(appliedCount, 1, "index 0 hedefine basariyla uygulanmali.");
  const afterState = fns.getState();
  assert.ok(afterState.primaryTitleUnitShadow, "primaryTitleUnitShadow lazy-create edilmeli.");
  assert.equal(afterState.primaryTitleUnitShadow.fields.landShape, "Dikdörtgen", "primaryTitleUnitShadow.fields'e kopyalanmali.");

  console.log("Aktif tasinmaz index 0 disindayken primaryTitleUnitShadow yazimi testi tamam.");
}

// --- 5) Gecersiz/araligi-disi/tekrarli index'ler sessizce atlanir --------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", landShape: "Dikdörtgen" },
    titleUnits: [{ fields: {}, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyLandDataToSelectedTitleUnits([-1, 1.5, 99, 1, 1]);
  assert.equal(appliedCount, 1, "Yalnizca tek gecerli, tekil hedef (1) sayilmali; gecersiz/tekrarli olanlar atlanmali.");
  assert.equal(fns.getState().titleUnits[0].fields.landShape, "Dikdörtgen", "Gecerli hedefe (1) yine de dogru kopyalanmali.");

  console.log("Gecersiz/araligi-disi/tekrarli index'lerin sessizce atlanmasi testi tamam.");
}

// --- 6) appliedCount = 0 durumlari (bos/undefined girdi) ------------------
{
  const state = freshState();
  fns.setState(state);
  assert.equal(fns.applyLandDataToSelectedTitleUnits([]), 0, "Bos dizi girdisinde 0 donmeli.");
  assert.equal(fns.applyLandDataToSelectedTitleUnits(undefined), 0, "undefined girdisinde 0 donmeli.");
  assert.equal(fns.applyLandDataToSelectedTitleUnits(null), 0, "null girdisinde 0 donmeli.");
  console.log("Bos/undefined/null girdide appliedCount=0 testi tamam.");
}

// --- 7) renderSection() gate'i kaynak-duzeyinde dogru kablolu -------------
// (2026-08-21 devam: "arsa özelliklerindeki butonu da taşı" — buton artık
// AYRI bir body.append(...) DEĞİL, createTitleUnitTabBar()'a extraActions
// olarak veriliyor. Kullanıcı takip talebi (2026-08-22): "tümüne uygula
// butonlarını seçili taşınmazlara uygula olarak değiştirelim" — eski
// "Tümüne uygula" checkbox'ı (createLandApplyAllControl) BURADAN
// KALDIRILDI, createLandCopyToSelectedControl() artık TEK araç.)
{
  assert.match(
    appSource,
    /if \(section\.id === "land" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep" && isPlanningScopedByAdaParsel\(\)\) \{[\s\S]*?body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createLandCopyToSelectedControl\(\)\] \}\)\);\s*\n\s*body\.append\(createLandUnitsSummaryTablePreview\(\)\);/,
    "renderSection() 'land' gate'i createLandCopyToSelectedControl()'u createTitleUnitTabBar()'in extraActions'ina eklemiyor."
  );
  // Yalnızca CANLI tanım/çağrı kalmadığını doğrular — tarihsel yorumlarda
  // adı geçmeye devam edebilir (bilinçli, bkz. app.js yorumu).
  assert.doesNotMatch(
    appSource,
    /function createLandApplyAllControl\(/,
    "REGRESYON: eski 'Tümüne uygula' checkbox fonksiyonu (createLandApplyAllControl) ARTIK TANIMLI OLMAMALI."
  );
  assert.doesNotMatch(
    appSource,
    /body\.append\(createLandApplyAllControl\(\)\)/,
    "REGRESYON: eski 'Tümüne uygula' checkbox'ı (createLandApplyAllControl) ARTIK ÇAĞRILMAMALI."
  );
  console.log("renderSection land seciliye-kopyala gate kaynak-duzeyi kablolama testi tamam.");
}

console.log("Arsa Ozellikleri secili-tasinmazlara-kopyala testleri basarili.");
