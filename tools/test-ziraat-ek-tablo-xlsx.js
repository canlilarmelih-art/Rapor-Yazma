"use strict";

/*
  Ziraat ek tablo XLSX doldurma regresyon testi (tarayıcısız).

  src/exports/xlsx-fill.js düşük seviye fonksiyonlarını (readStoredZip,
  setCellValue, writeStoredZip) Node'da çalıştırır; templates/ziraat-ek-tablo.xlsx
  STORED şablonunu manifest + örnek veriyle doldurur ve çıktıyı
  tools/.tmp-ziraat-ek-tablo-cikti.xlsx olarak yazar. Ardından bu dosya
  openpyxl ile açılıp hücre tip/değerleri doğrulanabilir (ayrı python adımı).

  Bu test: (1) şablonun STORED ve okunabilir olduğunu, (2) doldurma sonrası
  zip'in yeniden yazılabildiğini, (3) sayı hücrelerinin t="n", metin
  hücrelerinin inlineStr kaldığını doğrular.
*/

const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..");
const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// --- xlsx-fill.js'i Node'da yükle (window stub) ---
global.window = {};
const code = fs.readFileSync(path.join(appDir, "src", "exports", "xlsx-fill.js"), "utf8");
// eslint-disable-next-line no-eval
eval(code);
const F = global.window.RaporXlsxFill;
assert(F && typeof F.readStoredZip === "function", "RaporXlsxFill yüklenmedi.");

const dec = new TextDecoder("utf-8");
const enc = new TextEncoder();

// --- Şablon + manifest ---
const tplPath = path.join(appDir, "templates", "ziraat-ek-tablo.xlsx");
assert(fs.existsSync(tplPath), "templates/ziraat-ek-tablo.xlsx bulunamadı.");
const manifest = JSON.parse(
  fs.readFileSync(path.join(appDir, "src", "exports", "ziraat-ek-tablo-manifest.json"), "utf8")
);
assert(Array.isArray(manifest.cells) && manifest.cells.length > 0, "manifest cells boş.");

// --- Örnek veri (alan → değer) ---
const SAMPLE = {
  blockNo: "2626",
  parcelNo: "1",
  landArea: "3178",
  legalValue: "3600000",
  currentValue: "3600000",
  legalArea: "91",
  currentArea: "91",
  kaks: "1.05",
  taks: "0.35",
  hmax: "9.5",
  legend: "KONUT+TİCARET",
  order: "AYRIK",
  saleability: "SATILABİLİR",
  titleQuality: "DÜKKAN",
  titlePropertyId: "83280198",
  mainPropertyQuality: "KARGİR APARTMAN",
  buildingClass: "3-A",
  titleFloor: "ZEMİN",
  ZRT_RUHSAT: "YAPI RUHSATI / 29.05.2012 / 301/12",
  ZRT_ISKAN: "İSKAN / 29.01.2016 / 3516",
};

function toNumber(v) {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function resolve(entry) {
  const raw = SAMPLE[entry.field];
  if (entry.type === "number") return toNumber(raw);
  return raw != null ? String(raw) : "";
}

// --- Doldurma (fillTemplate'in fetch'siz karşılığı) ---
const bytes = fs.readFileSync(tplPath);
const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const entries = F.readStoredZip(ab);
assert(entries.length > 5, "STORED zip okunamadı (giriş sayısı düşük).");

const sheetTexts = new Map();
for (const e of entries) {
  const m = e.name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/);
  if (m) sheetTexts.set(Number(m[1]), dec.decode(e.bytes));
}
assert(sheetTexts.size === 4, `4 sayfa beklenirken ${sheetTexts.size} bulundu.`);

for (const cell of manifest.cells) {
  let text = sheetTexts.get(cell.sheetIndex);
  if (text == null) {
    failures.push(`sheet ${cell.sheetIndex} yok (${cell.cell}).`);
    continue;
  }
  const before = text;
  text = F.setCellValue(text, cell.cell, cell.type, resolve(cell));
  assert(text !== before, `Hücre değişmedi: sheet${cell.sheetIndex}!${cell.cell} (${cell.field})`);
  sheetTexts.set(cell.sheetIndex, text);
}

// tip kontrolü: doldurulmuş bir sayı hücresi t="n", metin inlineStr olmalı
const s1 = sheetTexts.get(1);
assert(/<c r="D3"[^>]*><v>3178<\/v><\/c>/.test(s1),
  "TARLA D3 (yüzölçüm) sayı olarak doldurulmadı.");
assert(/<c r="B3"[^>]*t="inlineStr"><is><t>2626<\/t><\/is><\/c>/.test(s1),
  "TARLA B3 (ada) inlineStr olarak doldurulmadı.");

const outEntries = entries.map((e) => {
  const m = e.name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/);
  if (m && sheetTexts.has(Number(m[1]))) {
    return { name: e.name, bytes: enc.encode(sheetTexts.get(Number(m[1]))) };
  }
  return e;
});
const outBytes = F.writeStoredZip(outEntries);
assert(outBytes && outBytes.length > 0, "writeStoredZip boş döndü.");
// EOCD imzası
assert(
  outBytes[outBytes.length - 22] === 0x50 && outBytes[outBytes.length - 21] === 0x4b,
  "Çıktı zip EOCD imzası hatalı."
);

// Çıktıyı geçici doğrulama için yaz, sonra temizle (repoda kalmasın).
const outPath = path.join(appDir, "tools", ".tmp-ziraat-ek-tablo-cikti.xlsx");
fs.writeFileSync(outPath, Buffer.from(outBytes));
// Geçerli zip mi (PK imzası)? — yüzeysel yapı kontrolü.
assert(outBytes[0] === 0x50 && outBytes[1] === 0x4b, "Çıktı geçerli ZIP (PK) imzasıyla başlamıyor.");
try {
  fs.unlinkSync(outPath);
} catch (error) {
  /* yoksay */
}

if (failures.length) {
  console.error("Ziraat ek tablo XLSX testi BAŞARISIZ:");
  for (const f of failures) console.error(" - " + f);
  process.exit(1);
}
console.log("Ziraat ek tablo XLSX doldurma testi tamam.");
