"use strict";

/*
  Değerleme piyasa değeri regresyonları:
  - Yasal ve mevcut alan aynıysa, ikisi de emsalden otomatik geldiğinde aynı
    m² birim değeriyle aynı toplam değer yazılmalı.
  - Eski raporlardaki manuel kilit, yapı/bağımsız bölüm raporlarında da geri
    alınabilir olmalı.
  - Emsal ortalaması kaybolduğunda eski otomatik toplam değerler ekranda
    kalmamalı; kullanıcı tarafından ayrıştırılmış değer korunmalı.
  - Arsa emsali ile yapı emsali aynı otomatik ortalamaya karışmamalı.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert(start >= 0, `Kaynak fonksiyon bulunamadi: ${name}`);
  const bodyStart = appSource.indexOf("{", start);
  assert(bodyStart > start, `Fonksiyon govdesi bulunamadi: ${name}`);
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    const next = appSource[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (["'", '"', "`"].includes(char)) {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start, index + 1);
    }
  }
  throw new Error(`Fonksiyon kapanisi bulunamadi: ${name}`);
}

const source = [
  "hasUserDefinedLandMarketValue",
  "isComparableValuationTotalKey",
  "hasComparableValuationManualOverride",
  "clearLandValuationManualOverride",
  "clearValuationManualOverride",
  "getComparableValuationRowsForAutoSync",
  "clearComparableAutoValueIfStale",
  "syncComparableValuationMarketValues",
  "syncComparableValuationMarketValue",
].map(extractFunction).join("\n");

function buildContext({ landReport = false, average, rows }) {
  const captured = { averageRows: null };
  const context = {
    state: {
      fields: {
        ownershipType: landReport ? "Arsa" : "Dikey Kat İrtifakı",
        legalValueArea: "55",
        currentValueArea: "55",
        legalRentArea: "55",
        currentRentArea: "55",
      },
      tables: {},
    },
    isLandOwnershipType: () => landReport,
    getComparableValuationRows: () => rows,
    calculateComparableValuationAverages: (inputRows) => {
      captured.averageRows = inputRows;
      return average;
    },
    syncValuationAreasFromUnitAreas: () => {},
    refreshValuationControls: () => {},
    refreshValuationComputedFields: () => {},
    autosave: () => {},
    renderSection: () => {},
    renderValidation: () => {},
    updateStatus: () => {},
    parseValuationNumber: (value) => Number(String(value).replaceAll(".", "").replace(",", ".")),
    formatValuationMoney: (value) => String(Math.round(value)),
    roundComparableValuationValue: (value) => Math.round(value / 50000) * 50000,
    comparableValuationRoundStep: 50000,
    comparableValuationRentRoundStep: 1000,
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, captured };
}

// Aynı alan + aynı emsal birim değeri, iki otomatik toplamda ayrışmamalı.
{
  const { context, captured } = buildContext({
    average: { adjustedUnitValue: 43636.36, adjustedRentUnitValue: Number.NaN },
    rows: [
      { landComparable: false, adjustedUnitValue: 43636.36 },
      { landComparable: true, adjustedUnitValue: 8000 },
    ],
  });
  Object.assign(context.state.fields, {
    legalValue: "2250000",
    currentValue: "2400000",
    legalValueComparableAuto: "2250000",
    currentValueComparableAuto: "2400000",
  });
  context.syncComparableValuationMarketValues();
  assert.equal(context.state.fields.legalValue, "2400000");
  assert.equal(context.state.fields.currentValue, "2400000");
  assert.equal(captured.averageRows.length, 1, "Yapi raporunda arsa emsali ortalamaya karismamali.");
}

// Manuel kilit korunur; yalnızca otomatik kalan taraf güncellenir.
{
  const { context } = buildContext({
    average: { adjustedUnitValue: 43636.36, adjustedRentUnitValue: Number.NaN },
    rows: [{ landComparable: false, adjustedUnitValue: 43636.36 }],
  });
  Object.assign(context.state.fields, {
    legalValue: "2250000",
    currentValue: "2400000",
    legalValueComparableAutoManual: "1",
  });
  context.syncComparableValuationMarketValues();
  assert.equal(context.state.fields.legalValue, "2250000");
  assert.equal(context.state.fields.currentValue, "2400000");
}

// Emsal ortalaması kalktığında makineye ait eski değerler temizlenir.
{
  const { context } = buildContext({
    average: { adjustedUnitValue: Number.NaN, adjustedRentUnitValue: Number.NaN },
    rows: [],
  });
  Object.assign(context.state.fields, {
    legalValue: "2400000",
    currentValue: "2400000",
    legalValueComparableAuto: "2400000",
    currentValueComparableAuto: "2400000",
  });
  context.syncComparableValuationMarketValues();
  assert.equal(context.state.fields.legalValue, "");
  assert.equal(context.state.fields.currentValue, "");
  assert.equal(context.state.fields.legalValueComparableAuto, "");
  assert.equal(context.state.fields.currentValueComparableAuto, "");
}

// Manuel değer sıfırlama bütün rapor türlerinde aynı otomatik akışı çağırır.
{
  const { context } = buildContext({
    average: { adjustedUnitValue: Number.NaN, adjustedRentUnitValue: Number.NaN },
    rows: [],
  });
  Object.assign(context.state.fields, {
    currentValue: "2500000",
    currentValueComparableAuto: "2000000",
    currentValueComparableAutoManual: "1",
  });
  context.clearValuationManualOverride("currentValue");
  assert.equal(context.state.fields.currentValue, "");
  assert.equal(context.state.fields.currentValueComparableAuto, "");
  assert.equal(context.state.fields.currentValueComparableAutoManual, "");
}

console.log("Değerleme emsal otomatik/manuel senkronizasyon testleri tamam.");
