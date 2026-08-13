"use strict";

/*
  Kullanici talebi: "emsal krokisi çıkmıyor word'de" — {{EMSAL_KROKISI}}
  HTML sablonlarda gercek bir <img> uretiyordu (reportImageHtml("comparables")),
  ama docx yolunda IKI ayri sorun vardi: (1) exportDocxTemplate gorsel
  varliklari (ensureReportMapImagesForExport/buildSavedReportImageAssets)
  HIC hazirlamiyordu, (2) htmlValueToXmlText zaten TUM HTML etiketlerini
  (dolayisiyla <img>'i) duz metne cevirirken siliyordu — .docx'e GERCEK bir
  gorsel gommek text-substitution ile mumkun degil, word/media/ + iliski
  (rels) + <w:drawing> XML'i gerekiyor.

  Bu test: (1) JPEG piksel boyutu ayristirici, (2) EMU boyutlandirma
  (contain-fit), (3) embedImageAssets — sentetik bir sablon + sahte JPEG
  varligiyla gercek <w:drawing>/rels/media entry'si uretildigini,
  (4) fillTemplate uctan uca (zip round-trip ile gorsel baytlarinin
  bozulmadan geri geldigini), (5) gercek emlakkatilim.docx sablonunda
  sahte bir "comparables" varligiyla sifir "missing" ve tam 1 yeni
  media/relationship eklendigini dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const failures = [];
function check(cond, msg) {
  if (!cond) failures.push(msg);
}

global.window = {};
// atob/btoa Node'da global degil (tarayicida var) — Buffer ile polyfill.
global.atob = (b64) => Buffer.from(b64, "base64").toString("binary");
global.btoa = (bin) => Buffer.from(bin, "binary").toString("base64");

const docxFillSrc = fs.readFileSync(path.join(appDir, "src", "exports", "docx-fill.js"), "utf8");
// eslint-disable-next-line no-eval
eval(docxFillSrc);
const DocxFill = global.window.RaporDocxFill;
assert.ok(DocxFill && typeof DocxFill.embedImageAssets === "function", "RaporDocxFill.embedImageAssets yuklenmedi.");

// Minimal, elle olusturulmus JPEG (SOI + SOF0[height=200,width=150] + EOI) —
// gercek bir goruntuyu decode etmez, yalnizca boyut okuyucuyu test eder.
function buildFakeJpegBytes(width, height) {
  return new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xc0, 0x00, 0x0b, 0x08, // SOF0, length=11, precision=8
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x01, 0x01, 0x11, 0x00, // 1 component
    0xff, 0xd9, // EOI
  ]);
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return global.btoa(binary);
}

// --- 1) getJpegPixelSize ----------------------------------------------------
{
  const bytes = buildFakeJpegBytes(150, 200);
  const size = DocxFill.getJpegPixelSize(bytes);
  check(size && size.width === 150 && size.height === 200, `JPEG boyutu dogru okunmadi: ${JSON.stringify(size)}`);
  check(DocxFill.getJpegPixelSize(new Uint8Array([0x00, 0x01])) === null, "Gecersiz JPEG baytlari icin null donmeli.");
  console.log("JPEG piksel boyutu ayristirma testi tamam.");
}

// --- 2) computeImageEmuSize — en-boy orani korunarak sigdirma (contain) ----
{
  // Sinir kutusu (6.29in x 3.21in, oran ~1.96:1) 16:9'dan (1.78:1) DAHA
  // GENIS oldugu icin bir 16:9 gorsel YUKSEKLIK sinirina oturur, genislik
  // sinirina degil — bu yuzden genislik-sinirli durumu test etmek icin
  // kutudan DAHA GENIS bir oran (21:9) kullanilir.
  const wide = DocxFill.computeImageEmuSize({ width: 2560, height: 1080 }); // 21:9, kutudan genis
  check(wide.cx === 5760000, `Kutudan genis oranli gorselde genislik sinira (5760000) oturmali: ${JSON.stringify(wide)}`);
  check(Math.abs(wide.cy - Math.round(5760000 * 1080 / 2560)) <= 1, `21:9 oran korunmamis: ${JSON.stringify(wide)}`);

  const sixteenNine = DocxFill.computeImageEmuSize({ width: 1600, height: 900 }); // 16:9, kutudan dar (yukseklik sinirli)
  check(sixteenNine.cy === 2939415, `16:9 gorselde yukseklik sinira (2939415) oturmali: ${JSON.stringify(sixteenNine)}`);
  check(sixteenNine.cx < 5760000, `16:9 gorselde genislik genislik sinirindan kucuk olmali: ${JSON.stringify(sixteenNine)}`);

  const tall = DocxFill.computeImageEmuSize({ width: 900, height: 1600 }); // dikey, uzun
  check(tall.cy === 2939415, `Dikey gorselde yukseklik sinira (2939415) oturmali: ${JSON.stringify(tall)}`);
  check(tall.cx < 5760000, `Dikey gorselde genislik yukseklik sinirindan kucuk olmali: ${JSON.stringify(tall)}`);

  const fallback = DocxFill.computeImageEmuSize(null);
  check(fallback.cx === 5760000, `Boyut bilinmiyorsa varsayilan genislik kullanilmali: ${JSON.stringify(fallback)}`);
  console.log("Gorsel EMU boyutlandirma (contain-fit) testi tamam.");
}

// --- 3) embedImageAssets — sentetik sablon + sahte JPEG -------------------
{
  const enc = new TextEncoder();
  const documentXml =
    '<?xml version="1.0"?><w:document><w:body>' +
    '<w:p><w:r><w:t>{{EMSAL_KROKISI}}</w:t></w:r></w:p>' +
    "</w:body></w:document>";
  const relsXml =
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    "</Relationships>";
  const entries = [
    { name: "word/document.xml", bytes: enc.encode(documentXml) },
    { name: "word/_rels/document.xml.rels", bytes: enc.encode(relsXml) },
  ];

  const jpegBytes = buildFakeJpegBytes(1200, 675); // 16:9
  const asset = { key: "comparables", title: "Emsal Konum Krokisi", base64: bytesToBase64(jpegBytes), mimeType: "image/jpeg" };

  const result = DocxFill.embedImageAssets(documentXml, entries, [asset]);
  check(result.embeddedAny === true, "embedImageAssets embeddedAny=true dondurmeli.");
  check(!result.xmlText.includes("{{EMSAL_KROKISI}}"), "Token belgede hala duz metin olarak kalmis.");
  check(result.xmlText.includes("<w:drawing>"), "Sonuc XML'inde <w:drawing> bulunamadi.");
  check(/r:embed="rId2"/.test(result.xmlText), `Yeni iliski Id'si (rId2, mevcut rId1'den sonraki) beklenirdi: ${result.xmlText}`);

  const mediaEntry = result.entries.find((e) => e.name === "word/media/image1.jpeg");
  check(Boolean(mediaEntry), "word/media/image1.jpeg eklenmemis.");
  check(mediaEntry && Buffer.from(mediaEntry.bytes).equals(Buffer.from(jpegBytes)), "Gomulen gorsel baytlari orijinaliyle birebir aynı degil.");

  const updatedRels = new TextDecoder("utf-8").decode(result.entries.find((e) => e.name === "word/_rels/document.xml.rels").bytes);
  check(updatedRels.includes('Id="rId2"') && updatedRels.includes("media/image1.jpeg"), `Rels dosyasina yeni iliski eklenmemis: ${updatedRels}`);
  check(updatedRels.includes('Id="rId1"'), "Mevcut iliski (rId1) korunmali.");

  // Karsiligi olmayan bir gorsel token (asset yok) DOKUNULMADAN kalmali.
  const noAssetResult = DocxFill.embedImageAssets(documentXml, entries, []);
  check(noAssetResult.embeddedAny === false, "Varlik yokken embeddedAny=false olmali.");
  check(noAssetResult.xmlText.includes("{{EMSAL_KROKISI}}"), "Varlik yokken token metin olarak kalmali (normal 'missing' akisina dusmeli).");

  console.log("embedImageAssets (sentetik sablon) testi tamam.");
}

// --- 4) fillTemplate uctan uca — gorsel zip round-trip'te bozulmamali -----
{
  const enc = new TextEncoder();
  const documentXml =
    '<?xml version="1.0"?><w:document><w:body>' +
    '<w:p><w:r><w:t>İl: {{CITY}}</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>{{EMSAL_KROKISI}}</w:t></w:r></w:p>' +
    "</w:body></w:document>";
  const relsXml =
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    "</Relationships>";
  const entries = [
    { name: "[Content_Types].xml", bytes: enc.encode("<Types/>") },
    { name: "word/document.xml", bytes: enc.encode(documentXml) },
    { name: "word/_rels/document.xml.rels", bytes: enc.encode(relsXml) },
  ];
  const arrayBuffer = DocxFill.writeStoredZip(entries).buffer;

  const jpegBytes = buildFakeJpegBytes(800, 450);
  const asset = { key: "comparables", title: "Emsal Konum Krokisi", base64: bytesToBase64(jpegBytes), mimeType: "image/jpeg" };
  const values = { CITY: "Bursa" };

  const result = DocxFill.fillTemplate(arrayBuffer, values, {}, [asset]);
  check(!result.missing.includes("EMSAL_KROKISI"), `EMSAL_KROKISI gomulduyse fillTemplate'in kendi missing listesinde OLMAMALI: ${JSON.stringify(result.missing)}`);

  const readBack = DocxFill.readStoredZip(result.bytes.buffer);
  const filledDoc = new TextDecoder("utf-8").decode(readBack.find((e) => e.name === "word/document.xml").bytes);
  check(filledDoc.includes("İl: Bursa"), "Normal metin token'i (CITY) etkilenmemis olmali.");
  check(filledDoc.includes("<w:drawing>"), "Dolu belgede <w:drawing> bulunamadi.");

  const mediaBack = readBack.find((e) => e.name === "word/media/image1.jpeg");
  check(Boolean(mediaBack), "Zip round-trip sonrasi gomulen gorsel entry'si kayip.");
  check(mediaBack && Buffer.from(mediaBack.bytes).equals(Buffer.from(jpegBytes)), "Zip round-trip sonrasi gorsel baytlari bozulmus.");

  console.log("fillTemplate ucdan uca gorsel gomme (zip round-trip) testi tamam.");
}

// --- 5) Gercek emlakkatilim.docx sablonu — sahte varlikla tam entegrasyon -
{
  const templatePath = path.join(appDir, "templates", "emlakkatilim.docx");
  const buffer = fs.readFileSync(templatePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const entriesBefore = DocxFill.readStoredZip(arrayBuffer);
  const docTextBefore = new TextDecoder("utf-8").decode(entriesBefore.find((e) => e.name === "word/document.xml").bytes);
  const tokens = DocxFill.collectTokens(docTextBefore);
  check(tokens.includes("EMSAL_KROKISI"), "Gercek sablonda {{EMSAL_KROKISI}} bulunamadi (sablon degismis olabilir).");

  const relsEntryBefore = entriesBefore.find((e) => e.name === "word/_rels/document.xml.rels");
  check(Boolean(relsEntryBefore), "Gercek sablonda word/_rels/document.xml.rels bulunamadi.");
  const relsBefore = new TextDecoder("utf-8").decode(relsEntryBefore.bytes);
  const relIdsBefore = [...relsBefore.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
  const maxRelIdBefore = Math.max(...relIdsBefore);
  const mediaCountBefore = entriesBefore.filter((e) => /^word\/media\//.test(e.name)).length;

  const jpegBytes = buildFakeJpegBytes(1200, 675);
  const asset = { key: "comparables", title: "Emsal Konum Krokisi", base64: bytesToBase64(jpegBytes), mimeType: "image/jpeg" };

  const values = {};
  tokens.forEach((t) => {
    if (t.startsWith("BOLD:") || t === "EMSAL_KROKISI") return;
    values[t] = "VAL";
  });

  const result = DocxFill.fillTemplate(arrayBuffer, values, {}, [asset]);
  check(result.missing.length === 0, `Gercek sablonda gorsel gomulduyse hicbir token 'missing' kalmamali: ${JSON.stringify(result.missing)}`);

  const entriesAfter = DocxFill.readStoredZip(result.bytes.buffer);
  const mediaCountAfter = entriesAfter.filter((e) => /^word\/media\//.test(e.name)).length;
  check(mediaCountAfter === mediaCountBefore + 1, `Tam 1 yeni media dosyasi eklenmeli (once:${mediaCountBefore}, sonra:${mediaCountAfter}).`);

  const relsAfter = new TextDecoder("utf-8").decode(entriesAfter.find((e) => e.name === "word/_rels/document.xml.rels").bytes);
  const relIdsAfter = [...relsAfter.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
  check(relIdsAfter.includes(maxRelIdBefore + 1), `Yeni iliski Id'si (rId${maxRelIdBefore + 1}) eklenmemis.`);
  check(relIdsAfter.length === relIdsBefore.length + 1, "Tam 1 yeni iliski eklenmeli, mevcutlar korunmali.");

  const docTextAfter = new TextDecoder("utf-8").decode(entriesAfter.find((e) => e.name === "word/document.xml").bytes);
  check(docTextAfter.includes("<w:drawing>"), "Gercek sablonda doldurma sonrasi <w:drawing> bulunamadi.");
  check(!docTextAfter.includes("{{EMSAL_KROKISI}}"), "Gercek sablonda {{EMSAL_KROKISI}} hala duz metin olarak kalmis.");

  console.log("Gercek emlakkatilim.docx sablonunda emsal krokisi gomme entegrasyon testi tamam.");
}

// --- 6) template-engine.js kablolamasi — exportDocxTemplate gorsel token
// varsa (harici) map/kroki varliklarini hazirlayip fillTemplate'e 4.
// parametre olarak gecmeli, HTML yolunda oldugu gibi -----------------------
{
  const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
  const fnStart = engineSource.indexOf("async function exportDocxTemplate(");
  assert(fnStart >= 0, "exportDocxTemplate bulunamadi.");
  const fnEnd = engineSource.indexOf("\n  }", fnStart) + 4;
  const fnBody = engineSource.slice(fnStart, fnEnd);
  check(fnBody.includes('tokens.includes("EMSAL_KROKISI")'), "exportDocxTemplate EMSAL_KROKISI token varligini kontrol etmiyor.");
  check(fnBody.includes('safeCall("ensureReportMapImagesForExport")'), "exportDocxTemplate ensureReportMapImagesForExport'u cagirmiyor.");
  check(fnBody.includes('safeCall("buildSavedReportImageAssets")'), "exportDocxTemplate buildSavedReportImageAssets'i cagirmiyor.");
  // 2026-08-13: "8. Ekler" fotograf modulu icin fillTemplate'e 5. (opsiyonel)
  // photoGroups parametresi eklendi — imageAssets'ten SONRA geldigi surece
  // kabul edilir (bkz. tools/test-emlakkatilim-photo-embed.js, o parametreyi
  // ayrica dogruluyor).
  check(/fillTemplate\(arrayBuffer, values, boldFlags, imageAssets(, \w+)?\)/.test(fnBody), "fillTemplate imageAssets ile cagrilmiyor.");
  check(fnBody.includes('embeddedImageKeys.has("comparables")'), "Basariyla gomulen EMSAL_KROKISI 'missing' listesinden filtrelenmiyor.");
  console.log("exportDocxTemplate gorsel varlik hazirlama kablolamasi testi tamam.");
}

if (failures.length) {
  console.error("Emsal krokisi gorsel gomme testi BASARISIZ:");
  failures.forEach((message) => console.error(` - ${message}`));
  process.exit(1);
}

console.log("Emsal krokisi gorsel gomme testi tamam.");
