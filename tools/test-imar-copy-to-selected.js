// "İmar Durumu" (planning): Seçili taşınmazlara kopyala (2026-08-22).
// Kullanıcı talebi: "çoklu çalışmalarda farklı ada parsel yada aynı ada
// parsel çalışmalarında tümüne uygula butonlarını seçili taşınmazlara
// uygula olarak değiştirelim zaten seçili taşınmazlara uygula kısmında
// tümüne uygula seçeneği bulunuyor" — İmar Durumu'nun eski "TÜM
// taşınmazlara uygula" checkbox'ı (createImarApplyAllControl, KALDIRILDI)
// yerine Land/Unit/Değerleme'yle AYNI "Seçili Taşınmazlara Kopyala"
// deseni eklendi. tools/test-land-copy-to-selected.js'in BİREBİR ikizi,
// TEK fark: getImarSectionFieldKeys()'in özel `calculatedEmsal` istisnası
// (HER hedefin KENDİ landArea'sıyla composeImarCalculatedEmsal() ile
// yeniden hesaplanır — applyImarDataToAllTitleUnits ile TUTARLI, bkz.
// tools/test-title-unit-switch.js senaryo 21).
//
// Bu test kapsamı:
//  1) Seçili hedeflere skaler alanlar (kaks/floorCount/planCancellationStay)
//     doğru uygulanır; seçilmeyenler ETKİLENMEZ.
//  2) calculatedEmsal: kaynaktan AYNEN kopyalanmaz, hedefin KENDİ (var
//     olan) landArea'sıyla YENİDEN hesaplanır.
//  3) Aktif/kaynak taşınmaz listede olsa bile ETKİLENMEZ.
//  4) Aktif taşınmaz index 0 DEĞİLKEN hedef index 0 -> primaryTitleUnitShadow.
//  5) Geçersiz/aralık-dışı/tekrarlı index'ler sessizce atlanır.
//  6) appliedCount doğru (boş/undefined girişte 0 dahil).
//  7) renderSection() gate'i kaynak-düzeyinde doğru kablolu (eski "Tümüne
//     uygula" checkbox'ı artık ÇAĞRILMIYOR/TANIMLI DEĞİL).

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
  "getTitleUnitCount",
  "resolveTitleUnitWriteTarget",
  "getImarSectionFieldKeys",
  "parseReportNumber",
  "normalizeYesNoChoice",
  "foldTurkish",
  "formatImarSquareMeter",
  "composeImarCalculatedEmsal",
  "applyImarDataToSelectedTitleUnits",
];

const sandboxSource = `
  let state = {};
  let sections = [
    { id: "planning", fields: [{ key: "kaks" }, { key: "floorCount" }, { key: "planCancellationStay" }, { key: "hmax" }] },
  ];
  const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set([]);
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getImarSectionFieldKeys,
    applyImarDataToSelectedTitleUnits,
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

// --- 1) Skaler alanlar secili hedeflere uygulanir, secilmeyenler ETKILENMEZ
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      kaks: "2", floorCount: "4", planCancellationStay: "Hayır", hmax: "12.50",
    },
    titleUnits: [
      { fields: { kaks: "ESKI-1" }, tables: {} },
      { fields: { kaks: "ESKI-2" }, tables: {} },
    ],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyImarDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1, "Yalnizca 1 hedefe uygulanmali.");

  const afterState = fns.getState();
  assert.equal(afterState.titleUnits[0].fields.kaks, "2", "Secili hedefe (index 1) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.floorCount, "4", "floorCount da kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.hmax, "12.50", "hmax da kopyalanmali.");
  assert.equal(afterState.titleUnits[1].fields.kaks, "ESKI-2", "REGRESYON: secilmeyen hedef (index 2) ETKILENMEMELI.");

  console.log("Skaler alanlarin secili hedeflere uygulanmasi testi tamam.");
}

// --- 2) calculatedEmsal: HEDEFIN KENDI landArea'siyla YENIDEN hesaplanir --
// (aktiften AYNEN kopyalanmaz — applyImarDataToAllTitleUnits ile TUTARLI
// istisna, bkz. tools/test-title-unit-switch.js senaryo 21).
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      kaks: "2", landArea: "1000", calculatedEmsal: "YANLIS-KOPYALANMAMALI",
    },
    titleUnits: [
      // Hedefin (index 1) KENDI landArea'si aktiften FARKLI (500 vs 1000) —
      // dogru davranista bu YENI hesaba katilmali, aktifin "1000"i DEGIL.
      { fields: { landArea: "500" }, tables: {} },
    ],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyImarDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1);

  const target = fns.getState().titleUnits[0].fields;
  // kaks(2) * landArea(500) = 1000 m^2
  assert.notEqual(target.calculatedEmsal, "YANLIS-KOPYALANMAMALI", "Hesaplanan Emsal aktif tasinmazdan OLDUGU GIBI kopyalanmamali.");
  assert.equal(target.calculatedEmsal, "1.000 m²", `Hedefin KENDI landArea'siyla (500) YENIDEN hesaplanmis deger bekleniyordu, bulunan: ${target.calculatedEmsal}`);
  assert.equal(target.kaks, "2", "kaks alani normal sekilde (istisna DISINDA) kopyalanmali.");
  assert.equal(target.landArea, "500", "REGRESYON: hedefin KENDI landArea'si (kopyalanmayan bir alan) DEGISMEMELI.");

  console.log("calculatedEmsal hedef-landArea'siyla yeniden hesaplama testi tamam.");
}

