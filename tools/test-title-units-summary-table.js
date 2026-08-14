// Çoklu taşınmazlı raporlarda tapu bilgilerini özetleyen tablo
// (2026-08-14). Kullanıcı talebi: "çoklu raporlarda tapu bilgilerini
// oluşturan tablo yapalım il ilçe mahalle mevkii pafta ada parsel
// yüzölçümü ana taşınmaz niteliği aynı ise tabloda gözükmeyecek. diğer
// bölümler her biri bir sütun olacak şekilde tablo oluşsun" — üç
// seçenekli AskUserQuestion ile "Her ikisi de" (uygulama içi önizleme +
// export {{TOKEN}}) ve "diğer bölümler" için TÜM 4 grup (Blok/Kat/BB
// No, Bağımsız Bölüm Niteliği, Malik+Hisse, Edinme Sebebi+Tapu
// Tarihi/No) onaylandı.
//
// Bu test kapsamı:
//  1) buildAllTitleUnitsForSummaryTable(): AKTİF taşınmaz state.fields/
//     state.tables'tan, DİĞERLERİ kendi "gölge" yuvasından (primaryTitleUnitShadow
//     / titleUnits[i-1]) okunuyor mu — bu, çoklu-taşınmaz mimarisinin
//     TEMEL kuralı (bkz. switchActiveTitleUnit); yanlış yapılırsa aktif
//     olmayan taşınmazların verisi HEP BOŞ görünür.
//  2) buildTitleUnitsSummaryTableData(): "aynı ise gizlensin" kuralı —
//     9 paylaşılan alandan TÜM taşınmazlarda AYNI olanlar sütun
//     listesinden ÇIKARILIYOR, FARKLI olanlar KALIYOR; "diğer bölümler"
//     (Blok/Kat/BB No/Nitelik/Malik/Hisse/Edinme Sebebi/Tarih/Yevmiye)
//     HER ZAMAN gösteriliyor; tekil raporda (1 taşınmaz) null dönüyor.
//  3) joinTitleUnitOwnerColumn(): birden fazla malik/hissedar varsa
//     alt alta (\n) birleştiriliyor.
//  4) buildTitleUnitsSummaryWordTableHtml(): gerçek HTML tablo üretimi,
//     tekil raporda "" (boş) dönüyor.
//  5) template-engine.js'te {{TASINMAZLARTAPUTABLOSU}} kayıtlı mı.

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

