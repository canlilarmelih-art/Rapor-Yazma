"use strict";

/*
  Kullanici talebi: "Yasal Acil Satış Değeri" ve "Mevcut Acil Satış Değeri"
  zaten otomatik hesaplanıyordu (Yasal/Mevcut Durum Değeri'nden %10 indirim,
  50.000 TL'ye yuvarlama — getUrgentSaleValueText), ama Değerleme
  bölümünde "Yasal ve Mevcut Durum Değeri" (Piyasa Değeri) panelindeki gibi
  görünür/düzenlenebilir bir hesaplama paneli YOKTU; değer yalnızca salt
  okunur bir özet listesinde görünüyordu. Yeni createValuationUrgentSaleTable()
  panel fonksiyonu, mevcut "Piyasa Değeri" panelinin (createValuationMarketTable)
  aynı görsel/işlevsel desenini (createValuationPanel + tablo + salt okunur
  hücreler + Yasal/Mevcut değerler eşitse tek satıra birleşme) izler.

  Bu test iki katmanı doğrular:
  1) createValuationUrgentSaleTable() gercek app.js kaynagindan izole
     calistirilir (minimal DOM stub ile); dogru degerleri gosterdigini VE
     Yasal/Mevcut esitken tek satira birlestigini dogrular.
  2) createValuationEditor() kaynak metninde createValuationUrgentSaleTable()
     cagrisinin GERCEKTEN mevcut oldugunu dogrular (kablolama regresyon
     korumasi — fonksiyon tanimlansa bile cagrilmazsa panel hic gorunmez).
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

// --- 1) Panel render + hesaplama testi ----------------------------------

const rowsArraySrc = sliceFn("const valuationUrgentSaleRows = [", { toMarker: "\n];" }) + "\n];";
const parseValuationNumberSrc = sliceFn("function parseValuationNumber(");
const getLegalCurrentDisplayRowsSrc = sliceFn("function getLegalCurrentDisplayRows(");
const createValuationPanelSrc = sliceFn("function createValuationPanel(");
const createValuationTableWrapSrc = sliceFn("function createValuationTableWrap(");
const createValuationLabelCellSrc = sliceFn("function createValuationLabelCell(");
const createValuationInputCellSrc = sliceFn("function createValuationInputCell(");
const createValuationInputSrc = sliceFn("function createValuationInput(");
const createValuationUrgentSaleTableSrc = sliceFn("function createValuationUrgentSaleTable(");

function makeElementStub(tag) {
  const el = {
    tagName: String(tag || "").toUpperCase(),
    className: "",
    textContent: "",
    innerHTML: "",
    value: "",
    scope: "",
    placeholder: "",
    inputMode: "",
    readOnly: false,
    children: [],
    dataset: {},
    classList: { add() {}, toggle() {} },
    append(...nodes) {
      el.children.push(...nodes);
    },
    addEventListener() {},
  };
  return el;
}

function collectRows(panel) {
  // panel.children: [header, tableWrap] ; tableWrap.children: [table] ; table.children: [tbody] (innerHTML thead ignored by stub)
  const tableWrap = panel.children.find((c) => c !== undefined && c.children && c.children.some((child) => child.tagName === "TABLE"));
  const table = tableWrap.children.find((c) => c.tagName === "TABLE");
  const tbody = table.children.find((c) => c.tagName === "TBODY");
  return tbody.children.map((tr) => ({
    label: tr.children[0].children[0].textContent,
    marketValueInput: tr.children[1].children[0].children[1],
    urgentValueInput: tr.children[2].children[0].children[1],
  }));
}

function runScenario(fields) {
  const context = {
    state: { fields },
    document: { createElement: (tag) => makeElementStub(tag) },
  };
  vm.createContext(context);
  vm.runInContext(rowsArraySrc, context);
  vm.runInContext(parseValuationNumberSrc, context);
  vm.runInContext(getLegalCurrentDisplayRowsSrc, context);
  vm.runInContext(createValuationPanelSrc, context);
  vm.runInContext(createValuationTableWrapSrc, context);
  vm.runInContext(createValuationLabelCellSrc, context);
  vm.runInContext(createValuationInputCellSrc, context);
  vm.runInContext(createValuationInputSrc, context);
  vm.runInContext(createValuationUrgentSaleTableSrc, context);
  const panel = context.createValuationUrgentSaleTable();
  return collectRows(panel);
}

// 1a) Yasal ve mevcut durum degeri FARKLI -> iki ayri satir, dogru degerler.
{
  const rows = runScenario({ legalValue: "6.000.000", currentValue: "6.500.000", legalUrgentSaleValue: "5.400.000", currentUrgentSaleValue: "5.850.000" });
  assert.equal(rows.length, 2, `Farkli degerlerde iki satir olmali: ${JSON.stringify(rows.map((r) => r.label))}`);
  assert.equal(rows[0].label, "Yasal Acil Satış Değeri");
  assert.equal(rows[0].marketValueInput.value, "6.000.000");
  assert.equal(rows[0].urgentValueInput.value, "5.400.000");
  assert.equal(rows[0].marketValueInput.readOnly, true, "Piyasa Değeri hücresi salt okunur olmali.");
  assert.equal(rows[0].urgentValueInput.readOnly, true, "Acil Satış Değeri hücresi salt okunur olmali.");
  assert.equal(rows[1].label, "Mevcut Acil Satış Değeri");
  assert.equal(rows[1].marketValueInput.value, "6.500.000");
  assert.equal(rows[1].urgentValueInput.value, "5.850.000");
}

// 1b) Yasal ve mevcut durum degeri AYNI -> tek birlesik satir (mevcut
//     Serefiye/Yapi Degeri panellerindeki gibi kendi kendine birlesmeli).
{
  const rows = runScenario({ legalValue: "6.000.000", currentValue: "6.000.000", legalUrgentSaleValue: "5.400.000", currentUrgentSaleValue: "5.400.000" });
  assert.equal(rows.length, 1, `Ayni degerde tek satira birlesmeli: ${JSON.stringify(rows.map((r) => r.label))}`);
  assert.equal(rows[0].label, "Yasal ve Mevcut Acil Satış Değeri");
}

// --- 2) Kablolama regresyon korumasi ------------------------------------
// createValuationUrgentSaleTable() tanimlansa bile createValuationEditor()
// icinde CAGRILMAZSA panel hicbir zaman ekranda gorunmez.
{
  const editorStart = appSource.indexOf("function createValuationEditor(");
  assert(editorStart >= 0, "createValuationEditor fonksiyonu bulunamadi.");
  const editorEnd = appSource.indexOf("\n}", editorStart) + 2;
  const editorSrc = appSource.slice(editorStart, editorEnd);
  assert.match(
    editorSrc,
    /createValuationUrgentSaleTable\(\)/,
    "createValuationEditor() artik createValuationUrgentSaleTable() cagirmiyor — panel Degerleme bolumunde gorunmez olur."
  );
}

console.log("Acil Satis Degeri hesaplama paneli testi tamam.");
