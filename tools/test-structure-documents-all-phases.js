"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function sliceBetween(start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `Baslangic bulunamadi: ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `Bitis bulunamadi: ${end}`);
  return source.slice(startIndex, endIndex);
}

const migrationSource = sliceBetween(
  "const BUILDING_STRUCTURE_STATUS_OPTIONS =",
  "function buildBuildingStructureFloorComposition(",
);
const migrationContext = { Math, Date, JSON, crypto: undefined };
vm.createContext(migrationContext);
vm.runInContext(`${migrationSource}\nthis.api = { normalizeStructureDocumentTables, createEmptyBuildingStructureRow };`, migrationContext);

const legacyTables = {
  buildings: [{ name: "Fabrika Binası", floors: [{ floor: "Zemin", legalArea: "1.000" }] }],
  documents: [{ c0: "Yeni Yapı Ruhsatı", c2: "2010-01-01", c3: "10/5" }],
};
assert.equal(migrationContext.api.normalizeStructureDocumentTables(legacyTables), true);
assert.match(legacyTables.buildings[0].id, /^building-/);
assert.match(legacyTables.documents[0].id, /^document-/);
assert.equal(legacyTables.documentScopes.length, 1);
assert.equal(legacyTables.documentScopes[0].targetType, "parcel");
assert.equal(legacyTables.documentScopes[0].documentId, legacyTables.documents[0].id);
assert.equal(legacyTables.documentScopes[0].documentType, "Yeni Yapı Ruhsatı");
assert.equal(legacyTables.buildingParts.length, 0);

const inconsistentTables = {
  buildings: [{ id: "building-fixed", name: "Fabrika" }],
  buildingParts: [{ id: "part-fixed", buildingId: "building-fixed", name: "Hol" }],
  documents: [{ id: "document-fixed", c0: "Yeni Yapı Ruhsatı" }],
  documentScopes: [{ documentId: "document-fixed", targetType: "parcel", buildingId: "building-fixed", buildingPartId: "part-fixed" }],
};
assert.equal(migrationContext.api.normalizeStructureDocumentTables(inconsistentTables), true);
assert.equal(inconsistentTables.documentScopes[0].targetType, "part");

const reconciliationSource = [
  sliceBetween("function getDocumentKind(", "function calculateScopedMetric("),
  sliceBetween("function calculateScopedMetric(", "function calculateStructureAreaReconciliation("),
  sliceBetween("function calculateStructureAreaReconciliation(", "function createStructureAreaReconciliationPanel("),
].join("\n");
const building = {
  id: "building-1",
  name: "Fabrika Binası",
  floors: [{ legalArea: "1500", currentArea: "1600" }],
};
const reconciliationContext = {
  state: {
    tables: {
      documents: [
        { id: "doc-1", c0: "Yeni Yapı Ruhsatı", c2: "2005-01-01" },
        { id: "doc-2", c0: "İlave Yapı Ruhsatı", c2: "2010-01-01" },
        { id: "doc-3", c0: "Yapı Kullanım İzin Belgesi", c2: "2011-01-01" },
      ],
      documentScopes: [
        { buildingId: "building-1", documentId: "doc-1", licensedArea: "1000", effect: "additive" },
        { buildingId: "building-1", documentId: "doc-2", licensedArea: "500", effect: "additive" },
        { buildingId: "building-1", documentId: "doc-3", occupancyArea: "1400", effect: "additive" },
      ],
    },
  },
  foldTurkish: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/İ/g, "I"),
  parseBuildingStructureAreaNumber: (value) => Number(String(value || "").replace(/\./g, "").replace(",", ".")) || 0,
  getBuildingParts: () => [],
  parseReviewedDocumentDate: (value) => value || "",
  formatBuildingStructureAreaNumber: (value) => String(value),
};
vm.createContext(reconciliationContext);
vm.runInContext(`${reconciliationSource}\nthis.calculate = calculateStructureAreaReconciliation;`, reconciliationContext);
const reconciliation = reconciliationContext.calculate(building);
assert.equal(reconciliation.licensedArea, 1500, "2005 ruhsati + 2010 ilave ruhsati toplanmali.");
assert.equal(reconciliation.occupancyArea, 1400);
assert.equal(reconciliation.legalArea, 1500);
assert.equal(reconciliation.currentArea, 1600);
assert(reconciliation.warnings.some((warning) => warning.includes("Ruhsat alanı") && warning.includes("iskan alanı")));
assert(reconciliation.warnings.some((warning) => warning.includes("Yasal alan") && warning.includes("mevcut alan")));

reconciliationContext.state.tables.documents = [];
reconciliationContext.state.tables.documentScopes = [
  {
    buildingId: "building-1",
    documentId: "senkron-sonrasi-belge",
    documentType: "İlave Yapı Ruhsatı",
    licensedArea: "750",
    effect: "additive",
  },
];
const reconciliationWithTypeSnapshot = reconciliationContext.calculate(building);
assert.equal(
  reconciliationWithTypeSnapshot.licensedArea,
  750,
  "Belge satiri blok senkronunda yeniden olussa bile kapsam uzerindeki belge turu ruhsat alanini korumali.",
);

const referenceContext = {
  dateIsoToTr: (value) => value === "2005-04-12" ? "12.04.2005" : "",
};
vm.createContext(referenceContext);
vm.runInContext(
  `${sliceBetween("function buildStructureDocumentReferenceText(", "function buildStructureDocumentsDescriptionParts(")}\nthis.buildReference = buildStructureDocumentReferenceText;`,
  referenceContext,
);
assert.equal(referenceContext.buildReference("2005-04-12", "2005/125"), "12.04.2005 tarih ve 2005/125 sayılı ");
assert.equal(referenceContext.buildReference("2005-04-12", ""), "12.04.2005 tarihli ");
assert.equal(referenceContext.buildReference("", "2005/125"), "2005/125 sayılı ");

assert(source.includes('body.append(createStructureDocumentsTabBar());'));
assert(source.includes('body.append(createStructureDocumentProfilePanel());'));
assert(source.includes('body.append(createDocumentScopeEditorPanel());'));
assert(source.includes('body.append(createStructureAreaReconciliationPanel());'));
assert(source.includes('parts.push(...buildStructureDocumentsDescriptionParts());'));
assert(source.includes('...structureFactors.filter((item) => item.kind === "positive")'));
assert(source.includes('"buildingParts", "documentScopes"'));
assert(source.includes('"buildings",'));
assert(source.includes('documents: ["documents", "documentScopes"]'));
assert(source.includes('building: ["buildings", "buildingParts"]'));
assert(source.includes('buildBuildingStructuresTechnicalDescription()'));
assert(source.includes('commitStructureDocumentDescriptionChange()'));

console.log("Yapi bazli belgeler: migrasyon, coklu kapsam, alan mutabakati, aciklama/cikti ve faktor kablolamasi testleri tamam.");
