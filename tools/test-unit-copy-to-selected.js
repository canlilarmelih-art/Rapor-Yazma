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

function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit dizi bulunamadı: ${name}`);
  const bracketStart = appSource.indexOf("[", start);
  let depth = 0;
  let index = bracketStart;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  assert(depth === 0, `Sabit dizi kapanmadı: ${name}`);
  const semicolonIndex = appSource.indexOf(";", index);
  return appSource.slice(start, semicolonIndex + 1);
}

const functionNames = [
  "createEmptyTitleUnit",
  "getTitleUnitCount",
  "resolveTitleUnitWriteTarget",
  "resolveTitleUnitUnitFloorsRowsWriteTarget",
  "getUnitSectionFieldKeys",
  "applyUnitDataToSelectedTitleUnits",
  // Dekoratif Ozellikler "Secili Tasinmazlara Kopyala" (2026-08-27).
  "getUnitDecorativeFieldKeys",
  "applyUnitDecorativeDataToSelectedTitleUnits",
];

// unitGeneralDecorativeFields/unitBathroomFixtureFields KENDI icinde
// unitKitchenCabinetOptions/vb. secenek dizilerine bagli - bu testin
// kapsami DEGIL (yalnizca .key okunuyor), hafif bos-dizi stub'lariyla
// degistirilir (diger test dosyalarindaki AYNI "kapsam disi agir
// bagimlilik" ilkesi).
const sandboxSource = `
  let state = {};
  let sections = [
    { id: "unit", fields: [{ key: "legalArea" }, { key: "currentArea" }] },
  ];
  const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["transport", "nearby", "environmentDescription"]);
  const unitKitchenCabinetOptions = [];
  const unitKitchenCounterOptions = [];
  const unitBathroomFixtureOptions = [];
  const unitMaterialQualityOptions = [];
  ${extractConstArray("unitWallFloorRows")}
  ${extractConstArray("unitGeneralDecorativeFields")}
  ${extractConstArray("unitBathroomFixtureFields")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getUnitSectionFieldKeys,
    resolveTitleUnitUnitFloorsRowsWriteTarget,
    applyUnitDataToSelectedTitleUnits,
    getUnitDecorativeFieldKeys,
    applyUnitDecorativeDataToSelectedTitleUnits,
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

// --- 8) getUnitDecorativeFieldKeys(): Dekoratif Ozellikler panelinin ------
// TUM alanlarini (duvar/zemin + genel dekoratif + vitrifiye + aciklama)
// icerir, "unit" bolumunun DIGER (genel/alan-ic mekan) alanlarini ICERMEZ.
{
  const keys = fns.getUnitDecorativeFieldKeys();
  [
    "unitSalonFloor", "unitSalonWall", "unitRoomFloor", "unitRoomWall", "unitHallFloor", "unitHallWall",
    "unitKitchenFloor", "unitKitchenWall", "unitWetFloor", "unitWetWall", "unitBalconyFloor", "unitBalconyWall",
    "unitWindows", "unitExteriorDoor", "unitInteriorDoors", "unitKitchenCabinet", "unitKitchenCounter", "unitMaterialQuality",
    "unitBathroomFixture1", "unitBathroomFixture2", "unitBathroomFixture3",
    "unitDecorativeDescription", "unitDecorativeDescriptionManual",
  ].forEach((key) => {
    assert.ok(keys.includes(key), `"${key}" getUnitDecorativeFieldKeys()'te OLMALI.`);
  });
  ["unitUsageStatus", "facades", "unitFloor", "unitInteriorDescription", "legalArea"].forEach((key) => {
    assert.ok(!keys.includes(key), `"${key}" Dekoratif Ozellikler paneline AIT DEGIL, getUnitDecorativeFieldKeys()'te OLMAMALI.`);
  });
  // getUnitSectionFieldKeys() bu listeyi TEK kaynaktan (spread) kullanmali -
  // ikisi arasinda drift olmamali (AGENTS.md'deki "iki ayri liste" uyarisi).
  const sectionKeys = fns.getUnitSectionFieldKeys();
  keys.forEach((key) => {
    assert.ok(sectionKeys.includes(key), `getUnitSectionFieldKeys() getUnitDecorativeFieldKeys()'in TAMAMINI icermeli - "${key}" eksik.`);
  });
  console.log("getUnitDecorativeFieldKeys() icerik + getUnitSectionFieldKeys() ile TEK-kaynak testi tamam.");
}

// --- 9) applyUnitDecorativeDataToSelectedTitleUnits(): yalnizca Dekoratif -
// Ozellikler alanlari kopyalanir, DIGER "unit" alanlari (facades vb.)
// ETKILENMEZ, unitFloors tablosuna DOKUNULMAZ.
{
  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      unitUsageStatus: "ESKI-AKTIF", facades: "ESKI-AKTIF-CEPHE",
      unitSalonFloor: "Seramik", unitSalonWall: "Saten Boya",
      unitWindows: "PVC", unitKitchenCabinet: "Lake",
      unitBathroomFixture1: "Lavabo",
      unitDecorativeDescription: "Aktif tasinmazin dekoratif aciklamasi.", unitDecorativeDescriptionManual: "Evet",
    },
    tables: { unitFloors: [{ floorName: "Zemin", legalArea: "100" }] },
    titleUnits: [
      {
        fields: {
          unitUsageStatus: "HEDEF-ESKI", facades: "HEDEF-ESKI-CEPHE",
          unitSalonFloor: "ESKI", unitWindows: "ESKI",
        },
        tables: { unitFloors: [{ floorName: "HEDEF-ESKI" }] },
      },
    ],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyUnitDecorativeDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1, "Tek hedefe uygulanmali.");

  const afterState = fns.getState();
  assert.equal(afterState.titleUnits[0].fields.unitSalonFloor, "Seramik", "Dekoratif alan (unitSalonFloor) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitSalonWall, "Saten Boya", "Dekoratif alan (unitSalonWall) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitWindows, "PVC", "Dekoratif alan (unitWindows) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitKitchenCabinet, "Lake", "Dekoratif alan (unitKitchenCabinet) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitBathroomFixture1, "Lavabo", "Dekoratif alan (unitBathroomFixture1) kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitDecorativeDescription, "Aktif tasinmazin dekoratif aciklamasi.", "Uretilen aciklama da kopyalanmali.");
  assert.equal(afterState.titleUnits[0].fields.unitDecorativeDescriptionManual, "Evet", "Manuel-gecersiz-kilma bayragi da (deger ile birlikte) kopyalanmali.");

  assert.equal(afterState.titleUnits[0].fields.unitUsageStatus, "HEDEF-ESKI", "REGRESYON: Dekoratif OLMAYAN alan (unitUsageStatus) ETKILENMEMELI.");
  assert.equal(afterState.titleUnits[0].fields.facades, "HEDEF-ESKI-CEPHE", "REGRESYON: Dekoratif OLMAYAN alan (facades) ETKILENMEMELI.");
  assert.deepEqual(afterState.titleUnits[0].tables.unitFloors, [{ floorName: "HEDEF-ESKI" }], "REGRESYON: unitFloors tablosuna DOKUNULMAMALI (bu panelin kapsami DISINDA).");

  console.log("applyUnitDecorativeDataToSelectedTitleUnits() secili-hedef + kapsam-disi korunma testi tamam.");
}

