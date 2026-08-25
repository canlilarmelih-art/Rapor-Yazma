// "Belgeler ve Proje": Blok → Bağımsız Bölüm 2 katmanlı tab yapısı
// (2026-08-19). Kullanıcı talebi: "diyelim ki taşınmazlar toplam 3 blokta
// yer alıyor. bu 3 bloğu blok bazında gruplandıralım. Belgeler ve proje
// bölümünde 3 adet tab açılsın. A Blok Tabı, B Blok Tabı C Blok Tabı." —
// bu, 0.0.479'un düz-tab+özet-tablo yaklaşımının YERİNE geçen GERÇEK bir
// 2 katmanlı tab yapısı, AMA YALNIZCA Dikey/Yatay Kat İrtifakı
// raporlarında (netleştirme: "bu bölümler müstakil binalar için
// geçerli... dikey ve yatay kat irtifakı için olacak").
//
// Bu test kapsamı:
//  1) computeDocumentsBlockGroups(): units'i blockNo+parcelNo+titleBlockName
//     üçlüsüne göre doğru gruplar (karışık üye sayılı bloklar dahil).
//  2) computeDocumentsBlockLabel(): titleBlockName doluysa onu, boşsa
//     "N. Blok" fallback'ini döner.
//  3) isDocumentsBlockGroupingActive(): YALNIZCA Çoklu Talep + 2+ taşınmaz
//     + Dikey/Yatay Kat İrtifakı + 2+ farklı blok varken true; Müstakil
//     Bina/Arsa/Tarla'da, tekil taşınmazda, tek blokta VEYA Tekli Talep'te
//     false.
//  4) syncDocumentsSharedDataToBlockSiblings(): AYNI bloktaki diğer
//     üyelere DOCUMENTS_BLOCK_SHARED_FIELD_KEYS'in TAMAMI + İncelenen
//     Belgeler tablosu kopyalanır; per-unit-only alanlar (projectSuitabilityStatus)
//     ASLA kopyalanmaz; FARKLI bloktaki üyeler ASLA etkilenmez; gate kapalıyken
//     (isDocumentsBlockGroupingActive false) no-op.

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

// app.js CRLF satır sonlarıyla saklanıyor — "[" / "]" derinliğine göre
// sabitin GERÇEK sonunu bulan yöntem (bkz. diğer test dosyalarındaki AYNI
// teknik).
function extractConst(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, index + 1)};`;
    }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "createEmptyTitleUnit",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "computeDocumentsBlockGroups",
  "computeDocumentsBlockLabel",
  "foldTurkish",
  "getOwnershipTypeText",
  "isCondominiumOwnershipTypeValue",
  "isCondominiumOwnershipType",
  "isDocumentsBlockGroupingActive",
  "resolveTitleUnitWriteTarget",
  "resolveTitleUnitDocumentsRowsWriteTarget",
  "syncDocumentsSharedDataToBlockSiblings",
  "applyDocumentsDataToAllBlocks",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik bunlara bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
];
const constNames = ["DOCUMENTS_BLOCK_SHARED_FIELD_KEYS"];

// normalizeReportTitleText (getOwnershipTypeText/isCondominiumOwnershipTypeValue'nun
// gerçek bağımlılığı) foldTurkish/toTitleCaseTr/preserveReportSpecialWords/
// normalizeReportWhitespace zincirine giriyor — bu testin kapsamı DEĞİL
// (o zaten mevcut/değişmeyen kod). Diğer test dosyalarındaki AYNI emsal
// (bkz. test-documents-units-summary-table.js normalizeReviewedDocumentRow
// stub'ı): kimlik (identity) fonksiyonuyla stub'lanır — foldTurkish zaten
// büyük harfe çeviriyor/Türkçe karakterleri katlıyor, girdi zaten "Dikey
// Kat İrtifakı" gibi doğru yazılmış test sabitleri olduğundan title-case
// adımı olmadan da fold+includes kontrolü doğru çalışır.
const sandboxSource = `
  let state = {};
  function normalizeReportTitleText(value) { return String(value || ""); }
  ${constNames.map(extractConst).join("\n")}
  // applyDocumentsDataToAllBlocks() (2026-08-25) app.js'te
  // DOCUMENTS_BLOCK_SHARED_FIELD_KEYS.filter(...) ile TÜRETİLİR (dizi
  // literal DEĞİL) - extractConst() yalnızca "const NAME = [" dizi
  // literallerini yakalar, bu yüzden GERÇEK filtre ifadesi burada birebir
  // kopyalanır (app.js'teki tanımla AYNI kalması gerekir).
  const DOCUMENTS_APPLY_TO_ALL_BLOCKS_FIELD_KEYS = DOCUMENTS_BLOCK_SHARED_FIELD_KEYS.filter(
    (key) => key !== "hasEkb" && !key.startsWith("ekb")
  );
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    computeDocumentsBlockGroups, computeDocumentsBlockLabel,
    isDocumentsBlockGroupingActive, isCondominiumOwnershipTypeValue,
    syncDocumentsSharedDataToBlockSiblings,
    applyDocumentsDataToAllBlocks,
    buildAllTitleUnitsForSummaryTable,
    getSharedKeys: () => DOCUMENTS_BLOCK_SHARED_FIELD_KEYS,
    getApplyToAllBlocksKeys: () => DOCUMENTS_APPLY_TO_ALL_BLOCKS_FIELD_KEYS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(blockNo, parcelNo, titleBlockName, overrides = {}, tables = {}) {
  return { fields: { blockNo, parcelNo, titleBlockName, ...overrides }, tables };
}

