"use strict";

/*
  "Tüm Tabloları Excel Olarak İndir" regresyon testi (tarayıcısız).

  src/exports/xlsx-fill.js (zip/crc32) ve src/exports/report-tables-xlsx.js
  modüllerini Node'da minimal window/document/state/sections stub'larıyla
  çalıştırır ve şunları doğrular:
   1) Ham grid tabloları (Malikler/Şerhler/Emsaller) doğru sayfada, boş
      tablolar/satırlar dahil edilmeden çıkar.
   2) Masraf Tablosu state.fields'ten doğru satırlarla kurulur.
   3) parseHtmlTables() gerçek üretici fonksiyonlarınkine benzer bir HTML
      parçasında colspan/rowspan'i doğru birleştirilmiş hücrelere (merge)
      çevirir, satır yüksekliğini (cm->pt) ve dolgu/kalın stilini doğru
      ayrıştırır.
   4) Üretilen hücre referanslarının (r="A1" gibi) HER ZAMAN sütun harfi
      içerdiğini doğrular (regresyon: sütun indeksi unutulursa r="1" gibi
      geçersiz referanslar üretilir).
   5) Nihai .xlsx blob'u readStoredZip ile geri okunduğunda gecerli bir
      OOXML paketi oldugunu (workbook.xml sayfa sayisi = worksheet dosya
      sayisi, styles.xml var) dogrular.
*/

const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..");
const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

global.window = {};
global.document = { createElement: () => ({}), body: { append() {} } };
global.URL = { createObjectURL: () => "blob:test", revokeObjectURL: () => {} };

const xlsxFillSrc = fs.readFileSync(path.join(appDir, "src", "exports", "xlsx-fill.js"), "utf8");
// eslint-disable-next-line no-eval
eval(xlsxFillSrc);
const XlsxFill = global.window.RaporXlsxFill;
assert(XlsxFill && typeof XlsxFill.writeStoredZip === "function", "RaporXlsxFill yuklenmedi.");

let capturedBlob = null;
XlsxFill.downloadBlob = (fileName, blob) => {
  capturedBlob = { fileName, blob };
};

global.state = {
  fields: {
    caseName: "Test Ekspertiz Raporu",
    bank: "T.C. Ziraat Bankası A.Ş.",
    customerName: "Ali Veli",
    city: "Bursa",
    district: "Gürsu",
    blockNo: "10",
    parcelNo: "5",
    appointmentType: "İçi görülmüştür",
    expenseAppraisalFeeExVat: "16.500,00",
    expenseAppraisalFeeIncVat: "19.800,00",
    expenseTotalFeeExVat: "20.603,06",
    expenseTotalFeeIncVat: "24.492,27",
  },
  tables: {
    title: [
      { c0: "Ali Veli", c1: "1/1", c2: "Satış", c3: "01.01.2026", c4: "123" },
      {}, // bos satir dahil edilmemeli
    ],
    documents: [], // tamamen bos tablo: sayfa hic olusmamali
    encumbranceAnnotations: [
      { c0: "Haciz", c1: "Test Açıklama", c2: "5000", c3: "01.02.2026", c4: "456" },
    ],
    comparables: [
      { c0: "sahibinden.com", c1: "Yakın", c2: "100 m2", c3: "1.000.000", c4: "-5%" },
    ],
  },
};
global.sections = [
  { id: "title", table: { title: "Malikler", columns: ["Malik", "Hisse", "Edinme sebebi", "Tapu tarihi", "Yevmiye"] } },
  { id: "encumbrance", table: { title: "Rapora girecek takyidat kayıtları", columns: ["Tür", "Açıklama", "Tarih", "Yevmiye No"] } },
  { id: "documents", table: { title: "İncelenen belgeler", columns: ["Belge türü", "İncelenen kurum", "Tarih", "No", "Kapsam"] } },
  { id: "comparables", table: { title: "Emsal kayıtları", columns: ["Kaynak", "Konum", "Alan", "Fiyat", "Düzeltme"] } },
];
global.encumbranceReportTables = [
  { key: "encumbranceDeclarations", title: "Beyanlar - Hak ve Mükellefiyetler", columns: ["Tür", "Açıklama", "Tarih", "Yevmiye No"] },
  { key: "encumbranceAnnotations", title: "Şerhler", columns: ["Şerh Türü", "Açıklama", "Haciz Tutarı", "Tarih", "Yevmiye No"] },
  { key: "encumbranceMortgages", title: "İpotekler", columns: ["İpotek Lehdarı", "İpotek Derecesi", "İpotek Tutarı", "Tarih", "Yevmiye No"] },
];
global.encumbranceReportColumns = ["Tür", "Açıklama", "Tarih", "Yevmiye No"];
global.buildExportBaseFileName = () => "test-raporu";
global.recalculateExpenseFees = () => {};

