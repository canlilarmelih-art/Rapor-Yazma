// Malikler Tablosu — çoklu taşınmazlı raporlarda TÜM taşınmazların
// malikleri (2026-09-08). Kullanıcı talebi: "çoklu raporda excel
// exportunda malikler bölümün sadece tek bir tapunun malik bölümü var
// burada Blok Bağımsız Bölüm no sütunları olmalı ve template kısmına bu
// şekilde aktarılmalı" — eskiden getMaliklerOwnerRows() YALNIZCA AKTİF
// taşınmazın (state.tables.title) malikini okuyordu; diğer taşınmazların
// malikleri (Excel/{{MALIKLERTABLO}} export'u DAHİL) hiç görünmüyordu.
//
// Bu test kapsamı:
//  1) Tekil rapor (1 taşınmaz): davranış AYNEN korunur — Blok/Bağımsız
//     Bölüm No sütunu YOK, eski 7 sütunlu yapı.
//  2) Çoklu rapor (2+ taşınmaz): buildAllTitleUnitsForSummaryTable ile
//     AYNI aktif/gölge okuma deseniyle TÜM taşınmazların malikleri
//     birleştirilir, HER satır KENDİ taşınmazının Blok/Bağımsız Bölüm
//     No etiketini taşır.
//  3) KRİTİK doğruluk kuralı: hisse yasal/mevcut durum değeri HER
//     taşınmazın KENDİ legalValue/currentValue'suna göre hesaplanır —
//     tek bir (aktif) taşınmazın toplam değerini TÜM maliklere uygulamak
//     YANLIŞ olurdu (farklı taşınmazlar farklı değerlere sahip olabilir).
//  4) Sahipsiz (owner satırı olmayan) bir taşınmaz sessizce atlanır.
//  5) buildMaliklerTableWordHtml() (→ {{MALIKLERTABLO}}) ve
//     buildMaliklerTableText() (ekran "Kopyala" butonu) her ikisi de
//     çoklu raporda Blok/Bağımsız Bölüm No sütunlarını + doğru TOPLAM
//     colspan'ını (7, tekilde 5) üretir.

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

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  "normalizeSlash",
  "splitFirst",
  "cleanTakbisValue",
  "dateIsoToTr",
  "parseValuationNumber",
  "getReportThemeToken",
  "escapeHtml",
  "getMaliklerOwnerRowsForUnit",
  "formatMaliklerShareValue",
  "isMaliklerTableMultiUnit",
  "parseOwnerShareComponent",
  "parseOwnerShareRatioValue",
  "buildMaliklerTableRowsForUnit",
  "buildMaliklerTableRows",
  "hasMaliklerTableData",
  "buildMaliklerTableText",
  "buildMaliklerTableWordHtml",
];

