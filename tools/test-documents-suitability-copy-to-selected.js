// "Belgeler ve Proje" (documents): Proje Uygunluk Özeti çift taraflı
// tablosu için Seçili Taşınmazlara Kopyala (2026-08-26). Kullanıcı talebi:
// "seçili taşınmazlara uygula kısmını belgeler ve proje kısmında çift
// taraflı tablomuz için uygulayalım" — Land/İmar/Unit/Değerleme'nin AYNI
// "bir kez snapshot al, seçili hedeflere yaz" mekaniği (bkz.
// test-valuation-copy-to-selected.js), TEK gerçek fark:
// getDocumentsProjectSuitabilityCopyableFieldKeys() Taşınmazlar Proje
// Uygunluk Özeti tablosunun 3 EDİTLENEBİLİR sütunuyla (Proje Uygunluk
// Durumu/Açıklama/Basit Tadilat) BİREBİR SINIRLI — Bina Oturumu/Giriş VE
// "Tapu/Belediye Proje Farkı" varyantları (titleProjectSuitability*/
// municipalityProjectSuitability*) BİLİNÇLİ OLARAK KAPSAM DIŞI (bu tabloda
// hiç görünmüyorlar).
//
// Bu test kapsamı:
//  1) Yalnızca getDocumentsProjectSuitabilityCopyableFieldKeys()'teki 3
//     alan kopyalanır; footprint/entrance ve hasDifferentProjects
//     varyantları KOPYALANMAZ.
//  2) Aktif/kaynak taşınmaz listede olsa bile ETKİLENMEZ.
//  3) Aktif taşınmaz index 0 DEĞİLKEN hedef index 0 -> primaryTitleUnitShadow.
//  4) Geçersiz/aralık-dışı/tekrarlı index'ler sessizce atlanır.
//  5) appliedCount doğru (boş/undefined/null girişte 0 dahil).
//  6) createProjectSuitabilityUnitsSummaryTablePreview() paneli butonu
//     KENDİ İÇİNE ekliyor (renderSection'ın 3-dallı tab-çubuğu belirsizliği
//     yüzünden extraActions DEĞİL) — kaynak-düzeyi kablolama.
//  7) Kaydet sonrası hem tablo HEM DE "Proje İnceleme Açıklaması" tazeleniyor
//     (0.0.565'in commitTitleUnitsSummaryCellEdit düzeltmesiyle AYNI gerekçe).

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
  "getDocumentsProjectSuitabilityCopyableFieldKeys",
  "applyDocumentsProjectSuitabilityDataToSelectedTitleUnits",
];

