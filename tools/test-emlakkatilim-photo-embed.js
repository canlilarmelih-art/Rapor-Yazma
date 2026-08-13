"use strict";

/*
  Kullanici talebi (2026-08-13): "ben görsellerin eklenmesini ve
  kullanılabilmesini istiyorum ancak bunlar kullanıcı cihazında kalmalı
  ve server a hiç gitmemeli" — sonrasinda kapsam "sadece docx dosyalara
  gömeceğiz. diğerleri olmayacak. şu an sadece emlakkatılım" olarak
  netlesti.

  templates/emlakkatilim.docx'in "8.1 Fotoğraflar" ve "8.3 Proje
  Fotoğrafları" bölümlerindeki (önceden BOŞ) hücrelere elle
  {{FOTO_ALANI_1}}/{{FOTO_ALANI_3}} token'ları eklendi (word/document.xml
  bayt-duzeyinde duzenlenip STORED zip olarak yeniden paketlendi — bkz.
  handoff.md). Bu test dogrular:
  1) Sablon hala GECERLI bir STORED .docx (readStoredZip patlamiyor).
  2) collectTokens() her iki yeni token'i da buluyor.
  3) Fotograf VARKEN: embedPhotoGalleryAssets gercek <w:drawing>+altyazi
     paragraflari gomuyor, ham "{{FOTO_ALANI_N}}" metni CIKTIDA kalmiyor.
  4) Fotograf YOKKEN (values[token]="" ile, template-engine.js'in gercek
     davranisi): token TEMIZ sekilde silinip belgede GORUNMUYOR (ne ham
     token ne de "missing" uyarisi).
  5) Her iki durumda da ciktinin STORED-zip round-trip'i saglam.
*/

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const appDir = path.join(__dirname, "..");
const failures = [];
function check(cond, msg) {
  if (!cond) failures.push(msg);
}

global.window = {};
const docxFillSrc = fs.readFileSync(path.join(appDir, "src", "exports", "docx-fill.js"), "utf8");
// eslint-disable-next-line no-eval
eval(docxFillSrc);
const DocxFill = global.window.RaporDocxFill;
assert.ok(DocxFill && typeof DocxFill.fillTemplate === "function", "RaporDocxFill yuklenmedi.");

const templatePath = path.join(appDir, "templates", "emlakkatilim.docx");
const templateBuffer = fs.readFileSync(templatePath);
const arrayBuffer = templateBuffer.buffer.slice(templateBuffer.byteOffset, templateBuffer.byteOffset + templateBuffer.byteLength);

// --- 1) Hala gecerli STORED zip mi? -----------------------------------
let entries;
try {
  entries = DocxFill.readStoredZip(arrayBuffer);
} catch (error) {
  check(false, `templates/emlakkatilim.docx artik STORED zip olarak okunamiyor: ${error.message}`);
}
const docEntry = entries?.find((e) => e.name === "word/document.xml");
check(Boolean(docEntry), "word/document.xml girisi bulunamadi.");

// --- 2) collectTokens yeni token'lari buluyor mu? ----------------------
const xmlText = Buffer.from(docEntry.bytes).toString("utf8");
const tokens = DocxFill.collectTokens(xmlText);
check(tokens.includes("FOTO_ALANI_1"), "{{FOTO_ALANI_1}} sablonda bulunamadi (8.1 Fotograflar duzenlemesi kaybolmus olabilir).");
check(tokens.includes("FOTO_ALANI_3"), "{{FOTO_ALANI_3}} sablonda bulunamadi (8.3 Proje Fotograflari duzenlemesi kaybolmus olabilir).");

// Gercek, gecerli, kucuk (1x1 kirmizi) bir JPEG — getJpegPixelSize'in
// gercek bir goruntude de dogru calistigini kanitlamak icin.
const TINY_JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function buildValuesWithMissingPlaceholders(tokenList, overrides = {}) {
  const values = {};
  tokenList.forEach((t) => { values[t] = overrides[t] !== undefined ? overrides[t] : `[${t}]`; });
  return values;
}

function countOccurrences(text, needle) {
  return (text.match(new RegExp(needle, "g")) || []).length;
}

// Sablon zaten kendi logo/antet gorselleriyle geliyor — mutlak sayim
// yerine ORIJINAL sablona GORE artis (delta) olcup karsilastiriyoruz.
const baselineDrawingCount = countOccurrences(xmlText, "<w:drawing>");
const baselineRelsEntry = entries.find((e) => e.name === "word/_rels/document.xml.rels");
const baselineRelsXml = Buffer.from(baselineRelsEntry.bytes).toString("utf8");
const baselineImageRelCount = countOccurrences(baselineRelsXml, 'Type="http://schemas\\.openxmlformats\\.org/officeDocument/2006/relationships/image"');
const baselineMediaCount = entries.filter((e) => e.name.startsWith("word/media/")).length;

