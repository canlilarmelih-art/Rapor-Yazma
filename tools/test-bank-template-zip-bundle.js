"use strict";

/*
  Kullanici talebi: "excel tablo indirme json dosyası ve rapor word formatı
  Banka Şablonu ile kaydet butonu tıklandığında otomatik zip yada rar içinde
  insin". Bu test iki katmani dogrular:

  1) ZIP round-trip — window.RaporXlsxFill.writeStoredZip ile paketlenen
     birden fazla, farkli turde dosyanin (metin + ikili) readStoredZip ile
     GERI okundugunda isim ve icerigin BIREBIR korundugunu dogrular. Bu,
     buildBankTemplateZipBundle()'in kullandigi ayni bagimliliksiz ZIP
     yazicisidir (zaten .xlsx uretimi icin var olan mekanizmanin yeniden
     kullanildigini kanitlar).
  2) Kaynak taramasi — exportTemplate/exportAllTables/exportXlsx'in
     {download:false} secenegini destekledigini, ve app.js'teki
     buildBankTemplateZipBundle()'in "Banka Şablonuyla Kaydet" tikinda
     cagirildigini (JSON+Excel+Word+varsa Ziraat ek tablosu tek zip'te)
     dogrular.
*/

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const appDir = path.join(__dirname, "..");
const failures = [];
function check(cond, msg) {
  if (!cond) failures.push(msg);
}

// --- 1) ZIP round-trip ----------------------------------------------------
{
  global.window = {};
  const xlsxFillSrc = fs.readFileSync(path.join(appDir, "src", "exports", "xlsx-fill.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(xlsxFillSrc);
  const XlsxFill = global.window.RaporXlsxFill;
  assert.ok(XlsxFill && typeof XlsxFill.writeStoredZip === "function", "RaporXlsxFill yuklenmedi.");

  const textEncoder = new TextEncoder();
  const wordBytes = textEncoder.encode("MIME-Version: 1.0\r\nContent-Type: multipart/related\r\n\r\nsahte word icerigi");
  const jsonBytes = textEncoder.encode(JSON.stringify({ schema: "rapor-yazma-programi-state", state: { fields: { caseName: "Test" } } }, null, 2));
  // İkili (binary) bir dosya simülasyonu — gerçek xlsx blob'una benzer,
  // düz metin encode/decode ile taşınamayacak byte'lar içeriyor.
  const binaryBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff, 0x10, 0x8a, 0x00, 0x01, 0x02]);

  const entries = [
    { name: "rapor-kuveytturk.doc", bytes: wordBytes },
    { name: "rapor.json", bytes: jsonBytes },
    { name: "rapor-tum-tablolar.xlsx", bytes: binaryBytes },
  ];
  const zipBytes = XlsxFill.writeStoredZip(entries);
  assert.ok(zipBytes instanceof Uint8Array && zipBytes.length > 0, "writeStoredZip bos/gecersiz cikti uretti.");

  const readBack = XlsxFill.readStoredZip(zipBytes.buffer);
  assert.equal(readBack.length, entries.length, `Zip'ten okunan girdi sayisi beklenenle uyusmuyor: ${readBack.length}`);

  entries.forEach((entry) => {
    const found = readBack.find((item) => item.name === entry.name);
    assert.ok(found, `Zip'te "${entry.name}" girdisi bulunamadi.`);
    assert.equal(found.bytes.length, entry.bytes.length, `"${entry.name}" boyutu round-trip sonrasi degisti.`);
    assert.deepEqual(Array.from(found.bytes), Array.from(entry.bytes), `"${entry.name}" icerigi round-trip sonrasi birebir korunmadi.`);
  });

  console.log("ZIP round-trip (Word + JSON + ikili XLSX) testi tamam.");
}

// --- 2) Kaynak taramasi — {download:false} destegi ve zip cagrisi --------
{
  const appJs = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
  const engineJs = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
  const reportTablesJs = fs.readFileSync(path.join(appDir, "src", "exports", "report-tables-xlsx.js"), "utf8");
  const ziraatJs = fs.readFileSync(path.join(appDir, "src", "exports", "ziraat-ek-tablo-xlsx.js"), "utf8");

  check(
    engineJs.includes("async function exportTemplate(templateKey, options = {})") &&
      engineJs.includes('const download = options.download !== false;') &&
      engineJs.includes("if (download) safeCall(\"downloadTextFile\""),
    "template-engine.js exportTemplate() {download:false} secenegini desteklemiyor.",
  );
  check(
    reportTablesJs.includes("function exportAllTables(options = {})") &&
      reportTablesJs.includes("if (options.download !== false) window.RaporXlsxFill.downloadBlob"),
    "report-tables-xlsx.js exportAllTables() {download:false} secenegini desteklemiyor.",
  );
  check(
    ziraatJs.includes("async function exportXlsx(options = {})") &&
      ziraatJs.includes("if (options.download !== false) window.RaporXlsxFill.downloadBlob"),
    "ziraat-ek-tablo-xlsx.js exportXlsx() {download:false} secenegini desteklemiyor.",
  );
  check(
    appJs.includes("async function buildBankTemplateZipBundle(templateKey)") &&
      appJs.includes("window.RaporTemplates.exportTemplate(templateKey, { download: false })") &&
      appJs.includes("window.RaporReportTablesXlsx.exportAllTables({ download: false })") &&
      appJs.includes("exportZiraatEkTabloWithBankTemplateIfNeeded(templateKey, { download: false })") &&
      appJs.includes("window.RaporXlsxFill.writeStoredZip(entries)"),
    "buildBankTemplateZipBundle() JSON+Excel+Word(+Ziraat) parcalarini tek zip'te toplamiyor.",
  );
  check(
    appJs.includes("block.querySelector(\"[data-export-template]\").addEventListener") &&
      appJs.includes("const result = await buildBankTemplateZipBundle(templateKey);"),
    "\"Banka Şablonuyla Kaydet\" dugmesi zip paketleme akisina baglanmamis.",
  );
  // Kullanıcı talebi: "Word olarak farklı kaydet"/"PDF olarak kaydet"
  // genel (banka şablonu dışı) butonları kalıcı olarak kaldırılmalı.
  check(
    !appJs.includes("data-export-word") && !appJs.includes("data-export-pdf"),
    "Kaldırılması gereken genel Word/PDF dışa aktarma butonları hâlâ mevcut.",
  );
}

if (failures.length) {
  console.error("Banka sablonu ZIP paketleme testi BASARISIZ:");
  failures.forEach((msg) => console.error(` - ${msg}`));
  process.exit(1);
}

console.log("Banka sablonu ZIP paketleme (Word+JSON+Excel+Ziraat) testi tamam.");
