"use strict";

// Kullanıcı talebi (2026-08-31, PDF örneği + ekran görüntüsüyle): "ada
// parseli ayrı çoklu taleplerde takyidat excel export tablosu daha okunaklı
// ve kullanıcı dostu olmalı şerh türü tarih yevmiye no kısıtlı malik var
// ise haciz tutarı kapsadığı ada parsel sütunları bulunmalı" — kullanıcı
// TEK taşınmazlı raporlarda ZATEN var olan "Beyanlar/Şerhler/İpotekler"
// tablosunun (Şerh Türü/Açıklama/Haciz Tutarı/Tarih/Yevmiye No/Kısıtlı
// Malik sütunlu) AYNI düzeninin çoklu taleplerde de korunmasını, yalnızca
// "hangi ada/parseli kapsadığı" bilgisinin eklenmesini istedi.
//
// KÖK NEDEN: "Tüm Tablolar" Excel export'undaki "Takyidat" sayfası
// (report-tables-xlsx.js, rawGridCellGridFor) yalnızca AKTİF taşınmazın
// ham ızgarasını okuyordu — diğer 8 "Taşınmazlar ... Özeti" sayfasının
// AKSİNE, Çoklu Talep'te (özellikle farklı ada/parsel) diğer taşınmazların
// şerh/beyan/ipotek kayıtları Excel'e HİÇ YANSIMIYORDU.
//
// Bu test kapsamı:
//  1) buildTakyidatCategoryUnitsSummaryTableHtml/buildTakyidat*UnitsSummaryWordTableHtml:
//     tekil raporda (1 taşınmaz) boş string dönmeli (rawGridCellGridFor
//     fallback'i tetiklemesi için, bkz. report-tables-xlsx.js).
//  2) 2+ taşınmazlı, FARKLI ada/parselli bir raporda: her kategori kendi
//     MEVCUT sütunlarını (Şerh Türü/Açıklama/Haciz Tutarı/Tarih/Yevmiye
//     No/Kısıtlı Malik gibi) korur, sona "Ada / Parsel" sütunu eklenir,
//     ve bu sütun formatTitleUnitEncumbranceReference'ın ürettiği "166
//     ada 7 parsel" biçimli metni taşır (ZATEN test edilmiş
//     getMultiTitleUnitEncumbranceRows yeniden kullanılıyor, yeni bir
//     gruplama mantığı YAZILMADI).
//  3) Aynı yevmiye no'lu bir kayıt 2 taşınmazda da geçiyorsa (ortak kayıt)
//     "Ada / Parsel" sütunu HER İKİ taşınmazın ada/parselini VİRGÜLLE
//     ayırarak listeler (REGRESYON, mevcut groupEncumbranceRowsAcrossTitleUnits
//     davranışı korunuyor).

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
    if (appSource[cursor] === "(") parenDepth += 1;
    if (appSource[cursor] === ")") {
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

function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit dizi bulunamadı: ${name}`);
  const end = appSource.indexOf("\n];", start);
  assert(end > start, `Sabit dizi kapanmadı: ${name}`);
  return appSource.slice(start, end + 3);
}

const functionNames = [
  "encumbranceCleanText",
  "formatWordCell",
  "escapeHtml",
  "buildCompactReportWordTableHtml",
  "getEncumbranceRowJournalNo",
  "getEncumbranceRowJournalNoColumn",
  "buildEncumbranceRowContentKey",
  "formatTitleUnitEncumbranceReference",
  "groupEncumbranceRowsAcrossTitleUnits",
  "getMultiTitleUnitEncumbranceRows",
  "hasMeaningfulEncumbranceTableRow",
  "buildTakyidatCategoryUnitsSummaryTableHtml",
  "buildTakyidatDeclarationsUnitsSummaryWordTableHtml",
  "buildTakyidatAnnotationsUnitsSummaryWordTableHtml",
  "buildTakyidatMortgagesUnitsSummaryWordTableHtml",
];

const sandboxSource = `
let state = null;
function getTitleUnitCount() { return state.titleUnits.length + 1; }
function getTitleUnitFieldsForLabel(index) {
  return index === 0 ? state.fields : state.titleUnits[index - 1].fields;
}
function getTitleUnitTablesForLabel(index) {
  return index === 0 ? state.tables : state.titleUnits[index - 1].tables;
}
function getFilledEncumbranceRows(tableKey) {
  return (state.tables[tableKey] || []).filter((row) => hasMeaningfulEncumbranceTableRow(tableKey, row));
}
${extractConstArray("encumbranceReportTables")}
const encumbranceReportColumns = ["Tür", "Açıklama", "Tarih", "Yevmiye No", "Kısıtlı Malik"];
${functionNames.map(extractFunction).join("\n")}
return {
  setState: (s) => { state = s; },
  buildTakyidatDeclarationsUnitsSummaryWordTableHtml,
  buildTakyidatAnnotationsUnitsSummaryWordTableHtml,
  buildTakyidatMortgagesUnitsSummaryWordTableHtml,
};
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// Basit HTML tablo ayrıştırıcı — başlık satırını ve gövde satırlarını
// (hücre metinlerini) çıkarır. Gerçek Excel dönüşümü report-tables-xlsx.js'in
// parseHtmlTables'ı ile yapılır (bkz. test-report-tables-xlsx.js), burada
// yalnızca app.js tarafının ÜRETTİĞİ ham HTML'in sütun/satır İÇERİĞİ
// doğrulanıyor.
function parseSimpleTable(html) {
  if (!html) return null;
  // NOT: `<th(?:\s[^>]*)?>` — yalnızca `<th` sonrası boşluk/`>` gelirse
  // eşleşir; aksi halde `<thead>` de "th" ile başladığından YANLIŞLIKLA
  // eşleşip başlık ayrıştırmasını bozardı (regexteki `[^>]*` "ead" kısmını
  // da kapsardı).
  const headerMatches = [...html.matchAll(/<th(?:\s[^>]*)?>([\s\S]*?)<\/th>/g)].map((m) => m[1].trim());
  const rowsHtml = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).slice(1); // ilk <tr> başlık
  const rows = rowsHtml.map((rowHtml) => [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].trim()));
  return { headers: headerMatches, rows };
}