function freshState(overrides = {}) {
  return {
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    tables: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) computeDocumentsBlockGroups(): dogru gruplama --------------------
{
  const units = [
    unit("100", "1", "A Blok"),
    unit("100", "1", "A Blok"),
    unit("100", "1", "B Blok"),
    unit("200", "9", "A Blok"), // farkli parselde AYNI blok adi -> AYRI grup
  ];
  const groups = fns.computeDocumentsBlockGroups(units);
  assert.equal(groups.length, 3, `3 farkli blok grubu bekleniyordu, bulunan: ${groups.length}`);
  assert.equal(groups[0].unitIndices.length, 2, "A Blok grubunda 2 uye olmali.");
  assert.deepEqual(groups[0].unitIndices, [0, 1], "A Blok grubunun uye index'leri dogru olmali.");
  assert.equal(groups[1].unitIndices.length, 1, "B Blok grubunda 1 uye olmali.");
  assert.equal(groups[2].unitIndices.length, 1, "Farkli parseldeki 'A Blok' AYRI bir grup olmali (tesadufen ayni ad).");
  console.log("computeDocumentsBlockGroups dogru gruplama testi tamam.");
}

// --- 2) computeDocumentsBlockLabel(): titleBlockName / fallback -----------
{
  const groups = fns.computeDocumentsBlockGroups([unit("100", "1", "A Blok"), unit("100", "2", "")]);
  assert.equal(fns.computeDocumentsBlockLabel(groups[0], groups), "A Blok", "titleBlockName doluysa dogrudan o donmeli.");
  assert.equal(fns.computeDocumentsBlockLabel(groups[1], groups), "2. Blok", "titleBlockName bossa 'N. Blok' fallback'i donmeli.");
  console.log("computeDocumentsBlockLabel etiket testi tamam.");
}

// --- 3) isDocumentsBlockGroupingActive(): gate kosullari ------------------
{
  // 3a) Yatay Kat Irtifaki + Coklu Talep + 2 farkli blok -> true
  fns.setState(freshState({
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: {} }],
  }));
  assert.equal(fns.isDocumentsBlockGroupingActive(), true, "Yatay Kat Irtifaki + 2 farkli blok -> true bekleniyordu.");

  // 3b) Ayni blok (2+ tasinmaz olsa bile) -> false
  fns.setState(freshState({
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" }, tables: {} }],
  }));
  assert.equal(fns.isDocumentsBlockGroupingActive(), false, "AYNI blokta (2+ tasinmaz olsa bile) false bekleniyordu (karsilastirilacak bir sey yok).");

  // 3c) Musteakil Bina -> false (kullanici netlestirmesi: bu yapi yalnizca kat irtifaki icin)
  fns.setState(freshState({
    fields: { requestType: "Çoklu Talep", ownershipType: "Müstakil Bina", blockNo: "100", parcelNo: "1", titleBlockName: "" },
    titleUnits: [{ fields: { blockNo: "200", parcelNo: "9", titleBlockName: "" }, tables: {} }],
  }));
  assert.equal(fns.isDocumentsBlockGroupingActive(), false, "Musteakil Bina raporunda false bekleniyordu (bu yapi yalnizca kat irtifaki icin).");

  // 3d) Tekli Talep -> false
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: {} }],
  }));
  assert.equal(fns.isDocumentsBlockGroupingActive(), false, "Tekli Talep'te false bekleniyordu.");

  // 3e) Tekil tasinmaz (titleUnits bos) -> false
  fns.setState(freshState({ titleUnits: [] }));
  assert.equal(fns.isDocumentsBlockGroupingActive(), false, "Tekil tasinmazli raporda false bekleniyordu.");

  console.log("isDocumentsBlockGroupingActive gate kosullari testi tamam.");
}

