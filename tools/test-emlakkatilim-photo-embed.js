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
     sayfada kendi "İç Mekan" etiketi (3 kez tekrar), her görsel TAM
     16×9,75 cm (2026-09-08: altına eklenen etiket için ayrılan pay
     2 cm'ye çıkarıldı, ÖNCEKİ 10,75 cm'den küçüldü).
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
// tokenForCategoryKey ile uretilen tam token adlari. 2026-09-08: "harclar"
// (8.6 Fatura icin yeni eklenen kategori) eklendi, bkz. asagidaki "8.
// Ekler yeniden yapilandirma" testleri.
const CATEGORY_KEYS = [
  "kapak", "dis_mekan", "ic_mekan", "yapi_ruhsati", "yapi_kullanma_izin",
  "yapi_kayit", "mimari_proje_belediye", "mimari_proje_tapu", "imar_durumu",
  "kadastro_paftasi", "tapu_senedi", "takbis_belgesi", "konum_kroki",
  "konum_harita", "emsal_harita", "adres_kodu", "enerji_kimlik",
  "tutanaklar", "mahkeme_evraklari", "uzman_ozcekim", "hesaplama_tablolari",
  "finansal_tablolar", "diger", "harclar",
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

// Her "8.X. ..." bölüm başlığı ÖNCE İçindekiler (TOC) tablosunda, SONRA
// gövdede (asıl bölüm başlığı olarak) İKİ KEZ geçer — sıra kontrolü için
// gövdedeki (İKİNCİ) konumu kullanılmalı, yoksa TOC'un birbirine YAKIN
// sıralı listesi (henüz hiçbir token içermez) yanlışlıkla "doğru aralık"
// sanılır.
function secondOccurrence(haystack, needle) {
  const first = haystack.indexOf(needle);
  if (first === -1) return -1;
  return haystack.indexOf(needle, first + 1);
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

  check(outXml.includes("Dış Mekan"), "\"Dış Mekan\" kategori etiketi ciktida yok.");
  check(outXml.includes("İç Mekan"), "\"İç Mekan\" kategori etiketi ciktida yok.");
  check(!outXml.includes("Finansal Tablolar"), "Secilmeyen \"Finansal Tablolar\" kategorisi ciktida gorunmemeliydi (kullanici talebi).");

  // KESIN sıra-seviyesi kontrol (2026-09-08'den itibaren: etiket artık
  // görsellerin ALTINDA, sayfa geçişi ise AYRI/görünmez bir paragrafla
  // tablodan HEMEN ÖNCE) — FİZİKSEL OLARAK İLK gelen sayfa ("Dış Mekan",
  // çünkü FOTO_DISMEKAN token'ı FOTO_ICMEKAN'dan ÖNCE gelir)
  // pageBreakBefore ALMAMALI (hücrenin doğal başlangıcına en yakın);
  // "İç Mekan" (2.) sayfası kendi pageBreakBefore'unu ALMALI — bu,
  // AYRI token'lar olsa BİLE dogru calismali (isFirstBannerOverall'un
  // TUM cagri boyunca paylasilmasi gerektigini kanitlar). "Dış Mekan"
  // metni artık YALNIZCA kendi (görsellerinden SONRAKİ) etiket
  // paragrafında geçtiğinden, TEK pageBreakBefore'un "Dış Mekan"
  // etiketinden SONRA ama "İç Mekan" etiketinden ÖNCE (yani İç Mekan'ın
  // tablosundan hemen önce) gelmesi gerekir.
  const disMekanIdx = outXml.indexOf("Dış Mekan");
  const icMekanIdx = outXml.indexOf("İç Mekan");
  const firstPageBreakIdx = outXml.indexOf("<w:pageBreakBefore/>");
  check(
    firstPageBreakIdx === -1 || firstPageBreakIdx > disMekanIdx,
    "İLK sayfanın (\"Dış Mekan\") ÖNCESİNDE hiçbir pageBreakBefore OLMAMALIYDI (hücrenin doğal başlangıç konumunda)."
  );
  check(
    firstPageBreakIdx > disMekanIdx && firstPageBreakIdx < icMekanIdx,
    "2. sayfa (\"İç Mekan\", AYRI bir token olsa da) kendi pageBreakBefore'unu (Dış Mekan etiketinden SONRA, İç Mekan etiketinden ÖNCE) ALMALIYDI."
  );

  const labelCount = countOccurrences(outXml, `w:color w:val="595959"`);
  check(labelCount === 2, `2 kategori etiketi (düz metin, dolgu YOK) bekleniyordu, bulunan: ${labelCount}`);
  check(!outXml.includes(`w:fill="1F3864"`), "Artık HİÇBİR lacivert (1F3864) dolgu banner'ı OLMAMALI (kullanıcı talebiyle kaldırıldı).");
  // 2026-09-08 (3. tur): kullanıcı örnek ekran görüntüsündeki gibi
  // İTALİK istedi — etiketin rPr'ı hem <w:i/><w:iCs/> HEM DE koyu-gri
  // rengi (595959) BİRLİKTE, tam beklenen sırada taşımalı.
  const italicLabelCount = countOccurrences(outXml, `<w:i/><w:iCs/><w:color w:val="595959"`);
  check(italicLabelCount === 2, `2 kategori etiketinin İKİSİ DE italik OLMALIYDI (<w:i/><w:iCs/>), bulunan: ${italicLabelCount}`);

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
  const labelCountEmpty = countOccurrences(outXml, `w:color w:val="595959"`);
  check(labelCountEmpty === 0, `Fotografsiz durumda kategori etiketi olmamaliydi, bulunan: ${labelCountEmpty}`);
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
  const labelCount = countOccurrences(outXml, `w:color w:val="595959"`);
  check(labelCount === 0, `Kapak fotoğrafı KENDİ kategori etiketini ALMAMALI (kendi ayrı yer tutucu başlığı var), bulunan: ${labelCount}`);

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

  const labelCount = countOccurrences(outXml, `w:color w:val="595959"`);
  check(labelCount === 3, `6 fotograf / sayfa basina 2 icin TAM 3 "İç Mekan" etiketi (her sayfada tekrar) bekleniyordu, bulunan: ${labelCount}`);
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

  // 2026-09-08 (2. tur): kategori etiketine yer acmak icin gorsel
  // izgarasinin yukseklik butcesi 22 cm'den 21 cm'e dustu (bkz.
  // docx-fill.js'teki CATEGORY_LABEL_RESERVED_HEIGHT_CM) — stacked_pair
  // (1x2) icin (21-0,5)/2 = 10,25 cm (ONCEKI 10,75 cm DEGIL).
  // 2026-09-08 (4. tur): gercek Word render'inda 1 cm'lik pay bazi
  // tek-gorsel sayfalarinda HALA yetersiz kaldigi GOZLEMLENDI (bkz.
  // docx-fill.js CATEGORY_LABEL_RESERVED_HEIGHT_CM notu) — pay 2 cm'ye
  // cikarildi, stacked_pair (1x2) icin (20-0,5)/2 = 9,75 cm.
  const extents = [...outXml.matchAll(/<wp:extent cx="(\d+)" cy="(\d+)"/g)].map((m) => ({ cx: Number(m[1]), cy: Number(m[2]) }));
  const stackedPairExtents = extents.filter((e) => e.cx === 5760000 && e.cy === 3510000);
  check(stackedPairExtents.length === 6, `6 gorselin de TAM 16×9,75 cm (5760000×3510000 EMU) olmasi bekleniyordu, bulunan (eslesen): ${stackedPairExtents.length}`);

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
  // DISMEKAN, kapaktan SONRAKİ ilk gerçek sayfa) KENDİ pageBreakBefore'unu
  // (görsellerinden HEMEN ÖNCE, görünmez bir paragrafla) ALMALI (kapak
  // fotoğrafından sonra kendi sayfasında başlamalı). "Dış Mekan" metni
  // artık YALNIZCA kendi (görselinden SONRAKİ) etiket paragrafında
  // geçtiğinden, TEK pageBreakBefore'un "Kapak Fotoğrafı" yer tutucu
  // metninden SONRA, "Dış Mekan" etiketinden ÖNCE gelmesi (yani Dış
  // Mekan'ın tablosundan hemen önce) yeterli kanıttır.
  const kapakIdx = outXml.indexOf("Kapak Fotoğrafı (yer tutucu");
  const disMekanIdx = outXml.indexOf("Dış Mekan");
  const pageBreakIdx = outXml.indexOf("<w:pageBreakBefore/>");
  check(
    pageBreakIdx > kapakIdx && pageBreakIdx < disMekanIdx,
    "Kapak fotoğrafından SONRAKİ ilk sayfa (\"Dış Mekan\") kendi pageBreakBefore'unu (kapaktan SONRA, Dış Mekan etiketinden ÖNCE) ALMALIYDI."
  );
  const pageBreakBeforeCount = countOccurrences(outXml, "<w:pageBreakBefore/>");
  check(pageBreakBeforeCount === 1, `Kapak + 1 kategori icin TAM 1 pageBreakBefore bekleniyordu, bulunan: ${pageBreakBeforeCount}`);
}

// --- 8) "8. Ekler" yeniden yapılandırma (2026-09-08): kontrolör onaylı
// GERÇEK bir raporun görsel olarak incelenmesiyle keşfedildi — şablonun
// ORİJİNALİNDE "8. Ekler" 6 ayrı alt bölüm (8.1-8.6) olarak tasarlanmış
// ama 23-token sistemi eklenirken 8.2-8.5'in kendi başlık satırları
// silinip TÜM tokenlar "8.1 Fotoğraflar"a tıkıştırılmıştı. Kullanıcının
// verdiği tabloya göre 22 token (kapak hariç) 5 bölüme yeniden dağıtıldı,
// eksik 4 başlık satırı (8.2, 8.3, 8.4, 8.5 — 8.6 Fatura'nın sağlam kalan
// satırından KOPYALANARAK, TOC'un zaten referans verdiği _Toc221099476-479
// yer imleriyle) geri eklendi; "8.6 Fatura" için yeni "harclar" kategorisi
// eklendi. KADASTROPAFTASI/KONUMKROKI/KONUMHARITA/EMSALHARITA kullanıcı
// isteğiyle BİLEREK "8.1 Fotoğraflar"da (taşınmadan) bırakıldı. ------
{
  const headings = [
    "8.1. Fotoğraflar", "8.2. Uavt Kodu,Kroki,İmar Durumu",
    "8.3. Proje Fotoğrafları", "8.4. Takbis Belgesi", "8.5. Diğer Ekler",
    "8.6. Fatura",
  ];
  headings.forEach((h) => {
    check(xmlText.includes(h), `Şablonda "${h}" başlığı BULUNAMADI (8. Ekler yeniden yapılandırması bozulmuş olabilir).`);
  });

  // Her token'ın KENDİ bölümünün başlığından SONRA, bir SONRAKİ bölümün
  // başlığından ÖNCE geldiğini (yani doğru bölüme dağıtıldığını) sıra
  // bazlı (indexOf) doğrula.
  const sectionTokenMap = [
    { heading: "8.1. Fotoğraflar", nextHeading: "8.2. Uavt Kodu,Kroki,İmar Durumu", tokens: ["FOTO_DISMEKAN", "FOTO_ICMEKAN", "FOTO_KADASTROPAFTASI", "FOTO_KONUMKROKI", "FOTO_KONUMHARITA", "FOTO_EMSALHARITA"] },
    { heading: "8.2. Uavt Kodu,Kroki,İmar Durumu", nextHeading: "8.3. Proje Fotoğrafları", tokens: ["FOTO_ADRESKODU", "FOTO_IMARDURUMU"] },
    { heading: "8.3. Proje Fotoğrafları", nextHeading: "8.4. Takbis Belgesi", tokens: ["FOTO_YAPIRUHSATI", "FOTO_YAPIKULLANMAIZIN", "FOTO_YAPIKAYIT", "FOTO_MIMARIPROJEBELEDIYE", "FOTO_MIMARIPROJETAPU"] },
    { heading: "8.4. Takbis Belgesi", nextHeading: "8.5. Diğer Ekler", tokens: ["FOTO_TAPUSENEDI", "FOTO_TAKBISBELGESI"] },
    { heading: "8.5. Diğer Ekler", nextHeading: "8.6. Fatura", tokens: ["FOTO_ENERJIKIMLIK", "FOTO_TUTANAKLAR", "FOTO_MAHKEMEEVRAKLARI", "FOTO_UZMANOZCEKIM", "FOTO_HESAPLAMATABLOLARI", "FOTO_FINANSALTABLOLAR", "FOTO_DIGER"] },
  ];
  sectionTokenMap.forEach(({ heading, nextHeading, tokens: sectionTokens }) => {
    const headingIdx = secondOccurrence(xmlText, heading);
    const nextHeadingIdx = secondOccurrence(xmlText, nextHeading);
    check(headingIdx !== -1, `"${heading}" başlığının GÖVDEDEKİ (TOC dışı) ikinci geçişi bulunamadı.`);
    check(nextHeadingIdx !== -1, `"${nextHeading}" başlığının GÖVDEDEKİ (TOC dışı) ikinci geçişi bulunamadı.`);
    sectionTokens.forEach((t) => {
      const tokenIdx = xmlText.indexOf(`{{${t}}}`);
      check(tokenIdx !== -1, `{{${t}}} şablonda hiç bulunamadı.`);
      check(
        tokenIdx > headingIdx && tokenIdx < nextHeadingIdx,
        `{{${t}}} "${heading}" ile "${nextHeading}" arasında OLMALIYDI (yanlış bölüme yerleşmiş olabilir).`
      );
    });
  });

  // FOTO_HARCLAR (yeni kategori) "8.6. Fatura" başlığından SONRA olmalı
  // (dosyanın sonuna kadar başka bir bölüm başlığı yok).
  const fatura6Idx = secondOccurrence(xmlText, "8.6. Fatura");
  const harclarIdx = xmlText.indexOf("{{FOTO_HARCLAR}}");
  check(harclarIdx !== -1, "{{FOTO_HARCLAR}} şablonda bulunamadı (yeni kategori eklenmemiş olabilir).");
  check(harclarIdx > fatura6Idx, "{{FOTO_HARCLAR}} \"8.6. Fatura\" başlığından SONRA olmalıydı.");

  // 2026-09-08: [Content_Types].xml'de "jpeg" uzantısı hiç deklare
  // edilmemişti (yalnızca "png" vardı) — gerçek kamera/telefon
  // fotoğrafları (JPEG) her embed edildiğinde Word'ün "okunamayan
  // içerik" onarım uyarısı vermesine yol açan, ÖNCEDEN VAR OLAN,
  // fark edilmemiş bir hataydı (bu oturumda gerçek Word render'ında
  // XSD doğrulamasıyla YAKALANDI). Şablona kalıcı olarak eklendi.
  const contentTypesEntry = entries.find((e) => e.name === "[Content_Types].xml");
  check(Boolean(contentTypesEntry), "[Content_Types].xml girişi bulunamadı.");
  const contentTypesXml = contentTypesEntry ? Buffer.from(contentTypesEntry.bytes).toString("utf8") : "";
  check(contentTypesXml.includes('Extension="jpeg"'), '[Content_Types].xml\'de "jpeg" uzantısı için Default deklarasyonu OLMALIYDI (gerçek JPEG fotoğraflar için gerekli).');
}

// --- 9) OOXML eleman sırası regresyon testi (2026-09-08): CT_TblPrBase
// şemasında <w:tblBorders>, <w:tblLayout>'tan ÖNCE; CT_PPrBase şemasında
// <w:spacing>, <w:jc>'den ÖNCE gelmeli. Bu sıra daha önce TERSTİ — gerçek
// Word render'ında "okunamayan içerik" onarım uyarısına yol açan,
// ÖNCEDEN VAR OLAN bir hataydı (fotoğraf özelliği eklendiğinden beri,
// XSD doğrulamasıyla bu oturumda YAKALANDI). ------------------------
{
  const values = buildValuesWithAllTokensMissing(tokens);
  const photoGroups = [
    singleCategoryGroup("FOTO_DISMEKAN", "Dış Mekan", "horizontal_pair", [makePhoto("a"), makePhoto("b")]),
    { token: "FOTO_KAPAK", coverPhoto: makePhoto("kapak") },
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");

  const tblBordersIdx = outXml.indexOf("<w:tblBorders>");
  const tblLayoutIdx = outXml.indexOf("<w:tblLayout", tblBordersIdx);
  check(tblBordersIdx !== -1 && tblLayoutIdx !== -1 && tblBordersIdx < tblLayoutIdx, "<w:tblBorders>, <w:tblLayout>'tan ÖNCE gelmeliydi (CT_TblPrBase şema sırası).");

  const drawingCellSpacingIdx = outXml.indexOf('<w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/>');
  check(drawingCellSpacingIdx !== -1, "Fotoğraf hücresindeki paragrafta <w:spacing>, <w:jc>'den ÖNCE gelmeliydi (CT_PPrBase şema sırası) — buildImageCellXml.");

  const coverSpacingIdx = outXml.indexOf('<w:pPr><w:spacing w:after="80"/><w:jc w:val="center"/></w:pPr>');
  check(coverSpacingIdx !== -1, "Kapak fotoğrafı etiket paragrafında <w:spacing>, <w:jc>'den ÖNCE gelmeliydi (CT_PPrBase şema sırası) — buildCoverPhotoBlockXml.");
}

// --- 10) YENİ BÖLÜM'ün İLK sayfası GEREKSİZ pageBreakBefore ALMAMALI
// (2026-09-08, kullanıcının GERÇEK bir raporda gösterdiği ekran
// görüntüsüyle bulundu): "8.2. Uavt Kodu,Kroki,İmar Durumu" başlığının
// SAYFASI neredeyse tamamen BOŞ kalıyordu, "Adres Kodu" içeriği bir
// SONRAKİ sayfaya taşıyordu — "bu kısım niye boş kaldı". Kök neden:
// isFirstBannerOverall TEK global bayraktı; "Adres Kodu" (section 1),
// İŞLENME SIRASINDA ondan önce gelen "Dış Mekan" (section 0) YÜZÜNDEN
// zaten "ilk değil" sayılıp GEREKSİZ bir pageBreakBefore alıyordu. Bu
// senaryo TAM OLARAK kullanıcının verdiği örneği yeniden üretir: Dış
// Mekan (section 0, İŞLENME SIRASINDA İLK) + Adres Kodu (section 1,
// TEK BAŞINA — İmar Durumu YOK) birlikte. --------------------------
{
  const values = buildValuesWithAllTokensMissing(tokens);
  const photoGroups = [
    singleCategoryGroup("FOTO_DISMEKAN", "Dış Mekan", "horizontal_pair", [makePhoto("a"), makePhoto("b")]),
    singleCategoryGroup("FOTO_ADRESKODU", "Adres Kodu", "vertical_single", [makePhoto("c")]),
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");

  const heading82Idx = secondOccurrence(outXml, "8.2. Uavt Kodu,Kroki,İmar Durumu");
  check(heading82Idx !== -1, '"8.2. Uavt Kodu,Kroki,İmar Durumu" başlığının gövdedeki (TOC dışı) ikinci geçişi bulunamadı.');
  const adresKoduLabelIdx = outXml.indexOf("Adres Kodu", heading82Idx + 1);
  check(adresKoduLabelIdx !== -1, '"Adres Kodu" etiketi "8.2" başlığından SONRA bulunamadı.');
  const sliceBetween = outXml.slice(heading82Idx, adresKoduLabelIdx);
  check(
    !sliceBetween.includes("<w:pageBreakBefore/>"),
    '"8.2" başlığı ile "Adres Kodu" içeriği ARASINDA gereksiz bir pageBreakBefore VARDI — bu, "8.2" başlığının kendi sayfasını boş bırakıp içeriği bir sonraki sayfaya iter (kullanıcının GERÇEK raporda gösterdiği sorun).'
  );
  // Görsel GERÇEKTEN "8.2" başlığıyla AYNI sayfaya (hemen ardından)
  // gömülmüş mü — <w:drawing> de bu aralıkta olmalı.
  check(sliceBetween.includes("<w:drawing>"), '"Adres Kodu" görseli "8.2" başlığının HEMEN SONRASINDA gömülü DEĞİL.');
}

if (failures.length) {
  console.error("emlakkatilim.docx fotograf gomme testi BASARISIZ:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("emlakkatilim.docx '8. Ekler' fotograf gomme (24 kategori-özel token, 6 alt bölüme dağıtılmış + 16x22 cm sayfa kutusu + kirpma yok + kapak fotografi yer tutucusu + OOXML şema sırası doğrulaması) testleri basarili.");