// --- 1) Tekil taşınmazlı raporda (1 taşınmaz) HER ÜÇ fonksiyon da boş -----
// string dönmeli — report-tables-xlsx.js'te generatedCellGridFor bunu null
// grid olarak yorumlayıp ESKİ rawGridCellGridFor (yalnızca aktif taşınmazın
// ham ızgarası) davranışına düşer; kullanıcının paylaştığı TEK taşınmazlı
// örnek ekran görüntüsündeki düzen bu sayede AYNEN korunur.
{
  fns.setState({
    fields: { blockNo: "166", parcelNo: "7" },
    tables: {
      encumbranceDeclarations: [{ c0: "Beyan", c1: "Test", c2: "01.01.2026", c3: "100", c4: "" }],
      encumbranceAnnotations: [{ c0: "İcrai Haciz", c1: "Test açıklama", c2: "37.995,32 TL", c3: "27.12.2021", c4: "3694", c5: "" }],
      encumbranceMortgages: [],
    },
    titleUnits: [],
  });
  assert.equal(fns.buildTakyidatDeclarationsUnitsSummaryWordTableHtml(), "", "Tekil raporda Beyanlar HTML'i BOŞ olmalı.");
  assert.equal(fns.buildTakyidatAnnotationsUnitsSummaryWordTableHtml(), "", "Tekil raporda Şerhler HTML'i BOŞ olmalı.");
  assert.equal(fns.buildTakyidatMortgagesUnitsSummaryWordTableHtml(), "", "Tekil raporda İpotekler HTML'i BOŞ olmalı.");
  console.log("Tekil tasinmazda buildTakyidat*UnitsSummaryWordTableHtml BOS donus (rawGrid fallback) testi tamam.");
}