// --- 4) syncDocumentsSharedDataToBlockSiblings(): ortak alanlar kopyalanir,
// per-unit-only ASLA kopyalanmaz, farkli bloktaki uyeler ETKILENMEZ -------
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      projectInstitution: "Belediye", hasEkb: "Evet", ekbEnergyClass: "B",
      projectSuitabilityStatus: "AKTIF-TASINMAZIN-DEGERI", // per-unit-only, ASLA kopyalanmamali
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "01.01.2020", c3: "123" }] },
    titleUnits: [
      // Ayni blok (A Blok), 2. uye - once FARKLI degerlerle basliyor.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", projectInstitution: "ESKI-DEGER", projectSuitabilityStatus: "IKINCI-TASINMAZIN-DEGERI" }, tables: {} },
      // FARKLI blok (B Blok) - senkrondan ETKILENMEMELI.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", projectInstitution: "B-BLOK-DEGERI" }, tables: {} },
    ],
  }));

  fns.syncDocumentsSharedDataToBlockSiblings();
  const state = fns.getState();

  // Ayni bloktaki 2. uye (titleUnits[0], global index 1): ortak alanlar KOPYALANMALI.
  assert.equal(state.titleUnits[0].fields.projectInstitution, "Belediye", "Ayni bloktaki 2. uyeye projectInstitution kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.hasEkb, "Evet", "Ayni bloktaki 2. uyeye hasEkb kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.ekbEnergyClass, "B", "Ayni bloktaki 2. uyeye ekbEnergyClass kopyalanmali.");
  assert.deepEqual(state.titleUnits[0].tables.documents, [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "01.01.2020", c3: "123" }], "Ayni bloktaki 2. uyeye Incelenen Belgeler tablosu kopyalanmali.");

  // per-unit-only alan (projectSuitabilityStatus) ASLA kopyalanmamali.
  assert.equal(state.titleUnits[0].fields.projectSuitabilityStatus, "IKINCI-TASINMAZIN-DEGERI", "projectSuitabilityStatus per-unit-only oldugundan senkrondan ETKILENMEMELI.");

  // FARKLI bloktaki (B Blok) uye HIC etkilenmemeli.
  assert.equal(state.titleUnits[1].fields.projectInstitution, "B-BLOK-DEGERI", "FARKLI bloktaki uye senkrondan ETKILENMEMELI.");

  console.log("syncDocumentsSharedDataToBlockSiblings ortak alan kopyalama + per-unit-only koruma + farkli blok izolasyonu testi tamam.");
}

// --- 5) syncDocumentsSharedDataToBlockSiblings(): gate kapaliyken no-op --
{
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", projectInstitution: "Belediye" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", projectInstitution: "DEGISMEMELI" }, tables: {} }],
  }));
  fns.syncDocumentsSharedDataToBlockSiblings();
  const state = fns.getState();
  assert.equal(state.titleUnits[0].fields.projectInstitution, "DEGISMEMELI", "isDocumentsBlockGroupingActive false iken (Tekli Talep) senkron no-op olmali.");
  console.log("syncDocumentsSharedDataToBlockSiblings gate kapaliyken no-op testi tamam.");
}

