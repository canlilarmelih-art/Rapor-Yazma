const { parseEkbFields } = require("../src/parsers/ekb-parser");
const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  assert(
    actual === expected,
    `${label}: beklenen "${expected}", gelen "${actual}"`
  );
}

function main() {
  const sampleText = `
    Enerji Kimlik Belgesi
    Belge Numarası: M221613B8E360
    Veriliş Tarihi 03.01.2020
    Son Geçerlilik Tarihi 03.01.2030
    Enerji Performans Sınıfı C
    Sera Gazı Emisyon Sınıfı C
  `;

  const parsed = parseEkbFields(sampleText);
  assertEqual(parsed.ekbDocumentNo, "M221613B8E360", "EKB belge no");
  assertEqual(parsed.ekbIssueDate, "2020-01-03", "EKB veriliş tarihi");
  assertEqual(parsed.ekbValidUntil, "2030-01-03", "EKB geçerlilik tarihi");
  assertEqual(parsed.ekbEnergyClass, "C", "Enerji sınıfı");
  assertEqual(parsed.ekbEmissionClass, "C", "Emisyon sınıfı");

  const tenYearOnlyText = `
    Rüzgar Enerjisi
    M221613B8E360
    06.03.2026
    06.03.2036
    0-39 40 40-79 80 B
    0-39 40 40-79 80 C
  `;

  const tenYearParsed = parseEkbFields(tenYearOnlyText);
  assertEqual(tenYearParsed.ekbIssueDate, "2026-03-06", "10 yıl kuralı veriliş tarihi");
  assertEqual(tenYearParsed.ekbValidUntil, "2036-03-06", "10 yıl kuralı geçerlilik tarihi");
  assertEqual(tenYearParsed.ekbEnergyClass, "B", "Grafik enerji sınıfı");
  assertEqual(tenYearParsed.ekbEmissionClass, "C", "Grafik emisyon sınıfı");

  const graphRatioOnlyText = `
    0 - 39 0 - 39
    40 - 79 40 - 79
    80 - 99 88 80 - 99 145
    100 - 119 100 - 119
    120 - 139 120 - 139
    140 - 174 140 - 174
    175 - 175 -
  `;
  const graphRatioOnlyParsed = parseEkbFields(graphRatioOnlyText);
  assertEqual(graphRatioOnlyParsed.ekbEnergyClass, "C", "Grafik oranindan enerji sinifi");
  assertEqual(graphRatioOnlyParsed.ekbEmissionClass, "F", "Grafik oranindan emisyon sinifi");

  const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  assert(
    appSource.includes('{ key: "ekbRawText", label: "EKB Okuma Ham Verisi", type: "textarea", wide: true, readOnly: true }'),
    "EKB okuma ham verisi Aciklamalar bolumunde salt okunur alan olarak bulunmuyor."
  );
  assert(
    appSource.includes("state.fields.ekbRawText = text;"),
    "Yuklenen EKB metni Aciklamalar bolumundeki ham veri alanina aktarilmiyor."
  );
  assert(
    appSource.includes('const documentNo = toTitleFieldUppercase(state.fields.ekbDocumentNo || "").trim();'),
    "EKB açıklamasında belge no büyük harfe dönüştürülmüyor."
  );
  assert(
    appSource.includes('enerji performans sınıfı ${energyClass} sınıfıdır.'),
    "EKB enerji sınıfı açıklaması tırnaksız sınıf formatında oluşturulmuyor."
  );

  console.log("EKB parser modul testi tamam.");
}

main();
