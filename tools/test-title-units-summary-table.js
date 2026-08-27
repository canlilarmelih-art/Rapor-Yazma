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
  // TÜM 8 "çift taraflı" özet tablosunun PAYLAŞTIĞI son adım (2026-08-27) -
  // "eğer veri yoksa/TÜM taşınmazlarda aynıysa" sütun filtreleme +
  // ortak-deger (commonFields) hoisting.
  "finalizeTitleUnitsSummaryTableData",
  "buildTitleUnitsSummaryTableData",
  "buildTitleUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  // Çift Yönlü Düzenleme, Faz 2 (2026-08-15) — bkz. app.js'teki yorum:
  // export'tan (buildTitleUnitsSummaryTableHtmlFromData, yukarıda) TAMAMEN
  // AYRI, yalnızca ekran-içi düzenlenebilir önizleme için kullanılan renderer.
  "buildTitleUnitsSummaryTableHtmlEditable",
  // buildTitleUnitsSummaryTableHtmlEditable() 2026-08-27'den itibaren bu
  // fonksiyonu KOŞULSUZ çağırıyor (commonFields banner'ı, bkz. app.js).
  "buildTitleUnitsSummaryTableCommonFieldsHtml",
  // Çift Yönlü Düzenleme, Faz 3 (2026-08-15) — bkz. app.js'teki yorum:
  // aktif OLMAYAN taşınmazların gölge yuvasına hedefli yazma yardımcıları.
  // createEmptyTitleUnit, resolveTitleUnitWriteTarget'ın index>0 dalının
  // (titleUnits[index-1] eksikse otomatik oluşturma) bağımlılığıdır.
  "createEmptyTitleUnit",
  "resolveTitleUnitWriteTarget",
  "setTitleUnitFieldValue",
  // Çift Yönlü Düzenleme, Faz 4 (2026-08-15) — Malik(ler) satırı yazma
  // yardımcıları (aynı 3 yönlü dallanma, `fields` yerine `tables.title`
  // DİZİSİNE uygulanmış hali).
  "resolveTitleUnitOwnerRowsWriteTarget",
  "setTitleUnitOwnerRowValue",
  "addTitleUnitOwnerRow",
  "removeTitleUnitOwnerRow",
  // İmar Durumu koşullu (ada/parsel'e göre ortak/scoped) scoping (2026-08-16)
  // - buildTitleUnitsSummaryTableData() artık bu yeniden kullanılabilir
  // yardımcıyı çağırıyor (davranış aynı, sadece çıkarıldı).
  "computeTitleUnitsShareSameAdaParsel",
  "parseReportNumber",
  "formatSquareMeterArea",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik bunlara bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
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
    getState: () => state,
    getTitleUnitCount, getTitleUnitFieldsForLabel, getTitleUnitTablesForLabel,
    buildAllTitleUnitsForSummaryTable, joinTitleUnitOwnerColumn,
    computeTitleUnitShareOfLandArea, splitTableHeaderLabelIntoTwoLines,
    buildTitleUnitsSummaryTableData, buildTitleUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
    resolveTitleUnitWriteTarget, setTitleUnitFieldValue,
    resolveTitleUnitOwnerRowsWriteTarget, setTitleUnitOwnerRowValue,
    addTitleUnitOwnerRow, removeTitleUnitOwnerRow,
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
// NOT (2026-08-15): fixture'da blockNo/parcelNo ARTIK 3 taşınmazda da
// AYNI (4834/1) — çünkü Arsa Payı/Payda/Hissesine Düşen Arsa Payı SADECE
// aynı ada/parselde gösterilir (bkz. senaryo 2d). "Farklı ise göster"
// mekaniğini test etmek için bu kez Mevkii (locationName) farklılaştırıldı.
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, titlePropertyId: "123456", titleBlockName: "A", titleFloor: "3", unitNo: "5", titleQuality: "Daire", share: "50", denominator: "1000", registryVolume: "12", registryPage: "34" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2", c2: "Satın Alma", c3: "01.01.2020", c4: "1234" }] },
    titleUnits: [
      { fields: { ...shared, titlePropertyId: "123457", titleBlockName: "A", titleFloor: "4", unitNo: "6", titleQuality: "Daire", share: "60", denominator: "1000", registryVolume: "12", registryPage: "35" }, tables: { title: [{ c0: "Ayşe Yılmaz", c1: "1/2" }] } },
      { fields: { ...shared, locationName: "Sahil Kesimi", titlePropertyId: "123458", titleBlockName: "B", titleFloor: "1", unitNo: "1", titleQuality: "Dükkan", share: "40", denominator: "1000", registryVolume: "13", registryPage: "1" }, tables: { title: [] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.ok(data, "3 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 3, "3 satır (3 taşınmaz) bekleniyordu.");
  // Aynı ada/parselde olduğundan İl/İlçe/Mahalle/Pafta ZORLA gizli; Ada/
  // Parsel/Yüzölçümü de (equality) AYNI olduğundan gizli. Yalnızca Mevkii
  // (3. taşınmazda "Sahil Kesimi") FARKLI — o KALMALI.
  assert.equal(data.sharedColumnCount, 1, `Yalnızca "Mevkii" farklı olduğundan 1 paylaşılan sütun bekleniyordu, bulunan: ${data.sharedColumnCount}`);
  assert.ok(data.headers.includes("Mevkii"), "\"Mevkii\" (farklı olan) sütunu bulunmalı.");
  assert.ok(!data.headers.includes("İl"), "\"İl\" (aynı ada/parsel) sütunu GİZLENMELİYDİ.");
  // "Diğer bölümler" HER ZAMAN var (Arsa Payı/Payda/Hissesine Düşen Arsa
  // Payı DAHİL — TÜM taşınmazlar AYNI ada/parselde olduğundan; farklı
  // ada/parselde bu üçü kaldırılır, bkz. senaryo 2d). "Ana Taşınmaz
  // Niteliği" HER ZAMAN gösterilen sabit bir sütun (2026-08-27, BEŞİNCİ
  // ve son tur: "sadece il ilçe mahalle mevkii pafta ada parsel ortak
  // olsun, diğerleri ortak olmasın eskiye dön" — 0.0.585'in "ortak"
  // yapma denemesi GERİ ALINDI, TÜM taşınmazlarda aynı ("Arsa") olsa BİLE
  // ASLA commonFields'e taşınmaz).
  ["Sıra No", "Taşınmaz Kimlik No", "Blok", "Kat", "Bağımsız Bölüm No", "Bağımsız Bölüm Niteliği", "Ana Taşınmaz Niteliği", "Arsa Payı", "Arsa Payda", "Hissesine Düşen Arsa Payı", "Malik(ler)", "Hisse Payı", "Edinme Sebebi", "Tapu Tarihi", "Yevmiye No", "Cilt", "Sayfa"].forEach((col) => {
    assert.ok(data.headers.includes(col), `"${col}" sütunu HER ZAMAN gösterilmeliydi.`);
  });
  assert.equal(data.commonFields.find((f) => f.label === "Ana Taşınmaz Niteliği"), undefined, "\"Ana Taşınmaz Niteliği\" ASLA commonFields'e taşınmamalı (artık \"ortak\" değil).");
  // "en sola Sıra No sütunu ekle 1 den başla saymaya" — EN SOL sütun,
  // 1'den başlayan sıra numarası. "taşınmaz kimlik no sıra nodan sonra
  // gelsin" (2026-08-15) — Taşınmaz Kimlik No HEMEN ardından gelmeli
  // (paylaşımlı alanlardan/Blok'tan bile ÖNCE).
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  assert.equal(data.headers[1], "Taşınmaz Kimlik No", "\"Taşınmaz Kimlik No\" Sıra No'nun HEMEN ardından gelmeli.");
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
  // KRITIK REGRESYON (2026-08-27, kullanici bulgusu: "pafta ortak olmasina
  // ragmen gozukmuyor") - "gizlenen" bu 4 alan artik SESSIZCE kaybolmuyor,
  // temsilci (ilk) tasinmazin degeriyle commonFields'e (Ortak Bilgiler)
  // TASINIYOR - metinleri KML/TAKBIS tutarsizligi yuzunden farkli gorunse
  // BILE (ada/parsel esitligi bunlarin GERCEKTEN ayni oldugunu garanti eder).
  const commonLabels = data.commonFields.map((f) => f.label);
  ["İl", "İlçe", "Mahalle", "Pafta"].forEach((label) => {
    assert.ok(commonLabels.includes(label), `"${label}" ayni ada/parselde commonFields'e TASINMALIYDI (sessizce kaybolmamali), bulunan: ${commonLabels.join(", ")}`);
  });
  assert.equal(data.commonFields.find((f) => f.label === "İl")?.value, "Bursa", "\"İl\" ortak degeri temsilci (ilk) tasinmazin KENDI metniyle (kirpilmemis \"BURSA \" DEGIL) olmali.");
  assert.equal(data.commonFields.find((f) => f.label === "Pafta")?.value, "F21", "\"Pafta\" ortak degeri temsilci tasinmazin KENDI metniyle olmali.");
  console.log("Il/Ilce/Mahalle/Pafta: ayni ada/parselde kendi metni farkli olsa bile commonFields'e tasinma (sessizce kaybolmama) testi tamam.");
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

// --- 2d) Arsa Payı/Payda/Hissesine Düşen Arsa Payı: FARKLI ada/parselde --
// KALDIRILIR (veri DOLU olsa bile), AYNI ada/parselde KORUNUR. Kullanıcı
// talebi: "farklı ada parsellerden oluşan çoklu taleplerde ARSA PAYI
// ARSA PAYDA KALDIR" — Arsa Payı/Payda TEK bir ORTAK parselin toplam
// alanındaki payını ifade eder; taşınmazlar FARKLI parsellerdeyse her
// satırın payı/paydası KENDİ (birbirinden bağımsız) parseline aittir —
// yan yana KIYASLANAMAZ, gösterilmesi YANILTICI olur. Hissesine Düşen
// Arsa Payı de (bu ikisinden HESAPLANDIĞI için) AYNI gerekçeyle kalkar.
{
  const base = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "-", landArea: "1200", mainPropertyQuality: "Arsa" };
  // FARKLI ada/parsel (100/1 vs 200/9) — share/denominator DOLU olmasına
  // rağmen (bu, salt "boş sütun kaldırılır" kuralından AYRI, ÖZEL bir
  // kural olduğunu kanıtlar) üç sütun de KALDIRILMALI.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...base, blockNo: "100", parcelNo: "1", share: "1", denominator: "2" },
    tables: { title: [] },
    titleUnits: [
      { fields: { ...base, blockNo: "200", parcelNo: "9", share: "1", denominator: "3" }, tables: { title: [] } },
    ],
  });
  const diffParcelData = fns.buildTitleUnitsSummaryTableData();
  ["Arsa Payı", "Arsa Payda", "Hissesine Düşen Arsa Payı"].forEach((col) => {
    assert.ok(!diffParcelData.headers.includes(col), `Farkli ada/parselde "${col}" sutunu (veri DOLU olsa bile) KALDIRILMALIYDI, bulunan basliklar: ${diffParcelData.headers.join(", ")}`);
  });

  // AYNI ada/parsel (100/1) — üç sütun de KALMALI.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...base, blockNo: "100", parcelNo: "1", share: "1", denominator: "2" },
    tables: { title: [] },
    titleUnits: [
      { fields: { ...base, blockNo: "100", parcelNo: "1", share: "1", denominator: "3" }, tables: { title: [] } },
    ],
  });
  const sameParcelData = fns.buildTitleUnitsSummaryTableData();
  ["Arsa Payı", "Arsa Payda", "Hissesine Düşen Arsa Payı"].forEach((col) => {
    assert.ok(sameParcelData.headers.includes(col), `Ayni ada/parselde "${col}" sutunu GOSTERILMELIYDI, bulunan basliklar: ${sameParcelData.headers.join(", ")}`);
  });
  console.log("Arsa Payi/Payda/Hissesine Dusen Arsa Payi: farkli ada/parselde kaldirilma, ayni ada/parselde korunma kurali testi tamam.");
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
    // Not: denominator/share BİLEREK dolduruldu — aksi halde "Hissesine
    // Düşen Arsa Payı" sütunu TÜM taşınmazlarda "-" kalır ve YENİ "tüm
    // taşınmazlarda boş olan sütun kaldırılır" kuralıyla (bkz. senaryo 17)
    // bu test asagidaki <br> assertion'ini bozacak şekilde SİLİNİR.
    fields: { ...shared, titleBlockName: "-", titleFloor: "-", unitNo: "-", titleQuality: "Arsa", denominator: "1000", share: "50" },
    // Not: malik adları BİLEREK küçük harfle yazıldı — "sistemde harfler
    // küçükte olsa büyükte olsa tabloda tüm harfler daima büyük olacak"
    // kuralını (bkz. asagidaki assertion) anlamli şekilde test edebilmek
    // için.
    tables: { title: [{ c0: "ahmet yılmaz", c1: "1/2" }, { c0: "ayşe yılmaz", c1: "1/2" }] },
    titleUnits: [{ fields: { ...shared, denominator: "1000", share: "40" }, tables: { title: [] } }],
  });
  const html = fns.buildTitleUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Gecerli bir <table> HTML'i uretilmeli.");
  assert.ok(html.includes("AHMET YILMAZ<br>AYŞE YILMAZ"), "Birden fazla malik hucre icinde <br> ile alt alta gelmeli VE kucuk harfli girdi BUYUK harfe cevrilmeli.");
  assert.ok(!html.includes("ahmet yılmaz") && !html.includes("Ahmet Yılmaz"), "Kucuk/karisik harfli orijinal metin HTML ciktisinda KALMAMALI (tamami buyutulmus olmali).");
  // "sütun genişliklerini dinamik yap" — table-layout:fixed DEĞİL, auto.
  assert.ok(html.includes("table-layout:auto"), "Sutun genislikleri DINAMIK (table-layout:auto) olmali.");
  // "tüm hücreler yatay ve dikey ortalı olsun".
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tum hucreler yatay VE dikey ortali olmali.");
  // "sütun başlıklarını 2 satır yap" — coklu kelimeli baslik (ornegin
  // "Bağımsız Bölüm Niteliği") HTML CIKTISINDA <br> ile bolunmus olmali.
  // Kullanıcı talebi (2026-08-15): "sistemde harfler küçükte olsa büyükte
  // olsa tabloda tüm harfler daima büyük olacak" — basliklar da (İl,
  // Bağımsız Bölüm Niteliği vb.) artik TÜRKÇE BÜYÜK HARFLE cikiyor.
  assert.ok(html.includes("BAĞIMSIZ BÖLÜM<br>NİTELİĞİ"), "'Bağımsız Bölüm Niteliği' basligi BUYUK harfle VE <br> ile 2 satira bolunmus olmali.");
  assert.ok(html.includes("HİSSESİNE DÜŞEN<br>ARSA PAYI"), "'Hissesine Düşen Arsa Payı' basligi BUYUK harfle VE <br> ile 2 satira bolunmus olmali.");
  console.log("buildTitleUnitsSummaryWordTableHtml gercek HTML uretimi (dinamik genislik + ortalama + 2 satirli baslik + daima BUYUK harf) testi tamam.");
}

