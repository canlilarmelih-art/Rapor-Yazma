// "Bağımsız Bölüm Özellikleri" (unit): Seçili taşınmazlara kopyala
// (2026-08-20/21). Kullanıcı talebi: "1 adet bağımsız bölüm bilgisi
// tamamen doldurdum ben bunu tümüne uygula mantığında olacak şekilde
// diğer bağımsız bölümlere kolay kopyalamak istiyorum. ancak burada
// benim seçeceğim bağımsız bölümlere kopyalama yapılmalı tamamına değil.
// aktif bulunduğum bağımsız bölümün bilgilerini istediğim bağımsız
// bölümlere kopyalamak işin özeti." — İmar/Arsa'daki "tümüne uygula"
// (applyImarDataToAllTitleUnits/applyLandDataToAllTitleUnits) İLE AYNI
// "bir kez kopyala, sürekli senkron DEĞİL" mekaniği, TEK fark: hedefler
// TÜM taşınmazlar değil, çağıranın verdiği açık bir alt küme.
//
// Bu test kapsamı:
//  1) resolveTitleUnitUnitFloorsRowsWriteTarget(): 3 dal (aktif/index-0-
//     shadow/diğer), resolveTitleUnitBuildingFloorsRowsWriteTarget()'ın
//     BİREBİR ikizi.
//  2) applyUnitDataToSelectedTitleUnits(): yalnızca SEÇİLİ index'lerin
//     fields+unitFloors'u kopyalanır; seçilmeyenler ETKİLENMEZ; aktif/
//     kaynak taşınmaz listede olsa bile ETKİLENMEZ; aktif taşınmaz index
//     0 DEĞİLKEN hedef index 0 -> primaryTitleUnitShadow doğru yazılır
//     (lazy-create dahil); geçersiz/aralık-dışı/tekrarlı index'ler
//     sessizce atlanır; appliedCount doğru (boş/undefined girişte 0 dahil).
//  3) renderSection() gate'i kaynak-düzeyinde createUnitCopyToSelectedControl()'ü
//     de eklediğini doğrular.

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
  "resolveTitleUnitUnitFloorsRowsWriteTarget",
  "getUnitSectionFieldKeys",
  "applyUnitDataToSelectedTitleUnits",
];