// --- 5b) applyDocumentsDataToAllBlocks(): kullanici talebi (2026-08-25) --
// "ana gayrimenkuldeki tum bloklara uygula secenegini belgeler ve proje
// bolumune uygulamak istiyorum" - syncDocumentsSharedDataToBlockSiblings()'in
// AKSINE bu FARKLI bloktaki uyeleri de kapsamali (manuel, kullanici
// tetikler), ama EKB alanlarini ASLA kopyalamamali (kullanici bu istekte
// EKB'yi anmadi, EKB kendi ayri blok-atifli mekanizmasina sahip).
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      projectInstitution: "Belediye", projectDifference: "Evet", penaltyDecision: "Hayır",
      staticSuitability: "Evet", buildingInspectionContractActive: "Evet",
      hasEkb: "Evet", ekbEnergyClass: "B", ekbDocumentNo: "AKTIF-EKB-NO",
      projectSuitabilityStatus: "AKTIF-TASINMAZIN-DEGERI", // per-unit-only, ASLA kopyalanmamali
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "01.01.2020", c3: "123" }] },
    titleUnits: [
      // AYNI blok (A Blok) - senkron ZATEN kapsar, bu komut da kapsamali.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", projectInstitution: "ESKI-DEGER", ekbDocumentNo: "ESKI-EKB-NO", projectSuitabilityStatus: "IKINCI-TASINMAZIN-DEGERI" }, tables: {} },
      // FARKLI blok (B Blok) - syncDocumentsSharedDataToBlockSiblings BUNU KAPSAMAZ, ama applyDocumentsDataToAllBlocks KAPSAMALI.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", projectInstitution: "B-BLOK-ESKI-DEGER", ekbDocumentNo: "B-BLOK-ESKI-EKB-NO" }, tables: {} },
    ],
  }));

  const applied = fns.applyDocumentsDataToAllBlocks();
  assert.equal(applied, true, "Kosullar saglaniyorken true donmeli.");
  const state = fns.getState();

  // FARKLI bloktaki (B Blok) uye de kopyalamayi ALMALI (sync'ten farkli).
  assert.equal(state.titleUnits[1].fields.projectInstitution, "Belediye", "FARKLI bloktaki (B Blok) uyeye de projectInstitution kopyalanmali - bu, sync'ten FARKI.");
  assert.equal(state.titleUnits[1].fields.projectDifference, "Evet", "FARKLI bloktaki uyeye projectDifference kopyalanmali.");
  assert.equal(state.titleUnits[1].fields.penaltyDecision, "Hayır", "FARKLI bloktaki uyeye penaltyDecision kopyalanmali.");
  assert.equal(state.titleUnits[1].fields.staticSuitability, "Evet", "FARKLI bloktaki uyeye staticSuitability kopyalanmali.");
  assert.equal(state.titleUnits[1].fields.buildingInspectionContractActive, "Evet", "FARKLI bloktaki uyeye buildingInspectionContractActive kopyalanmali.");
  assert.deepEqual(state.titleUnits[1].tables.documents, [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "01.01.2020", c3: "123" }], "FARKLI bloktaki uyeye Incelenen Belgeler tablosu da kopyalanmali.");

  // EKB alanlari HICBIR bloga (ayni veya farkli) kopyalanmamali.
  assert.equal(state.titleUnits[0].fields.ekbDocumentNo, "ESKI-EKB-NO", "AYNI bloktaki uyenin EKB alani da DEGISMEMELI (EKB bu komuttan bilerek haric).");
  assert.equal(state.titleUnits[1].fields.ekbDocumentNo, "B-BLOK-ESKI-EKB-NO", "FARKLI bloktaki uyenin EKB alani DEGISMEMELI.");

  // per-unit-only alan (projectSuitabilityStatus) ASLA kopyalanmamali.
  assert.equal(state.titleUnits[0].fields.projectSuitabilityStatus, "IKINCI-TASINMAZIN-DEGERI", "projectSuitabilityStatus per-unit-only oldugundan bu komuttan da ETKILENMEMELI.");

  const applyKeys = fns.getApplyToAllBlocksKeys();
  assert.ok(!applyKeys.some((key) => key === "hasEkb" || key.startsWith("ekb")), "DOCUMENTS_APPLY_TO_ALL_BLOCKS_FIELD_KEYS EKB alani ICERMEMELI.");
  assert.ok(applyKeys.includes("projectInstitution") && applyKeys.includes("penaltyDecision"), "DOCUMENTS_APPLY_TO_ALL_BLOCKS_FIELD_KEYS kullanicinin istedigi alanlari ICERMELI.");

  console.log("applyDocumentsDataToAllBlocks farkli-blok kopyalama + EKB haric tutma + per-unit-only koruma testi tamam.");
}