// --- 2) 2 taşınmazlı, FARKLI ada/parselli rapor: Şerhler tablosu ----------
// mevcut sütunları (Şerh Türü/Açıklama/Haciz Tutarı/Tarih/Yevmiye No/
// Kısıtlı Malik) korur, sona "Ada / Parsel" eklenir ve doğru ada/parsel
// metnini taşır (kullanıcının PDF örneğindeki "166/7" ve "1955/3" gibi
// FARKLI parseller).
{
  fns.setState({
    fields: { blockNo: "166", parcelNo: "7", titleBlockName: "", unitNo: "" },
    tables: {
      encumbranceDeclarations: [],
      encumbranceAnnotations: [
        { c0: "İcrai Haciz", c1: "Musa UĞUR lehine haciz işlenmiştir.", c2: "37.995,32 TL", c3: "27.12.2021", c4: "3694", c5: "" },
      ],
      encumbranceMortgages: [],
    },
    titleUnits: [
      {
        fields: { blockNo: "1955", parcelNo: "3", titleBlockName: "", unitNo: "" },
        tables: {
          encumbranceDeclarations: [],
          encumbranceAnnotations: [
            { c0: "İhtiyati Haciz", c1: "Vergül Erdem aleyhine haciz.", c2: "5.213,00 TL", c3: "05.11.2011", c4: "5213", c5: "Vergül Erdem" },
          ],
          encumbranceMortgages: [],
        },
      },
    ],
  });
  const html = fns.buildTakyidatAnnotationsUnitsSummaryWordTableHtml();
  assert.ok(html, "2 farkli ada/parselli raporda Serhler HTML'i DOLU donmeli.");
  const parsed = parseSimpleTable(html);
  assert.deepEqual(
    parsed.headers,
    ["Şerh Türü", "Açıklama", "Haciz Tutarı", "Tarih", "Yevmiye No", "Kısıtlı Malik", "Ada / Parsel"],
    `Basliklar mevcut Serhler duzenini korumali + sona "Ada / Parsel" eklemeli, bulunan: ${parsed.headers.join(", ")}`,
  );
  assert.equal(parsed.rows.length, 2, "2 FARKLI yevmiyeli kayit -> 2 ayri satir beklenir.");
  const row166 = parsed.rows.find((row) => row[4] === "3694");
  assert.ok(row166, "166/7 parselinin haciz kaydi bulunamadi.");
  assert.equal(row166[0], "İcrai Haciz");
  assert.equal(row166[2], "37.995,32 TL", "Haciz Tutari sutunu korunmali.");
  assert.equal(row166[6], "166 ada 7 parsel", `"Ada / Parsel" sutunu dogru taşınmazi gostermeli, bulunan: ${row166[6]}`);
  const row1955 = parsed.rows.find((row) => row[4] === "5213");
  assert.ok(row1955, "1955/3 parselinin haciz kaydi bulunamadi.");
  assert.equal(row1955[5], "Vergül Erdem", "Kisitli Malik sutunu korunmali.");
  assert.equal(row1955[6], "1955 ada 3 parsel", `"Ada / Parsel" sutunu dogru taşınmazi gostermeli, bulunan: ${row1955[6]}`);
  console.log("2 FARKLI ada/parselli raporda Serhler ozet tablosu (Ada/Parsel sutunu DAHIL) testi tamam.");
}

// --- 3) REGRESYON: aynı yevmiye no'lu (ortak) kayıt 2 taşınmazda da ------
// geçiyorsa "Ada / Parsel" sütunu HER İKİSİNİ de virgülle ayırarak listeler
// — getMultiTitleUnitEncumbranceRows'un ZATEN test edilmiş gruplama
// mantığı burada da AYNEN çalışıyor (yeni bir mantık YAZILMADI).
{
  fns.setState({
    fields: { blockNo: "166", parcelNo: "7" },
    tables: {
      encumbranceDeclarations: [],
      encumbranceAnnotations: [
        { c0: "Kamu Haczi", c1: "Ortak haciz kaydı.", c2: "10.000,00 TL", c3: "01.01.2026", c4: "999", c5: "" },
      ],
      encumbranceMortgages: [],
    },
    titleUnits: [
      {
        fields: { blockNo: "1955", parcelNo: "3" },
        tables: {
          encumbranceDeclarations: [],
          encumbranceAnnotations: [
            { c0: "Kamu Haczi", c1: "Ortak haciz kaydı.", c2: "10.000,00 TL", c3: "01.01.2026", c4: "999", c5: "" },
          ],
          encumbranceMortgages: [],
        },
      },
    ],
  });
  const html = fns.buildTakyidatAnnotationsUnitsSummaryWordTableHtml();
  const parsed = parseSimpleTable(html);
  assert.equal(parsed.rows.length, 1, "Ayni yevmiye no'lu (999) kayit TEK satirda birlesmeli.");
  assert.equal(
    parsed.rows[0][6],
    "166 ada 7 parsel, 1955 ada 3 parsel",
    `Ortak kayit HER IKI ada/parseli de listelemeli, bulunan: ${parsed.rows[0][6]}`,
  );
  console.log("Ortak (ayni yevmiyeli) kaydin Ada/Parsel sutununda BIRLESIK gosterilmesi REGRESYON testi tamam.");
}