// --- 10) applyUnitDecorativeDataToSelectedTitleUnits(): aktif/kaynak ------
// tasinmaz kendine kopyalamada etkilenmez; bos/undefined girdide 0.
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", unitSalonFloor: "Seramik" },
    titleUnits: [{ fields: { unitSalonFloor: "ESKI" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyUnitDecorativeDataToSelectedTitleUnits([0, 1]);
  assert.equal(appliedCount, 1, "Aktif/kaynak index (0) sayilmamali, yalnizca gercek hedef (1) sayilmali.");
  assert.equal(fns.getState().fields.unitSalonFloor, "Seramik", "REGRESYON: Aktif/kaynak tasinmazin KENDI verisi degismemeli.");

  assert.equal(fns.applyUnitDecorativeDataToSelectedTitleUnits([]), 0, "Bos dizi girdisinde 0 donmeli.");
  assert.equal(fns.applyUnitDecorativeDataToSelectedTitleUnits(undefined), 0, "undefined girdisinde 0 donmeli.");

  console.log("applyUnitDecorativeDataToSelectedTitleUnits() aktif-tasinmaz-korumasi + bos-girdi testi tamam.");
}

// --- 11) Kaynak-duzeyi kablolama: buton, modal ve createUnitDecorativePanel'e
// ekleme dogru mu? ------------------------------------------------------
{
  assert.match(
    appSource,
    /function createUnitDecorativePanel\(\)[\s\S]*?if \(state\.fields\.requestType === "Çoklu Talep" && getTitleUnitCount\(\) > 1\) \{\s*\n\s*panel\.append\(createUnitDecorativeCopyToSelectedControl\(\)\);/,
    "createUnitDecorativePanel() createUnitDecorativeCopyToSelectedControl()'u (2+ tasinmazken) eklemiyor."
  );
  assert.match(
    appSource,
    /createUnitDecorativeCopyToSelectedControl[\s\S]{0,600}openUnitDecorativeCopyToSelectedModal/,
    "createUnitDecorativeCopyToSelectedControl() openUnitDecorativeCopyToSelectedModal()'u acmiyor."
  );
  assert.match(
    appSource,
    /data-unit-decorative-copy-save[\s\S]{0,300}applyUnitDecorativeDataToSelectedTitleUnits/,
    "openUnitDecorativeCopyToSelectedModal()'in Kaydet butonu applyUnitDecorativeDataToSelectedTitleUnits()'i cagirmiyor."
  );
  console.log("Dekoratif Ozellikler secili-tasinmazlara-kopyala kaynak-duzeyi kablolama testi tamam.");
}

console.log("Bagimsiz Bolum secili-tasinmazlara-kopyala testleri basarili.");