// --- 17) Farkli parselli tarla raporunda: BOS sutun kurali VE "farkli ----
// ada/parselde Arsa Payi/Payda" kurali BIRLIKTE uygulanir ------------------
// Kullanici talebi: "eğer sistemde hücrede veri yoksa. örnek tarla raporu
// bb no kat bölümler boş o zaman tabloda bu sütunlar gözükmemeli" VE
// "farklı ada parsellerden oluşan çoklu taleplerde ARSA PAYI ARSA PAYDA
// KALDIR" — gerçekci bir tarla ornegi: HER tarla parcasi genelde AYRI bir
// parseldir (bu fixture'da 12 ve 13). Blok/Kat/Bagimsiz Bolum No hepsi
// BOS (arazinin karsiligi yok) → kaldirilir (bos-sutun kurali, 0.0.451).
// Arsa Payi/Payda DOLU (share/denominator "1"/"1") OLMASINA RAGMEN farkli
// parsel oldugundan kaldirilir (senaryo 2d'deki kuralin bagimsiz bir
// dogrulamasi — bu ikisi AYNI ANDA gecerli olabiliyor).
{
  const shared = { titleCity: "Konya", titleDistrict: "Ereğli", titleNeighborhood: "-", locationName: "-", sheetNo: "-", blockNo: "500", landArea: "8000", mainPropertyQuality: "Tarla" };
  fns.setState({
    activeTitleUnitIndex: 0,
    // Blok/Kat/Bagimsiz Bolum No hepsi bos ("") — tarla parcasinda
    // bunlarin karsiligi yok. Diger alanlar (Kimlik No, Nitelik, Arsa
    // Payi/Payda, Malik, Cilt/Sayfa) DOLU.
    fields: { ...shared, parcelNo: "12", titlePropertyId: "999001", titleBlockName: "", titleFloor: "", unitNo: "", titleQuality: "Tarla", share: "1", denominator: "1", registryVolume: "7", registryPage: "20" },
    tables: { title: [{ c0: "Veli Demir", c1: "1/1", c2: "Miras", c3: "05.03.2019", c4: "555" }] },
    titleUnits: [
      { fields: { ...shared, parcelNo: "13", titlePropertyId: "999002", titleBlockName: "", titleFloor: "", unitNo: "", titleQuality: "Tarla", share: "1", denominator: "1", registryVolume: "7", registryPage: "21" }, tables: { title: [{ c0: "Ayşe Demir", c1: "1/1" }] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.ok(data, "2 tasinmazli tarla raporunda tablo verisi donmeli.");
  ["Blok", "Kat", "Bağımsız Bölüm No", "Arsa Payı", "Arsa Payda", "Hissesine Düşen Arsa Payı"].forEach((col) => {
    assert.ok(!data.headers.includes(col), `Bu sutun (bos veya farkli-parsel kurali geregi) KALDIRILMALIYDI: "${col}", bulunan basliklar: ${data.headers.join(", ")}`);
  });
  ["Sıra No", "Taşınmaz Kimlik No", "Bağımsız Bölüm Niteliği", "Ana Taşınmaz Niteliği", "Malik(ler)", "Hisse Payı", "Edinme Sebebi", "Cilt", "Sayfa"].forEach((col) => {
    assert.ok(data.headers.includes(col), `Dolu olan "${col}" sutunu KORUNMALIYDI, bulunan basliklar: ${data.headers.join(", ")}`);
  });
  // "Ana Taşınmaz Niteliği" ("Tarla"), "Hisse Payı" ("1/1") VE Cilt ("7")
  // HER IKI tasinmazda da BIREBIR AYNI olsa da (2026-08-27, BESINCI/son
  // tur: "sadece il ilce mahalle mevkii pafta ada parsel ortak olsun,
  // digerleri ortak olmasin eskiye don") HICBIRI commonFields'e
  // tasinmaz - HER ZAMAN normal sutun olarak kalirlar. Sayfa ("20"/"21")
  // zaten FARKLI oldugundan da eklenmez.
  ["Ana Taşınmaz Niteliği", "Hisse Payı", "Cilt", "Sayfa"].forEach((label) => {
    assert.equal(data.commonFields.find((f) => f.label === label), undefined, `"${label}" ASLA commonFields'e tasinmamali (artik "ortak" degil).`);
  });
  // "Parsel" farkli (12 vs 13) oldugundan paylasimli sutun olarak kalmali.
  assert.ok(data.headers.includes("Parsel"), "\"Parsel\" (farkli olan paylasimli alan) sutunu kalmali.");
  assert.equal(data.sharedColumnCount, 1, `sharedColumnCount filtreden SONRA da dogru sayilmali (yalnizca Parsel), bulunan: ${data.sharedColumnCount}`);
  console.log("Farkli parselli tarla ornegi: bos sutun + farkli-ada-parselde Arsa Payi/Payda kaldirma kurali birlikte testi tamam.");
}

// --- 7) columnMeta: headers ile hizali, dogru kind/fieldKey/ownerColumn --
// eslemesi (Cift Yonlu Duzenleme, Faz 2, 2026-08-15) -----------------------
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, titlePropertyId: "123456", titleBlockName: "A", titleFloor: "3", unitNo: "5", titleQuality: "Daire", share: "50", denominator: "1000", registryVolume: "12", registryPage: "34" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2", c2: "Satın Alma", c3: "01.01.2020", c4: "1234" }] },
    titleUnits: [
      { fields: { ...shared, locationName: "Sahil Kesimi", titlePropertyId: "123457", titleBlockName: "B", titleFloor: "1", unitNo: "1", titleQuality: "Dükkan", share: "40", denominator: "1000", registryVolume: "13", registryPage: "1" }, tables: { title: [] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.ok(Array.isArray(data.columnMeta), "columnMeta dizisi donmeli.");
  assert.equal(data.columnMeta.length, data.headers.length, "columnMeta, headers ile AYNI uzunlukta olmali.");
  assert.equal(data.columnMeta[0].kind, "seq", "Ilk sutun (Sira No) 'seq' olmali.");
  assert.equal(data.columnMeta[1].kind, "scalar", "Ikinci sutun (Tasinmaz Kimlik No) 'scalar' olmali.");
  assert.equal(data.columnMeta[1].fieldKey, "titlePropertyId", "Tasinmaz Kimlik No -> titlePropertyId eslesmeli.");
  const malikColumnIndex = data.headers.indexOf("Malik(ler)");
  assert.equal(data.columnMeta[malikColumnIndex].kind, "owner", "Malik(ler) sutunu 'owner' olmali (Faz 4'e kadar duzenlenemez).");
  assert.equal(data.columnMeta[malikColumnIndex].ownerColumn, "c0", "Malik(ler) -> c0 eslesmeli.");
  const shareAreaColumnIndex = data.headers.indexOf("Hissesine Düşen Arsa Payı");
  assert.equal(data.columnMeta[shareAreaColumnIndex].kind, "computed", "Hissesine Dusen Arsa Payi 'computed' olmali (asla duzenlenemez).");
  const shareColumnIndex = data.headers.indexOf("Arsa Payı");
  assert.equal(data.columnMeta[shareColumnIndex].kind, "scalar", "Arsa Payi 'scalar' olmali.");
  assert.equal(data.columnMeta[shareColumnIndex].fieldKey, "share", "Arsa Payi -> share eslesmeli.");
  console.log("buildTitleUnitsSummaryTableData columnMeta esleme testi tamam.");
}

// --- 8) columnMeta: bos-sutun filtresi headers ile BIRLIKTE columnMeta'yi -
// da budar (Faz 2) -----------------------------------------------------------
{
  const shared = { titleCity: "Konya", titleDistrict: "Ereğli", titleNeighborhood: "-", locationName: "-", sheetNo: "-", blockNo: "500", landArea: "8000", mainPropertyQuality: "Tarla" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, parcelNo: "12", titlePropertyId: "999001", titleBlockName: "", titleFloor: "", unitNo: "", titleQuality: "Tarla", share: "1", denominator: "1", registryVolume: "7", registryPage: "20" },
    tables: { title: [{ c0: "Veli Demir", c1: "1/1", c2: "Miras", c3: "05.03.2019", c4: "555" }] },
    titleUnits: [
      { fields: { ...shared, parcelNo: "13", titlePropertyId: "999002", titleBlockName: "", titleFloor: "", unitNo: "", titleQuality: "Tarla", share: "1", denominator: "1", registryVolume: "7", registryPage: "21" }, tables: { title: [{ c0: "Ayşe Demir", c1: "1/1" }] } },
    ],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  assert.equal(data.columnMeta.length, data.headers.length, "Bos-sutun filtresinden SONRA da columnMeta headers ile AYNI uzunlukta olmali.");
  assert.ok(!data.columnMeta.some((meta) => meta.fieldKey === "titleBlockName"), "Kaldirilan 'Blok' sutununun columnMeta girdisi de KALKMALI.");
  console.log("columnMeta bos-sutun filtresiyle birlikte budanma testi tamam.");
}

// --- 9) buildTitleUnitsSummaryTableHtmlEditable(): TUM satirlarin scalar --
// hucreleri duzenlenebilir isaretlenir (Cift Yonlu Duzenleme, Faz 3, ------
// 2026-08-15) — "yalnizca AKTIF satir" kisitlamasi Faz 2'de vardi, Faz -----
// 3'te KALDIRILDI; aktif satir artik yalnizca GORSEL olarak (tus-active- --
// row sinifiyla) isaretleniyor, duzenlenebilirligi ETKILEMIYOR. ------------
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 1,
    fields: { ...shared, titlePropertyId: "AKTIF-ID", titleBlockName: "A", titleFloor: "3", unitNo: "5", titleQuality: "Daire", share: "50", denominator: "1000", registryVolume: "12", registryPage: "34" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2" }] },
    primaryTitleUnitShadow: { fields: { ...shared, titlePropertyId: "GOLGE-ID", titleBlockName: "B", titleFloor: "1", unitNo: "1", titleQuality: "Dükkan", share: "40", denominator: "1000", registryVolume: "13", registryPage: "1" }, tables: { title: [] } },
    titleUnits: [{}],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 1);
  assert.ok(html.includes('data-unit-index="1"'), "Aktif tasinmazin (index 1) hucreleri isaretlenmeli.");
  assert.ok(html.includes('data-unit-index="0"'), "Aktif OLMAYAN tasinmazin (index 0) hucreleri de Faz 3'te duzenlenebilir isaretlenmeli.");
  assert.ok(html.includes('data-field-key="titlePropertyId"'), "Aktif satirin scalar hucresi (Tasinmaz Kimlik No) duzenlenebilir isaretlenmeli.");
  assert.ok(html.includes('<tr class="tus-active-row">'), "Aktif satir (index 1) GORSEL olarak 'tus-active-row' sinifiyla isaretlenmeli.");
  const expectedEditableCount = data.columnMeta.filter((meta) => meta.kind === "scalar").length * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `TUM satirlarin 'scalar' sutunlari (${expectedEditableCount} adet) duzenlenebilir isaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  console.log("buildTitleUnitsSummaryTableHtmlEditable TUM-satir/scalar-sutun isaretleme + aktif-satir gorsel vurgu testi tamam.");
}

// --- 10) resolveTitleUnitWriteTarget()/setTitleUnitFieldValue(): aktif/ ---
// index-0-golge/diger 3 yonlu dallanma (Faz 3, 2026-08-15) -----------------
{
  // 10a) index === aktif -> dogrudan state.fields (referans, kopya DEGIL).
  fns.setState({ activeTitleUnitIndex: 0, fields: { titlePropertyId: "AKTIF" }, tables: { title: [] }, titleUnits: [{ fields: { titlePropertyId: "DIGER" }, tables: {} }] });
  assert.equal(fns.setTitleUnitFieldValue(0, "titlePropertyId", "AKTIF-YENI"), true, "Aktif tasinmaza yazma basarili donmeli.");
  assert.equal(fns.getState().fields.titlePropertyId, "AKTIF-YENI", "Aktif tasinmaza yazilan deger state.fields'ta gorunmeli.");

  // 10b) index === 0, primaryTitleUnitShadow HENUZ YOKSA (bozuk/teorik durum)
  // -> yeni bir gölge yuva OLUSTURULUP oraya yazilmali (sessizce KAYBOLMAMALI).
  fns.setState({ activeTitleUnitIndex: 1, fields: { titlePropertyId: "AKTIF-2" }, tables: { title: [] }, primaryTitleUnitShadow: null, titleUnits: [{ fields: {}, tables: {} }] });
  assert.equal(fns.setTitleUnitFieldValue(0, "titlePropertyId", "GOLGE-YENI"), true, "primaryTitleUnitShadow yokken bile yazma basarili donmeli.");
  assert.ok(fns.getState().primaryTitleUnitShadow, "Yoksa primaryTitleUnitShadow OTOMATIK olusturulmali.");
  assert.equal(fns.getState().primaryTitleUnitShadow.fields.titlePropertyId, "GOLGE-YENI", "Deger yeni olusturulan golge yuvaya dogru yazilmali.");
  assert.equal(fns.getState().fields.titlePropertyId, "AKTIF-2", "Aktif tasinmazin (index 1) kendi degeri ETKILENMEMELI.");

  // 10c) index === 0, primaryTitleUnitShadow ZATEN VARSA -> ustune yazilir,
  // MEVCUT diger alanlar KORUNUR (round-trip guvenligi).
  fns.setState({ activeTitleUnitIndex: 1, fields: {}, tables: {}, primaryTitleUnitShadow: { fields: { titlePropertyId: "ESKI", titleCity: "Bursa" }, tables: {} }, titleUnits: [{ fields: {}, tables: {} }] });
  assert.equal(fns.setTitleUnitFieldValue(0, "titlePropertyId", "GUNCEL"), true);
  assert.equal(fns.getState().primaryTitleUnitShadow.fields.titlePropertyId, "GUNCEL", "Var olan golge yuvadaki alan guncellenmeli.");
  assert.equal(fns.getState().primaryTitleUnitShadow.fields.titleCity, "Bursa", "Golge yuvadaki DIGER alanlar (titleCity) ETKILENMEMELI.");

  // 10d) index > 0 (titleUnits[index-1]) -> mevcutsa uzerine yazilir.
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: {}, titleUnits: [{ fields: { titlePropertyId: "ESKI-2" }, tables: {} }, { fields: {}, tables: {} }] });
  assert.equal(fns.setTitleUnitFieldValue(1, "titlePropertyId", "GUNCEL-2"), true, "titleUnits[0]'a (index 1) yazma basarili donmeli.");
  assert.equal(fns.getState().titleUnits[0].fields.titlePropertyId, "GUNCEL-2", "titleUnits[0].fields dogru guncellenmeli.");
  assert.equal(fns.getState().fields.titlePropertyId, undefined, "Aktif (index 0) tasinmazin fields'i ETKILENMEMELI.");

  // 10e) index > 0, titleUnits[index-1] HENUZ YOKSA (dizide "delik" var,
  // ör. bozuk/eksik veri) -> otomatik olusturulup yazilmali (10b'nin
  // index>0 karsiligi), DIGER tasinmazlar ETKILENMEMELI.
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: {}, titleUnits: [undefined, { fields: { titlePropertyId: "UCUNCU" }, tables: {} }] });
  assert.equal(fns.getState().titleUnits.length, 2, "Fixture: 2 ek tasinmaz (3 toplam) — index 1 (titleUnits[0]) EKSIK.");
  assert.equal(fns.setTitleUnitFieldValue(1, "titlePropertyId", "YENI-UNITE"), true, "titleUnits[0] eksikken bile (index gecerli araliktaysa) yazma basarili donmeli.");
  assert.ok(fns.getState().titleUnits[0], "Eksik olan titleUnits[0] OTOMATIK olusturulmali.");
  assert.equal(fns.getState().titleUnits[0].fields.titlePropertyId, "YENI-UNITE", "Deger yeni olusturulan yuvaya dogru yazilmali.");
  assert.equal(fns.getState().titleUnits[1].fields.titlePropertyId, "UCUNCU", "Diger tasinmazin (index 2) verisi ETKILENMEMELI.");
  console.log("resolveTitleUnitWriteTarget/setTitleUnitFieldValue 3-yonlu dallanma testi tamam.");
}

// --- 11) setTitleUnitFieldValue(): gecersiz index icin false doner, hata --
// firlatmaz --------------------------------------------------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: {}, titleUnits: [{ fields: {}, tables: {} }] });
  assert.equal(fns.setTitleUnitFieldValue(-1, "titlePropertyId", "X"), false, "Negatif index false donmeli.");
  assert.equal(fns.setTitleUnitFieldValue(5, "titlePropertyId", "X"), false, "Aralik disi (5) index false donmeli (2 tasinmaz varken).");
  assert.equal(fns.setTitleUnitFieldValue(0, "", "X"), false, "Bos key false donmeli.");
  assert.equal(fns.setTitleUnitFieldValue(0.5, "titlePropertyId", "X"), false, "Tam sayi olmayan index false donmeli.");
  console.log("setTitleUnitFieldValue gecersiz girdi guvenlik agi testi tamam.");
}

// --- 12) resolveTitleUnitOwnerRowsWriteTarget()/setTitleUnitOwnerRowValue()/ -
// addTitleUnitOwnerRow()/removeTitleUnitOwnerRow(): aktif/index-0-golge/ ----
// diger 3 yonlu dallanma + satir ekle/sil (Cift Yonlu Duzenleme, Faz 4, ----
// 2026-08-15) --------------------------------------------------------------
{
  // 12a) index === aktif -> dogrudan state.tables.title (referans).
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2" }] }, titleUnits: [{ fields: {}, tables: {} }] });
  assert.equal(fns.setTitleUnitOwnerRowValue(0, 0, "c0", "Ahmet Yılmaz (Düzeltildi)"), true, "Aktif tasinmaza malik satiri yazma basarili donmeli.");
  assert.equal(fns.getState().tables.title[0].c0, "Ahmet Yılmaz (Düzeltildi)", "Aktif tasinmazin malik satirina yazilan deger state.tables.title'da gorunmeli.");

  // 12b) index === 0, primaryTitleUnitShadow HENUZ YOKSA -> otomatik olusur.
  fns.setState({ activeTitleUnitIndex: 1, fields: {}, tables: {}, primaryTitleUnitShadow: null, titleUnits: [{ fields: {}, tables: {} }] });
  assert.equal(fns.setTitleUnitOwnerRowValue(0, 0, "c0", "Golge Malik"), true, "primaryTitleUnitShadow yokken bile malik satiri yazma basarili donmeli.");
  assert.ok(fns.getState().primaryTitleUnitShadow, "Yoksa primaryTitleUnitShadow OTOMATIK olusturulmali.");
  assert.equal(fns.getState().primaryTitleUnitShadow.tables.title[0].c0, "Golge Malik", "Deger yeni olusturulan golge yuvanin tables.title'ina dogru yazilmali.");

  // 12c) index > 0, titleUnits[index-1] mevcut -> uzerine yazilir, DIGER
  // satirlar/sutunlar ETKILENMEZ.
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: {}, titleUnits: [{ fields: {}, tables: { title: [{ c0: "Eski Malik", c1: "1/1" }, { c0: "Ikinci Malik" }] } }] });
  assert.equal(fns.setTitleUnitOwnerRowValue(1, 0, "c0", "Guncel Malik"), true, "titleUnits[0]'un (index 1) malik satirina yazma basarili donmeli.");
  assert.equal(fns.getState().titleUnits[0].tables.title[0].c0, "Guncel Malik", "Hedeflenen satir/sutun guncellenmeli.");
  assert.equal(fns.getState().titleUnits[0].tables.title[0].c1, "1/1", "Ayni satirin DIGER sutunu (c1) ETKILENMEMELI.");
  assert.equal(fns.getState().titleUnits[0].tables.title[1].c0, "Ikinci Malik", "Diger satir (index 1) ETKILENMEMELI.");

  // 12d) addTitleUnitOwnerRow: yeni bos satir ekler, YENI index'i doner.
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: { title: [{ c0: "Tek Malik" }] }, titleUnits: [] });
  const newRowIndex = fns.addTitleUnitOwnerRow(0);
  assert.equal(newRowIndex, 1, "Yeni satir index 1 (2. satir) olmali.");
  assert.deepEqual(fns.getState().tables.title[1], {}, "Yeni eklenen satir BOS olmali.");

  // 12e) removeTitleUnitOwnerRow: gecerli index'te satiri kaldirir, DIGER
  // satirlar KAYMALI (splice); gecersiz index icin false doner.
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, tables: { title: [{ c0: "Birinci" }, { c0: "Ikinci" }, { c0: "Ucuncu" }] }, titleUnits: [] });
  assert.equal(fns.removeTitleUnitOwnerRow(0, 1), true, "Gecerli index'te satir silme basarili donmeli.");
  assert.deepEqual(fns.getState().tables.title.map((r) => r.c0), ["Birinci", "Ucuncu"], "Ortadaki satir (Ikinci) kaldirilip digerleri KORUNMALI.");
  assert.equal(fns.removeTitleUnitOwnerRow(0, 99), false, "Aralik disi satir index'i false donmeli, hata firlatmamali.");
  console.log("resolveTitleUnitOwnerRowsWriteTarget/setTitleUnitOwnerRowValue/addTitleUnitOwnerRow/removeTitleUnitOwnerRow 3-yonlu dallanma + satir ekle-sil testi tamam.");
}

// --- 13) buildTitleUnitsSummaryTableHtmlEditable(): "owner" sutunlari -----
// (Malik(ler) vb.) TUM satirlarda "tus-owner-cell" (popover tetikleyici) --
// ile isaretlenir, "tus-editable-cell" (inline duzenleme) ile DEGIL -------
// (Cift Yonlu Duzenleme, Faz 4, 2026-08-15) ---------------------------------
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, titlePropertyId: "AKTIF-ID", share: "50", denominator: "1000" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2" }] },
    titleUnits: [{ fields: { ...shared, titlePropertyId: "DIGER-ID", share: "40", denominator: "1000" }, tables: { title: [{ c0: "Ayşe Yılmaz", c1: "1/2" }] } }],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const malikColumnCount = data.columnMeta.filter((meta) => meta.kind === "owner").length;
  assert.ok(malikColumnCount > 0, "Fixture'da en az bir 'owner' sutunu (Malik(ler) vb.) olmali.");
  const expectedOwnerCellCount = malikColumnCount * data.rows.length;
  const actualOwnerCellCount = (html.match(/tus-owner-cell/g) || []).length;
  assert.equal(actualOwnerCellCount, expectedOwnerCellCount, `TUM satirlarin 'owner' sutunlari (${expectedOwnerCellCount} adet) 'tus-owner-cell' ile isaretlenmeliydi, bulunan: ${actualOwnerCellCount}.`);
  assert.ok(html.includes('data-unit-index="0"') && html.includes('data-unit-index="1"'), "Her iki tasinmazin da 'owner' hucreleri data-unit-index tasimali (popover hangi tasinmazi acacagini bilsin).");
  // "owner" hucrelerinde data-field-key OLMAMALI (tek alan degil, TUM
  // satir popover ile duzenleniyor) — yalnizca data-unit-index yeterli.
  const ownerCellMatch = html.match(/<td[^>]*class="tus-owner-cell"[^>]*>/);
  assert.ok(ownerCellMatch && !ownerCellMatch[0].includes("data-field-key"), "'owner' hucrelerinde data-field-key OLMAMALI (popover tum satiri acar).");
  console.log("buildTitleUnitsSummaryTableHtmlEditable 'owner' sutunlarinin tus-owner-cell ile isaretlenmesi testi tamam.");
}

// --- 14) openTitleUnitOwnerRowEditor() popover sutun etiketleri, "title" --
// bolumunun table.columns tanimiyla (kaynak-duzeyinde) senkron mu ----------
// (openTitleUnitOwnerRowEditor DOM/document.createElement agir kullandigi --
// icin sandbox'ta CALISTIRILAMAZ — bkz. tools/test-title-unit-switch.js'in --
// benzer "kaynak-duzeyi" kontrolleri, ayni teknik) --------------------------
{
  assert.match(
    appSource,
    /table:\s*\{\s*\n\s*title:\s*"Malikler",\s*\n\s*columns:\s*\["Malik",\s*"Hisse",\s*"Edinme sebebi",\s*"Tapu tarihi",\s*"Yevmiye"\]/,
    "\"title\" bolumunun table.columns tanimi degismis olabilir — openTitleUnitOwnerRowEditor'daki 'columns' dizisi ELLE senkron tutulmali."
  );
  assert.match(
    appSource,
    /function openTitleUnitOwnerRowEditor\(unitIndex\)\s*\{[\s\S]{0,400}const columns = \["Malik", "Hisse", "Edinme sebebi", "Tapu tarihi", "Yevmiye"\];/,
    "openTitleUnitOwnerRowEditor'daki 'columns' dizisi \"title\" bolumunun table.columns tanimiyla BIREBIR AYNI olmali."
  );
  console.log("openTitleUnitOwnerRowEditor sutun etiketleri kaynak-duzeyi senkron testi tamam.");
}

// --- 15) openTitleUnitOwnerRowEditor(): blur'da normalizeReportTableValue --
// ile AYNI normalizasyon uygulanmali (Cift Yonlu Duzenleme, kendi kendine ---
// derin test sirasinda BULUNAN gercek gap: popover'daki "input" dinleyicisi -
// yalnizca CANLI yaziyordu, GERCEK Malikler tablosunun blur'da yaptigi -----
// buyuk-harf/baslik-harf normalizasyonunu UYGULAMIYORDU — bu yuzden -------
// popover'dan girilen deger, gercek tablodan girilenle FARKLI bicimde ------
// saklanirdi (ozellikle "aktif OLMAYAN" tasinmaz icin, cunku o hicbir zaman -
// normalizeReportStateFields'in autosave-zamanli genel taramasindan --------
// GECMEZ — bkz. app.js normalizeReportStateFields yorumu). --------------
{
  assert.match(
    appSource,
    /function openTitleUnitOwnerRowEditor\(unitIndex\)[\s\S]{0,5000}?input\.addEventListener\("blur", \(\) => \{[\s\S]{0,80}?normalizeReportTableValue\(titleTableSection, columns\[columnIndex\], input\.value\)/,
    "openTitleUnitOwnerRowEditor'da malik satiri input'lari icin blur'da normalizeReportTableValue(titleTableSection, ...) cagrilan bir dinleyici bulunamadi — gercek Malikler tablosuyla (createTable) TUTARSIZ normalizasyon riski."
  );
  console.log("openTitleUnitOwnerRowEditor blur-normalizasyon (gercek tabloyla tutarlilik) kaynak-duzeyi testi tamam.");
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

// --- 16) buildTitleUnitsSummaryTableHtmlEditable(): "sutunun tumune ------
// uygula" butonu (2026-08-22) YALNIZCA scalar sutun basliklarinda --------
// gorunur — readonly/owner sutunlarinda YOK, dogru data-field-key/ --------
// data-column-label tasiyor. ------------------------------------------------
{
  const shared = { titleCity: "Bursa", titleDistrict: "Nilüfer", titleNeighborhood: "Özlüce", locationName: "-", sheetNo: "F21", blockNo: "4834", parcelNo: "1", landArea: "1200", mainPropertyQuality: "Arsa" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, titlePropertyId: "AKTIF-ID", share: "50", denominator: "1000" },
    tables: { title: [{ c0: "Ahmet Yılmaz", c1: "1/2" }] },
    titleUnits: [{ fields: { ...shared, titlePropertyId: "DIGER-ID", share: "40", denominator: "1000" }, tables: { title: [{ c0: "Ayşe Yılmaz", c1: "1/2" }] } }],
  });
  const data = fns.buildTitleUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((meta) => meta.kind === "scalar").length;
  const nonScalarCount = data.columnMeta.filter((meta) => meta.kind !== "scalar").length;
  assert.ok(scalarCount > 0, "Fixture'da en az bir 'scalar' sutun olmali.");
  assert.ok(nonScalarCount > 0, "Fixture'da en az bir scalar-OLMAYAN (readonly/owner) sutun olmali (butonun YOKLUGUNU test edebilmek icin).");
  const buttonCount = (html.match(/tus-apply-column-btn/g) || []).length;
  assert.equal(buttonCount, scalarCount, `"Tumune uygula" butonu YALNIZCA scalar sutunlarda (${scalarCount} adet) gorunmeliydi, bulunan: ${buttonCount}.`);
  // titlePropertyId (scalar) sutununun basliginda dogru data-field-key/
  // data-column-label tasiyan bir buton olmali.
  const propertyIdIndex = data.headers.findIndex((label, index) => data.columnMeta[index]?.fieldKey === "titlePropertyId");
  assert.ok(propertyIdIndex >= 0, "Fixture'da titlePropertyId sutunu bulunamadi.");
  assert.match(
    html,
    /<button type="button" class="tus-apply-column-btn" data-field-key="titlePropertyId" data-column-label="[^"]*"[^>]*>/,
    "titlePropertyId sutununun basliginda dogru data-field-key tasiyan 'tumune uygula' butonu bulunamadi."
  );
  console.log("buildTitleUnitsSummaryTableHtmlEditable 'sutunun tumune uygula' butonu (yalnizca scalar sutunlar) testi tamam.");
}

// --- Eski Ada/Eski Parsel (2026-08-27, kullanici talebi: "TAPU BOLUMUNDE ---
// IL ILCE MAHALLE MEVKII PAFTA ESKI ADA ESKI PARSEL BOLUMLERINI EKLEYELIM")
// - oldBlockNo/oldParcelNo tabloya eklendi (Tapu bolumunde ZATEN var olan
// form alanlari, tabloya hic yansimiyordu). BESINCI/SON tur (2026-08-27):
// "sadece il ilce mahalle mevkii pafta, ada parsel ortak olsun. digerleri
// ortak olmasin eskiye don" - kullanici Eski Ada/Eski Parsel'i bu listeye
// DAHIL ETMEDI, bu yuzden artik Blok/Kat/BB No gibi HER ZAMAN normal
// sutun (asla "ortak"a tasinmayan) oldular - ne aynı olsalar bile
// commonFields'e tasinirlar.
{
  // 1) Farkli "Eski Ada"/"Eski Parsel" -> normal sutun olarak kalir.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titlePropertyId: "1", blockNo: "500", parcelNo: "10", oldBlockNo: "12", oldParcelNo: "3" },
    tables: {},
    titleUnits: [
      unit({ titlePropertyId: "2", blockNo: "500", parcelNo: "10", oldBlockNo: "13", oldParcelNo: "4" }),
    ],
  });
  const dataDiff = fns.buildTitleUnitsSummaryTableData();
  assert.ok(dataDiff.headers.includes("Eski Ada"), "\"Eski Ada\" farkli oldugunda sutun olarak KALMALI.");
  assert.ok(dataDiff.headers.includes("Eski Parsel"), "\"Eski Parsel\" farkli oldugunda sutun olarak KALMALI.");
  const oldBlockIdx = dataDiff.headers.indexOf("Eski Ada");
  const oldParcelIdx = dataDiff.headers.indexOf("Eski Parsel");
  assert.equal(dataDiff.rows[0][oldBlockIdx], "12", "1. tasinmazin Eski Ada degeri dogru sutunda olmali.");
  assert.equal(dataDiff.rows[1][oldParcelIdx], "4", "2. tasinmazin Eski Parsel degeri dogru sutunda olmali.");
  assert.equal(dataDiff.columnMeta[oldBlockIdx].fieldKey, "oldBlockNo", "Eski Ada -> oldBlockNo eslesmeli.");
  assert.equal(dataDiff.columnMeta[oldParcelIdx].fieldKey, "oldParcelNo", "Eski Parsel -> oldParcelNo eslesmeli.");

  // 2) Ayni (dolu) "Eski Ada"/"Eski Parsel" -> ARTIK sutun olarak KALIR,
  // commonFields'e HICBIR ZAMAN tasinmaz (Ada/Parsel BILEREK farkli
  // tutuldu ki zorla-gizleme kurali devreye girmesin).
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titlePropertyId: "1", blockNo: "500", parcelNo: "10", oldBlockNo: "12", oldParcelNo: "3" },
    tables: {},
    titleUnits: [
      unit({ titlePropertyId: "2", blockNo: "600", parcelNo: "20", oldBlockNo: "12", oldParcelNo: "3" }),
    ],
  });
  const dataSame = fns.buildTitleUnitsSummaryTableData();
  assert.ok(dataSame.headers.includes("Eski Ada"), "\"Eski Ada\" TUM tasinmazlarda ayni olsa bile sutun olarak KALMALI.");
  assert.ok(dataSame.headers.includes("Eski Parsel"), "\"Eski Parsel\" TUM tasinmazlarda ayni olsa bile sutun olarak KALMALI.");
  const commonLabels = dataSame.commonFields.map((field) => field.label);
  assert.ok(!commonLabels.includes("Eski Ada"), "\"Eski Ada\" ASLA commonFields'e tasinmamali (artik \"ortak\" degil).");
  assert.ok(!commonLabels.includes("Eski Parsel"), "\"Eski Parsel\" ASLA commonFields'e tasinmamali (artik \"ortak\" degil).");
  console.log("Eski Ada/Eski Parsel (artik HER ZAMAN normal sutun, asla ortak olmaz) testi tamam.");
}

console.log("Tasinmazlar tapu ozeti tablosu testleri basarili.");
