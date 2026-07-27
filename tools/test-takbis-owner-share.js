"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function findTakbisFractionFromOwnerRows");
const end = appSource.indexOf("function buildTakbisOwnerNameFromRows", start);
assert(start >= 0 && end > start, "TAKBIS malik hisse ayrıştırıcıları bulunamadı.");

const context = {
  cleanTakbisValue: (value) => String(value || "").replace(/\s+/g, " ").trim(),
};
vm.runInNewContext(appSource.slice(start, end), context);

const pageBreakRows = [
  {
    page: 3,
    text: "674926808 (SN:187438092) KAMİL ERDOĞAN 11176263 1/132 - - İntikal -",
    items: [
      { x: 356.024, str: "11176263", page: 3 },
      { x: 436.037, str: "1/132", page: 3 },
    ],
  },
  {
    page: 3,
    text: "3 / 11",
    items: [{ x: 772.753, str: "3 / 11" }],
  },
  {
    page: 4,
    text: "KANAK : SELAHATTİN Oğlu 9 21-07-2022",
    items: [
      { x: 165.966, str: "KANAK : SELAHATTİN Oğlu" },
      { x: 379.628, str: "9" },
      { x: 638.707, str: "21-07-2022" },
    ],
  },
];
assert.equal(
  context.findTakbisFractionFromOwnerRows(pageBreakRows).value,
  "1/132",
  "Yan sütundaki sayfa devamı paydanın sonuna eklenmemeli.",
);

const wrappedDenominatorRows = [
  {
    page: 1,
    text: "123456789 (SN:1) TEST MALİK 8117/8728",
    items: [{ x: 436, str: "8117/8728", page: 1 }],
  },
  {
    page: 2,
    text: "8",
    items: [{ x: 438, str: "8" }],
  },
];
assert.equal(
  context.findTakbisFractionFromOwnerRows(wrappedDenominatorRows).value,
  "8117/87288",
  "Aynı sütundaki gerçek payda devamı sayfa taşmasında korunmalı.",
);

console.log("TAKBIS malik hisse paydası testi tamam.");
