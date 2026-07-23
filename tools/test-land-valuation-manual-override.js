const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const manualOverrideSource = sourceBetween("function hasUserDefinedLandMarketValue", "function refreshValuationComputedFields");
const setAutoSource = sourceBetween("function setAutoValuationField", "function calculateBuildingValuationValue");
const landDefaultsSource = sourceBetween("function syncLandOwnershipValuationDefaults", "function syncBuildingValueDefaults");

function runLandSync({ tarla, legalValue, currentValue, previousAuto, nextValue, userDefined = false }) {
  const context = {
    state: {
      fields: {
        landArea: "100",
        legalValue,
        currentValue,
        legalValueComparableAuto: previousAuto,
        currentValueComparableAuto: previousAuto,
        legalValueUserDefined: userDefined ? "1" : "",
        currentValueUserDefined: userDefined ? "1" : "",
      },
    },
    isLandOwnershipType: () => true,
    isTarlaOwnershipType: () => tarla,
    parseValuationNumber: (value) => Number(String(value).replaceAll(".", "").replace(",", ".")),
    formatValuationArea: (value) => String(value),
    formatValuationMoney: (value) => String(value),
    getComparableCalculatedEmsalValuationMetrics: () => ({ marketValue: nextValue }),
    getComparableValuationRows: () => [{ landComparable: true }],
    calculateComparableValuationAverages: () => ({ adjustedUnitValue: nextValue / 100 }),
    roundComparableValuationValue: (value) => value,
    comparableValuationRoundStep: 50000,
  };
  vm.runInNewContext(`${manualOverrideSource}\n${setAutoSource}\n${landDefaultsSource}\nsyncLandOwnershipValuationDefaults();`, context);
  return context.state.fields;
}

[false, true].forEach((tarla) => {
  const preserved = runLandSync({
    tarla,
    legalValue: "900000",
    currentValue: "900000",
    previousAuto: "800000",
    nextValue: 1000000,
  });
  assert.equal(preserved.legalValue, "900000");
  assert.equal(preserved.currentValue, "900000");
  assert.equal(preserved.legalValueComparableAuto, "1000000");
  assert.equal(preserved.currentValueComparableAuto, "1000000");

  const refreshed = runLandSync({
    tarla,
    legalValue: "800000",
    currentValue: "800000",
    previousAuto: "800000",
    nextValue: 1000000,
  });
  assert.equal(refreshed.legalValue, "1000000");
  assert.equal(refreshed.currentValue, "1000000");

  const locked = runLandSync({
    tarla,
    legalValue: "900000",
    currentValue: "900000",
    previousAuto: "900000",
    nextValue: 1000000,
    userDefined: true,
  });
  assert.equal(locked.legalValue, "900000");
  assert.equal(locked.currentValue, "900000");
  assert.equal(locked.legalValueComparableAuto, "1000000");
  assert.equal(locked.currentValueComparableAuto, "1000000");
});

console.log("land valuation manual override tests passed");