// --- 4) Beyanlar tablosu: haciz-tutari-benzeri bir sutunu YOK, ama Ada/ ---
// Parsel sutunu ayni sekilde eklenmeli (encumbranceReportColumns fallback'i).
// AYRICA (2026-09-01, kullanici bulgusu): kategori GENEL OLARAK dolu iken
// (en az 1 tasinmazda kayit varken) kaydi OLMAYAN diger tasinmaz(lar)
// SESSIZCE atlanmamali - "Herhangi bir kayit bulunmamaktadir." satiriyla
// ACIKCA temsil edilmeli.
{
  fns.setState({
    fields: { blockNo: "166", parcelNo: "7" },
    tables: {
      encumbranceDeclarations: [{ c0: "Beyan", c1: "Yönetim Planı Belirtilmesi", c2: "08.08.2006", c3: "", c4: "" }],
      encumbranceAnnotations: [],
      encumbranceMortgages: [],
    },
    titleUnits: [
      {
        fields: { blockNo: "1955", parcelNo: "3" },
        tables: { encumbranceDeclarations: [], encumbranceAnnotations: [], encumbranceMortgages: [] },
      },
    ],
  });
  const html = fns.buildTakyidatDeclarationsUnitsSummaryWordTableHtml();
  assert.ok(html, "Beyanlar HTML'i DOLU donmeli.");
  const parsed = parseSimpleTable(html);
  assert.deepEqual(parsed.headers, ["Tür", "Açıklama", "Tarih", "Yevmiye No", "Kısıtlı Malik", "Ada / Parsel"]);
  assert.equal(parsed.rows.length, 2, `Gercek kayit (166/7) + bos tasinmaz icin "kayit yok" satiri (1955/3) = 2 satir beklenir, bulunan: ${JSON.stringify(parsed.rows)}`);
  const realRow = parsed.rows.find((row) => row[5] === "166 ada 7 parsel");
  assert.ok(realRow, "166/7 parselinin gercek beyan kaydi bulunamadi.");
  assert.equal(realRow[1], "Yönetim Planı Belirtilmesi");
  const emptyRow = parsed.rows.find((row) => row[5] === "1955 ada 3 parsel");
  assert.ok(emptyRow, `Bos tasinmaz (1955/3) icin "kayit yok" satiri bulunamadi, bulunan: ${JSON.stringify(parsed.rows)}`);
  assert.equal(emptyRow[0], "Herhangi bir kayıt bulunmamaktadır.", `Bos tasinmazin ilk sutununda "Herhangi bir kayit bulunmamaktadir." metni olmali, bulunan: ${emptyRow[0]}`);
  assert.deepEqual(emptyRow.slice(1, 5), ["-", "-", "-", "-"], "Bos tasinmaz satirinin diger sutunlari '-' olmali.");
  console.log("Beyanlar ozet tablosu (Ada/Parsel sutunu + bos tasinmaz icin 'kayit yok' satiri) testi tamam.");
}

