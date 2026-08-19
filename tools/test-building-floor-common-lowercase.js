"use strict";

/*
  Kullanici talebi: "Ana Gayrimenkul Kat Satırları" tablosundaki "Ortak Ve
  Eklentiler" hücresine kullanıcı nasıl yazarsa yazsın (BÜYÜK HARF, Baş
  Harfleri Büyük, karışık...) tüm kelimeler küçük harfle başlamalı.

  İki katman test edilir:
  1) normalizeLowercaseFreeText() — saf metin donusturme fonksiyonu.
  2) createBuildingFloorRowsTable() — gercek "blur" olay dinleyicisinin bu
     fonksiyonu gercekten cagirdigini VE tabloya ONCEDEN kaydedilmis
     buyuk/karisik harfli bir satirin render aninda kendi kendine
     duzeltildigini (self-heal) dogrular.

  Her iki fonksiyon da gercek app.js kaynagindan izole calistirilir; DOM
  minimal bir stub ile temsil edilir (createElement + append + addEventListener
  + value/innerHTML), gercek jsdom kullanilmaz.
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

const normalizeLowercaseFreeTextSrc = sliceFn("function normalizeLowercaseFreeText(");
const buildingFloorUnitColumnsSrc = sliceFn("const buildingFloorUnitColumns = [", { toMarker: "\n];" }) + "\n];";
const createBuildingFloorRowsTableSrc = sliceFn("function createBuildingFloorRowsTable(", {
  toMarker: "\nfunction updateBuildingFloorTotals",
});

// --- 1) Saf fonksiyon testi ---------------------------------------------
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(normalizeLowercaseFreeTextSrc, context);
  const cases = [
    ["ORTAK ALAN MERDİVEN BOŞLUĞU", "ortak alan merdiven boşluğu"],
    ["Ortak Alan, Asansör Boşluğu", "ortak alan, asansör boşluğu"],
    ["  Kapıcı   Dairesi  ", "kapıcı dairesi"],
    ["Işıklık", "ışıklık"], // Türkçe İ/I -> ı, ş büyük/küçük duyarlılığı
    ["", ""],
  ];
  cases.forEach(([input, expected]) => {
    const actual = context.normalizeLowercaseFreeText(input);
    assert.equal(actual, expected, `"${input}" -> "${expected}" beklenirken "${actual}" alındı.`);
  });
}

// --- 2) Gercek tablo render + blur kablolamasi testi --------------------
function makeElementStub(tag) {
  const el = {
    tagName: String(tag || "").toUpperCase(),
    className: "",
    textContent: "",
    innerHTML: "",
    value: "",
    type: "",
    min: "",
    step: "",
    inputMode: "",
    dataset: {},
    children: [],
    _listeners: {},
    append(...nodes) {
      el.children.push(...nodes);
    },
    addEventListener(type, handler) {
      el._listeners[type] = handler;
    },
    fire(type, event = {}) {
      el._listeners[type]?.(event);
    },
  };
  return el;
}

function findAllStubs(node, tag, acc = []) {
  if (!node) return acc;
  if (node.tagName === tag) acc.push(node);
  (node.children || []).forEach((child) => findAllStubs(child, tag, acc));
  return acc;
}

function findInputsByColumn(panel) {
  // panel -> [heading, shell] ; shell -> [table] ; table -> [thead, tbody]
  const [tbody] = findAllStubs(panel, "TBODY");
  return tbody.children.map((tr) => tr.children.slice(1).map((td) => td.children[0]));
}

function runTableScenario(rows) {
  const context = {
    state: { tables: { buildingFloors: rows } },
    document: {
      createElement: (tag) => {
        const el = makeElementStub(tag);
        if (tag === "tbody") el._isTbody = true;
        return el;
      },
    },
    updateBuildingFloorTotals: () => {},
    updateBuildingFloorSummary: () => {},
    // 2026-08-20: syncBuildingSharedDataToBlockSiblings() blok bazli
    // paylasim icin satir input/blur dinleyicilerine eklendi (bkz.
    // tools/test-building-block-shared-sync.js, bu fonksiyonun kendi
    // testi) - burada davranissal olarak KAPSAM DISI, no-op stub yeterli.
    syncBuildingSharedDataToBlockSiblings: () => {},
    autosave: () => {
      context.autosaveCalls = (context.autosaveCalls || 0) + 1;
    },
    normalizeNonNegativeInteger: (value) => String(value || "").replace(/\D/g, ""),
  };
  vm.createContext(context);
  vm.runInContext(normalizeLowercaseFreeTextSrc, context);
  vm.runInContext(buildingFloorUnitColumnsSrc, context);
  vm.runInContext(createBuildingFloorRowsTableSrc, context);
  const panel = context.createBuildingFloorRowsTable();
  return { panel, rows: context.state.tables.buildingFloors };
}

// 2a) Render aninda ONCEDEN BUYUK harfle kaydedilmis "common" degeri
//     kendi kendine kucuk harfe duzelmeli (self-heal), digger satirlar
//     (floorName gibi) etkilenmemeli.
{
  const rows = [{ floorName: "Zemin Kat", common: "Ortak Alan VE Merdiven Boşluğu", residential: "2" }];
  const { rows: correctedRows, panel } = runTableScenario(rows);
  assert.equal(
    correctedRows[0].common,
    "ortak alan ve merdiven boşluğu",
    `Render aninda mevcut satir kucuk harfe duzelmeli: ${JSON.stringify(correctedRows[0])}`
  );
  const [commonInput] = findInputsByColumn(panel)[0];
  assert.equal(commonInput.value, "ortak alan ve merdiven boşluğu", "Girdi alaninda gosterilen deger de kucuk harfli olmali.");
}

// 2b) Kullanici hucreye BUYUK harfle yazip alandan cikinca (blur) deger
//     kucuk harfe donusmeli.
{
  const rows = [{ floorName: "1. Normal", common: "", residential: "1" }];
  const { panel, rows: liveRows } = runTableScenario(rows);
  const [commonInput] = findInputsByColumn(panel)[0];
  commonInput.value = "ASANSÖR BOŞLUĞU VE KAPICI DAİRESİ";
  commonInput.fire("blur");
  assert.equal(commonInput.value, "asansör boşluğu ve kapıcı dairesi", "Blur sonrasi girdi kucuk harfe donmeli.");
  assert.equal(liveRows[0].common, "asansör boşluğu ve kapıcı dairesi", "Blur sonrasi kayitli satir da kucuk harfli olmali.");
}

// 2c) Sayisal (freeText olmayan) sutunlar bu donusumden ETKİLENMEMELİ.
{
  const rows = [{ floorName: "Zemin Kat", common: "", residential: "3" }];
  const { panel } = runTableScenario(rows);
  const [, residentialInput] = findInputsByColumn(panel)[0];
  residentialInput.value = "3";
  residentialInput.fire("blur");
  assert.equal(residentialInput.value, "3", "Sayisal sutun blur sonrasi degismemeli.");
}

console.log("Ana Gayrimenkul Kat Satirlari - Ortak Ve Eklentiler kucuk harf testi tamam.");
