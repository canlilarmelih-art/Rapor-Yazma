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
  "computeTitleUnitShareOfLandArea",
  "buildTitleUnitsSummaryTableData",
  "buildTitleUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "parseReportNumber",
  "formatSquareMeterArea",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
];
// Not: "buildCompactReportWordTableHtml" artık bu tablo TARAFINDAN
// KULLANILMIYOR (kendi ÖZEL HTML üreticisi var, bkz. yukarıdaki yorum —
// diğer PAYLAŞILAN tabloları etkilememek için) — bu yüzden listeye
// eklenmedi.
const constNames = ["TITLE_UNITS_TABLE_SHARED_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getTitleUnitCount, getTitleUnitFieldsForLabel, getTitleUnitTablesForLabel,
    buildAllTitleUnitsForSummaryTable, joinTitleUnitOwnerColumn,
    computeTitleUnitShareOfLandArea, splitTableHeaderLabelIntoTwoLines,
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
  // pay payda cilt sayfa eksik" dedi, bu 5 alan da eklendi. "Sıra No"
  // ve "Hissesine Düşen Arsa Payı" da HER ZAMAN gösterilir.
  ["Sıra No", "Taşınmaz Kimlik No", "Blok", "Kat", "Bağımsız Bölüm No", "Bağımsız Bölüm Niteliği", "Arsa Payı", "Arsa Payda", "Hissesine Düşen Arsa Payı", "Malik(ler)", "Hisse Payı", "Edinme Sebebi", "Tapu Tarihi", "Yevmiye No", "Cilt", "Sayfa"].forEach((col) => {
    assert.ok(data.headers.includes(col), `"${col}" sütunu HER ZAMAN gösterilmeliydi.`);
  });
  // "en sola Sıra No sütunu ekle 1 den başla saymaya" — EN SOL sütun,
  // 1'den başlayan sıra numarası.
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  assert.deepEqual(data.rows.map((row) => row[0]), [1, 2, 3], "Sıra No 1'den başlayıp sırayla artmalı.");
  // "her bir taşınmazın 'Hissesine Düşen Arsa Payı' bölümünü hesapla.
  // (Yüzölçümü) / Arsa Payda X Arsa Pay" — 1. taşınmaz: 1200/1000*50 = 60.
  const shareAreaColumnIndex = data.headers.indexOf("Hissesine Düşen Arsa Payı");
  assert.equal(data.rows[0][shareAreaColumnIndex], "60,00 m²", `1. taşınmazın hesabı (1200/1000*50=60) yanlış, bulunan: ${data.rows[0][shareAreaColumnIndex]}`);
  assert.equal(data.rows[1][shareAreaColumnIndex], "72,00 m²", `2. taşınmazın hesabı (1200/1000*60=72) yanlış, bulunan: ${data.rows[1][shareAreaColumnIndex]}`);
  const propertyIdColumnIndex = data.headers.indexOf("Taşınmaz Kimlik No");
  assert.equal(data.rows[0][propertyIdColumnIndex], "123456", "1. taşınmazın Taşınmaz Kimlik No'su doğru sütunda olmalı.");
  assert.equal(data.rows[1][propertyIdColumnIndex], "123457", "2. taşınmazın Taşınmaz Kimlik No'su doğru sütunda olmalı.");
  const shareColumnIndex = data.headers.indexOf("Arsa Payı");
  assert.equal(data.rows[0][shareColumnIndex], "50", "1. taşınmazın Arsa Payı doğru sütunda olmalı.");
  const registryPageColumnIndex = data.headers.indexOf("Sayfa");
  assert.equal(data.rows[2][registryPageColumnIndex], "1", "3. taşınmazın Sayfa değeri doğru sütunda olmalı.");
  console.log("\"Ayni ise gizlensin\" + \"diger bolumler her zaman var\" (Kimlik No/Arsa Payi/Payda/Cilt/Sayfa dahil) kurali testi tamam.");
}