// --- 5c) applyDocumentsDataToAllBlocks(): gate kapaliyken false + no-op --
{
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", projectInstitution: "Belediye" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", projectInstitution: "DEGISMEMELI" }, tables: {} }],
  }));
  const applied = fns.applyDocumentsDataToAllBlocks();
  assert.equal(applied, false, "isDocumentsBlockGroupingActive false iken false donmeli.");
  assert.equal(fns.getState().titleUnits[0].fields.projectInstitution, "DEGISMEMELI", "Gate kapaliyken no-op olmali.");
  console.log("applyDocumentsDataToAllBlocks gate kapaliyken no-op testi tamam.");
}

// --- 6) DOCUMENTS_BLOCK_SHARED_FIELD_KEYS: per-unit-only alanlar YOK -----
{
  const sharedKeys = fns.getSharedKeys();
  ["projectSuitabilityStatus", "projectSuitabilitySimpleRepair", "projectConformity", "projectReviewDescription",
    "titleProjectSuitabilityStatus", "municipalityProjectSuitabilityStatus",
    "hasArchitecturalProject", "projectRegisteredInCadastre"].forEach((key) => {
    assert.ok(!sharedKeys.includes(key), `"${key}" DOCUMENTS_BLOCK_SHARED_FIELD_KEYS'te OLMAMALI (per-unit-only veya musteakil-bina-ozgu).`);
  });
  ["projectInstitution", "hasEkb", "penaltyDecision", "staticSuitability", "buildingInspectionContractActive", "mainRealEstateProjectSuitable"].forEach((key) => {
    assert.ok(sharedKeys.includes(key), `"${key}" DOCUMENTS_BLOCK_SHARED_FIELD_KEYS'te OLMALI.`);
  });
  // 2026-08-23: EKB grubunun eksik kalan 2 alani (ekbEmissionClass ZATEN
  // vardi) - bkz. app.js DOCUMENTS_BLOCK_SHARED_FIELD_KEYS yorumu.
  ["ekbEmissionClass", "ekbExplanation", "ekbRawText"].forEach((key) => {
    assert.ok(sharedKeys.includes(key), `"${key}" DOCUMENTS_BLOCK_SHARED_FIELD_KEYS'te OLMALI (EKB blok-paylasiminin tam kapsanmasi icin).`);
  });
  console.log("DOCUMENTS_BLOCK_SHARED_FIELD_KEYS icerik testi tamam.");
}

// --- 7) getDocumentsPerUnitOnlyFieldKeys(): "explanations" bolumundeki ----
// ekbEmissionClass/ekbRawText artik scoped set'e ekleniyor - ekbExplanation
// (kendi kendini iyileştiren) BILEREK YOK (kaynak-duzeyi, DOM'suz saf
// fonksiyon oldugu icin dogrudan calistirilabilir). ------------------------
{
  const fnSrc = extractFunction("getDocumentsPerUnitOnlyFieldKeys");
  // eslint-disable-next-line no-new-func
  const keys = new Function(`${fnSrc}\nreturn getDocumentsPerUnitOnlyFieldKeys();`)();
  assert.ok(keys.includes("ekbEmissionClass"), "getDocumentsPerUnitOnlyFieldKeys() artik 'ekbEmissionClass' icermeli (2026-08-23 scoping-gap-fix).");
  assert.ok(keys.includes("ekbRawText"), "getDocumentsPerUnitOnlyFieldKeys() artik 'ekbRawText' icermeli (2026-08-23 scoping-gap-fix).");
  assert.ok(!keys.includes("ekbExplanation"), "getDocumentsPerUnitOnlyFieldKeys() 'ekbExplanation' ICERMEMELI (kendi kendini iyileştiren metin, ayri scoping'e gerek yok).");
  console.log("getDocumentsPerUnitOnlyFieldKeys EKB scoping-gap-fix testi tamam.");
}

