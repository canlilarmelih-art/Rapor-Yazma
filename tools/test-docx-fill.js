"use strict";

/*
  Kullanici talebi: "beni tamamen yanlış anlamışsın word formatını
  bozmamalıydın logolar sayfa yapısı çerçeveler emlak katılım tasarruf
  finansman template dosyasını word olarak tutabilirsin" — Emlak Katılım
  şablonu artık HTML'e ÇEVRİLMİYOR; kullanıcının bize sunduğu GERÇEK
  Word (.docx) dosyası templates/emlakkatilim.docx olarak saklanıyor,
  içindeki {{TOKEN}} yer tutucuları src/exports/docx-fill.js ile
  word/document.xml üzerinde bayt düzeyinde doldurulup geri paketleniyor
  — logo/çerçeve/sayfa düzeni/stil TAMAMEN korunuyor.

  Bu test üç katmani dogrular:
  1) writeStoredZip/readStoredZip round-trip (xlsx-fill.js'teki ile ayni
     teknik, docx-fill.js'in kendi bagimsiz kopyasi).
  2) htmlValueToXmlText — resolveTemplateTokenValues()'un HTML-kacisli
     ciktisini (entity + <br/> + <p> sinirlari) duz XML metnine dogru
     cevirdigini.
  3) fillTemplate — sentetik bir STORED .docx (word/document.xml icinde
     {{TOKEN}}) uzerinde doldurmanin dogru calistigini VE eksik
     token'lari "missing" listesinde bildirdigini.
  4) templates/emlakkatilim.docx GERCEK sablon dosyasinin STORED
     paketlendigini ve icinde en az bir {{TOKEN}} bulundugunu (yapisal
     saglik kontrolu — Word'de acilabilirligin dolayli kaniti).
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

// --- 1) ZIP round-trip -----------------------------------------------------
{
  const enc = new TextEncoder();
  const entries = [
    { name: "[Content_Types].xml", bytes: enc.encode("<Types/>") },
    { name: "word/document.xml", bytes: enc.encode("<w:document><w:body><w:t>{{CITY}}</w:t></w:body></w:document>") },
  ];
  const zipped = DocxFill.writeStoredZip(entries);
  const readBack = DocxFill.readStoredZip(zipped.buffer);
  check(readBack.length === entries.length, `Zip round-trip girdi sayisi uyusmuyor: ${readBack.length}`);
  entries.forEach((entry) => {
    const found = readBack.find((item) => item.name === entry.name);
    check(Boolean(found), `Zip round-trip: "${entry.name}" bulunamadi.`);
    if (found) {
      check(
        Buffer.from(found.bytes).equals(Buffer.from(entry.bytes)),
        `Zip round-trip: "${entry.name}" icerigi degisti.`
      );
    }
  });
}

// --- 2) htmlValueToXmlText ---------------------------------------------
{
  const cases = [
    ["Bursa", "Bursa"],
    ["Ka&ccedil;", "Ka&amp;ccedil;"], // gercek entity degil, ama & tek basina XML icin kacislanmali
    ["A &amp; B", "A &amp; B"],
    ["<p>Birinci cumle.</p><p>Ikinci cumle.</p>", "Birinci cumle. Ikinci cumle."],
    ["Satir 1<br />Satir 2", "Satir 1 Satir 2"],
    ["  fazla   boşluk  ", "fazla boşluk"],
    ["<span style=\"color:red\">Kırmızı</span>", "Kırmızı"],
    ["3.100.000 TL", "3.100.000 TL"],
  ];
  cases.forEach(([input, expected]) => {
    const result = DocxFill.htmlValueToXmlText(input);
    check(result === expected, `htmlValueToXmlText("${input}") -> "${expected}" beklenirken "${result}" geldi.`);
  });
}

// --- 3) fillTemplate — sentetik sablon ----------------------------------
{
  const enc = new TextEncoder();
  const documentXml =
    '<?xml version="1.0"?><w:document><w:body>' +
    '<w:p><w:r><w:t>İl: {{CITY}}</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>Açıklama: {{DESC}}</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>Eksik: {{MISSING_TOKEN}}</w:t></w:r></w:p>' +
    "</w:body></w:document>";
  const entries = [
    { name: "[Content_Types].xml", bytes: enc.encode("<Types/>") },
    { name: "word/document.xml", bytes: enc.encode(documentXml) },
  ];
  const arrayBuffer = DocxFill.writeStoredZip(entries).buffer;

  const values = {
    CITY: "Bursa",
    DESC: "<p>Konu taşınmaz A &amp; B sitesindedir.</p>",
  };
  const result = DocxFill.fillTemplate(arrayBuffer, values);
  check(result.blob && typeof result.blob.size === "number", "fillTemplate blob dondurmedi.");
  check(Array.isArray(result.missing) && result.missing.includes("MISSING_TOKEN"), `Eksik token bildirilmedi: ${JSON.stringify(result.missing)}`);
  check(!result.missing.includes("CITY") && !result.missing.includes("DESC"), "Dolu token'lar yanlislikla 'missing' sayildi.");

  const readBack = DocxFill.readStoredZip(result.bytes.buffer);
  const filledDoc = new TextDecoder("utf-8").decode(readBack.find((e) => e.name === "word/document.xml").bytes);
  check(filledDoc.includes("İl: Bursa"), `Dolu belgede "İl: Bursa" bulunamadi: ${filledDoc}`);
  check(filledDoc.includes("Konu taşınmaz A &amp; B sitesindedir."), `Dolu belgede aciklama dogru XML-kacisli gelmedi: ${filledDoc}`);
  check(filledDoc.includes("{{MISSING_TOKEN}}"), "Eksik token yer tutucusu belgede degistirilmemis olmali (bozulmamis kalmali).");
  check(
    filledDoc.startsWith('<?xml version="1.0"?>') && filledDoc.includes("<w:document>") && filledDoc.includes("</w:document>"),
    "Dolu belgenin XML govdesi/yapisi bozulmus."
  );
}

// --- 3b) applyBoldMarkers — coktan-secmeli alanlarda dogru secenegi
// kalinlastirma (kullanici talebi: "Doğru seçeneği KOYU (bold) yap") -------
{
  const runFor = (name, text) =>
    `<w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>{{BOLD:${name}}}${text}</w:t></w:r>`;
  const documentXml =
    "<w:document><w:body><w:p>" +
    runFor("KENT", "Kent") +
    runFor("KENT_DISI", "Kent Dışı") +
    runFor("KIRSAL", "Kırsal") +
    "</w:p></w:body></w:document>";

  const boldTrue = DocxFill.applyBoldMarkers(documentXml, { KENT_DISI: true });
  check(!/\{\{BOLD:/.test(boldTrue), `applyBoldMarkers isaretleri tamamen silmedi: ${boldTrue}`);
  check(
    /<w:rPr><w:b\/><w:bCs\/><w:color[^>]*\/><\/w:rPr><w:t>Kent Dışı<\/w:t>/.test(boldTrue),
    `"Kent Dışı" run'ina <w:b/> eklenmedi: ${boldTrue}`
  );
  check(
    /<w:rPr><w:color[^>]*\/><\/w:rPr><w:t>Kent<\/w:t>/.test(boldTrue),
    `Secilmeyen "Kent" run'ina yanlislikla <w:b/> eklenmis: ${boldTrue}`
  );

  const boldNone = DocxFill.applyBoldMarkers(documentXml, {});
  check(!/<w:b\/>/.test(boldNone), `Hicbir bayrak true degilken hicbir run kalinlasmamali: ${boldNone}`);
  check(!/\{\{BOLD:/.test(boldNone), "Bayrak bos olsa da isaretler silinmeli.");

  // collectTokens {{BOLD:...}} isaretlerini normal token saymamali —
  // aksi halde resolveTemplateTokenValues bunlari hep "missing" sayardi.
  const tokensWithBold = DocxFill.collectTokens(documentXml + "<w:t>{{CITY}}</w:t>");
  check(tokensWithBold.includes("CITY"), "collectTokens normal token'i kacirdi.");
  check(!tokensWithBold.some((t) => t.startsWith("BOLD:")), `collectTokens {{BOLD:...}} isaretlerini normal token saymis: ${JSON.stringify(tokensWithBold)}`);
}

// --- 4) Gerçek şablon dosyası — yapısal sağlık kontrolü -------------------
{
  const templatePath = path.join(appDir, "templates", "emlakkatilim.docx");
  assert.ok(fs.existsSync(templatePath), "templates/emlakkatilim.docx bulunamadi.");
  const buffer = fs.readFileSync(templatePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const entries = DocxFill.readStoredZip(arrayBuffer); // STORED degilse burada zaten hata firlatir
  const docEntry = entries.find((e) => e.name === "word/document.xml");
  check(Boolean(docEntry), "emlakkatilim.docx icinde word/document.xml bulunamadi.");
  const docText = new TextDecoder("utf-8").decode(docEntry.bytes);
  const tokens = DocxFill.collectTokens(docText);
  check(tokens.length >= 30, `emlakkatilim.docx icinde beklenenden az {{TOKEN}} bulundu: ${tokens.length}`);
  check(tokens.includes("CITY"), "emlakkatilim.docx icinde {{CITY}} bulunamadi.");
  check(tokens.includes("CURRENT_VALUE"), "emlakkatilim.docx icinde {{CURRENT_VALUE}} bulunamadi.");
  check(tokens.includes("EMSAL1ACIKLAMASI"), "emlakkatilim.docx icinde {{EMSAL1ACIKLAMASI}} bulunamadi.");
  check(tokens.includes("SAHIPLER"), "emlakkatilim.docx icinde {{SAHIPLER}} bulunamadi.");
  check(!tokens.some((t) => t.startsWith("BOLD:")), "collectTokens gercek sablonda da {{BOLD:...}} isaretlerini normal token saymamali.");
  // Coktan-secmeli alanlar (Cevre Analizi/Kira Kabiliyeti) icin {{BOLD:AD}}
  // isaretleri sablonda gercekten var mi (applyBoldMarkers'in isleyecegi
  // ham malzeme) — yoksa bold-secim ozelligi sessizce devre disi kalir.
  const boldMarkerCount = (docText.match(/\{\{BOLD:[A-Za-z0-9_]+\}\}/g) || []).length;
  check(boldMarkerCount >= 15, `emlakkatilim.docx icinde beklenenden az {{BOLD:...}} isareti bulundu: ${boldMarkerCount}`);
  // Belge orijinal Word raporundaki metin degil, HALA orijinal yapida
  // olmali (logo/cerceve/sayfa duzeni icin sorumlu diger XML parcalari
  // dokunulmadan kalmis olmali) — orijinal ile ayni giris sayisi.
  check(
    entries.some((e) => e.name.startsWith("word/media/") || e.name === "word/header1.xml" || e.name === "word/footer1.xml"),
    "emlakkatilim.docx icinde beklenen destek dosyalari (media/header/footer) eksik gorunuyor — orijinal yapi bozulmus olabilir."
  );
}

if (failures.length) {
  console.error("DOCX doldurma motoru testi BASARISIZ:");
  failures.forEach((message) => console.error(` - ${message}`));
  process.exit(1);
}

console.log("DOCX doldurma motoru (gercek Word sablonu, HTML'e cevrilmeden doldurma) testi tamam.");