const reportTablesSrc = fs.readFileSync(path.join(appDir, "src", "exports", "report-tables-xlsx.js"), "utf8");
// eslint-disable-next-line no-eval
eval(reportTablesSrc);
const ReportTablesXlsx = global.window.RaporReportTablesXlsx;
assert(ReportTablesXlsx && typeof ReportTablesXlsx.exportAllTables === "function", "RaporReportTablesXlsx yuklenmedi.");
assert(typeof ReportTablesXlsx.parseHtmlTables === "function", "parseHtmlTables disa acilmadi.");

// --- 1) colspan/rowspan + stil ayristirma birim testi -------------------
const sampleHtml = `<table>
<colgroup><col style="width:20%;"><col style="width:30%;"><col style="width:25%;"><col style="width:25%;"></colgroup>
<thead><tr height="19" style="height:0.5cm;"><th style="background:#e4ebf8;font-weight:700;" colspan="4">BAŞLIK</th></tr></thead>
<tbody>
<tr><td rowspan="2" style="background:#e4ebf8;font-weight:700;">Zemin Kat</td><td style="">1. Bölüm</td><td style="text-align:right;">120,50</td><td style="text-align:right;font-weight:800;">115,00</td></tr>
<tr><td style="">2. Bölüm &amp; Ek</td><td style="text-align:right;">80,00</td><td style="text-align:right;font-weight:800;">75,00</td></tr>
</tbody>
</table>`;
const parsed = ReportTablesXlsx.parseHtmlTables(sampleHtml);
assert(Boolean(parsed), "parseHtmlTables ornek HTML'i ayristiramadi.");
assert(parsed.colCount === 4, `colCount beklenmedik: ${parsed.colCount}`);
assert(parsed.merges.length === 2, `merge sayisi beklenmedik: ${parsed.merges.length}`);
assert(
  parsed.merges.some((m) => m.r1 === 0 && m.c1 === 0 && m.r2 === 0 && m.c2 === 3),
  "colspan=4 baslik birlesimi bulunamadi."
);
assert(
  parsed.merges.some((m) => m.r1 === 1 && m.c1 === 0 && m.r2 === 2 && m.c2 === 0),
  "rowspan=2 birlesimi bulunamadi."
);
assert(Math.abs((parsed.rowHeights[0] || 0) - 14.17325) < 0.01, `satir yuksekligi (0.5cm) dogru cm->pt cevrilmemis: ${parsed.rowHeights[0]}`);
assert(parsed.grid[2].find((c) => c.col === 1)?.text === "2. Bölüm & Ek", "HTML entity (&amp;) dogru cozulmemis.");
assert(parsed.grid[0][0].bold === true && parsed.grid[0][0].bg === "#e4ebf8", "Baslik hucresi kalin/dolgu bilgisi kaybolmus.");

// --- 1b) Iç içe (nested) tablo regresyon testi ----------------------------
// buildComparableValuationWordTableHtml() gercek veri tablosunu dekoratif
// bir disari "role=presentation" cerceve tablosuna gomer. Bu, kullanicinin
// bildirdigi "Emsal Degerleme Tablosunda kayma var" hatasinin kok nedeniydi:
// ic ice tabloyu bilmeyen bir ayristirici, dis cercevenin baslik satirini ve
// ic tablonun satirlarini TEK bir izgaraya karistirir.
const framedHtml = `<table role="presentation" style="border-collapse:collapse;">
<tr><td style="background:#e7e7e7;">Emsal Değerleme Tablosu</td></tr>
<tr><td>
  <table class="word-table is-wide" style="border-collapse:collapse;">
    <colgroup><col style="width:9%;"><col style="width:6%;"><col style="width:12%;"></colgroup>
    <thead>
      <tr><th rowspan="2" style="background:#e4ebf8;font-weight:700;">NO</th><th rowspan="2" style="background:#e4ebf8;font-weight:700;">ALAN</th><th style="background:#e4ebf8;font-weight:700;">SATIŞ</th></tr>
      <tr><th style="background:#e4ebf8;font-weight:700;">TALEP EDİLEN</th></tr>
    </thead>
    <tbody>
      <tr><td style="text-align:center;">E1</td><td style="text-align:right;">120,00</td><td style="text-align:right;">1.000.000</td></tr>
    </tbody>
  </table>
</td></tr>
</table>`;
const framedParsed = ReportTablesXlsx.parseHtmlTables(framedHtml);
assert(Boolean(framedParsed), "Ic ice tablo ayristirilamadi.");
assert(framedParsed.grid.length === 3, `Ic ice tabloda satir sayisi beklenmedik (dis cerceve satirlari sizmis olabilir): ${framedParsed.grid.length}`);
assert(
  framedParsed.grid[0].map((c) => c.text).join("|") === "NO|ALAN|SATIŞ",
  `Ic ice tabloda ilk baslik satiri yanlis (dis cerceve karismis olabilir): ${JSON.stringify(framedParsed.grid[0].map((c) => c.text))}`
);
assert(
  framedParsed.grid[1].find((c) => c.text === "TALEP EDİLEN")?.col === 2,
  `"TALEP EDİLEN" SATIŞ sutununun (col 2) altina hizalanmamis — KAYMA regresyonu: ${JSON.stringify(framedParsed.grid[1])}`
);
assert(
  framedParsed.grid[2].find((c) => c.text === "E1")?.col === 0,
  `Veri satiri (E1) NO sutununun (col 0) altina hizalanmamis: ${JSON.stringify(framedParsed.grid[2])}`
);