const sandboxSource = `
  let state = {};
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getDocumentsProjectSuitabilityCopyableFieldKeys,
    applyDocumentsProjectSuitabilityDataToSelectedTitleUnits,
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

// --- 1) Yalnızca kopyalanabilir alanlar kopyalanır; footprint/entrance/ ---
// hasDifferentProjects varyantları KOPYALANMAZ.
{
  const keys = fns.getDocumentsProjectSuitabilityCopyableFieldKeys();
  assert.deepEqual(keys.sort(), ["projectConformity", "projectSuitabilitySimpleRepair", "projectSuitabilityStatus"], "getDocumentsProjectSuitabilityCopyableFieldKeys() yalnızca tablonun 3 sütunundan oluşmalı.");
  ["buildingFootprintReference", "buildingEntranceLevel", "buildingEntranceDirection",
    "titleProjectSuitabilityStatus", "titleProjectSuitabilityNote", "titleProjectSuitabilitySimpleRepair",
    "municipalityProjectSuitabilityStatus", "municipalityProjectSuitabilityNote", "municipalityProjectSuitabilitySimpleRepair",
    "mainRealEstateProjectSuitable", "mainRealEstateProjectSuitabilityNote"]
    .forEach((excludedKey) => {
      assert.ok(!keys.includes(excludedKey), `"${excludedKey}" kopyalanabilir alanlar listesinde OLMAMALI (bu tabloda hiç görünmüyor).`);
    });

  const state = freshState({
    fields: {
      requestType: "Çoklu Talep",
      projectSuitabilityStatus: "mimari olarak uygun değildir.",
      projectConformity: "10 m2 büyüme tespit edilmiştir.",
      projectSuitabilitySimpleRepair: "Evet",
      buildingFootprintReference: "A referansı",
    },
    titleUnits: [{ fields: { projectSuitabilityStatus: "ESKI", buildingFootprintReference: "ESKI-REF" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits([1]);
  assert.equal(appliedCount, 1, "Yalnizca 1 hedefe uygulanmali.");
  const targetFields = fns.getState().titleUnits[0].fields;
  assert.equal(targetFields.projectSuitabilityStatus, "mimari olarak uygun değildir.", "projectSuitabilityStatus kopyalanmali.");
  assert.equal(targetFields.projectConformity, "10 m2 büyüme tespit edilmiştir.", "projectConformity kopyalanmali.");
  assert.equal(targetFields.projectSuitabilitySimpleRepair, "Evet", "projectSuitabilitySimpleRepair kopyalanmali.");
  assert.equal(targetFields.buildingFootprintReference, "ESKI-REF", "buildingFootprintReference (bu tabloda YOK) KOPYALANMAMALI, degismeden kalmali.");

  console.log("Yalnizca kopyalanabilir alanlarin (3 sutun) kopyalanmasi testi tamam.");
}

// --- 2) Aktif/kaynak tasinmaz listede olsa bile ETKILENMEZ ---------------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", projectSuitabilityStatus: "uygundur." },
    titleUnits: [{ fields: { projectSuitabilityStatus: "ESKI-1" }, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits([0, 1]);
  assert.equal(appliedCount, 1, "Aktif/kaynak index sayilmamali, yalnizca gercek hedef (1) sayilmali.");
  assert.equal(fns.getState().fields.projectSuitabilityStatus, "uygundur.", "REGRESYON: Aktif/kaynak tasinmazin KENDI verisi degismemeli.");

  console.log("Aktif/kaynak tasinmaz kendine kopyalamada etkilenmiyor testi tamam.");
}

// --- 3) Aktif taşınmaz index 0 DEĞİLKEN, hedef index 0 -> primaryTitleUnitShadow
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", projectSuitabilityStatus: "uygundur." },
    titleUnits: [
      { fields: {}, tables: {} }, // index 1 (aktif)
      { fields: {}, tables: {} }, // index 2
    ],
    activeTitleUnitIndex: 1,
    primaryTitleUnitShadow: null,
  });
  fns.setState(state);

  const appliedCount = fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits([0]);
  assert.equal(appliedCount, 1, "index 0 hedefine basariyla uygulanmali.");
  const afterState = fns.getState();
  assert.ok(afterState.primaryTitleUnitShadow, "primaryTitleUnitShadow lazy-create edilmeli.");
  assert.equal(afterState.primaryTitleUnitShadow.fields.projectSuitabilityStatus, "uygundur.", "primaryTitleUnitShadow.fields'e kopyalanmali.");

  console.log("Aktif tasinmaz index 0 disindayken primaryTitleUnitShadow yazimi testi tamam.");
}

// --- 4) Gecersiz/araligi-disi/tekrarli index'ler sessizce atlanir --------
{
  const state = freshState({
    fields: { requestType: "Çoklu Talep", projectSuitabilityStatus: "uygundur." },
    titleUnits: [{ fields: {}, tables: {} }],
    activeTitleUnitIndex: 0,
  });
  fns.setState(state);

  const appliedCount = fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits([-1, 1.5, 99, 1, 1]);
  assert.equal(appliedCount, 1, "Yalnizca tek gecerli, tekil hedef (1) sayilmali; gecersiz/tekrarli olanlar atlanmali.");
  assert.equal(fns.getState().titleUnits[0].fields.projectSuitabilityStatus, "uygundur.", "Gecerli hedefe (1) yine de dogru kopyalanmali.");

  console.log("Gecersiz/araligi-disi/tekrarli index'lerin sessizce atlanmasi testi tamam.");
}

// --- 5) appliedCount = 0 durumlari (bos/undefined/null girdi) -------------
{
  const state = freshState();
  fns.setState(state);
  assert.equal(fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits([]), 0, "Bos dizi girdisinde 0 donmeli.");
  assert.equal(fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits(undefined), 0, "undefined girdisinde 0 donmeli.");
  assert.equal(fns.applyDocumentsProjectSuitabilityDataToSelectedTitleUnits(null), 0, "null girdisinde 0 donmeli.");
  console.log("Bos/undefined/null girdide appliedCount=0 testi tamam.");
}

// --- 6) createProjectSuitabilityUnitsSummaryTablePreview() butonu KENDI --
// PANELINE ekliyor (renderSection'ın 3-dallı tab-çubuğu belirsizliği
// yüzünden extraActions DEĞİL, bkz. app.js yorumu).
{
  const panelStart = appSource.indexOf("function createProjectSuitabilityUnitsSummaryTablePreview(");
  const panelEnd = appSource.indexOf("\nfunction ", panelStart + 1);
  const panelBody = appSource.slice(panelStart, panelEnd);
  assert.ok(
    panelBody.includes("wrap.append(createDocumentsProjectSuitabilityCopyToSelectedControl());"),
    "createProjectSuitabilityUnitsSummaryTablePreview() createDocumentsProjectSuitabilityCopyToSelectedControl()'u panelin kendisine eklemeli."
  );
  console.log("createProjectSuitabilityUnitsSummaryTablePreview() kaynak-duzeyi kablolama testi tamam.");
}

// --- 7) Kaydet sonrası hem tablo HEM DE Proje İnceleme Açıklaması ---------
// tazeleniyor (0.0.565 ile AYNI gerekçe).
{
  const modalStart = appSource.indexOf("function openDocumentsProjectSuitabilityCopyToSelectedModal(");
  const modalEnd = appSource.indexOf("\nfunction ", modalStart + 1);
  const modalBody = appSource.slice(modalStart, modalEnd);
  assert.ok(modalBody.includes("refreshProjectSuitabilityUnitsSummaryTablePreview();"), "Kaydet sonrasi tablo tazelenmeli.");
  assert.ok(modalBody.includes('refreshReviewedDocumentsDescriptionFromCurrentFields("projectSuitabilityStatus");'), "Kaydet sonrasi Proje Inceleme Aciklamasi da tazelenmeli (aksi halde 0.0.565'teki AYNI 'dinamik guncellenmiyor' hatasi burada da olurdu).");

  console.log("openDocumentsProjectSuitabilityCopyToSelectedModal() aciklama tazeleme kablolamasi testi tamam.");
}

console.log("Belgeler ve Proje (Proje Uygunluk Ozeti) secili-tasinmazlara-kopyala testleri basarili.");
