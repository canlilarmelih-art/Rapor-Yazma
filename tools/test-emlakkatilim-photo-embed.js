"use strict";

/*
  Kullanici talebi (2026-08-13): "ben görsellerin eklenmesini ve
  kullanılabilmesini istiyorum ancak bunlar kullanıcı cihazında kalmalı
  ve server a hiç gitmemeli" — sonrasinda kapsam "sadece docx dosyalara
  gömeceğiz. diğerleri olmayacak. şu an sadece emlakkatılım" olarak
  netlesti.

  2. tur (ayni gun, ekran goruntusu ornekleriyle genisletildi): 23
  fotograf/belge TURU (kategori), her tur icin tek satir LACIVERT
  zeminli baslik + fotograflar, 4 sayfa yerlesim sablonu (Yatay Ikili/
  Dikey Tekli/Alt Alta Ikili/6'li Grid), fotografin yatay/dikey
  oldugunun srcRect kirpmasina yansitilmasi. Kullanici acikca: "Her bir
  turdeki fotografta tek satir navy Blue dolgu rengi icine beyaz Dis
  Mekan Altina fotograflar. olarak gelsin secilmeyen gorseller ornek:
  finansal tablolar kullanici tarafindan secilmedi ise wordde baslik
  olarak belirtilmesin" dedi.

  templates/emlakkatilim.docx'in "8.1 Fotoğraflar" bolumundeki (onceden
  BOS) hucreye elle {{FOTO_ALANI_1}} token'i eklendi (word/document.xml
  bayt-duzeyinde duzenlenip STORED zip olarak yeniden paketlendi — bkz.
  handoff.md). Bu TEK token, YENI semada TUM kategorileri barindirir —
  {{FOTO_ALANI_3}} (eski "8.3 Proje Fotografları" ayri token'i) sablonda
  hala FIZIKSEL olarak duruyor ama yeni akista hic kullanilmiyor (her
  zaman "" ile temizlenir, template-engine.js'in gercek davranisi).

  3. tur (ayni gun): kullanici "worde eklenen resimlerin boyutlari cok
  buyuk maksimum genislik 15 cm olmali" + "kapak fotografi icin bir
  placeholder olustur. kullanici bu fotografi nerede istiyor ise orada
  kullansin. kapak fotografinda maksimum genislik 15 cm" dedi. Bu ikisi
  icin: (a) HER hucrenin genisligi artik en fazla 15 cm (5400000 EMU) ile
  sinirli (once tek sutunlu yerlesimlerde ~18.5 cm'e kadar cikabiliyordu),
  (b) "Kapak Fotografi" kategorisi artik izgara/batch sistemine GIRMEZ —
  kategori donguşunden ONCE, ayri, TEK ve tasinabilir bir paragraf (etiket
  + 15 cm sinirli, KIRPILMAMIS gorsel) olarak gomulur.

  4. tur (ayni gun): kullanici "başlıklar sayfa sonundan başlamamalı her
  bir başlık yeni sayfadan başlamalı" dedi — ONCEDEN yalnizca kategoriler
  ARASINDA (categoryIndex > 0) sayfa sonu ekleniyordu, ILK kategori
  onceki icerigin hemen ardindan (sayfanin herhangi bir yerinden)
  baslayabiliyordu. Artik HER kategori banner'i (ILK dahil, kapak
  fotografi olsun olmasin) kendi sayfasinda baslar — banner'dan hemen
  ONCE KOSULSUZ bir sayfa sonu eklenir.

  Bu test dogrular:
  1) Sablon hala GECERLI bir STORED .docx (readStoredZip patlamiyor).
  2) collectTokens() FOTO_ALANI_1'i buluyor.
  3) Fotograf VARKEN (2 kategori, farkli yerlesim sablonlari):
     - her kategori icin TEK bir lacivert (1F3864) dolgu banner'i var,
     - kategori etiketleri (ör. "Dış Mekan") ciktida geciyor,
     - FOTOGRAFSIZ bir kategori (ör. "Finansal Tablolar") ciktida HIC
       gecmiyor (ne baslik ne baska bir iz),
     - gercek <w:drawing> + rels + media girisleri (sablona GORE delta)
       toplam fotograf sayisi kadar artiyor,
     - en az bir <a:srcRect> (kirpma) uretiliyor,
     - HICBIR gorselin genisligi (wp:extent cx) 5400000 EMU'yu (15 cm)
       asmiyor,
     - kategoriler arasi sayfa sonu (<w:br w:type="page"/>) var.
  4) Fotograf YOKKEN: token TEMIZ sekilde silinip belgede GORUNMUYOR.
  5) Kapak Fotografi VARKEN: "Kapak Fotoğrafı" etiketi kategori
     banner'larindan ONCE geliyor, gorseli 15 cm'i asmiyor, KIRPILMAMIS
     (srcRect yok) ve kategori listesine (banner) DAHIL EDILMIYOR.
  6) Her senaryoda ciktinin STORED-zip round-trip'i saglam.
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

// --- 2) collectTokens FOTO_ALANI_1'i buluyor mu? ----------------------
const xmlText = Buffer.from(docEntry.bytes).toString("utf8");
const tokens = DocxFill.collectTokens(xmlText);
check(tokens.includes("FOTO_ALANI_1"), "{{FOTO_ALANI_1}} sablonda bulunamadi (8.1 Fotograflar duzenlemesi kaybolmus olabilir).");

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

// Sablon zaten (logo/antet gibi) kendi <wp:extent> genislikleriyle
// geliyor — bir listeyi BASKA bir listeden "cikarirken" (multiset fark)
// baseline'da zaten var olan degerleri sayaclariyla dusup yalnizca YENİ
// (bizim eklediğimiz) degerleri dondurur.
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

function makePhoto(caption) {
  return { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", caption: caption || "", width: 800, height: 800, orientation: "square" };
}

// --- 3) Fotograf VARKEN: kategori banner'lari + gercek gomme -----------
{
  const values = buildValuesWithMissingPlaceholders(tokens, { FOTO_ALANI_3: "" });
  const boldFlags = {};
  const photoGroups = [
    {
      token: "FOTO_ALANI_1",
      categories: [
        {
          label: "Dış Mekan",
          batches: [
            { layoutKey: "horizontal_pair", photos: [makePhoto("Ön cephe"), makePhoto("Bahçe")] },
          ],
        },
        {
          label: "İç Mekan",
          batches: [
            { layoutKey: "vertical_single", photos: [makePhoto("Salon")] },
          ],
        },
        // "Finansal Tablolar" kasitli olarak HIC eklenmedi — kullanici
        // acikca "secilmeyen gorseller ... wordde baslik olarak
        // belirtilmesin" dedi; bu kategori listede bile yok.
      ],
    },
  ];
  const totalPhotos = 3;
  const filled = DocxFill.fillTemplate(arrayBuffer, values, boldFlags, [], photoGroups);
  check(!filled.missing.includes("FOTO_ALANI_1"), "FOTO_ALANI_1 fotograf gomulmesine ragmen 'missing' listesinde.");

  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  check(!outXml.includes("{{FOTO_ALANI_1}}"), "Ciktida ham {{FOTO_ALANI_1}} metni hala duruyor (gomulmemis).");
  check(!outXml.includes("{{FOTO_ALANI_3}}"), "Ciktida ham {{FOTO_ALANI_3}} metni hala duruyor (temizlenmemis).");

  check(outXml.includes("Dış Mekan"), "\"Dış Mekan\" kategori basligi ciktida yok.");
  check(outXml.includes("İç Mekan"), "\"İç Mekan\" kategori basligi ciktida yok.");
  check(!outXml.includes("Finansal Tablolar"), "Secilmeyen \"Finansal Tablolar\" kategorisi ciktida gorunmemeliydi (kullanici talebi).");

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

  // 1x1 kare (square) test goruntusu, hicbir yerlesim hucresinin kare
  // olmayan hedef en-boy oranina (horizontal_pair ~1.35, vertical_single
  // ~0.75) TAM uymadigindan HER fotografta kirpma (srcRect) beklenir.
  const srcRectCount = countOccurrences(outXml, "<a:srcRect ");
  check(srcRectCount === totalPhotos, `Her hucre icin kirpma (srcRect) bekleniyordu (${totalPhotos}), bulunan: ${srcRectCount}`);

  // "başlıklar sayfa sonundan başlamamalı her bir başlık yeni sayfadan
  // başlamalı" — HER kategori banner'i (ILK dahil) kendi sayfasında
  // baslar: 2 kategori = TAM 2 sayfa sonu (once ne kadar icerik olursa
  // olsun, ilk banner de kendi sayfasinda baslar).
  const pageBreakCount = countOccurrences(outXml, '<w:br w:type="page"/>');
  check(pageBreakCount === 2, `2 kategori icin TAM 2 sayfa sonu (her basligin kendi sayfasi) bekleniyordu, bulunan: ${pageBreakCount}`);

  // "worde eklenen resimlerin boyutlari cok buyuk maksimum genislik 15 cm
  // olmali" — vertical_single (tek sutun) yerlesimi ONCEDEN "8.1" hucresinin
  // TAM genisligini (~18.5 cm) kullaniyordu; artik HICBIR gorsel genisligi
  // (wp:extent cx) 5400000 EMU'yu (15 cm) gecmemeli.
  const extentWidths = [...outXml.matchAll(/<wp:extent cx="(\d+)"/g)].map((m) => Number(m[1]));
  const newExtentWidths = subtractMultiset(extentWidths, baselineExtentWidths);
  const oversizedWidths = newExtentWidths.filter((cx) => cx > 5400000);
  check(oversizedWidths.length === 0, `15 cm (5400000 EMU) sinirini asan ${oversizedWidths.length} YENİ gorsel bulundu: ${oversizedWidths.join(", ")}`);

  // Cikti hala saglam bir STORED zip olmali (round-trip).
  try {
    DocxFill.readStoredZip(filled.bytes.buffer);
  } catch (error) {
    check(false, `Fotografli cikti STORED zip olarak yeniden okunamadi: ${error.message}`);
  }
}

// --- 4) Fotograf YOKKEN: token temiz sekilde silinmeli -------------------
{
  const overrides = { FOTO_ALANI_1: "", FOTO_ALANI_3: "" }; // template-engine.js'in gercek davranisi
  const values = buildValuesWithMissingPlaceholders(tokens, overrides);
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], []);
  check(!filled.missing.includes("FOTO_ALANI_1"), "Fotografsiz durumda FOTO_ALANI_1 'missing' olarak isaretlenmis.");
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  check(!outXml.includes("{{FOTO_ALANI_1}}"), "Fotografsiz durumda ham {{FOTO_ALANI_1}} metni ciktida kalmis.");
  // Sablonun KENDI logo/antet gorselleri (baseline) hala dursun — yalnizca
  // FOTO_ALANI_* icin YENI bir <w:drawing> eklenmemis olmasi kontrol edilir.
  const drawingCountEmpty = countOccurrences(outXml, "<w:drawing>");
  check(drawingCountEmpty === baselineDrawingCount, `Fotografsiz durumda <w:drawing> sayisi sablonla ayni kalmaliydi (${baselineDrawingCount}), bulunan: ${drawingCountEmpty}`);
  const bannerCountEmpty = countOccurrences(outXml, `w:fill="1F3864"`);
  check(bannerCountEmpty === 0, `Fotografsiz durumda kategori banner'i olmamaliydi, bulunan: ${bannerCountEmpty}`);
}

// --- 5) Kapak Fotografi: ayri, tek, 15 cm sinirli, KIRPILMAMIS -----------
{
  const values = buildValuesWithMissingPlaceholders(tokens, { FOTO_ALANI_3: "" });
  // 4:3 (dikey olmayan) bir "gercek boyut" bildirimi: pixelSize test
  // JPEG'inden (1x1) okunacagindan srcRect hesaplamasinda width/height
  // override'i onemli degil, ama genislik/yukseklik hesap mantigini
  // (computeCoverPhotoEmuSize) dogrulamak icin makePhoto ile ayni sekil.
  const photoGroups = [
    {
      token: "FOTO_ALANI_1",
      categories: [
        { label: "İç Mekan", batches: [{ layoutKey: "vertical_single", photos: [makePhoto("Salon")] }] },
      ],
      coverPhoto: { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", width: 1600, height: 1200 },
    },
  ];
  const totalPhotos = 2; // 1 kapak + 1 kategori fotografi
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  check(!filled.missing.includes("FOTO_ALANI_1"), "Kapak fotografli senaryoda FOTO_ALANI_1 'missing' listesinde.");

  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");

  const coverLabelIndex = outXml.indexOf("Kapak Fotoğrafı (yer tutucu");
  const bannerIndex = outXml.indexOf('w:fill="1F3864"');
  check(coverLabelIndex >= 0, "\"Kapak Fotoğrafı\" yer tutucu etiketi ciktida bulunamadi.");
  check(bannerIndex >= 0, "Kategori banner'i (İç Mekan) ciktida bulunamadi.");
  check(coverLabelIndex >= 0 && bannerIndex >= 0 && coverLabelIndex < bannerIndex, "Kapak Fotoğrafı, kategori banner'larindan ONCE gelmeliydi.");
  // "Kapak Fotoğrafı" kendi lacivert banner'ini ALMAZ — yalnizca "İç Mekan"
  // icin TEK bir banner (w:fill="1F3864") olmali, kapak icin AYRICA bir
  // tane daha OLMAMALI (kategori listesine dahil edilmedigi icin).
  const coverScenarioBannerCount = countOccurrences(outXml, 'w:fill="1F3864"');
  check(coverScenarioBannerCount === 1, `Yalnizca "İç Mekan" icin 1 banner bekleniyordu (Kapak Fotoğrafı banner ALMAZ), bulunan: ${coverScenarioBannerCount}`);

  const drawingCount = countOccurrences(outXml, "<w:drawing>");
  check(drawingCount === baselineDrawingCount + totalPhotos, `Sablona gore +${totalPhotos} <w:drawing> bekleniyordu (1 kapak + 1 kategori), gercek fark: ${drawingCount - baselineDrawingCount}`);

  const extentWidths = [...outXml.matchAll(/<wp:extent cx="(\d+)"/g)].map((m) => Number(m[1]));
  const newExtentWidths = subtractMultiset(extentWidths, baselineExtentWidths);
  const oversizedWidths = newExtentWidths.filter((cx) => cx > 5400000);
  check(oversizedWidths.length === 0, `Kapak fotografi dahil, 15 cm sinirini asan ${oversizedWidths.length} YENİ gorsel bulundu.`);

  // Kapak fotografi KIRPILMAZ (srcRect=null gecilir) — yalnizca kategori
  // (vertical_single) fotografinda 1 srcRect beklenir, kapakta HIC.
  const srcRectCount = countOccurrences(outXml, "<a:srcRect ");
  check(srcRectCount === 1, `Yalnizca kategori fotografinda 1 srcRect (kirpma) bekleniyordu (kapak KIRPILMAZ), bulunan: ${srcRectCount}`);

  // "her bir başlık yeni sayfadan başlamalı" — kapak fotografindan SONRA,
  // TEK kategori (İç Mekan) icin TAM 1 sayfa sonu (kapagin KENDISI icin
  // sayfa sonu eklenmez, yalnizca ardindan gelen basliktan ONCE).
  const pageBreakCount = countOccurrences(outXml, '<w:br w:type="page"/>');
  check(pageBreakCount === 1, `Kapak fotografi + 1 kategori icin TAM 1 sayfa sonu (basligin kendi sayfasi) bekleniyordu, bulunan: ${pageBreakCount}`);

  try {
    DocxFill.readStoredZip(filled.bytes.buffer);
  } catch (error) {
    check(false, `Kapak fotografli cikti STORED zip olarak yeniden okunamadi: ${error.message}`);
  }
}

// --- 6) Kapak Fotografi TEK BASINA (kategori yokken de calismali) --------
{
  const values = buildValuesWithMissingPlaceholders(tokens, { FOTO_ALANI_3: "" });
  const photoGroups = [
    { token: "FOTO_ALANI_1", categories: [], coverPhoto: { base64: TINY_JPEG_BASE64, mimeType: "image/jpeg", width: 1600, height: 1200 } },
  ];
  const filled = DocxFill.fillTemplate(arrayBuffer, values, {}, [], photoGroups);
  check(!filled.missing.includes("FOTO_ALANI_1"), "Yalniz-kapak senaryosunda FOTO_ALANI_1 'missing' listesinde.");
  const outEntries = DocxFill.readStoredZip(filled.bytes.buffer);
  const outDoc = outEntries.find((e) => e.name === "word/document.xml");
  const outXml = Buffer.from(outDoc.bytes).toString("utf8");
  check(outXml.includes("Kapak Fotoğrafı (yer tutucu"), "Kategori olmadan yalniz kapak fotografi eklendiginde etiket ciktida yok.");
  const drawingCount = countOccurrences(outXml, "<w:drawing>");
  check(drawingCount === baselineDrawingCount + 1, `Yalniz-kapak senaryosunda +1 <w:drawing> bekleniyordu, gercek fark: ${drawingCount - baselineDrawingCount}`);
}

if (failures.length) {
  console.error("emlakkatilim.docx fotograf gomme testi BASARISIZ:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("emlakkatilim.docx '8. Ekler' fotograf gomme (kategori/yerlesim semasi + kapak fotografi yer tutucusu + 15 cm sinirlamasi) testleri basarili.");
