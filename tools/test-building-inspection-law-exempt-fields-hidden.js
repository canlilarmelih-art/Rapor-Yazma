"use strict";

/*
  Kullanici talebi (Yapi Denetim kanun kapsam disi guncellemesine ek): yeni
  yapi ruhsati 13.07.2001'den ONCE ise "Sözleşme Aktif mi?" ve "Yapı Denetim
  Hakediş Seviyesi" hücreleri (select alanlari) tamamen GİZLENSİN — sadece
  aciklama metni (kanun kapsami disi cumlesi) gosterilsin, sozlesme durumu
  sorusu sorulmasin.

  createDocumentDecisionControls() gercek app.js kaynagindan, minimal bir
  sahte DOM (document.createElement stub'i) ile izole calistirilir.
  createConditionalYesNoControl (Cezai Karar/Statik Uygunluk kontrolleri)
  bu testin kapsami disinda oldugundan sahte bir <div> donen stub'la
  degistirilir. Uretilen agac, dataset.field degerlerine gore taranarak
  hangi alanlarin gercekten DOM'a eklendigi dogrulanir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const foldSrc = sliceFn("function foldTurkish(");
const normalizeEkbDateSrc = sliceFn("function normalizeEkbDate(");
const dateTrToIsoSrc = sliceFn("function dateTrToIso(");
const dateIsoToTrSrc = sliceFn("function dateIsoToTr(");
const parseReviewedDocumentDateSrc = sliceFn("function parseReviewedDocumentDate(");
const getReviewedDocumentChronologicalEntriesSrc = sliceFn("function getReviewedDocumentChronologicalEntries(");
const getReviewedDocumentTableEntriesSrc = sliceFn("function getReviewedDocumentTableEntries(");
const findReviewedDocumentRowBySrc = sliceFn("function findReviewedDocumentRowBy(");
const isPermitLikeDocumentSrc = sliceFn("function isPermitLikeDocument(");
const isBuildingCompletionOccupancyDocumentSrc = sliceFn("function isBuildingCompletionOccupancyDocument(");
const isOccupancyPermitDocumentSrc = sliceFn("function isOccupancyPermitDocument(");
const getLatestBuildingPermitDocumentRowSrc = sliceFn("function getLatestBuildingPermitDocumentRow(");

const lawExemptionBlockSrc = sliceFn("const BUILDING_INSPECTION_LAW_EFFECTIVE_ISO_DATE", {
  toMarker: "\nfunction buildBuildingInspectionTerminationExplanation",
});

const createSpanSrc = sliceFn("function createSpan(");
const createDocumentDecisionSelectSrc = sliceFn("function createDocumentDecisionSelect(");
const createBuildingInspectionExplanationPreviewSrc = sliceFn("function createBuildingInspectionExplanationPreview(");
const createDocumentDecisionControlsSrc = sliceFn("function createDocumentDecisionControls(");

function makeElementStub(tag) {
  const el = {
    tagName: String(tag || "").toUpperCase(),
    className: "",
    textContent: "",
    dataset: {},
    children: [],
    value: "",
    rows: 0,
    readOnly: false,
    classList: { toggle() {}, add() {} },
    setAttribute() {},
    append(...nodes) {
      el.children.push(...nodes);
    },
    addEventListener() {},
  };
  return el;
}

function collectDatasetFieldKeys(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (node.dataset && node.dataset.field) acc.push(node.dataset.field);
  (node.children || []).forEach((child) => collectDatasetFieldKeys(child, acc));
  return acc;
}

function runScenario({ documents = [], contractActive = "" }) {
  const context = {
    state: {
      tables: { documents },
      fields: {
        buildingInspectionContractActive: contractActive,
        buildingInspectionProgressLevel: "",
        buildingInspectionTerminationDate: "",
        buildingInspectionTerminationLevel: "",
        buildingInspectionExplanation: "",
        municipalityInspectionDate: "",
        appointmentDate: "",
        district: "",
        titleDistrict: "",
        hasArchitecturalProject: "Hayır",
      },
    },
    document: { createElement: (tag) => makeElementStub(tag) },
    formatUiHeading: (value) => value,
    normalizeReportDescriptionText: (value) => value,
    normalizeReportTitleText: (value) => value,
    getArchitecturalProjectReviewedDocumentRows: () => [],
    normalizeReviewedDocumentRow: (row) => ({ type: String(row?.c0 || "") }),
    hasReviewedOccupancyPermitDocument: () => false,
    // Bu testin kapsami disi: Cezai Karar/Statik Uygunluk kontrolleri sahte
    // bir <div> ile temsil edilir, dataset.field icermez (taramaya girmez).
    createConditionalYesNoControl: () => makeElementStub("div"),
    refreshBuildingInspectionExplanationFromCurrentFields: () => {},
    // Bu testin kapsami: kanun-kapsam-disi hucre gizleme mantigi.
    // Ayricalikli-kullanici gorunurlugu (sensitiveOnly) ayri bir testte
    // (test-user-approval-flow.js) kapsanir; burada her zaman gorunur kabul
    // edilir ki bu testin senaryolari etkilenmesin.
    canViewSensitiveContent: () => true,
    autosave: () => {},
    renderValidation: () => {},
    updateStatus: () => {},
    renderSection: () => {},
    hasCompletionValue: (value) => String(value ?? "").trim().length > 0,
    // selectVariant burada BİLEREK her zaman 0 (orijinal metin) döner — bu
    // test alan gizleme mantığını doğruluyor, varyant SEÇİMİ ayrı olarak
    // tools/test-variant-selection.js'te test ediliyor.
    selectVariant: () => 0,
    registerVariantGroup: () => {},
  };
  vm.createContext(context);
  vm.runInContext(foldSrc, context);
  vm.runInContext(normalizeEkbDateSrc, context);
  vm.runInContext(dateTrToIsoSrc, context);
  vm.runInContext(dateIsoToTrSrc, context);
  vm.runInContext(parseReviewedDocumentDateSrc, context);
  vm.runInContext(getReviewedDocumentChronologicalEntriesSrc, context);
  vm.runInContext(getReviewedDocumentTableEntriesSrc, context);
  vm.runInContext(findReviewedDocumentRowBySrc, context);
  vm.runInContext(isPermitLikeDocumentSrc, context);
  vm.runInContext(isBuildingCompletionOccupancyDocumentSrc, context);
  vm.runInContext(isOccupancyPermitDocumentSrc, context);
  vm.runInContext(getLatestBuildingPermitDocumentRowSrc, context);
  vm.runInContext(lawExemptionBlockSrc, context);
  vm.runInContext(createSpanSrc, context);
  vm.runInContext(createDocumentDecisionSelectSrc, context);
  vm.runInContext(createBuildingInspectionExplanationPreviewSrc, context);
  vm.runInContext(createDocumentDecisionControlsSrc, context);
  const wrapper = context.createDocumentDecisionControls();
  return { fieldKeys: collectDatasetFieldKeys(wrapper), wrapper, fields: context.state.fields };
}

const oldPermitRow = { c0: "Yeni Yapı Ruhsatı", c1: "X Belediyesi", c2: "1995-03-20", c3: "1/1" };
const modernPermitRow = { c0: "Yeni Yapı Ruhsatı", c1: "X Belediyesi", c2: "2018-09-05", c3: "2/2" };

// 1) Ruhsat kanundan ONCE (13.07.2001 oncesi) -> her iki hucre de GİZLENMELİ.
{
  const { fieldKeys } = runScenario({ documents: [oldPermitRow], contractActive: "Evet" });
  assert.ok(
    !fieldKeys.includes("buildingInspectionContractActive"),
    `Kanun kapsami disi iken "Sözleşme Aktif mi?" hucresi gizlenmeli: ${JSON.stringify(fieldKeys)}`
  );
  assert.ok(
    !fieldKeys.includes("buildingInspectionProgressLevel"),
    `Kanun kapsami disi iken "Yapı Denetim Hakediş Seviyesi" hucresi gizlenmeli: ${JSON.stringify(fieldKeys)}`
  );
}

// 2) Ruhsat kanundan SONRA, sozlesme durumu bos -> "Sözleşme Aktif mi?"
//    GORUNMELI, ama hakediş seviyesi (sözleşme "Evet" olmadigi icin) gizli.
{
  const { fieldKeys } = runScenario({ documents: [modernPermitRow], contractActive: "" });
  assert.ok(
    fieldKeys.includes("buildingInspectionContractActive"),
    `Kanun kapsaminda iken "Sözleşme Aktif mi?" hucresi gorunmeli: ${JSON.stringify(fieldKeys)}`
  );
  assert.ok(
    !fieldKeys.includes("buildingInspectionProgressLevel"),
    `Sözleşme "Evet" degilken hakediş seviyesi hala gizli olmali: ${JSON.stringify(fieldKeys)}`
  );
}

// 3) Ruhsat kanundan SONRA, sozlesme "Evet" -> HER İKİ hücre de görünmeli
//    (mevcut davranis, bu degisiklikten etkilenmemeli).
{
  const { fieldKeys } = runScenario({ documents: [modernPermitRow], contractActive: "Evet" });
  assert.ok(fieldKeys.includes("buildingInspectionContractActive"), `Sözleşme hücresi görünmeli: ${JSON.stringify(fieldKeys)}`);
  assert.ok(fieldKeys.includes("buildingInspectionProgressLevel"), `Hakediş seviyesi hücresi görünmeli: ${JSON.stringify(fieldKeys)}`);
}

// 4) Ruhsat kanundan ONCE iken, hücre gizlenmeden ÖNCE seçili kalmış "Evet"
//    değeri state.fields'ten de temizlenmeli (gizli hücrenin eski değeri
//    rapora/eksik-alan kontrolüne sızmasın).
{
  const { fields } = runScenario({ documents: [oldPermitRow], contractActive: "Evet" });
  assert.equal(fields.buildingInspectionContractActive, "", `Gizlenince state.fields.buildingInspectionContractActive temizlenmeli: ${JSON.stringify(fields)}`);
  assert.equal(fields.buildingInspectionProgressLevel, "", `Gizlenince state.fields.buildingInspectionProgressLevel temizlenmeli: ${JSON.stringify(fields)}`);
}

console.log("Yapi denetim kanunu kapsam disinda Sözleşme/Hakediş hucrelerinin gizlenmesi testi tamam.");