// --- 3) Fotograf VARKEN: gercek <w:drawing> gomuluyor mu? ---------------
{
  const values = buildValuesWithMissingPlaceholders(tokens);
  const boldFlags = {};
  const photoGroups = [
    { token: "FOTO_ALANI_1", photos: [
      { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", caption: "Ön cephe" },
      { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", caption: "" },
    ] },
    { token: "FOTO_ALANI_3", photos: [
      { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", caption: "Temel çalışması" },
    ] },
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, boldFlags, [], photoGroups);
  check(!filled.missing.includes("FOTO_ALANI_1"), "FOTO_ALANI_1 fotograf gomulmesine ragmen 'missing' listesinde.");
  check(!filled.missing.includes("FOTO_ALANI_3"), "FOTO_ALANI_3 fotograf gomulmesine ragmen 'missing' listesinde.");

  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  check(!outXml.includes("{{FOTO_ALANI_1}}"), "Ciktida ham {{FOTO_ALANI_1}} metni hala duruyor (gomulmemis).");
  check(!outXml.includes("{{FOTO_ALANI_3}}"), "Ciktida ham {{FOTO_ALANI_3}} metni hala duruyor (gomulmemis).");
  const drawingCount = countOccurrences(outXml, "<w:drawing>");
  check(drawingCount === baselineDrawingCount + 3, `Sablona gore +3 <w:drawing> (2+1 fotograf) bekleniyordu, gercek fark: ${drawingCount - baselineDrawingCount}`);
  check(outXml.includes("Ön cephe"), "İlk fotografin altyazisi ciktida yok.");
  check(outXml.includes("Temel çalışması"), "8.3 fotografinin altyazisi ciktida yok.");
  const outRelsEntry = outEntries.find((e) => e.name === "word/_rels/document.xml.rels");
  const outRelsXml = Buffer.from(outRelsEntry.bytes).toString("utf8");
  const relCount = countOccurrences(outRelsXml, 'Type="http://schemas\\.openxmlformats\\.org/officeDocument/2006/relationships/image"');
  check(relCount === baselineImageRelCount + 3, `Sablona gore +3 goruntu iliskisi (rels) bekleniyordu, gercek fark: ${relCount - baselineImageRelCount}`);
  const mediaEntries = outEntries.filter((e) => e.name.startsWith("word/media/"));
  check(mediaEntries.length === baselineMediaCount + 3, `Sablona gore +3 word/media/ girisi bekleniyordu, gercek fark: ${mediaEntries.length - baselineMediaCount}`);
}

// --- 4) Fotograf YOKKEN: token temiz sekilde silinmeli -------------------
{
  const overrides = { FOTO_ALANI_1: "", FOTO_ALANI_3: "" }; // template-engine.js'in gercek davranisi
  const values = buildValuesWithMissingPlaceholders(tokens, overrides);
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], []);
  check(!filled.missing.includes("FOTO_ALANI_1"), "Fotografsiz durumda FOTO_ALANI_1 'missing' olarak isaretlenmis.");
  check(!filled.missing.includes("FOTO_ALANI_3"), "Fotografsiz durumda FOTO_ALANI_3 'missing' olarak isaretlenmis.");
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  check(!outXml.includes("{{FOTO_ALANI_1}}"), "Fotografsiz durumda ham {{FOTO_ALANI_1}} metni ciktida kalmis.");
  check(!outXml.includes("{{FOTO_ALANI_3}}"), "Fotografsiz durumda ham {{FOTO_ALANI_3}} metni ciktida kalmis.");
  // Sablonun KENDI logo/antet gorselleri (baseline) hala dursun — yalnizca
  // FOTO_ALANI_* icin YENI bir <w:drawing> eklenmemis olmasi kontrol edilir.
  const drawingCountEmpty = countOccurrences(outXml, "<w:drawing>");
  check(drawingCountEmpty === baselineDrawingCount, `Fotografsiz durumda <w:drawing> sayisi sablonla ayni kalmaliydi (${baselineDrawingCount}), bulunan: ${drawingCountEmpty}`);
}

if (failures.length) {
  console.error("emlakkatilim.docx fotograf gomme testi BASARISIZ:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("emlakkatilim.docx '8. Ekler' fotograf gomme (FOTO_ALANI_1/FOTO_ALANI_3) testleri basarili.");