// --- 1c) Ince sutun izgarasi (birlesik sayfa genislik) birim testi --------
// Kullanici talebi: birlesik sayfalarda genislik gerektiren (az sutunlu,
// geniş yuzdeli) bir tablo, ayni sayfadaki dar/cok-sutunlu baska bir tablo
// icin gereken genisligi bozmasin — bunun icin ortak ince bir sutun
// izgarasi kurulup her tablo kendi sutununu bu izgarada birden fazla ince
// sutunu birlestirerek (merge) temsil eder.
const wideTableHtml = `<table><colgroup><col style="width:24%;"><col style="width:56%;"><col style="width:20%;"></colgroup>
<tbody><tr><td style="font-weight:700;">Kalem</td><td>Çok uzun bir açıklama metni buraya gelir</td><td style="text-align:right;">1.234.567,89</td></tr></tbody></table>`;
const narrowTableHtml = `<table><tbody><tr>${Array.from({ length: 12 }, (_, i) => `<td>C${i}</td>`).join("")}</tr></tbody></table>`;
const combinedFineGrid = ReportTablesXlsx.combineNamedGrids([
  { title: "Geniş Tablo", cellGrid: ReportTablesXlsx.parseHtmlTables(wideTableHtml) },
  { title: "Dar Tablo", cellGrid: ReportTablesXlsx.parseHtmlTables(narrowTableHtml) },
]);
assert(combinedFineGrid.colCount === ReportTablesXlsx.COMBINED_SHEET_FINE_COLUMNS, `Birleşik sayfa ince sütun sayısı beklenmedik: ${combinedFineGrid.colCount}`);
const wideRow = combinedFineGrid.grid[1]; // 0: baslik satiri, 1: veri satiri
assert(wideRow.length === 3, `Geniş tablo satırında 3 hücre bekleniyordu: ${wideRow.length}`);
assert(wideRow[0].col === 0 && wideRow[1].col === wideRow[0].col + wideRow[0].colspan, "Geniş tablo hücreleri ince ızgarada art arda dizilmemiş.");
assert(wideRow.reduce((sum, c) => sum + c.colspan, 0) === ReportTablesXlsx.COMBINED_SHEET_FINE_COLUMNS, "Geniş tablonun 3 sütunu toplamda tüm ince ızgarayı kaplamıyor.");
const narrowRow = combinedFineGrid.grid[4]; // 2: bos satir, 3: 2. tablo basligi, 4: veri satiri
assert(narrowRow.length === 12 && narrowRow.every((c) => c.colspan === ReportTablesXlsx.COMBINED_SHEET_FINE_COLUMNS / 12), "Dar tablonun 12 eşit sütunu ince ızgarada eşit dağılmamış.");
// Genislik hesaplaninca uzun metin TEK bir ince sutuna yigilmamali (spread edilmeli).
const fineGridStyleRegistry = ReportTablesXlsx.createStyleRegistry();
const fineGridSheetXml = ReportTablesXlsx.buildSheetXmlFromCellGrid(fineGridStyleRegistry, combinedFineGrid);
const fineGridColWidths = [...(fineGridSheetXml.match(/<cols>[\s\S]*?<\/cols>/)?.[0] || "").matchAll(/width="([\d.]+)"/g)].map((m) => Number(m[1]));
assert(Math.max(...fineGridColWidths) < 20, `Uzun metin tek bir ince sütuna yığılmış olabilir (maks genişlik: ${Math.max(...fineGridColWidths)}).`);

