"use strict";

/*
  "Tüm Tabloları Excel Olarak İndir" regresyon testi (tarayıcısız).

  src/exports/xlsx-fill.js (zip/crc32) ve src/exports/report-tables-xlsx.js
  modüllerini Node'da minimal window/document/state/sections stub'larıyla
  çalıştırır. exportAllTables()'in ürettiği .xlsx blob'unu tekrar
  readStoredZip ile açıp: workbook.xml'deki sayfa sayısının beklenenle
  eştiğini, her sayfa XML'inin geçerli OOXML olduğunu ve girilen tablo
  verilerinin (Malikler/Şerhler/Emsaller) doğru sayfada, doğru hücrelerde
  çıktığını doğrular.
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
  },
  tables: {
    title: [
      { c0: "Ali Veli", c1: "1/1", c2: "Satış", c3: "01.01.2026", c4: "123" },
      {}, // bos satir dahil edilmemeli
    ],
    documents: [],
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

const reportTablesSrc = fs.readFileSync(path.join(appDir, "src", "exports", "report-tables-xlsx.js"), "utf8");
// eslint-disable-next-line no-eval
eval(reportTablesSrc);
const ReportTablesXlsx = global.window.RaporReportTablesXlsx;
assert(ReportTablesXlsx && typeof ReportTablesXlsx.exportAllTables === "function", "RaporReportTablesXlsx yuklenmedi.");

const result = ReportTablesXlsx.exportAllTables();
assert(result.fileName === "test-raporu-tum-tablolar.xlsx", `dosya adi beklenmedik: ${result.fileName}`);
// Genel Bilgiler + Malikler + Beyanlar(bos, atlanir mi?) + Serhler + Ipotekler(bos) + Incelenen belgeler(bos) + Emsaller
assert(result.sheetCount === 7, `sayfa sayisi beklenmedik: ${result.sheetCount}`);
assert(capturedBlob && capturedBlob.blob, "downloadBlob cagirilmadi veya blob eksik.");

async function verifyBlob() {
  const buf = await capturedBlob.blob.arrayBuffer();
  const entries = XlsxFill.readStoredZip(buf);
  const dec = new TextDecoder("utf-8");

  const requiredEntries = [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/worksheets/sheet1.xml",
  ];
  requiredEntries.forEach((name) => {
    assert(entries.some((entry) => entry.name === name), `zip girisi eksik: ${name}`);
  });

  const workbookXml = dec.decode(entries.find((entry) => entry.name === "xl/workbook.xml").bytes);
  const sheetNames = [...workbookXml.matchAll(/<sheet name="([^"]*)"/g)].map((m) => m[1]);
  assert(sheetNames.includes("Genel Bilgiler"), "Genel Bilgiler sayfasi workbook.xml'de yok.");
  assert(sheetNames.includes("Malikler"), "Malikler sayfasi workbook.xml'de yok.");
  assert(sheetNames.includes("Şerhler"), "Şerhler sayfasi workbook.xml'de yok.");
  assert(sheetNames.includes("Emsal kayıtları"), "Emsal kayitlari sayfasi workbook.xml'de yok.");
  assert(sheetNames.length === entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).length,
    "workbook.xml sayfa sayisi ile worksheet dosya sayisi eslesmiyor.");

  const sheetXmlByName = new Map();
  sheetNames.forEach((name, index) => {
    const sheetEntry = entries.find((entry) => entry.name === `xl/worksheets/sheet${index + 1}.xml`);
    sheetXmlByName.set(name, dec.decode(sheetEntry.bytes));
  });

  const maliklerXml = sheetXmlByName.get("Malikler");
  assert(maliklerXml.includes("<t>Malik</t>"), "Malikler basligi eksik.");
  assert(maliklerXml.includes("<t>Ali Veli</t>"), "Malikler satiri (Ali Veli) eksik.");
  assert((maliklerXml.match(/<row /g) || []).length === 2, "Malikler sayfasinda bos satir dahil edilmis olabilir (2 satir bekleniyordu: baslik+1 dolu satir).");

  const serhlerXml = sheetXmlByName.get("Şerhler");
  assert(serhlerXml.includes("<t>Haciz</t>") && serhlerXml.includes("<t>Test Açıklama</t>"), "Şerhler satiri eksik.");

  const emsalXml = sheetXmlByName.get("Emsal kayıtları");
  assert(emsalXml.includes("<t>sahibinden.com</t>"), "Emsal satiri eksik.");

  const genelXml = sheetXmlByName.get("Genel Bilgiler");
  assert(genelXml.includes("<t>Test Ekspertiz Raporu</t>") && genelXml.includes("<t>İş Adı</t>"), "Genel Bilgiler sayfasinda is adi eksik.");

  const ipotekEntry = [...sheetXmlByName.entries()].find(([name]) => name === "İpotekler");
  assert(ipotekEntry && !/<row r="2"/.test(ipotekEntry[1]), "Bos Ipotekler sayfasinda beklenmedik veri satiri var.");

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