// --- 8) applyEkbFieldsToReport(): syncDocumentsSharedDataToBlockSiblings() -
// artik cagriliyor (kaynak-duzeyi - DOM/state agir bagimliliklari nedeniyle
// tam davranissal test yerine, bkz. proje konvansiyonu) --------------------
{
  const fnSrc = extractFunction("applyEkbFieldsToReport");
  assert.match(
    fnSrc,
    /refreshEkbExplanationFromCurrentFields\("hasEkb"\);[\s\S]{0,1200}syncDocumentsSharedDataToBlockSiblings\(\);/,
    "applyEkbFieldsToReport() artik syncDocumentsSharedDataToBlockSiblings()'i cagirmiyor - EKB PDF yuklendiginde aktif tasinmaz DISINDAKI blok uyeleri guncellenmez."
  );
  console.log("applyEkbFieldsToReport blok-senkron kablolama testi tamam.");
}

// --- 9) createEkbInlineUploadButton(): "Enerji Kimlik Belgesi" (hasEkb) ---
// alaninin YANINDA (ALTINDA DEGIL - bkz. 2026-08-23 takip: "buton dizayn
// acisindan cok kotu duruyor ... hucrenin yanina al butonu") tek bir yatay
// satirda (ekb-hasekb-row) createForm() icinde eklendi mi - kaynak-duzeyi -
{
  assert.match(
    appSource,
    /function createEkbInlineUploadButton\(\)\s*\{[\s\S]{0,100}const button = document\.createElement\("button"\);[\s\S]{0,600}await processEkbFile\(file\);/,
    "createEkbInlineUploadButton() bulunamadi veya processEkbFile()'i cagirmiyor."
  );
  assert.match(
    appSource,
    /if \(section\.id === "documents" && field\.key === "hasEkb"\) \{\s*\n\s*const ekbRow = document\.createElement\("div"\);\s*\n\s*ekbRow\.className = "ekb-hasekb-row";\s*\n\s*ekbRow\.append\(control, createEkbInlineUploadButton\(\)\);\s*\n\s*label\.append\(ekbRow\);/,
    "createForm() artik select + EKB Yukle butonunu 'ekb-hasekb-row' ile AYNI yatay satira almiyor (select'in ALTINA dusme regresyonu olabilir)."
  );
  console.log("createEkbInlineUploadButton hasEkb yanina (ayni satirda) kablolama testi tamam.");
}

// --- 9) createDocumentsBlockTabBar(): "Tum bloklara uygula" butonu -------
// kaynak-duzeyinde dogru kablolu - kullanici talebi (2026-08-25): "ana
// gayrimenkuldeki tum bloklara uygula secenegini belgeler ve proje
// bolumune uygulamak istiyorum" (bkz. test-building-block-shared-sync.js
// senaryo 6'nin AYNI deseni, "documents" icin).
{
  assert.match(
    appSource,
    /function createDocumentsBlockTabBar\(\)[\s\S]*?outerTabs\.append\(applyAllBlocksButton\);[\s\S]*?wrap\.append\(outerTabs\);/,
    "Tum bloklara uygula butonu Belgeler ve Proje blok sekmelerinin bulundugu satira eklenmelidir."
  );
  assert.match(
    appSource,
    /applyAllBlocksButton\.addEventListener\("click", \(\) => \{\s*\n\s*if \(!applyDocumentsDataToAllBlocks\(\)\) return;/,
    "Tum bloklara uygula butonu applyDocumentsDataToAllBlocks()'u cagirmiyor gorunuyor."
  );
  console.log("createDocumentsBlockTabBar Tum bloklara uygula butonu kaynak-duzeyi kablolama testi tamam.");
}

console.log("Belgeler ve Proje blok/bagimsiz-bolum tab yapisi testleri basarili.");
