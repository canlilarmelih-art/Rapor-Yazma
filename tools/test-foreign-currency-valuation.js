"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("const foreignCurrencyValuationDefinitions = [");
const end = appSource.indexOf("function setTcmbRateStatus(", start);
assert(start >= 0 && end > start, "Doviz bazli degerleme hesaplama yardimcilari bulunamadi.");

const context = {
  state: {
    fields: {
      legalValue: "6000000",
      currentValue: "6500000",
      legalUrgentSaleValue: "5400000",
      currentUrgentSaleValue: "5850000",
    },
  },
  tcmbRatePayload: {
    date: "03.08.2026",
    usd: { buying: 50, selling: 50.25 },
    eur: { buying: 55, selling: 55.5 },
  },
  parseValuationNumber: (value) => Number(value),
  formatValuationMoney: (value) => Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 }),
  formatTcmbDate: (value) => value,
  formatTcmbRate: (value) => Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
  document: { querySelector: () => null },
};
vm.createContext(context);
vm.runInContext(appSource.slice(start, end), context);

const rows = context.getForeignCurrencyValuationRows();
assert.equal(rows.length, 8, "Dort deger icin USD ve EUR olmak uzere sekiz placeholder degeri uretilmeli.");
assert.equal(rows.find((row) => row.key === "legalValueUsd").value, "120.000,00 USD");
assert.equal(rows.find((row) => row.key === "legalValueEur").value, "109.090,91 EUR");
assert.equal(rows.find((row) => row.key === "currentUrgentSaleValueUsd").value, "117.000,00 USD");

const rateRows = context.getTcmbRatePlaceholderRows();
assert.equal(rateRows.length, 4, "USD/EUR alış ve satış için dört kur placeholder'ı üretilmeli.");
assert.equal(rateRows.find((row) => row.key === "usdBuyingRate").value, "50,0000");
assert.equal(rateRows.find((row) => row.key === "usdSellingRate").value, "50,2500");
assert.equal(rateRows.find((row) => row.key === "eurBuyingRate").value, "55,0000");
assert.equal(rateRows.find((row) => row.key === "eurSellingRate").value, "55,5000");

const explanation = context.buildForeignCurrencyValuationExplanation();
assert.match(explanation, /TCMB 03\.08\.2026 tarihli döviz alış kurları/i);
assert.match(explanation, /Yasal Durum Değeri/);
assert.match(explanation, /USD alış kuru 50,0000 TL/);
assert.match(explanation, /EUR alış kuru 55,0000 TL/);

context.tcmbRatePayload = null;
assert.equal(context.getForeignCurrencyValuationRows().every((row) => row.value === ""), true, "Kur yoksa döviz değeri üretilmemeli.");
assert.equal(context.getTcmbRatePlaceholderRows().every((row) => row.value === ""), true, "Kur yoksa kur placeholder değeri üretilmemeli.");
assert.equal(context.buildForeignCurrencyValuationExplanation(), "", "Kur yoksa açıklama boş kalmalı.");

console.log("Döviz bazlı değerleme hesaplama testleri geçti.");
