"use strict";

/*
  Kullanici talebi (2026-08-13): "ben görsellerin eklenmesini ve
  kullanılabilmesini istiyorum ancak bunlar kullanıcı cihazında kalmalı
  ve server a hiç gitmemeli" — sonrasinda kapsam "sadece docx dosyalara
  gömeceğiz. diğerleri olmayacak. şu an sadece emlakkatılım" olarak
  netlesti. Sonraki turlarda: 23 kategori + 4 sayfa yerlesim sablonu +
  lacivert basliklar (2. tur), kapak fotografi icin ayri/tasinabilir
  yer tutucu (3. tur), her basligin kendi sayfasinda baslamasi (4-6.
  tur), 16×22 cm kesin sayfa kutusu + kirpma yerine "uzat" (7. tur),
  hucre cercevesinin bos kutu sorunu (8. tur) — TAM detaylar icin
  handoff.md 0.0.434-0.0.442.

  9. tur (2026-08-14): kullanici "tüm görsel türlerine placeholder
  ekleyebilir miyiz. örnek (DIŞMEKAN)" dedi; AskUserQuestion ile "Her
  kategori için .docx şablonunda AYRI bir {{TOKEN}} olsun" secenegini
  onayladi. Bu, mimariyi KOKTEN degistirdi:

  - templates/emlakkatilim.docx'teki TEK {{FOTO_ALANI_1}} token'i,
    "8.1 Fotoğraflar" hücresine art arda gömülen 23 AYRI token'la
    DEGISTIRILDI (bkz. FOTO_TOKEN_BY_KEY asagida) — her biri
    report-photos.js'teki tokenForCategoryKey ile birebir uretiliyor
    ("FOTO_" + BUYUK_HARF_ANAHTAR, alt cizgiler silinmis; ör.
    "dis_mekan" → "FOTO_DISMEKAN", kullanicinin verdigi ornekle
    birebir). Binary duzenleme: readStoredZip/writeStoredZip vm ile
    cikarilip Node betiginde calistirildi, yedek: backups/ altinda
    "before-per-category-photo-tokens" ile baslayan klasor.
  - report-photos.js'in getPhotoAppendixForExport'u artik TEK degil,
    HER kategori icin AYRI bir {token, categories/coverPhoto} girisi
    donduruyor (fotografi olmayan kategoriler hala TAMAMEN atlaniyor).
  - docx-fill.js'in embedPhotoGalleryAssets'i zaten COKLU grup'u
    destekliyordu (degisiklik gerekmedi) — TEK kritik duzeltme:
    "isFirstBannerOverall" bayragi artik HER GRUP icin sifirlanmiyor,
    TUM cagri boyunca (23 token'in HEPSI) PAYLASILIYOR — aksi halde
    HER kategorinin kendi ilk sayfasi "ilk" sanilip pageBreakBefore
    kaybederdi (2., 3., ... kategoriler yine ortadan/sondan baslardi,
    tam 0.0.442'de duzeltilen sorunun GERI GELMESI anlamina gelirdi).
  - template-engine.js'teki "FOTO_ALANI_" filtresi "FOTO_" olarak
    genisletildi (tum 23 yeni token'i ve eski/kullanilmayan
    FOTO_ALANI_3'u kapsayacak sekilde).

  Bu test dogrular:
  1) Sablon hala GECERLI bir STORED .docx (readStoredZip patlamiyor).
  2) collectTokens() 23 YENI kategori token'inin TAMAMINI buluyor.
  3) Fotograf VARKEN (2 AYRI token/kategori — FOTO_DISMEKAN + FOTO_ICMEKAN):
     - her ikisi de kendi paragrafinda GERCEK icerige donusuyor,
     - her kategori icin TEK bir lacivert (1F3864) dolgu banner'i var,
     - FOTOGRAFSIZ bir kategori (ör. FOTO_FINANSALTABLOLAR) ciktida HIC
       gecmiyor (temiz sekilde "" ile siliniyor),
     - gercek <w:drawing> + rels + media girisleri (sablona GORE delta)
       toplam fotograf sayisi kadar artiyor,
     - HICBIR gorsel KIRPILMIYOR (srcRect YOK),
     - HICBIR gorselin genisligi 5760000 EMU'yu (16 cm) asmiyor,
     - manuel sayfa sonu paragrafı YOK,
     - KESIN paragraf-seviyesi kontrol: TÜM 23 token arasinda FİZİKSEL
       OLARAK İLK olan banner ("Dış Mekan") pageBreakBefore ALMAZ, 2.
       banner ("İç Mekan") ALIR — ayrı token'lar OLMASINA RAĞMEN.
  4) Fotograf YOKKEN: token'lar TEMIZ sekilde silinip belgede
     GORUNMUYOR.
  5) Kapak Fotografi (FOTO_KAPAK) VARKEN: kendi token'inda, tek,
     KIRPILMAMIS, KENDI banner'i OLMAYAN bir yer tutucu olarak geliyor.
  6) 6 fotoğraf + stacked_pair (FOTO_ICMEKAN) → TAM 3 sayfa, HER
     sayfada kendi "İç Mekan" banner'ı (3 kez tekrar), her görsel TAM
     16×10,75 cm.
  7) Her senaryoda ciktinin STORED-zip round-trip'i saglam.
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

// report-photos.js PHOTO_CATEGORIES ile BIREBIR ayni sira/anahtarlar —
// tokenForCategoryKey ile uretilen tam token adlari.
const CATEGORY_KEYS = [
  "kapak", "dis_mekan", "ic_mekan", "yapi_ruhsati", "yapi_kullanma_izin",
  "yapi_kayit", "mimari_proje_belediye", "mimari_proje_tapu", "imar_durumu",
  "kadastro_paftasi", "tapu_senedi", "takbis_belgesi", "konum_kroki",
  "konum_harita", "emsal_harita", "adres_kodu", "enerji_kimlik",
  "tutanaklar", "mahkeme_evraklari", "uzman_ozcekim", "hesaplama_tablolari",
  "finansal_tablolar", "diger",
];
function tokenForKey(key) {
  return `FOTO_${key.toUpperCase().replace(/_/g, "")}`;
}
const ALL_CATEGORY_TOKENS = CATEGORY_KEYS.map(tokenForKey);

// --- 1) Hala gecerli STORED zip mi? -----------------------------------
let entries;
try {
  entries = DocxFill.readStoredZip(arrayBuffer);
} catch (error) {
  check(false, `templates/emlakkatilim.docx artik STORED zip olarak okunamiyor: ${error.message}`);
}
const docEntry = entries?.find((e) => e.name === "word/document.xml");
check(Boolean(docEntry), "word/document.xml girisi bulunamadi.");

// --- 2) collectTokens 23 kategori token'inin TAMAMINI buluyor mu? -----
const xmlText = Buffer.from(docEntry.bytes).toString("utf8");
const tokens = DocxFill.collectTokens(xmlText);
ALL_CATEGORY_TOKENS.forEach((t) => {
  check(tokens.includes(t), `{{${t}}} sablonda bulunamadi (kategori-basina-token duzenlemesi kaybolmus olabilir).`);
});

// Gercek, gecerli, kucuk (1x1 kirmizi) bir JPEG — getJpegPixelSize'in
// gercek bir goruntude de dogru calistigini kanitlamak icin.
const TINY_JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function buildValuesWithAllTokensMissing(tokenList, overrides = {}) {
  const values = {};
  tokenList.forEach((t) => { values[t] = overrides[t] !== undefined ? overrides[t] : `[${t}]`; });
  return values;
}

function countOccurrences(text, needle) {
  return (text.match(new RegExp(needle, "g")) || []).length;
}

function subtractMultiset(outputArr, baselineArr) {
  const baselineCounts = new Map();
  baselineArr.forEach((v) => baselineCounts.set(v, (baselineCounts.get(v) || 0) + 1));
  const result = [];
  outputArr.forEach((v) => {
    const remaining = baselineCounts.get(v) || 0;
    if (remaining > 0) baselineCounts.set(v, remaining - 1);
    else result.push(v);
  });
  return result;
}

// Sablon zaten kendi logo/antet gorselleriyle geliyor — mutlak sayim
// yerine ORIJINAL sablona GORE artis (delta) olcup karsilastiriyoruz.
const baselineDrawingCount = countOccurrences(xmlText, "<w:drawing>");
const baselineRelsEntry = entries.find((e) => e.name === "word/_rels/document.xml.rels");
const baselineRelsXml = Buffer.from(baselineRelsEntry.bytes).toString("utf8");
const baselineImageRelCount = countOccurrences(baselineRelsXml, 'Type="http://schemas\\.openxmlformats\\.org/officeDocument/2006/relationships/image"');
const baselineExtentWidths = [...xmlText.matchAll(/<wp:extent cx="(\d+)"/g)].map((m) => Number(m[1]));
const baselineMediaCount = entries.filter((e) => e.name.startsWith("word/media/")).length;
const baselineTableCount = countOccurrences(xmlText, "<w:tbl>");

function makePhoto(caption) {
  return { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", caption: caption || "", width: 800, height: 800 };
}

function singleCategoryGroup(token, label, layoutKey, photos) {
  return { token, categories: [{ label, batches: [{ layoutKey, photos }] }] };
}

// --- 3) Fotograf VARKEN (2 AYRI token): banner'lar + gercek gomme ------
{
  const values = buildValuesWithAllTokensMissing(tokens);
  const boldFlags = {};
  const photoGroups = [
    singleCategoryGroup("FOTO_DISMEKAN", "Dış Mekan", "horizontal_pair", [makePhoto("Ön cephe"), makePhoto("Bahçe")]),
    singleCategoryGroup("FOTO_ICMEKAN", "İç Mekan", "vertical_single", [makePhoto("Salon")]),
    // FOTO_FINANSALTABLOLAR kasitli olarak HIC eklenmedi — kullanici
    // acikca "secilmeyen gorseller ... wordde baslik olarak
    // belirtilmesin" dedi; bu token'in grubu listede bile yok.
  ];
  const totalPhotos = 3;
  const filled = DocxFill.fillTemplate(arrayBuffer, values, boldFlags, [], photoGroups);
  check(!filled.missing.includes("FOTO_DISMEKAN") && !filled.missing.includes("FOTO_ICMEKAN"), "Fotograf gomulmesine ragmen ilgili token'lar 'missing' listesinde.");

  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  check(!outXml.includes("{{FOTO_DISMEKAN}}") && !outXml.includes("{{FOTO_ICMEKAN}}"), "Ciktida ham {{FOTO_*}} metni hala duruyor (gomulmemis).");

  check(outXml.includes("Dış Mekan"), "\"Dış Mekan\" kategori basligi ciktida yok.");
  check(outXml.includes("İç Mekan"), "\"İç Mekan\" kategori basligi ciktida yok.");
  check(!outXml.includes("Finansal Tablolar"), "Secilmeyen \"Finansal Tablolar\" kategorisi ciktida gorunmemeliydi (kullanici talebi).");

  // KESIN paragraf-seviyesi kontrol: FİZİKSEL OLARAK İLK gelen banner
  // ("Dış Mekan", çünkü FOTO_DISMEKAN token'ı FOTO_ICMEKAN'dan ÖNCE
  // gelir) pageBreakBefore ALMAMALI (hücrenin doğal başlangıcına en
  // yakın); "İç Mekan" (2.) ALMALI — bu, AYRI token'lar olsa BİLE
  // dogru calismali (isFirstBannerOverall'un TUM cagri boyunca
  // paylasilmasi gerektigini kanitlar).
  const disMekanIdx = outXml.indexOf("Dış Mekan");
  const disMekanParaStart = outXml.lastIndexOf("<w:p><w:pPr>", disMekanIdx);
  const disMekanPara = outXml.slice(disMekanParaStart, disMekanIdx);
  check(!disMekanPara.includes("<w:pageBreakBefore/>"), "İLK banner (\"Dış Mekan\") pageBreakBefore ALMAMALIYDI (hücrenin doğal başlangıç konumunda).");
  const icMekanIdx = outXml.indexOf("İç Mekan");
  const icMekanParaStart = outXml.lastIndexOf("<w:p><w:pPr>", icMekanIdx);
  const icMekanPara = outXml.slice(icMekanParaStart, icMekanIdx);
  check(icMekanPara.includes("<w:pageBreakBefore/>"), "2. banner (\"İç Mekan\", AYRI bir token olsa da) pageBreakBefore ALMALIYDI.");

  const bannerCount = countOccurrences(outXml, `w:fill="1F3864"`);
  check(bannerCount === 2, `2 kategori banner'i (lacivert dolgu) bekleniyordu, bulunan: ${bannerCount}`);

  const drawingCount = countOccurrences(outXml, "<w:drawing>");
  check(drawingCount === baselineDrawingCount + totalPhotos, `Sablona gore +${totalPhotos} <w:drawing> bekleniyordu, gercek fark: ${drawingCount - baselineDrawingCount}`);

  const outRelsEntry = outEntries.find((e) => e.name === "word/_rels/document.xml.rels");
  const outRelsXml = Buffer.from(outRelsEntry.bytes).toString("utf8");
  const relCount = countOccurrences(outRelsXml, 'Type="http://schemas\\.openxmlformats\\.org/officeDocument/2006/relationships/image"');
  check(relCount === baselineImageRelCount + totalPhotos, `Sablona gore +${totalPhotos} goruntu iliskisi (rels) bekleniyordu, gercek fark: ${relCount - baselineImageRelCount}`);

  const mediaEntries = outEntries.filter((e) => e.name.startsWith("word/media/"));
  check(mediaEntries.length === baselineMediaCount + totalPhotos, `Sablona gore +${totalPhotos} word/media/ girisi bekleniyordu, gercek fark: ${mediaEntries.length - baselineMediaCount}`);

  const srcRectCount = countOccurrences(outXml, "<a:srcRect ");
  check(srcRectCount === 0, `Artık hiçbir görsel kırpılmamalı (srcRect olmamalı), bulunan: ${srcRectCount}`);

  const manualBreakCount = countOccurrences(outXml, '<w:br w:type="page"/>');
  check(manualBreakCount === 0, `Artık ayrı manuel sayfa sonu paragrafı OLMAMALI, bulunan: ${manualBreakCount}`);

  const extentWidths = [...outXml.matchAll(/<wp:extent cx="(\d+)"/g)].map((m) => Number(m[1]));
  const newExtentWidths = subtractMultiset(extentWidths, baselineExtentWidths);
  const oversizedWidths = newExtentWidths.filter((cx) => cx > 5760000);
  check(oversizedWidths.length === 0, `16 cm (5760000 EMU) sinirini asan ${oversizedWidths.length} YENİ gorsel bulundu: ${oversizedWidths.join(", ")}`);

  try {
    DocxFill.readStoredZip(filled.bytes.buffer);
  } catch (error) {
    check(false, `Fotografli cikti STORED zip olarak yeniden okunamadi: ${error.message}`);
  }
}

// --- 4) Fotograf YOKKEN: token'lar temiz sekilde silinmeli -------------
{
  const overrides = {};
  ALL_CATEGORY_TOKENS.forEach((t) => { overrides[t] = ""; }); // template-engine.js'in gercek davranisi
  const values = buildValuesWithAllTokensMissing(tokens, overrides);
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], []);
  ALL_CATEGORY_TOKENS.forEach((t) => {
    check(!filled.missing.includes(t), `Fotografsiz durumda ${t} 'missing' olarak isaretlenmis.`);
  });
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  ALL_CATEGORY_TOKENS.forEach((t) => {
    check(!outXml.includes(`{{${t}}}`), `Fotografsiz durumda ham {{${t}}} metni ciktida kalmis.`);
  });
  const drawingCountEmpty = countOccurrences(outXml, "<w:drawing>");
  check(drawingCountEmpty === baselineDrawingCount, `Fotografsiz durumda <w:drawing> sayisi sablonla ayni kalmaliydi (${baselineDrawingCount}), bulunan: ${drawingCountEmpty}`);
  const bannerCountEmpty = countOccurrences(outXml, `w:fill="1F3864"`);
  check(bannerCountEmpty === 0, `Fotografsiz durumda kategori banner'i olmamaliydi, bulunan: ${bannerCountEmpty}`);
}

// --- 5) Kapak Fotografi (FOTO_KAPAK): ayri, tek, kirpilmamis -----------
{
  const values = buildValuesWithAllTokensMissing(tokens);
  const photoGroups = [
    { token: "FOTO_KAPAK", categories: [], coverPhoto: { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", width: 1600, height: 1200 } },
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  check(!filled.missing.includes("FOTO_KAPAK"), "Kapak fotografli senaryoda FOTO_KAPAK 'missing' listesinde.");

  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");

  check(outXml.includes("Kapak Fotoğrafı (yer tutucu"), "\"Kapak Fotoğrafı\" yer tutucu etiketi ciktida bulunamadi.");
  const bannerCount = countOccurrences(outXml, `w:fill="1F3864"`);
  check(bannerCount === 0, `Kapak fotoğrafı KENDİ banner'ını ALMAMALI, bulunan: ${bannerCount}`);

  const drawingCount = countOccurrences(outXml, "<w:drawing>");
  check(drawingCount === baselineDrawingCount + 1, `Sablona gore +1 <w:drawing> bekleniyordu, gercek fark: ${drawingCount - baselineDrawingCount}`);

  const srcRectCount = countOccurrences(outXml, "<a:srcRect ");
  check(srcRectCount === 0, `Kapak fotoğrafı kırpılmamalı, bulunan srcRect: ${srcRectCount}`);

  const pageBreakBeforeCount = countOccurrences(outXml, "<w:pageBreakBefore/>");
  check(pageBreakBeforeCount === 0, `Yalnız kapak fotoğrafı senaryosunda pageBreakBefore OLMAMALI (kapak hiç almaz, başka banner yok), bulunan: ${pageBreakBeforeCount}`);

  try {
    DocxFill.readStoredZip(filled.bytes.buffer);
  } catch (error) {
    check(false, `Kapak fotografli cikti STORED zip olarak yeniden okunamadi: ${error.message}`);
  }
}

// --- 6) 6 fotoğraf + Alt Alta İkili (FOTO_ICMEKAN, stacked_pair) → 3
// sayfa, HER sayfada tekrarlanan başlık ------------------------------
{
  const values = buildValuesWithAllTokensMissing(tokens);
  const sixPhotos = Array.from({ length: 6 }, (_, i) => makePhoto(`İç mekan ${i + 1}`));
  const photoGroups = [
    singleCategoryGroup("FOTO_ICMEKAN", "İç Mekan", "stacked_pair", sixPhotos),
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  check(!filled.missing.includes("FOTO_ICMEKAN"), "6-fotografli senaryoda FOTO_ICMEKAN 'missing' listesinde.");

  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");

  const bannerCount = countOccurrences(outXml, `w:fill="1F3864"`);
  check(bannerCount === 3, `6 fotograf / sayfa basina 2 icin TAM 3 "İç Mekan" banner'i (her sayfada tekrar) bekleniyordu, bulunan: ${bannerCount}`);
  const icMekanCount = countOccurrences(outXml, "İç Mekan");
  check(icMekanCount === 3, `"İç Mekan" metni TAM 3 kez (3 sayfa) gecmeliydi, bulunan: ${icMekanCount}`);

  const manualBreakCount = countOccurrences(outXml, '<w:br w:type="page"/>');
  check(manualBreakCount === 0, `Artık ayrı manuel sayfa sonu paragrafı OLMAMALI, bulunan: ${manualBreakCount}`);
  // İLK sayfa (bu senaryoda TEK grup/token, akışın en başı) pageBreakBefore
  // ALMAZ; 2. ve 3. sayfa alır — 3 sayfa icin TAM 2 pageBreakBefore.
  const pageBreakBeforeCount = countOccurrences(outXml, "<w:pageBreakBefore/>");
  check(pageBreakBeforeCount === 2, `3 sayfadan yalnızca 2.-3.'sünde <w:pageBreakBefore/> bekleniyordu, bulunan: ${pageBreakBeforeCount}`);

  const tableCount = countOccurrences(outXml, "<w:tbl>") - baselineTableCount;
  check(tableCount === 3, `3 sayfa icin TAM 3 izgara tablosu (sablona gore delta) bekleniyordu, bulunan: ${tableCount}`);

  const drawingCount = countOccurrences(outXml, "<w:drawing>");
  check(drawingCount === baselineDrawingCount + 6, `6 fotograf icin +6 <w:drawing> bekleniyordu, gercek fark: ${drawingCount - baselineDrawingCount}`);

  const extents = [...outXml.matchAll(/<wp:extent cx="(\d+)" cy="(\d+)"/g)].map((m) => ({ cx: Number(m[1]), cy: Number(m[2]) }));
  const stackedPairExtents = extents.filter((e) => e.cx === 5760000 && e.cy === 3870000);
  check(stackedPairExtents.length === 6, `6 gorselin de TAM 16×10,75 cm (5760000×3870000 EMU) olmasi bekleniyordu, bulunan (eslesen): ${stackedPairExtents.length}`);

  try {
    DocxFill.readStoredZip(filled.bytes.buffer);
  } catch (error) {
    check(false, `6-fotografli cikti STORED zip olarak yeniden okunamadi: ${error.message}`);
  }
}

// --- 7) Kapak + AYRI kategori BİRLİKTE: farklı token'lar, hücrenin
// FİZİKSEL SIRASI (kapak önce) doğru şekilde takip ediliyor mu? --------
{
  const values = buildValuesWithAllTokensMissing(tokens);
  const photoGroups = [
    { token: "FOTO_KAPAK", categories: [], coverPhoto: { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", width: 1600, height: 1200 } },
    singleCategoryGroup("FOTO_DISMEKAN", "Dış Mekan", "vertical_single", [makePhoto("Sokak")]),
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");

  // Kapak fotoğrafı kendi token'ında (FOTO_KAPAK, hücrenin fiziksel
  // olarak İLK token'ı) hiç pageBreakBefore almaz; "Dış Mekan" (FOTO_
  // DISMEKAN, kapaktan SONRAKİ ilk gerçek banner) KENDİSİ pageBreakBefore
  // ALMALI (kapak fotoğrafından sonra kendi sayfasında başlamalı).
  const disMekanIdx = outXml.indexOf("Dış Mekan");
  const disMekanParaStart = outXml.lastIndexOf("<w:p><w:pPr>", disMekanIdx);
  const disMekanPara = outXml.slice(disMekanParaStart, disMekanIdx);
  check(disMekanPara.includes("<w:pageBreakBefore/>"), "Kapak fotoğrafından SONRAKİ ilk banner (\"Dış Mekan\") pageBreakBefore ALMALIYDI.");
  const pageBreakBeforeCount = countOccurrences(outXml, "<w:pageBreakBefore/>");
  check(pageBreakBeforeCount === 1, `Kapak + 1 kategori icin TAM 1 pageBreakBefore bekleniyordu, bulunan: ${pageBreakBeforeCount}`);
}

if (failures.length) {
  console.error("emlakkatilim.docx fotograf gomme testi BASARISIZ:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("emlakkatilim.docx '8. Ekler' fotograf gomme (23 kategori-özel token + 16x22 cm sayfa kutusu + kirpma yok + kapak fotografi yer tutucusu) testleri basarili.");