// --- 1d) Sutun genisligi ust siniri regresyon testi -----------------------
// Kullanici geri bildirimi: ilk surumde bazi sutunlar asiri genisti (ornegin
// uzun bir "Emsal Metni" paragrafi bir sutunu ~58 birime kadar genisletiyordu).
// wrapText acik oldugu icin genislik yerine metin sarilmali; ust sinir dar
// tutulmali (bkz. widthFromContent/widthFromPercent).
const longParagraph = "Ekspertize konu taşınmazla aynı binada, ara katta yer alan, 125 m2 olarak beyan edilen, 120 m2 olduğu düşünülen, 3+1 planında daire 4.850.000 TL bedelle satılıktır. Emsal, benzer konumda ve konu taşınmaza göre benzer iç özelliklere sahiptir. Pazarlık payı vardır.";
const longTextHtml = `<table><tbody><tr><td>Emsal Metni</td><td>${longParagraph}</td><td>x</td><td>y</td><td>z</td></tr></tbody></table>`;
const longTextCombined = ReportTablesXlsx.combineNamedGrids([{ title: "Emsal Matrisi", cellGrid: ReportTablesXlsx.parseHtmlTables(longTextHtml) }]);
const longTextRegistry = ReportTablesXlsx.createStyleRegistry();
const longTextSheetXml = ReportTablesXlsx.buildSheetXmlFromCellGrid(longTextRegistry, longTextCombined);
const longTextWidths = [...(longTextSheetXml.match(/<cols>[\s\S]*?<\/cols>/)?.[0] || "").matchAll(/width="([\d.]+)"/g)].map((m) => Number(m[1]));
assert(Math.max(...longTextWidths) <= 22, `Uzun paragraf metni sutun genisligini asiri artirmis (maks: ${Math.max(...longTextWidths)}, beklenen <= 22).`);

// --- 2) Tam disa aktarma calistir -----------------------------------------
// Kullanici talebi: Takyidat alt tablolari (Beyanlar/Serhler/Ipotekler) TEK
// sayfada alt alta; Degerleme ve Emsal tablolari da TEK sayfada alt alta.
const result = ReportTablesXlsx.exportAllTables();
assert(result.fileName === "test-raporu-tum-tablolar.xlsx", `dosya adi beklenmedik: ${result.fileName}`);
assert(capturedBlob && capturedBlob.blob, "downloadBlob cagirilmadi veya blob eksik.");
// Genel Bilgiler + Malikler (ayri) + Takyidat (Beyanlar/Serhler/Ipotekler birlesik)
// + Masraf Tablosu + Degerleme ve Emsaller (Emsal Kayitlari birlesik; digerleri
// bu Node ortaminda buildXxxWordHtml fonksiyonlari tanimli olmadigi icin bos gecilir)
assert(result.sheetNames.includes("Genel Bilgiler"), "Genel Bilgiler sayfasi yok.");
assert(result.sheetNames.includes("Malikler"), "Malikler sayfasi yok.");
assert(result.sheetNames.includes("Takyidat"), "Birlesik Takyidat sayfasi yok.");
assert(result.sheetNames.includes("Masraf Tablosu"), "Masraf Tablosu sayfasi yok.");
assert(result.sheetNames.includes("Değerleme ve Emsaller"), "Birlesik Degerleme ve Emsaller sayfasi yok.");
assert(!result.sheetNames.includes("Şerhler"), "Şerhler artik ayri bir sayfa olmamali (Takyidat'a tasindi).");
assert(!result.sheetNames.includes("Emsal kayıtları"), "Emsal kayitlari artik ayri bir sayfa olmamali (Değerleme ve Emsaller'e tasindi).");
assert(!result.sheetNames.includes("İncelenen belgeler"), "Tamamen bos 'İncelenen belgeler' tablosu icin sayfa olusturulmamali.");