const sandboxSource = `
  let state = {};
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildAllTitleUnitsForSummaryTable,
    buildMaliklerTableRows, hasMaliklerTableData,
    buildMaliklerTableText, buildMaliklerTableWordHtml,
    isMaliklerTableMultiUnit,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(fields, ownerRows) {
  return { fields, tables: { title: ownerRows || [] } };
}

// --- 1) Tekil rapor: davranış AYNEN korunur (Blok/BB No sütunu YOK) ------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValue: "1000000", currentValue: "1200000", titleBlockName: "A", unitNo: "5" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2", c2: "Satış", c3: "2020-01-01", c4: "1234" }, { c0: "Ayşe Yılmaz", c1: "1/2", c2: "Satış", c3: "2020-01-01", c4: "1234" }] },
    titleUnits: [],
  });
  assert.ok(!fns.isMaliklerTableMultiUnit(), "Tekil raporda isMaliklerTableMultiUnit() false dönmeli.");
  const rows = fns.buildMaliklerTableRows();
  assert.equal(rows.length, 2, "2 malik satırı bekleniyordu.");
  assert.equal(rows[0].block, "", "Tekil raporda 'block' alanı BOŞ olmalı (sütun YOK).");
  assert.equal(rows[0].unitNo, "", "Tekil raporda 'unitNo' alanı BOŞ olmalı (sütun YOK).");
  assert.equal(rows[0].legalShareValue, 500000, "1. malikin hisse yasal değeri 1000000*1/2=500000 olmalı.");
  assert.equal(rows[1].currentShareValue, 600000, "2. malikin hisse mevcut değeri 1200000*1/2=600000 olmalı.");

  const html = fns.buildMaliklerTableWordHtml();
  assert.ok(!html.includes(">Blok<"), "Tekil raporda Word HTML'inde 'Blok' başlığı OLMAMALI.");
  assert.ok(!html.includes(">Bağımsız Bölüm No<"), "Tekil raporda Word HTML'inde 'Bağımsız Bölüm No' başlığı OLMAMALI.");
  assert.ok(html.includes('colspan="5"'), "Tekil raporda TOPLAM satırı colspan=5 olmalı.");
  assert.ok(!html.includes('colspan="7"'), "Tekil raporda colspan=7 OLMAMALI.");

  const text = fns.buildMaliklerTableText();
  assert.ok(!text.startsWith("Malik / Hissedar | Blok"), "Tekil raporda metin çıktısında Blok sütunu OLMAMALI.");
  console.log("Tekil rapor: Malikler Tablosu eski (Blok/BB No'suz) davranışı korudu testi tamam.");
}

// --- 2) Çoklu rapor: TÜM taşınmazların malikleri, KENDİ Blok/BB No + -----
// KENDİ legalValue/currentValue'suna göre hesaplanmış hisse değeriyle.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    // Aktif taşınmaz (index 0): legalValue farklı, tek malik (Tam hisse).
    fields: { legalValue: "1000000", currentValue: "1200000", titleBlockName: "A", unitNo: "5" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "Tam", c2: "Satış", c3: "2020-01-01", c4: "1234" }] },
    titleUnits: [
      // İkinci taşınmaz: FARKLI legalValue/currentValue, 2 hissedar.
      unit({ legalValue: "2000000", currentValue: "2400000", titleBlockName: "B", unitNo: "8" }, [
        { c0: "Mehmet Kaya", c1: "1/2", c2: "Miras", c3: "2021-05-10", c4: "5678" },
        { c0: "Fatma Kaya", c1: "1/2", c2: "Miras", c3: "2021-05-10", c4: "5678" },
      ]),
      // Üçüncü taşınmaz: HİÇ malik girilmemiş — sessizce ATLANMALI.
      unit({ legalValue: "500000", currentValue: "600000", titleBlockName: "C", unitNo: "1" }, []),
    ],
  });
  assert.ok(fns.isMaliklerTableMultiUnit(), "3 taşınmazlı raporda isMaliklerTableMultiUnit() true dönmeli.");
  const rows = fns.buildMaliklerTableRows();
  assert.equal(rows.length, 3, `Toplam 3 malik satırı (1+2+0) bekleniyordu, bulunan: ${rows.length}`);

  // 1. taşınmazın maliki (Ahmet Yılmaz, Blok A, BB No 5, Tam hisse).
  assert.equal(rows[0].malik, "AHMET YILMAZ");
  assert.equal(rows[0].block, "A", "1. taşınmazın maliki KENDİ Blok'unu (A) taşımalı.");
  assert.equal(rows[0].unitNo, "5", "1. taşınmazın maliki KENDİ Bağımsız Bölüm No'sunu (5) taşımalı.");
  assert.equal(rows[0].legalShareValue, 1000000, "Tam hisse -> 1. taşınmazın TÜM legalValue'su (1000000).");
  assert.equal(rows[0].currentShareValue, 1200000, "Tam hisse -> 1. taşınmazın TÜM currentValue'su (1200000).");

  // 2. taşınmazın malikleri (Mehmet/Fatma Kaya, Blok B, BB No 8, yarı yarıya).
  assert.equal(rows[1].malik, "MEHMET KAYA");
  assert.equal(rows[1].block, "B", "2. taşınmazın malikleri KENDİ Blok'unu (B) taşımalı.");
  assert.equal(rows[1].unitNo, "8", "2. taşınmazın malikleri KENDİ Bağımsız Bölüm No'sunu (8) taşımalı.");
  // KRİTİK: 2. taşınmazın KENDİ legalValue'su (2000000) kullanılmalı — 1.
  // taşınmazın (aktif, 1000000) DEĞİL. Yanlış uygulanırsa 1000000*1/2=500000
  // çıkardı, doğrusu 2000000*1/2=1000000.
  assert.equal(rows[1].legalShareValue, 1000000, "2. taşınmazın maliki KENDİ legalValue'sundan (2000000) hesaplanmalı: 2000000*1/2=1000000.");
  assert.equal(rows[1].currentShareValue, 1200000, "2. taşınmazın maliki KENDİ currentValue'sundan (2400000) hesaplanmalı: 2400000*1/2=1200000.");
  assert.equal(rows[2].malik, "FATMA KAYA");
  assert.equal(rows[2].block, "B");
  assert.equal(rows[2].legalShareValue, 1000000);

  // Word HTML (→ {{MALIKLERTABLO}}) Blok/Bağımsız Bölüm No başlıklarını
  // ve colspan=7 TOPLAM satırını içermeli.
  const html = fns.buildMaliklerTableWordHtml();
  assert.ok(html.includes(">Blok<"), "Çoklu raporda Word HTML'inde 'Blok' başlığı OLMALI.");
  assert.ok(html.includes(">Bağımsız Bölüm No<"), "Çoklu raporda Word HTML'inde 'Bağımsız Bölüm No' başlığı OLMALI.");
  assert.ok(html.includes('colspan="7"'), "Çoklu raporda TOPLAM satırı colspan=7 olmalı (5+Blok+BB No).");
  assert.ok(!html.includes('colspan="5"'), "Çoklu raporda colspan=5 OLMAMALI (tekil kalıntısı sızmış olabilir).");
  // Her malik satırının KENDİ Blok/BB No değeri doğru hücrede görünmeli.
  const bIdx = html.indexOf(">B<");
  const idx8 = html.indexOf(">8<");
  assert.ok(bIdx !== -1 && idx8 !== -1 && bIdx < idx8, "2. taşınmazın Blok (B) ve Bağımsız Bölüm No (8) hücreleri HTML'de doğru sırada bulunamadı.");

  const text = fns.buildMaliklerTableText();
  assert.ok(text.startsWith("Malik / Hissedar | Blok | Bağımsız Bölüm No |"), `Çoklu raporda metin çıktısı Blok/BB No ile başlamalı, bulunan başlık: ${text.split("\n")[0]}`);
  assert.ok(text.includes("MEHMET KAYA | B | 8 |"), "Metin çıktısında 2. taşınmazın maliki KENDİ Blok/BB No'suyla görünmeli.");
  console.log("Coklu rapor: Malikler Tablosu TUM tasinmazlarin maliklerini KENDI Blok/BB No + KENDI legalValue/currentValue'suyla birlestirdi testi tamam.");
}

// --- 3) Hiçbir taşınmazda malik yoksa boş dönmeli (regresyon) ------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValue: "1000000", currentValue: "1200000" },
    tables: { title: [] },
    titleUnits: [unit({ legalValue: "500000", currentValue: "600000" }, [])],
  });
  assert.equal(fns.buildMaliklerTableRows().length, 0, "Hiçbir taşınmazda malik yoksa 0 satır dönmeli.");
  assert.ok(!fns.hasMaliklerTableData(), "hasMaliklerTableData() false dönmeli.");
  assert.equal(fns.buildMaliklerTableWordHtml(), "", "Malik yokken Word HTML boş string dönmeli.");
  assert.equal(fns.buildMaliklerTableText(), "", "Malik yokken metin çıktısı boş string dönmeli.");
  console.log("Hicbir tasinmazda malik yokken bos donme regresyon testi tamam.");
}

console.log("Malikler Tablosu coklu tasinmaz testleri basarili.");