// --- 2b) İl/İlçe/Mahalle/Pafta: AYNI ada/parselde, KENDİ metni FARKLI ----
// olsa bile GİZLENİR. Kullanıcı talebi: "İl İlçe Mahalle Pafta bunlar
// aynı ada parsel taleplerinde tabloda yer almamalı" / "pafta bölümünü
// kaldır aynı ada parselde yer alan işlemlerde" — bu DÖRT alan da (yalnız
// Pafta değil) KML/TAKBİS'ten taşınmaz başına ayrı ayrı içeri alındığından
// veri girişi tutarsızlığı (ör. "Özlüce" / "Özlüce " veya "F21" / "F 21")
// olsa BİLE, ada/parsel eşitse zorla gizlenmeli (ada/parsel eşitliği bu
// dördünün karşılaştırmasından ÖNCELİKLİDİR). Regresyon testi: ilk
// uygulamada kapsam yanlışlıkla sadece Pafta'ya daraltılmıştı — kullanıcı
// "İL İLÇE MAHALLE HALA ÇIKIYOR AYNI OLMASINA RAĞMEN" ile düzeltti.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" },
    tables: { title: [] },
    titleUnits: [
      // AYNI ada/parsel (4834/1) ama İl/İlçe/Mahalle/Pafta metinleri
      // KASITLI OLARAK FARKLI (KML/TAKBİS veri girişi tutarsızlığını taklit ediyor).
      { fields: { titleCity: "BURSA ", titleDistrict: "Nilufer", titleNeighborhood: "Özlüce ", locationName: "-", sheetNo: "F 21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" }, tables: { title: [] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.ok(!data.headers.includes("İl"), "Ayni ada/parselde Il metni farkli OLSA BILE 'Il' sutunu GIZLENMELIYDI.");
  assert.ok(!data.headers.includes("İlçe"), "Ayni ada/parselde Ilce metni farkli OLSA BILE 'Ilce' sutunu GIZLENMELIYDI.");
  assert.ok(!data.headers.includes("Mahalle"), "Ayni ada/parselde Mahalle metni farkli OLSA BILE 'Mahalle' sutunu GIZLENMELIYDI.");
  assert.ok(!data.headers.includes("Pafta"), "Ayni ada/parselde Pafta metni farkli OLSA BILE 'Pafta' sutunu GIZLENMELIYDI.");
  console.log("Il/Ilce/Mahalle/Pafta: ayni ada/parselde kendi metni farkli olsa bile gizlenme kurali testi tamam.");
}

// --- 2c) İl/İlçe/Mahalle/Pafta: FARKLI ada/parselde, kendi metni de ------
// FARKLI ise GÖSTERİLİR.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" },
    tables: { title: [] },
    titleUnits: [
      // FARKLI ada/parsel (5000/9) VE farklı İl/İlçe/Mahalle/Pafta — bu
      // durumda dördü de GERÇEKTEN bilgilendirici, gizlenmemeli.
      { fields: { titleCity: "İstanbul", titleDistrict: "Kadıköy", titleNeighborhood: "Fenerbahçe", locationName: "-", sheetNo: "G30", blockNo: "5000", parcelNo: "9", landArea: "1200", mainPropertyQuality: "Arsa" }, tables: { title: [] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.ok(data.headers.includes("İl"), "Farkli ada/parselde, Il de farkliysa 'Il' sutunu GOSTERILMELIYDI.");
  assert.ok(data.headers.includes("İlçe"), "Farkli ada/parselde, Ilce de farkliysa 'Ilce' sutunu GOSTERILMELIYDI.");
  assert.ok(data.headers.includes("Mahalle"), "Farkli ada/parselde, Mahalle de farkliysa 'Mahalle' sutunu GOSTERILMELIYDI.");
  assert.ok(data.headers.includes("Pafta"), "Farkli ada/parselde, Pafta de farkliysa 'Pafta' sutunu GOSTERILMELIYDI.");
  console.log("Il/Ilce/Mahalle/Pafta: farkli ada/parselde kendi metni de farkliysa gosterilme kurali testi tamam.");
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

// --- 4b) computeTitleUnitShareOfLandArea(): formül + eksik veri --------
{
  // (Yüzölçümü) / Arsa Payda X Arsa Pay — Türkçe ondalık virgül de
  // desteklenmeli (parseReportNumber).
  assert.equal(fns.computeTitleUnitShareOfLandArea({ landArea: "1200", denominator: "1000", share: "50" }), "60,00 m²", "1200/1000*50 = 60 m² bekleniyordu.");
  assert.equal(fns.computeTitleUnitShareOfLandArea({ landArea: "1.200,50", denominator: "1000", share: "50" }), "60,02 m²", "Turkce ondalik/binlik bicimli yuzolcumu dogru parse edilmeli (1200,50/1000*50=60,025, kayan nokta yuvarlama).");
  assert.equal(fns.computeTitleUnitShareOfLandArea({ landArea: "1200", denominator: "0", share: "50" }), "-", "Payda 0 ise '-' donmeli (sifira bolme).");
  assert.equal(fns.computeTitleUnitShareOfLandArea({ landArea: "", denominator: "1000", share: "50" }), "-", "Yuzolcumu eksikse '-' donmeli.");
  assert.equal(fns.computeTitleUnitShareOfLandArea({}), "-", "Hicbir alan yoksa '-' donmeli.");
  console.log("computeTitleUnitShareOfLandArea formul + eksik veri testi tamam.");
}

// --- 4c) splitTableHeaderLabelIntoTwoLines(): coklu kelimeli basliklar --
// ZORLA 2 satira bolunmeli. Kullanici talebi: "sütun başlıklarını 2 satır
// yap böylelikle hücre genişliği bir nebze azalacaktır" — table-layout:
// auto'da tarayici yeterli alan varken white-space:normal'e ragmen tek
// satirda birakabiliyordu, bu yuzden ORTAYA en yakin bosluktan <br> ile
// ELLE kiriliyor. Tek kelimeli basliklar (bosluk yok) DOKUNULMADAN kalir.
{
  assert.equal(fns.splitTableHeaderLabelIntoTwoLines("Bağımsız Bölüm Niteliği"), "Bağımsız Bölüm<br>Niteliği", "3 kelimeli baslik ortaya en yakin bosluktan kirilmali.");
  assert.equal(fns.splitTableHeaderLabelIntoTwoLines("Hissesine Düşen Arsa Payı"), "Hissesine Düşen<br>Arsa Payı", "4 kelimeli baslik ortaya en yakin bosluktan kirilmali.");
  assert.equal(fns.splitTableHeaderLabelIntoTwoLines("Taşınmaz Kimlik No"), "Taşınmaz<br>Kimlik No", "3 kelimeli baslik ortaya en yakin bosluktan kirilmali.");
  assert.equal(fns.splitTableHeaderLabelIntoTwoLines("Blok"), "Blok", "Tek kelimeli baslik (bosluk yok) DOKUNULMADAN kalmali.");
  assert.equal(fns.splitTableHeaderLabelIntoTwoLines("Sayfa"), "Sayfa", "Tek kelimeli baslik (bosluk yok) DOKUNULMADAN kalmali.");
  console.log("splitTableHeaderLabelIntoTwoLines coklu kelimeli baslik kirma testi tamam.");
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
  // "sütun genişliklerini dinamik yap" — table-layout:fixed DEĞİL, auto.
  assert.ok(html.includes("table-layout:auto"), "Sutun genislikleri DINAMIK (table-layout:auto) olmali.");
  // "tüm hücreler yatay ve dikey ortalı olsun".
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tum hucreler yatay VE dikey ortali olmali.");
  // "sütun başlıklarını 2 satır yap" — coklu kelimeli baslik (ornegin
  // "Bağımsız Bölüm Niteliği") HTML CIKTISINDA <br> ile bolunmus olmali.
  assert.ok(html.includes("Bağımsız Bölüm<br>Niteliği"), "'Bağımsız Bölüm Niteliği' basligi HTML ciktisinda <br> ile 2 satira bolunmus olmali.");
  assert.ok(html.includes("Hissesine Düşen<br>Arsa Payı"), "'Hissesine Düşen Arsa Payı' basligi HTML ciktisinda <br> ile 2 satira bolunmus olmali.");
  console.log("buildTitleUnitsSummaryWordTableHtml gercek HTML uretimi (dinamik genislik + ortalama + 2 satirli baslik) testi tamam.");
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