async function verifyBlob() {
  const buf = await capturedBlob.blob.arrayBuffer();
  const entries = XlsxFill.readStoredZip(buf);
  const dec = new TextDecoder("utf-8");

  ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml"].forEach((name) => {
    assert(entries.some((entry) => entry.name === name), `zip girisi eksik: ${name}`);
  });

  const workbookXml = dec.decode(entries.find((entry) => entry.name === "xl/workbook.xml").bytes);
  const sheetNames = [...workbookXml.matchAll(/<sheet name="([^"]*)"/g)].map((m) => m[1]);
  const worksheetFileCount = entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).length;
  assert(sheetNames.length === worksheetFileCount, "workbook.xml sayfa sayisi ile worksheet dosya sayisi eslesmiyor.");
  assert(sheetNames.length === result.sheetNames.length, "workbook.xml sayfa listesi exportAllTables sonucuyla eslesmiyor.");

  const sheetXmlByName = new Map();
  sheetNames.forEach((name, index) => {
    const sheetEntry = entries.find((entry) => entry.name === `xl/worksheets/sheet${index + 1}.xml`);
    sheetXmlByName.set(name, dec.decode(sheetEntry.bytes));
  });

  // Regresyon: her <c> referansi bir sutun harfi ICERMELI (r="A1" gibi),
  // yalnizca satir numarasi degil (r="1" gibi — .col unutulursa olusan hata).
  sheetXmlByName.forEach((xml, name) => {
    const badRefs = [...xml.matchAll(/<c r="(\d+)"/g)];
    assert(badRefs.length === 0, `${name} sayfasinda sutun harfi olmayan hucre referansi var: ${badRefs.map((m) => m[0]).join(", ")}`);
  });

  const maliklerXml = sheetXmlByName.get("Malikler");
  assert(maliklerXml.includes('<c r="A1"') && maliklerXml.includes("<t>Malik</t>"), "Malikler basligi eksik/yanlis hucrede.");
  assert(maliklerXml.includes("<t>Ali Veli</t>"), "Malikler satiri (Ali Veli) eksik.");
  assert((maliklerXml.match(/<row /g) || []).length === 2, "Malikler sayfasinda bos satir dahil edilmis olabilir (2 satir bekleniyordu).");

  // Takyidat: yalnizca doldurulan "Şerhler" grubu (Beyanlar/Ipotekler bu
  // testte bos) baslik satiriyla birlikte gorunmeli, tablolar alt alta olmali.
  const takyidatXml = sheetXmlByName.get("Takyidat");
  assert(takyidatXml.includes("<t>Şerhler</t>"), "Takyidat sayfasinda 'Şerhler' alt tablo basligi eksik.");
  assert(takyidatXml.includes("<t>Haciz</t>") && takyidatXml.includes("<t>Test Açıklama</t>"), "Takyidat sayfasinda Şerhler satiri eksik.");
  assert(!takyidatXml.includes("<t>Beyanlar - Hak ve Mükellefiyetler</t>"), "Bos 'Beyanlar' alt tablosu icin baslik satiri eklenmemeli.");

  // Değerleme ve Emsaller: "Emsal Kayıtları" alt tablo basligiyla birlikte
  // gorunmeli (bu Node test ortaminda tek dolu olan alt tablo budur).
  const combinedXml = sheetXmlByName.get("Değerleme ve Emsaller");
  assert(combinedXml.includes("<t>Emsal Kayıtları</t>"), "Değerleme ve Emsaller sayfasinda 'Emsal Kayıtları' alt tablo basligi eksik.");
  assert(combinedXml.includes("<t>sahibinden.com</t>"), "Değerleme ve Emsaller sayfasinda emsal satiri eksik.");

  const genelXml = sheetXmlByName.get("Genel Bilgiler");
  assert(genelXml.includes("<t>Test Ekspertiz Raporu</t>") && genelXml.includes("<t>İş Adı</t>"), "Genel Bilgiler sayfasinda is adi eksik.");

  const masrafXml = sheetXmlByName.get("Masraf Tablosu");
  assert(masrafXml.includes("<t>Değerleme (Rapor) Ücreti</t>") && masrafXml.includes("<t>16.500,00 TL</t>"), "Masraf Tablosunda Degerleme Ucreti satiri eksik.");
  assert(masrafXml.includes("<t>Toplam Ücret</t>") && masrafXml.includes("<t>20.603,06 TL</t>"), "Masraf Tablosunda Toplam Ucret satiri eksik.");

  if (failures.length) {
    console.error("Tum tablolar Excel disa aktarma testi BASARISIZ:");
    failures.forEach((f) => console.error(" - " + f));
    process.exit(1);
  }
  console.log("Tum tablolar Excel disa aktarma testi tamam.");
}

verifyBlob().catch((error) => {
  console.error("Tum tablolar Excel disa aktarma testi BASARISIZ (istisna):", error);
  process.exit(1);
});