const sandboxSource = `
  let state = {};
  let sections = [
    { id: "unit", fields: [{ key: "legalArea" }, { key: "currentArea" }] },
  ];
  const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["transport", "nearby", "environmentDescription"]);
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getUnitSectionFieldKeys,
    resolveTitleUnitUnitFloorsRowsWriteTarget,
    applyUnitDataToSelectedTitleUnits,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function freshState(overrides = {}) {
  return {
    fields: { requestType: "Çoklu Talep", unitUsageStatus: "Mesken", facades: "Kuzey, Güney" },
    tables: { unitFloors: [{ floorName: "Zemin", legalArea: "100" }] },
    titleUnits: [
      { fields: {}, tables: {} },
      { fields: {}, tables: {} },
    ],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) resolveTitleUnitUnitFloorsRowsWriteTarget(): 3 dal --------------
{
  const state = freshState({ activeTitleUnitIndex: 1, primaryTitleUnitShadow: null });
  fns.setState(state);

  // 1a) Aktif taşınmaz (index 1) -> state.tables.unitFloors.
  const activeRows = fns.resolveTitleUnitUnitFloorsRowsWriteTarget(1);
  assert.equal(activeRows, state.tables.unitFloors, "Aktif taşınmaz icin state.tables.unitFloors donmeli.");

  // 1b) index 0 (birincil, aktif DEĞİL) -> primaryTitleUnitShadow, lazy-create.
  const shadowRows = fns.resolveTitleUnitUnitFloorsRowsWriteTarget(0);
  assert.deepEqual(shadowRows, [], "index 0 icin primaryTitleUnitShadow.tables.unitFloors lazy-create ile bos dizi olmali.");
  assert.equal(fns.getState().primaryTitleUnitShadow.tables.unitFloors, shadowRows, "Dondurulen referans primaryTitleUnitShadow'daki ile ayni olmali.");

  // 1c) diger index (titleUnits[index-1]) -> lazy-create.
  const otherRows = fns.resolveTitleUnitUnitFloorsRowsWriteTarget(2);
  assert.deepEqual(otherRows, [], "diger index icin titleUnits[index-1].tables.unitFloors lazy-create ile bos dizi olmali.");

  console.log("resolveTitleUnitUnitFloorsRowsWriteTarget 3 dal testi tamam.");
}

// --- 2) applyUnitDataToSelectedTitleUnits(): yalnizca secili hedefler ----
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      unitUsageStatus: "Mesken", unitSalonFloor: "Seramik", facades: "Kuzey, Güney",
      legalArea: "120", currentArea: "115",
    },
    tables: { unitFloors: [{ floorName: "Zemin", residential: "1" }] },
    titleUnits: [
      { fields: { unitUsageStatus: "ESKI-1" }, tables: { unitFloors: [{ floorName: "ESKI-1" }] } },
      { fields: { unitUsageStatus: "ESKI-2" }, tables: { unitFloors: [{ floorName: "ESKI-2" }] } },
      { fields: { unitUsageStatus: "ESKI-3" }, tables: { unitFloors: [{ floorName: "ESKI-3" }] } },
    ],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  fns.setState(state);

  // Hedefler: index 1 (secili) ve index 2 (secili DEGIL); index 0 aktif/kaynak.
  const appliedCount = fns.applyUnitDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1, "Yalnizca 1 hedefe uygulanmali.");

  const afterState = fns.getState();
  assert.equal(afterState.titleUnits[0].fields.unitUsageStatus, "Mesken", "Secili hedefe (index 1, titleUnits[0]) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitSalonFloor, "Seramik", "Dekoratif alan da kopyalanmali.");
  assert.deepEqual(afterState.titleUnits[0].tables.unitFloors, [{ floorName: "Zemin", residential: "1" }], "unitFloors tablosu da kopyalanmali.");

  assert.equal(afterState.titleUnits[1].fields.unitUsageStatus, "ESKI-2", "REGRESYON: secilmeyen hedef (index 2) ETKILENMEMELI.");
  assert.deepEqual(afterState.titleUnits[1].tables.unitFloors, [{ floorName: "ESKI-2" }], "REGRESYON: secilmeyen hedefin unitFloors tablosu ETKILENMEMELI.");

  console.log("applyUnitDataToSelectedTitleUnits secili-hedef testi tamam.");
}

// --- 3) Kaynak/aktif tasinmaz listede olsa bile ETKILENMEZ ---------------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", unitUsageStatus: "Mesken" },
    titleUnits: [{ fields: { unitUsageStatus: "ESKI-1" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  // targetIndices'te YANLISLIKLA aktif index (0) de var.
  const appliedCount = fns.applyUnitDataToSelectedTitleUnits([0, 1]);
  assert.equal(appliedCount, 1, "Aktif/kaynak index sayilmamali, yalnizca gercek hedef (1) sayilmali.");
  assert.equal(fns.getState().fields.unitUsageStatus, "Mesken", "REGRESYON: Aktif/kaynak tasinmazin KENDI verisi degismemeli.");

  console.log("Aktif/kaynak tasinmaz kendine kopyalamada etkilenmiyor testi tamam.");
}

// --- 4) Aktif taşınmaz index 0 DEĞİLKEN, hedef index 0 -> primaryTitleUnitShadow
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", unitUsageStatus: "Mesken" },
    tables: { unitFloors: [{ floorName: "Zemin" }] },
    titleUnits: [
      { fields: {}, tables: {} }, // index 1 (aktif)
      { fields: {}, tables: {} }, // index 2
    ],
    activeTitleUnitIndex: 1,
    primaryTitleUnitShadow: null,
  });
  fns.setState(state);

  const appliedCount = fns.applyUnitDataToSelectedTitleUnits([0]);
  assert.equal(appliedCount, 1, "index 0 hedefine basariyla uygulanmali.");
  const afterState = fns.getState();
  assert.ok(afterState.primaryTitleUnitShadow, "primaryTitleUnitShadow lazy-create edilmeli.");
  assert.equal(afterState.primaryTitleUnitShadow.fields.unitUsageStatus, "Mesken", "primaryTitleUnitShadow.fields'e kopyalanmali.");
  assert.deepEqual(afterState.primaryTitleUnitShadow.tables.unitFloors, [{ floorName: "Zemin" }], "primaryTitleUnitShadow.tables.unitFloors'a kopyalanmali.");

  console.log("Aktif tasinmaz index 0 disindayken primaryTitleUnitShadow yazimi testi tamam.");
}

// --- 5) Gecersiz/araligi-disi/tekrarli index'ler sessizce atlanir --------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", unitUsageStatus: "Mesken" },
    titleUnits: [{ fields: {}, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  // getTitleUnitCount() = 2 (birincil + 1 ek). Gecersizler: -1, 1.5, 99, tekrar 1.
  const appliedCount = fns.applyUnitDataToSelectedTitleUnits([-1, 1.5, 99, 1, 1]);
  assert.equal(appliedCount, 1, "Yalnizca tek gecerli, tekil hedef (1) sayilmali; gecersiz/tekrarli olanlar atlanmali.");
  assert.equal(fns.getState().titleUnits[0].fields.unitUsageStatus, "Mesken", "Gecerli hedefe (1) yine de dogru kopyalanmali.");

  console.log("Gecersiz/araligi-disi/tekrarli index'lerin sessizce atlanmasi testi tamam.");
}

// --- 6) appliedCount = 0 durumlari (bos/undefined girdi) ------------------
{
  const state = freshState();
  fns.setState(state);
  assert.equal(fns.applyUnitDataToSelectedTitleUnits([]), 0, "Bos dizi girdisinde 0 donmeli.");
  assert.equal(fns.applyUnitDataToSelectedTitleUnits(undefined), 0, "undefined girdisinde 0 donmeli.");
  assert.equal(fns.applyUnitDataToSelectedTitleUnits(null), 0, "null girdisinde 0 donmeli.");
  console.log("Bos/undefined/null girdide appliedCount=0 testi tamam.");
}

// --- 7) renderSection() gate'i kaynak-duzeyinde dogru kablolu -------------
// (2026-08-21 devam: "seçili taşınmazlara kopyala butonunu bağımsız bölüm
// tablarının sonuna aynı punto ve biçimde taşı" — buton artık AYRI bir
// body.append(...) DEĞİL, createTitleUnitTabBar()'a extraActions olarak
// veriliyor, bkz. test-unit-units-summary-table.js'in AYNI kontrolü.)
{
  assert.match(
    appSource,
    /if \(section\.id === "unit" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createUnitCopyToSelectedControl\(\)\] \}\)\);/,
    "renderSection() 'unit' icin createUnitCopyToSelectedControl()'u createTitleUnitTabBar()'in extraActions'ina eklemiyor."
  );
  console.log("renderSection unit seciliye-kopyala gate kaynak-duzeyi kablolama testi tamam.");
}

console.log("Bagimsiz Bolum secili-tasinmazlara-kopyala testleri basarili.");