// app.js CRLF satır sonlarıyla saklanıyor (git core.autocrlf) — bu yüzden
// literal "\n" arayan basit bir yaklaşım yerine, "[" / "]" derinliğine
// göre sabitin GERÇEK sonunu (fonksiyon gövdesi çıkarımıyla AYNI teknik)
// bulan bir yöntem kullanılıyor.
function extractConst(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1; // "[" karakterinin kendisi
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, index + 1)};`;
    }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "joinTitleUnitOwnerColumn",
  "buildTitleUnitsSummaryTableData",
  "buildTitleUnitsSummaryWordTableHtml",
  "buildCompactReportWordTableHtml",
  "formatWordCell",
  "escapeHtml",
];
const constNames = ["TITLE_UNITS_TABLE_SHARED_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getTitleUnitCount, getTitleUnitFieldsForLabel, getTitleUnitTablesForLabel,
    buildAllTitleUnitsForSummaryTable, joinTitleUnitOwnerColumn,
    buildTitleUnitsSummaryTableData, buildTitleUnitsSummaryWordTableHtml,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(fields, ownerRows) {
  return { fields, tables: { title: ownerRows || [] } };
}

// --- 1) buildAllTitleUnitsForSummaryTable(): aktif/gölge okuma kuralı ----
{
  // Senaryo: 3 taşınmaz, İKİNCİSİ (index 1) şu an AKTİF (state.fields'ta
  // canlı) — birincil (index 0) ve üçüncü (index 2) kendi gölge
  // yuvalarında duruyor. Yanlış okuma yapılırsa aktif olmayanların
  // verisi BOŞ görünürdü.
  fns.setState({
    activeTitleUnitIndex: 1,
    fields: { titleCity: "Bursa", titleDistrict: "Nilüfer", blockNo: "709", parcelNo: "2" }, // aktif = ikinci taşınmaz
    tables: { title: [{ c0: "Ayşe Yılmaz", c1: "1/1" }] },
    primaryTitleUnitShadow: { fields: { titleCity: "Bursa", titleDistrict: "Nilüfer", blockNo: "709", parcelNo: "1" }, tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/1" }] } },
    // titleUnits[0] "index 1"e (şu an AKTİF, bu yüzden state.fields'tan
    // okunacağından İÇERİĞİ ÖNEMSİZ) karşılık gelir; titleUnits[1] ise
    // "index 2"nin gölge verisidir.
    titleUnits: [
      {},
      { fields: { titleCity: "Bursa", titleDistrict: "Nilüfer", blockNo: "709", parcelNo: "3" }, tables: { title: [{ c0: "Mehmet Yılmaz", c1: "1/1" }] } },
    ],
  });
  const units = fns.buildAllTitleUnitsForSummaryTable();
  assert.equal(units.length, 3, "3 taşınmaz (birincil + 2 ek) bekleniyordu.");
  assert.equal(units[0].fields.parcelNo, "1", "İndex 0 (aktif değil) gölgeden (primaryTitleUnitShadow) okunmalı.");
  assert.equal(units[1].fields.parcelNo, "2", "İndex 1 (AKTİF) canlı state.fields'tan okunmalı.");
  assert.equal(units[2].fields.parcelNo, "3", "İndex 2 (aktif değil) titleUnits[1]'den okunmalı.");
  console.log("buildAllTitleUnitsForSummaryTable aktif/golge okuma kurali testi tamam.");
}

// --- 2) "aynı ise gizlensin" kuralı + "diğer bölümler her zaman var" -----
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, titlePropertyId: "123456", titleBlockName: "A", titleFloor: "3", unitNo: "5", titleQuality: "Daire", share: "50", denominator: "1000", registryVolume: "12", registryPage: "34" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2", c2: "Satın Alma", c3: "01.01.2020", c4: "1234" }] },
    titleUnits: [
      { fields: { ...shared, titlePropertyId: "123457", titleBlockName: "A", titleFloor: "4", unitNo: "6", titleQuality: "Daire", share: "60", denominator: "1000", registryVolume: "12", registryPage: "35" }, tables: { title: [{ c0: "Ayşe Yılmaz", c1: "1/2" }] } },
      { fields: { ...shared, parcelNo: "2", titlePropertyId: "123458", titleBlockName: "B", titleFloor: "1", unitNo: "1", titleQuality: "Dükkan", share: "40", denominator: "1000", registryVolume: "13", registryPage: "1" }, tables: { title: [] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.ok(data, "3 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 3, "3 satır (3 taşınmaz) bekleniyordu.");
  // İl/İlçe/Mahalle/Mevkii/Pafta/Ana Taşınmaz Niteliği/Yüzölçümü AYNI —
  // gizlenmeli; yalnızca Parsel FARKLI (3. taşınmazda "2") — o KALMALI.
  assert.equal(data.sharedColumnCount, 1, `Yalnızca "Parsel" farklı olduğundan 1 paylaşılan sütun bekleniyordu, bulunan: ${data.sharedColumnCount}`);
  assert.ok(data.headers.includes("Parsel"), "\"Parsel\" (farklı olan) sütunu bulunmalı.");
  assert.ok(!data.headers.includes("İl"), "\"İl\" (aynı olan) sütunu GİZLENMELİYDİ.");
  assert.ok(!data.headers.includes("Ana Taşınmaz Niteliği"), "\"Ana Taşınmaz Niteliği\" (aynı olan) sütunu GİZLENMELİYDİ.");
  // "Diğer bölümler" HER ZAMAN var — kullanıcı "Taşınmaz Kimlik No arsa
  // pay payda cilt sayfa eksik" dedi, bu 5 alan da eklendi.
  ["Taşınmaz Kimlik No", "Blok", "Kat", "Bağımsız Bölüm No", "Bağımsız Bölüm Niteliği", "Arsa Payı", "Arsa Payda", "Malik(ler)", "Hisse Payı", "Edinme Sebebi", "Tapu Tarihi", "Yevmiye No", "Cilt", "Sayfa"].forEach((col) => {
    assert.ok(data.headers.includes(col), `"${col}" sütunu HER ZAMAN gösterilmeliydi.`);
  });
  const propertyIdColumnIndex = data.headers.indexOf("Taşınmaz Kimlik No");
  assert.equal(data.rows[0][propertyIdColumnIndex], "123456", "1. taşınmazın Taşınmaz Kimlik No'su doğru sütunda olmalı.");
  assert.equal(data.rows[1][propertyIdColumnIndex], "123457", "2. taşınmazın Taşınmaz Kimlik No'su doğru sütunda olmalı.");
  const shareColumnIndex = data.headers.indexOf("Arsa Payı");
  assert.equal(data.rows[0][shareColumnIndex], "50", "1. taşınmazın Arsa Payı doğru sütunda olmalı.");
  const registryPageColumnIndex = data.headers.indexOf("Sayfa");
  assert.equal(data.rows[2][registryPageColumnIndex], "1", "3. taşınmazın Sayfa değeri doğru sütunda olmalı.");
  console.log("\"Ayni ise gizlensin\" + \"diger bolumler her zaman var\" (Kimlik No/Arsa Payi/Payda/Cilt/Sayfa dahil) kurali testi tamam.");
}

// --- 3) Tekil raporda (1 taşınmaz) tablo üretilmemeli ---------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: { titleCity: "Bursa" }, tables: { title: [] }, titleUnits: [] });
  assert.equal(fns.buildTitleUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildTitleUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı (placeholder temiz silinsin).");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 4) joinTitleUnitOwnerColumn(): birden fazla malik alt alta ----------
{
  const owners = [{ c0: "Ahmet Yılmaz", c1: "1/2" }, { c0: "Ayşe Yılmaz", c1: "1/2" }, { c0: "" }];
  assert.equal(fns.joinTitleUnitOwnerColumn(owners, (r) => r.c0), "Ahmet Yılmaz\nAyşe Yılmaz", "Birden fazla malik \\n ile birlesmeli, bos satir atlanmali.");
  assert.equal(fns.joinTitleUnitOwnerColumn([], (r) => r.c0), "-", "Hic malik yoksa '-' donmeli.");
  console.log("joinTitleUnitOwnerColumn coklu malik birlestirme testi tamam.");
}

// --- 5) Gerçek HTML üretimi: birden fazla malik <br>'a dönüşüyor mu ------
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "-", blockNo: "1", parcelNo: "1", landArea: "500", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, titleBlockName: "-", titleFloor: "-", unitNo: "-", titleQuality: "Arsa" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2" }, { c0: "Ayşe Yılmaz", c1: "1/2" }] },
    titleUnits: [{ fields: shared, tables: { title: [] } }],
  });
  const html = fns.buildTitleUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Gecerli bir <table> HTML'i uretilmeli.");
  assert.ok(html.includes("Ahmet Yılmaz<br>Ayşe Yılmaz"), "Birden fazla malik hucre icinde <br> ile alt alta gelmeli.");
  console.log("buildTitleUnitsSummaryWordTableHtml gercek HTML uretimi testi tamam.");
}

// --- 6) template-engine.js'te {{TASINMAZLARTAPUTABLOSU}} kayitli mi -------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARTAPUTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildTitleUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARTAPUTABLOSU}} -> buildTitleUnitsSummaryWordTableHtml kablolamasi bulunamadi."
  );
  console.log("{{TASINMAZLARTAPUTABLOSU}} template-engine.js kablolama testi tamam.");
}

console.log("Tasinmazlar tapu ozeti tablosu testleri basarili.");