// --- 5) REGRESYON (2026-09-01, kullanıcının gerçek 7 taşınmazlı raporuyla) -
// "bence olmamış tüm takyidatlar tüm tapular üzerine olan tek sayfada yer
// almalı" — kullanıcı, indirdiği Excel'in Şerhler tablosunda YALNIZCA 3/7
// taşınmazın (1955/3, 1135/7, 1955/4) göründüğünü, diğer 4'ünün (166/7,
// 1605/4, 166/17, 1141/3 — gerçekten hiç şerh kaydı olmayan taşınmazlar)
// HİÇ görünmediğini fark etti. 7 taşınmazlı, 3'ünde gerçek kayıt olan bir
// senaryoda TÜM 7 taşınmazın (4'ü "kayıt yok" olarak) tabloda temsil
// edildiği doğrulanıyor.
{
  const noRecordUnit = () => ({ tables: { encumbranceDeclarations: [], encumbranceAnnotations: [], encumbranceMortgages: [] } });
  fns.setState({
    fields: { blockNo: "166", parcelNo: "7" }, // taşınmaz 1: kayıt YOK
    tables: { encumbranceDeclarations: [], encumbranceAnnotations: [], encumbranceMortgages: [] },
    titleUnits: [
      { fields: { blockNo: "1605", parcelNo: "4" }, ...noRecordUnit() }, // taşınmaz 2: kayıt YOK
      {
        fields: { blockNo: "1955", parcelNo: "3" }, // taşınmaz 3: kayıt VAR
        tables: {
          encumbranceDeclarations: [],
          encumbranceAnnotations: [
            { c0: "İcrai Haciz", c1: "Musa Uğur lehine haciz.", c2: "37.995,32 TL", c3: "27.12.2021", c4: "3694", c5: "" },
          ],
          encumbranceMortgages: [],
        },
      },
      {
        fields: { blockNo: "1135", parcelNo: "7" }, // taşınmaz 4: kayıt VAR
        tables: {
          encumbranceDeclarations: [],
          encumbranceAnnotations: [
            { c0: "Serh", c1: "Kamulaştırma şerhi.", c2: "", c3: "26.08.2026", c4: "3062", c5: "Müzeyyen Dönmez" },
          ],
          encumbranceMortgages: [],
        },
      },
      {
        fields: { blockNo: "1955", parcelNo: "4" }, // taşınmaz 5: kayıt VAR
        tables: {
          encumbranceDeclarations: [],
          encumbranceAnnotations: [
            { c0: "İcrai Haciz", c1: "Ayrı bir haciz kaydı.", c2: "5.000,00 TL", c3: "01.01.2026", c4: "999", c5: "" },
          ],
          encumbranceMortgages: [],
        },
      },
      { fields: { blockNo: "166", parcelNo: "17" }, ...noRecordUnit() }, // taşınmaz 6: kayıt YOK
      { fields: { blockNo: "1141", parcelNo: "3" }, ...noRecordUnit() }, // taşınmaz 7: kayıt YOK
    ],
  });
  const html = fns.buildTakyidatAnnotationsUnitsSummaryWordTableHtml();
  assert.ok(html, "Serhler HTML'i DOLU donmeli.");
  const parsed = parseSimpleTable(html);
  assert.equal(parsed.rows.length, 7, `3 gercek kayit (farkli yevmiye, birlesmez) + 4 "kayit yok" satiri = 7 tasinmaz = 7 satir beklenir, bulunan: ${JSON.stringify(parsed.rows.map((r) => r[6]))}`);
  const allAdaParsels = parsed.rows.map((row) => row[6]).sort();
  assert.deepEqual(
    allAdaParsels,
    ["1135 ada 7 parsel", "166 ada 17 parsel", "166 ada 7 parsel", "1605 ada 4 parsel", "1955 ada 3 parsel", "1955 ada 4 parsel", "1141 ada 3 parsel"].sort(),
    `TUM 7 tasinmaz (kayitli VEYA "kayit yok") bu tabloda temsil edilmeli, bulunan: ${JSON.stringify(allAdaParsels)}`,
  );
  const emptyRows = parsed.rows.filter((row) => row[0] === "Herhangi bir kayıt bulunmamaktadır.");
  assert.equal(emptyRows.length, 4, `4 kayitsiz tasinmaz icin 4 "kayit yok" satiri beklenir, bulunan: ${emptyRows.length}`);
  console.log("7 tasinmazli GERCEK senaryo (3'unde kayit, 4'unde yok) - TUMU tek sayfada temsil ediliyor REGRESYON testi tamam.");
}

console.log("Takyidat coklu tasinmaz ozet tablosu (Ada/Parsel sutunu) testleri basarili.");
