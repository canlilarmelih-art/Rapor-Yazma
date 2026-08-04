"use strict";

/*
  Kullanici talebi: "03.08.2026 tarihinde saat 17:32 Webtapu Sistemi
  üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki
  takyidatlar bulunmaktadır. takyidatlar bölümünde yer alan bu açıklama
  bölümünü de ayrı bir placeholder olarak ekleyelim" — bu cümle daha önce
  yalnızca buildEncumbranceSummaryVariants() İÇİNDE (birleşik özetin ilk
  cümlesi) üretiliyordu; artık ayrı buildEncumbranceIntroSentence() /
  getEncumbranceIntroSentenceForPlaceholder() fonksiyonlarına çıkarıldı ve
  {{TAKYIDATACIKLAMAGIRISCUMLESI}} placeholder'ı ile ayrı yerleştirilebilir.

  Bu test:
  1) buildEncumbranceIntroSentence()'ın tarih/saat/yöntem alanlarından
     dogru cumleyi urettigini (kullanicinin ornegiyle birebir),
  2) getEncumbranceIntroSentenceForPlaceholder()'ın "Tapu Kaydı
     Alınmamıştır." ve "hiç veri yok" durumlarında BOŞ dondugunu
     (buildEncumbranceSummaryVariants()'in erken-donus korumasiyla ayni),
  3) template-engine.js'in placeholder'i dogru fonksiyona bagladigini
  izole VM'de dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

function sliceRange(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const literalEnd = appSource.indexOf(endMarker, start);
  assert(literalEnd > start, `Bitis bulunamadi: ${endMarker}`);
  return appSource.slice(start, literalEnd);
}

const src = [
  sliceFn("function foldTurkish("),
  sliceFn("function normalizeYesNoChoice("),
  sliceFn("function dateIsoToTr("),
  sliceFn("function encumbranceCleanText("),
  sliceFn("function encumbranceTextOrBila("),
  sliceFn("function encumbranceDateOrBila("),
  sliceFn("function getFilledEncumbranceRows("),
  sliceRange("const encumbranceReportTables = [", "\n];") + "\n];",
  sliceFn("function buildEncumbranceIntroSentence("),
  sliceFn("function getEncumbranceIntroSentenceForPlaceholder("),
].join("\n");

function run(fields, tables = {}) {
  const context = { state: { fields, tables } };
  vm.createContext(context);
  vm.runInContext(src, context);
  return context;
}

// --- 1) Kullanicinin kendi ornegi -----------------------------------------
{
  const ctx = run({ takbisDate: "2026-08-03", takbisTime: "17:32", takbisMethod: "Webtapu Sistemi" });
  assert.equal(
    ctx.buildEncumbranceIntroSentence(),
    "03.08.2026 tarihinde saat 17:32 Webtapu Sistemi üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki takyidatlar bulunmaktadır.",
    "Kullanicinin verdigi ornek cumleyle birebir eslesmeli."
  );
}

// --- 2) Saat girilmemisse "saat ..." kismi dusmeli ------------------------
{
  const ctx = run({ takbisDate: "2026-08-03", takbisMethod: "Webtapu Sistemi" });
  assert.equal(
    ctx.buildEncumbranceIntroSentence(),
    "03.08.2026 tarihinde Webtapu Sistemi üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki takyidatlar bulunmaktadır."
  );
}

// --- 3) Tarih/yontem bos ise "Bila" ile doldurulur ------------------------
{
  const ctx = run({});
  assert.equal(
    ctx.buildEncumbranceIntroSentence(),
    "Bila tarihinde Webtapu Sistemi üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki takyidatlar bulunmaktadır.",
    "Bos alanlarda varsayilan 'Bila'/'Webtapu Sistemi' kullanilmali."
  );
}

// --- 4) getEncumbranceIntroSentenceForPlaceholder — erken-donus korumalari
{
  const ctx1 = run({ takbisMethod: "Tapu Kaydı Alınmamıştır." });
  assert.equal(ctx1.getEncumbranceIntroSentenceForPlaceholder(), "", "'Tapu Kaydı Alınmamıştır.' durumunda bos donmeli.");

  const ctx2 = run({});
  assert.equal(ctx2.getEncumbranceIntroSentenceForPlaceholder(), "", "Hic veri yokken bos donmeli.");

  const ctx3 = run({ takbisDate: "2026-08-03", takbisTime: "17:32" });
  assert.notEqual(ctx3.getEncumbranceIntroSentenceForPlaceholder(), "", "takbisDate girilmisse dolu donmeli.");
}

// --- 5) template-engine.js kablolamasi ------------------------------------
{
  const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
  assert(
    engineSource.includes('TAKYIDATACIKLAMAGIRISCUMLESI: { t: () => safeCall("getEncumbranceIntroSentenceForPlaceholder") }'),
    "TAKYIDATACIKLAMAGIRISCUMLESI placeholder'i getEncumbranceIntroSentenceForPlaceholder'a baglanmamis."
  );
}

console.log("Takyidat aciklama giris cumlesi (TAKYIDATACIKLAMAGIRISCUMLESI) testi tamam.");
