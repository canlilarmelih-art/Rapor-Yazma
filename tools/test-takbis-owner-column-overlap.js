"use strict";

// TAKBİS Mülkiyet Bilgileri tablosunda çok uzun (birden fazla satıra sarılan)
// tüzel kişi Malik unvanı, aynı Y bandına denk gelen "Edinme Sebebi" sütununun
// sarma metniyle TEK satırda birleşebilir (pdf.js'in satır gruplama mantığı,
// bkz. app.js groupPdfItemsIntoRows). Bu durumda hem Malik ismi hem Edinme
// Sebebi metni birbirine karışıyordu — gerçek bir kullanıcı TAKBİS PDF'i ile
// tespit edildi (2026-08-12). Kök neden: `findTakbisAcquisitionToken` bu
// PDF'teki "6306 Sayılı Kanun Gereğince Kat Karşılığı Temlik İşlemi" gibi
// tanınmayan bir edinme sebebini YOK sayıp "kesir ile tarih arasındaki ham
// metni" edinme sebebi olarak kullanıyor (fallback) — sarma satırlarında bu
// ham metin, Malik sütununun devam metnini de içeriyordu.
//
// Düzeltme: `splitTakbisOwnerRowByColumn` (app.js), SN satırı DIŞINDAKİ
// (index > 0) satırlarda `row.items`'ın x konumuna bakarak Malik sütunu
// (x < OWNER_ROW_NAME_COLUMN_MAX_X) ile diğer sütunları (Edinme/Terkin
// Sebebi, x >=) ayırıyor — Malik/El Birliği/Hisse/Metrekare sütunları asla
// sarılmadığı için bu iki bölge arasında her zaman geniş bir boşluk var.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

assert.match(
  appSource,
  /const OWNER_ROW_NAME_COLUMN_MAX_X = \d+;/,
  "OWNER_ROW_NAME_COLUMN_MAX_X sabiti kaldırılmış/yeniden adlandırılmış görünüyor — bu test buna göre güncellenmeli.",
);

const functionNames = [
  "parseTakbisOwners",
  "getTakbisSectionRows",
  "getTakbisOwnerSectionRows",
  "findTakbisSectionBounds",
  "parseTakbisOwnersFromRows",
  "parseTakbisOwnersFromText",
  "mergeTakbisSameOwnerShares",
  "parseTakbisOwnerRows",
  "splitTakbisOwnerRowByColumn",
  "parseTakbisOwnerSegment",
  "findTakbisFraction",
  "findWrappedDenominatorPartInText",
  "findWrappedDenominatorPart",
  "findTakbisFractionFromOwnerRows",
  "buildTakbisOwnerNameFromRows",
  "cleanTakbisOwnerNameFragment",
  "cleanTakbisOwnerName",
  "cleanTakbisOwnerDisplayName",
  "removeTakbisParentTail",
  "cleanTakbisAcquisition",
  "extractTakbisAcquisitionReason",
  "findTakbisAcquisitionToken",
  "removeTakbisAcquisitionTokens",
  "escapeRegExp",
  "cleanTakbisValue",
  "normalizeSlash",
  "foldTurkish",
  "toTitleCaseTr",
  "sumOwnerFractionsBigInt",
  "gcdBigInt",
];

const sandboxSource = `
const OWNER_ROW_NAME_COLUMN_MAX_X = 400;
${functionNames.map(extractFunction).join("\n")}
return { parseTakbisOwners };
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

// Gerçek kullanıcı PDF'inden (2026-08-12, YKB-202600639) pdf.js
// groupPdfItemsIntoRows çıktısının aynısı — Mülkiyet Bilgileri bölümü.
function ownerRow(text, items, page = 2) {
  return { page, text, items: items.map(([str, x]) => ({ str, x, page })) };
}

const longNameRows = [
  ownerRow("MÜLKİYET BİLGİLERİ", []),
  ownerRow("(Hisse) Sistem Malik El Birliği Hisse Pay/ Metrekare Toplam Edinme Terkin Sebebi-", []),
  ownerRow(
    "639675906 (SN:8158434) GENÇ ÇELEBİLER - 1/1 - - 6306 Sayılı -",
    [
      ["639675906", 54.65], ["(SN:8158434) GENÇ ÇELEBİLER", 153.63], ["-", 381.34],
      ["1/1", 442.78], ["-", 519.34], ["-", 588.34], ["6306 Sayılı", 639.97], ["-", 756.34],
    ],
  ),
  ownerRow("SERAMİK GRANİT İNŞAAT TAAHHÜT Kanun", [["SERAMİK GRANİT İNŞAAT TAAHHÜT", 140.85], ["Kanun", 652.04]]),
  ownerRow("MÜHENDİSLİK MİMARLIK HİZMETLERİ Gereğince Kat", [["MÜHENDİSLİK MİMARLIK HİZMETLERİ", 134.99], ["Gereğince Kat", 631.63]]),
  ownerRow("SANAYİ VE TİCARET ANONİM ŞİRKETİ karşılığı Temlik", [["SANAYİ VE TİCARET ANONİM ŞİRKETİ", 136.66], ["karşılığı Temlik", 629.10]]),
  ownerRow("İşlemi", [["İşlemi", 652.91]]),
  ownerRow("03-02-2022", [["03-02-2022", 638.71]]),
  ownerRow("8623", [["8623", 655.51]]),
];

const [owner] = sandbox.parseTakbisOwners(longNameRows);
assert.ok(owner, "Uzun unvanlı malik ayrıştırılmalı.");
assert.equal(
  owner.name,
  "Genç Çelebiler Seramik Granit İnşaat Taahhüt Mühendislik Mimarlık Hizmetleri Sanayi Ve Ticaret Anonim Şirketi",
  "Malik adı, Edinme Sebebi sütununun sarma metniyle karışmadan TAM gelmeli.",
);
assert.equal(
  owner.acquisition,
  "6306 Sayılı Kanun Gereğince Kat karşılığı Temlik İşlemi",
  "Edinme sebebi, Malik sütununun sarma metni bulaşmadan doğru gelmeli.",
);
assert.equal(owner.share, "1/1", "Hisse payı etkilenmemeli.");
assert.equal(owner.date, "2022-02-03", "Tapu tarihi etkilenmemeli.");
assert.equal(owner.journalNo, "8623", "Yevmiye no etkilenmemeli.");
console.log("Uzun unvanli malik / Edinme Sebebi sutun karismasi duzeltmesi testi tamam.");

// Regresyon güvenlik ağı: kısa, tek satırlık bir malik adı (yaygın durum,
// gerçek kişi) sütun-bölme mantığından HİÇ etkilenmemeli.
const shortNameRows = [
  ownerRow("MÜLKİYET BİLGİLERİ", []),
  ownerRow(
    "123456789 (SN:1) MEHMET YILMAZ 1/1 - - Satış 12-01-2020 555",
    [
      ["123456789", 54.65], ["(SN:1) MEHMET YILMAZ", 153.63], ["1/1", 442.78],
      ["-", 519.34], ["-", 588.34], ["Satış", 639.97], ["12-01-2020", 638.71], ["555", 655.51],
    ],
  ),
];
const [shortOwner] = sandbox.parseTakbisOwners(shortNameRows);
assert.ok(shortOwner, "Kısa malik adı ayrıştırılmalı.");
assert.equal(shortOwner.name, "Mehmet Yılmaz", "Tek satırlık (kısa) malik adı değişmemeli.");
assert.equal(shortOwner.acquisition, "Satış", "Bilinen edinme sebebi token'ı değişmemeli.");
console.log("Kisa malik adi (tek satir) regresyon testi tamam.");
