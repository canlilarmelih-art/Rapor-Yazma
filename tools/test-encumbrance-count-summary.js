"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const helperStart = appSource.indexOf("function getEncumbranceNumericCounts");
const helperEnd = appSource.indexOf("function buildTakyidatTableGroups", helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, "Takyidat sayım yardımcıları bulunamadı.");

const foldTurkish = (value) => String(value || "")
  .toLocaleUpperCase("tr-TR")
  .replaceAll("İ", "I")
  .replaceAll("Ş", "S")
  .replaceAll("Ğ", "G")
  .replaceAll("Ü", "U")
  .replaceAll("Ö", "O")
  .replaceAll("Ç", "C");

const context = {
  foldTurkish,
  normalizeEncumbranceSummaryText: (value) => String(value || "").trim(),
  getFilledEncumbranceRows: () => [],
  isEncumbranceRightOrLiabilityRow: (row) => /HAK|MUKELLEFIYET|IRTIFAK|INTIFA|SUKNA|OTURMA|UST HAKKI|GECIT HAKKI|KAYNAK HAKKI|DAIMI HAK/
    .test(foldTurkish([row?.c0, row?.c1].filter(Boolean).join(" "))),
};
const selectorStart = appSource.indexOf("function selectEncumbranceSummaryVariant");
const selectorEnd = appSource.indexOf("function buildEncumbranceSummary(", selectorStart);
assert(selectorStart >= 0 && selectorEnd > selectorStart, "Özet/detay seçim yardımcısı bulunamadı.");
vm.runInNewContext(appSource.slice(selectorStart, selectorEnd), context);
vm.runInNewContext(appSource.slice(helperStart, helperEnd), context);

const declarations = [
  { c0: "Beyan", c1: "Yönetim Planı" },
  { c0: "Beyan", c1: "Diğer beyan" },
  { c0: "İrtifak Hakkı", c1: "Geçit hakkı" },
];
const mortgages = [{ c0: "Banka" }];
const annotations = [
  ...Array.from({ length: 9 }, () => ({ c0: "İcrai Haciz" })),
  ...Array.from({ length: 5 }, () => ({ c0: "Kamu Haczi" })),
  ...Array.from({ length: 12 }, () => ({ c0: "İhtiyati Haciz" })),
  ...Array.from({ length: 6 }, () => ({ c0: "Aile Konutu Şerhi" })),
];

const counts = context.getEncumbranceNumericCounts({
  declarationRows: declarations,
  mortgageRows: mortgages,
  annotationRows: annotations,
});
assert.deepEqual(
  JSON.parse(JSON.stringify(counts)),
  { declarations: 2, mortgages: 1, annotations: 32, easements: 1, total: 36 },
);

const condensed = context.buildCondensedAnnotationSummary(annotations);
assert.match(condensed, /9 adet icrai haciz/);
assert.match(condensed, /5 adet kamu haczi/);
assert.match(condensed, /12 adet ihtiyati haciz/);
assert.match(condensed, /6 adet diğer tür şerh/);
assert.match(condensed, /rapor ekinde tablo olarak tarafınıza sunulmuştur/);

const oversized = `${"Beyan kaydı. ".repeat(220)}\n\n${condensed}`;
const limited = context.limitEncumbranceSummaryCharacters(oversized, 2000);
assert(limited.length <= 2000, "Yoğun takyidat özeti 2000 karakteri aşıyor.");
assert.match(limited, /rapor ekinde tablo olarak tarafınıza sunulmuştur/);

const completeLines = Array.from({ length: 40 }, (_, index) => `İrtifak kaydı ${index + 1} (Tarih: 01.01.2020, Yevmiye No: ${index + 1})`).join("\n");
const requiredTail = `Şerhler Bölümü:\n${condensed}`;
const lineLimited = context.limitEncumbranceSummaryCharacters(`${completeLines}\n\n${requiredTail}`, 2000, requiredTail);
const beforeTail = lineLimited.split("\n\nŞerhler Bölümü:")[0];
assert.match(beforeTail, /\)$/, "Yoğun özet bir takyidat kaydının ortasında kesilmemeli.");

const adaptiveSummary = context.buildAdaptiveEncumbranceSummary({
  intro: "TAKBİS belgesine göre takyidatlar aşağıdadır.",
  sections: [
    {
      detail: `Şerhler Bölümü:\n${"Uzun şerh kaydı. ".repeat(85)}`,
      summary: "Şerhler Bölümü:\nTaşınmaz üzerinde 32 adet şerh kaydı bulunmaktadır.",
    },
    {
      detail: `Hak ve Mükellefiyetler Bölümü:\n${"Uzun irtifak hakkı kaydı. ".repeat(70)}`,
      summary: "Hak ve Mükellefiyetler Bölümü:\nTaşınmaz üzerinde 18 adet hak ve mükellefiyet kaydı bulunmaktadır.",
    },
    {
      detail: "Beyanlar Bölümü:\nYönetim planı kaydı aynen korunmalıdır.",
      summary: "Beyanlar Bölümü:\n1 adet beyan kaydı bulunmaktadır.",
    },
  ],
  maxLength: 500,
});
assert(adaptiveSummary.length <= 500, "Uyarlamalı takyidat özeti karakter sınırını aşmamalı.");
assert.match(adaptiveSummary, /32 adet şerh kaydı/);
assert.match(adaptiveSummary, /18 adet hak ve mükellefiyet kaydı/);
assert.match(adaptiveSummary, /Yönetim planı kaydı aynen korunmalıdır/);

assert.equal(
  context.selectEncumbranceSummaryVariant(
    { detail: "kısa detay", summary: "kısa özet", exceedsLimit: false },
    "summary",
  ),
  "kısa detay",
);
assert.equal(
  context.selectEncumbranceSummaryVariant(
    { detail: "uzun detay", summary: "uzun özet", exceedsLimit: true },
    "summary",
  ),
  "uzun özet",
);
assert.equal(
  context.selectEncumbranceSummaryVariant(
    { detail: "uzun detay", summary: "uzun özet", exceedsLimit: true },
    "detail",
  ),
  "uzun detay",
);

assert.match(appSource, /const exceedsLimit = detail\.length > 2000/);
assert.match(appSource, /buildCondensedAnnotationSummary\(annotationRows\)/);
assert.match(appSource, /buildAdaptiveEncumbranceSummary\(\{/);
assert.match(appSource, /right\.detailLength - left\.detailLength/);
assert.match(appSource, /dataEncumbranceSummaryMode|data-encumbrance-summary-mode/);
assert.match(appSource, /group\.hidden = !variants\.exceedsLimit/);
assert.match(appSource, /body\.append\(createEncumbranceCountSummaryPanel\(\)\)/);

console.log("takyidat sayısal tablo ile özet/detay görünümü testleri tamam.");