// --- 3) Aktif/kaynak tasinmaz listede olsa bile ETKILENMEZ ---------------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", kaks: "2" },
    titleUnits: [{ fields: { kaks: "ESKI-1" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyImarDataToSelectedTitleUnits([0, 1]);
  assert.equal(appliedCount, 1, "Aktif/kaynak index sayilmamali, yalnizca gercek hedef (1) sayilmali.");
  assert.equal(fns.getState().fields.kaks, "2", "REGRESYON: Aktif/kaynak tasinmazin KENDI verisi degismemeli.");

  console.log("Aktif/kaynak tasinmaz kendine kopyalamada etkilenmiyor testi tamam.");
}

// --- 4) Aktif taşınmaz index 0 DEĞİLKEN, hedef index 0 -> primaryTitleUnitShadow
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", kaks: "2" },
    titleUnits: [
      { fields: {}, tables: {} }, // index 1 (aktif)
      { fields: {}, tables: {} }, // index 2
    ],
    activeTitleUnitIndex: 1,
    primaryTitleUnitShadow: null,
  });
  fns.setState(state);

  const appliedCount = fns.applyImarDataToSelectedTitleUnits([0]);
  assert.equal(appliedCount, 1, "index 0 hedefine basariyla uygulanmali.");
  const afterState = fns.getState();
  assert.ok(afterState.primaryTitleUnitShadow, "primaryTitleUnitShadow lazy-create edilmeli.");
  assert.equal(afterState.primaryTitleUnitShadow.fields.kaks, "2", "primaryTitleUnitShadow.fields'e kopyalanmali.");

  console.log("Aktif tasinmaz index 0 disindayken primaryTitleUnitShadow yazimi testi tamam.");
}

// --- 5) Gecersiz/araligi-disi/tekrarli index'ler sessizce atlanir --------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", kaks: "2" },
    titleUnits: [{ fields: {}, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyImarDataToSelectedTitleUnits([-1, 1.5, 99, 1, 1]);
  assert.equal(appliedCount, 1, "Yalnizca tek gecerli, tekil hedef (1) sayilmali; gecersiz/tekrarli olanlar atlanmali.");
  assert.equal(fns.getState().titleUnits[0].fields.kaks, "2", "Gecerli hedefe (1) yine de dogru kopyalanmali.");

  console.log("Gecersiz/araligi-disi/tekrarli index'lerin sessizce atlanmasi testi tamam.");
}

// --- 6) appliedCount = 0 durumlari (bos/undefined girdi) ------------------
{
  const state = freshState();
  fns.setState(state);
  assert.equal(fns.applyImarDataToSelectedTitleUnits([]), 0, "Bos dizi girdisinde 0 donmeli.");
  assert.equal(fns.applyImarDataToSelectedTitleUnits(undefined), 0, "undefined girdisinde 0 donmeli.");
  assert.equal(fns.applyImarDataToSelectedTitleUnits(null), 0, "null girdisinde 0 donmeli.");
  console.log("Bos/undefined/null girdide appliedCount=0 testi tamam.");
}

// --- 7) renderSection() gate'i kaynak-duzeyinde dogru kablolu -------------
// (2026-08-22: eski "Tümüne uygula" checkbox'ı (createImarApplyAllControl)
// KALDIRILDI, createImarCopyToSelectedControl() createTitleUnitTabBar()'in
// extraActions'ina veriliyor — Land/Unit/Değerleme ile AYNI desen.)
{
  assert.match(
    appSource,
    /if \(section\.id === "planning" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep" && isPlanningScopedByAdaParsel\(\)\) \{[\s\S]*?body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createImarCopyToSelectedControl\(\)\] \}\)\);\s*\n\s*body\.append\(createImarUnitsSummaryTablePreview\(\)\);/,
    "renderSection() 'planning' gate'i createImarCopyToSelectedControl()'u createTitleUnitTabBar()'in extraActions'ina eklemiyor."
  );
  assert.doesNotMatch(
    appSource,
    /function createImarApplyAllControl\(/,
    "REGRESYON: eski 'Tümüne uygula' checkbox fonksiyonu (createImarApplyAllControl) ARTIK TANIMLI OLMAMALI."
  );
  assert.doesNotMatch(
    appSource,
    /body\.append\(createImarApplyAllControl\(\)\)/,
    "REGRESYON: eski 'Tümüne uygula' checkbox'ı (createImarApplyAllControl) ARTIK ÇAĞRILMAMALI."
  );
  console.log("renderSection planning seciliye-kopyala gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 8) "Tümünü Seç" modal butonu gerçekten mevcut ------------------------
// (kullanıcının "seçili taşınmazlara uygula kısmında tümüne uygula
// seçeneği bulunuyor" gözlemini kaynak-düzeyinde doğrular.)
{
  assert.match(
    appSource,
    /data-imar-copy-select-all[\s\S]{0,20}>Tümünü Seç</,
    "İmar 'Seçili Taşınmazlara Kopyala' modalinde 'Tümünü Seç' butonu bulunmuyor."
  );
  console.log("Imar kopyala modali Tumunu Sec butonu testi tamam.");
}

console.log("Imar Durumu secili-tasinmazlara-kopyala testleri basarili.");
