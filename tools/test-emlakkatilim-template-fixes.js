"use strict";

/*
  Kullanici talebi (2026-09-07): gercek bir emlakkatilim.docx raporundan
  6 ayri isaretli ekran goruntusu geldi (metin mesaji YOK — isaretli
  goruntulerin KENDISI istekti, bu oturumda 0.0.669-671'de de kurulan
  bir kalip). Bu test o 6 duzeltmeyi dogrular:

  1) Kapak tablosunda "Il:/Sokak:/Daire No:" satiri daraltildi
     (trHeight 330 -> 260 twips).
  2) Cadde/Sokak ikilenmesi: "street" alaninda "Cadde" geciyorsa SADECE
     Cadde hucresi, "Sokak" geciyorsa SADECE Sokak hucresi dolar, digeri
     BOS kalir (eskiden IKISI de ayni {{STREET_BUYUK}}'u kullaniyordu).
     Sablonda YENI {{STREET_SOKAK_BUYUK}}/{{STREET_CADDE_BUYUK}} token'lari;
     template-engine.js'te classifyStreetKind() ile davranis.
  3) "Tapu/Adres Bilgileri" mini tablosu (Ili/Tasinmaz ID/Mahalle/Ilcesi/
     Pafta/Sayfa/Cephe Sayisi/Ada/Arsa Payi/Parsel/Malik/Kat Sayisi/
     Tasinmaz Tipi/Dairenin Alani/Iskan Durumu/Oda Planlamasi) TUM
     hucrelerde ZATEN vAlign=center idi (degisiklik gerekmedi) — ama
     buyuk harf ZORUNLULUGU icin HER run'a <w:caps/> eklendi (veri
     degismeden, yalnizca GORUNTULEME).
  4) Kapak fotografi "Kapak Fotoğrafı (yer tutucu — istediginiz konuma
     tasiyabilirsiniz)" GORUNUR etiketi kaldirildi (docx-fill.js,
     buildCoverPhotoBlockXml) — kendi testi test-emlakkatilim-photo-embed.js
     senaryo 5/7/dual-occurrence'ta guncellendi, burada TEKRAR edilmiyor.
  5) Iki sabit/placeholder konum artik {{KULLANICI_AD_SOYAD}} (zaten var
     olan, calisan token) kullaniyor: (a) "İSİM SOYİSİM" statik metni,
     (b) "Raporu Hazırlayan Değerleme Uzmanı" imza hucresindeki "…..".
     "Raporu Kontrol Eden" hucresi ELLE kalmali, "Raporu Onaylayan"
     ("Baki Budakoğlu") DEGISMEMELI.
  6) Imar Durumu aciklamasi paragrafinin jc=both (tam yasla, cirkin
     kelime araligi) -> jc=left (sola yasli) oldu. Bu paragraf ayni
     zamanda {{PLANNING_NOTE_TEXT}} kullaniyor — bu token HICBIR
     alias/alan/uretilmis-metin dizininde KAYITLI DEGILDI (halkbank.html/
     isbankasi.html'de de ayni kirikligi tasiyordu, "⚠ FOTO_KAPAK" ile
     AYNI hata ailesi) — template-engine.js'e eklendi.
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
assert.ok(DocxFill && typeof DocxFill.readStoredZip === "function", "RaporDocxFill yuklenmedi.");

const templatePath = path.join(appDir, "templates", "emlakkatilim.docx");
const templateBuffer = fs.readFileSync(templatePath);
const arrayBuffer = templateBuffer.buffer.slice(templateBuffer.byteOffset, templateBuffer.byteOffset + templateBuffer.byteLength);
const entries = DocxFill.readStoredZip(arrayBuffer);
const docEntry = entries.find((e) => e.name === "word/document.xml");
check(Boolean(docEntry), "word/document.xml girisi bulunamadi.");
const xml = Buffer.from(docEntry.bytes).toString("utf8");

function countOf(text, needle) {
  return text.split(needle).length - 1;
}

// --- Fix 1: Il/Sokak/Daire No satiri daraltildi -------------------------
{
  check(
    countOf(xml, '<w:tr w:rsidR="005C045D" w:rsidRPr="006C287B" w14:paraId="2B29184D"') === 1,
    "Fix1: Il/Sokak/Daire No satirinin paraId'si bulunamadi/benzersiz degil."
  );
  const rowIdx = xml.indexOf('w14:paraId="2B29184D"');
  const rowSlice = xml.slice(Math.max(0, rowIdx - 40), rowIdx + 200);
  check(rowSlice.includes('<w:trHeight w:val="260"/>'), "Fix1: satir yuksekligi 260'a daraltilmamis.");
  check(!rowSlice.includes('<w:trHeight w:val="330"/>'), "Fix1: eski (330) satir yuksekligi hala mevcut.");
}

// --- Fix 2: Cadde/Sokak ayri token'lar -----------------------------------
{
  check(countOf(xml, "{{STREET_SOKAK_BUYUK}}") === 1, "Fix2: {{STREET_SOKAK_BUYUK}} sablonda tam olarak 1 kez bulunmali.");
  check(countOf(xml, "{{STREET_CADDE_BUYUK}}") === 1, "Fix2: {{STREET_CADDE_BUYUK}} sablonda tam olarak 1 kez bulunmali.");
  // Kapak tablosunun "Cadde/Sokak" BIRLESIK hucresi (Tapu/Adres mini
  // tablosunda) kasitli olarak degismedi — hala {{STREET_BUYUK}} kullanir
  // (TEK hucre, ikileme sorunu yok).
  check(countOf(xml, "{{STREET_BUYUK}}") === 1, "Fix2: kalan tek {{STREET_BUYUK}} (Cadde/Sokak birlesik hucresi) beklenenden farkli sayida.");
}

// --- Fix 3: Tapu/Adres bilgileri mini tablosu buyuk harf (w:caps) -------
{
  const startIdx = xml.lastIndexOf("<w:tr ", xml.indexOf("39773287"));
  const endIdx = xml.lastIndexOf("<w:tr ", xml.indexOf("2D9AD5BC"));
  check(startIdx > 0 && endIdx > startIdx, "Fix3: Tapu/Adres bilgileri tablosunun sinirlari bulunamadi.");
  const segment = xml.slice(startIdx, endIdx);
  const rPrCount = countOf(segment, "<w:rPr>");
  const capsCount = countOf(segment, "<w:caps/>");
  check(rPrCount > 100, `Fix3: beklenenden az <w:rPr> bulundu (${rPrCount}) — tablo sinirlari kaymis olabilir.`);
  check(capsCount === rPrCount, `Fix3: HER <w:rPr> icin bir <w:caps/> bekleniyordu (${rPrCount}), bulunan: ${capsCount}.`);
  // <w:caps/> her zaman rFonts/b/bCs/i/iCs'den SONRA, color/sz'den ONCE
  // gelmeli (CT_RPrBase sema sirasi) — b/bCs iceren bir ornek uzerinde dogrula.
  check(
    segment.includes('<w:b/><w:bCs/><w:caps/><w:color'),
    "Fix3: <w:caps/> kalin (b/bCs) etiket hucrelerinde SEMA SIRASINA uygun yerlestirilmemis (b/bCs SONRASI, color ONCESI olmali)."
  );
}

// --- Fix 5a: "İSİM SOYİSİM" -> {{KULLANICI_AD_SOYAD}} -------------------
{
  check(!xml.includes("İSİM SOYİSİM"), 'Fix5a: statik "İSİM SOYİSİM" metni hala sablonda.');
  check(countOf(xml, "{{KULLANICI_AD_SOYAD}}") === 2, `Fix5a/5b: {{KULLANICI_AD_SOYAD}} tam olarak 2 kez (Degerleme Uzmani basligi + imza hucresi) bekleniyordu.`);
}

// --- Fix 5b: imza hucresi "….." -> {{KULLANICI_AD_SOYAD}}, digerleri SABIT --
{
  // Once IKI "….." vardi ("Raporu Hazırlayan" + "Raporu Kontrol Eden");
  // yalnizca "Raporu Hazırlayan" olan KULLANICI_AD_SOYAD'a donustu, "Raporu
  // Kontrol Eden"inki ELLE doldurulmak uzere "….." olarak KALMALI.
  check(countOf(xml, ">…..<") === 1, `Fix5b: "Raporu Hazırlayan" hucresi degismis olmali (1 kaldi, "Raporu Kontrol Eden"in "….."si), bulunan: ${countOf(xml, ">…..<")}.`);
  check(!xml.includes('<w:highlight w:val="yellow"/><w:lang w:eastAsia="tr-TR"/></w:rPr><w:t>…..</w:t>'), 'Fix5b: "Raporu Hazırlayan" hucresindeki sari vurgulu "….." hala eski haliyle sablonda.');
  check(xml.includes("Baki Budakoğlu"), 'Fix5b: "Raporu Onaylayan" (Baki Budakoğlu) sabit deger DEGISMEMELIYDI ama artik yok.');
}

// --- Fix 6: Imar Durumu aciklamasi jc=both -> jc=left --------------------
{
  check(countOf(xml, "{{PLANNING_NOTE_TEXT}}") === 1, "Fix6: {{PLANNING_NOTE_TEXT}} sablonda tam olarak 1 kez bulunmali.");
  const idx = xml.indexOf("{{PLANNING_NOTE_TEXT}}");
  const pStart = xml.lastIndexOf("<w:p ", idx);
  const pPrEnd = xml.indexOf("</w:pPr>", idx);
  const pPr = xml.slice(pStart, pPrEnd);
  check(pPr.includes('<w:jc w:val="left"/>'), "Fix6: Imar Durumu aciklamasi paragrafi jc=left DEGIL.");
  check(!pPr.includes('<w:jc w:val="both"/>'), "Fix6: Imar Durumu aciklamasi paragrafi hala jc=both (tam yasla).");
}

// --- template-engine.js: STREET_SOKAK_BUYUK/STREET_CADDE_BUYUK + PLANNING_NOTE_TEXT ----
{
  const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
  process.env.NODE_ENV = "test"; // resolveToken vb. yalnizca test ortaminda disari acilir.
  const sandboxWindow = {};
  const stubState = { fields: {}, tables: {} };
  function stubEscapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  const loader = new Function(
    "window", "state", "sections", "collectGeneratedTextPlaceholders",
    "escapeHtml", "formatWordParagraphs", "dateIsoToTr", "parseValuationNumber", "formatSchemeNumber",
    engineSource
  );
  loader(
    sandboxWindow,
    stubState,
    [{ id: "test", fields: [] }],
    () => [],
    stubEscapeHtml,
    (text) => `<p>${stubEscapeHtml(text)}</p>`,
    (iso) => String(iso || ""),
    (value) => Number.parseFloat(String(value).replace(/\./g, "").replace(",", ".")),
    (value) => new Intl.NumberFormat("tr-TR").format(value)
  );
  const engine = sandboxWindow.RaporTemplates;
  check(Boolean(engine), "template-engine.js sandbox'ta yuklenemedi.");

  // Cadde iceren deger -> SADECE Cadde hucresi dolar.
  stubState.fields.street = "Atatürk Caddesi No:5";
  check(engine.resolveToken("STREET_CADDE_BUYUK").html === "ATATÜRK CADDESİ NO:5", "STREET_CADDE_BUYUK: 'Cadde' iceren deger CADDE hucresine gitmeli.");
  check(engine.resolveToken("STREET_SOKAK_BUYUK").html === "", "STREET_SOKAK_BUYUK: 'Cadde' iceren degerde SOKAK hucresi BOS kalmali.");

  // Sokak iceren deger -> SADECE Sokak hucresi dolar.
  stubState.fields.street = "5. Sokak";
  check(engine.resolveToken("STREET_SOKAK_BUYUK").html === "5. SOKAK", "STREET_SOKAK_BUYUK: 'Sokak' iceren deger SOKAK hucresine gitmeli.");
  check(engine.resolveToken("STREET_CADDE_BUYUK").html === "", "STREET_CADDE_BUYUK: 'Sokak' iceren degerde CADDE hucresi BOS kalmali.");

  // Ne "Cadde" ne "Sokak" geciyorsa (belirsiz) -> veri kaybolmasin diye Sokak'a duser.
  stubState.fields.street = "Merkez Mahallesi 12. Blok";
  check(engine.resolveToken("STREET_SOKAK_BUYUK").html === "MERKEZ MAHALLESİ 12. BLOK", "STREET_SOKAK_BUYUK: belirsiz (ne Cadde ne Sokak) durumda veri kaybolmamali (varsayilan Sokak).");
  check(engine.resolveToken("STREET_CADDE_BUYUK").html === "", "STREET_CADDE_BUYUK: belirsiz durumda CADDE hucresi BOS kalmali (cift gosterim olmamali).");

  // PLANNING_NOTE_TEXT artik IMARDURUMUKISA ile AYNI kaynaga (planningNote
  // alani / buildImarPlanningNote) baglaniyor mu?
  stubState.fields.planningNote = "";
  global.buildImarPlanningNote = () => "TEST İMAR NOTU METNİ";
  check(engine.resolveToken("PLANNING_NOTE_TEXT").ok, "PLANNING_NOTE_TEXT artik cozumlenebilir olmali (eskiden '⚠ PLANNING_NOTE_TEXT' uyarisina duserdi).");
  check(
    engine.resolveToken("PLANNING_NOTE_TEXT").html === engine.resolveToken("IMARDURUMUKISA").html,
    "PLANNING_NOTE_TEXT, IMARDURUMUKISA ile AYNI degeri uretmeli (ayni buildImarPlanningNote/planningNote kaynagi)."
  );
  check(engine.resolveToken("PLANNING_NOTE_TEXT").html.includes("TEST İMAR NOTU METNİ"), "PLANNING_NOTE_TEXT beklenen icerigi tasimiyor.");
  delete global.buildImarPlanningNote;
}

if (failures.length) {
  console.error("emlakkatilim.docx 6-duzeltme testi BASARISIZ:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("emlakkatilim.docx 6-duzeltme (satir daraltma, Cadde/Sokak ayrimi, Tapu/Adres tablosu buyuk harf, KULLANICI_AD_SOYAD, Imar Durumu sola yasli) testleri basarili.");
