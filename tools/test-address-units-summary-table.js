// Çoklu taşınmazlı raporlarda ADRES bilgilerini özetleyen tablo (2026-08-15).
// Kullanıcı talebi: "adres ve konum bölümü için aynı mantıkta tablo
// oluşturalım" — Tapu özet tablosuyla (bkz. tools/test-title-units-summary-table.js,
// buildTitleUnitsSummaryTableData) BİREBİR AYNI desen, Adres ve Konum
// bölümü alanları için: buildAllTitleUnitsForSummaryTable() ve
// buildTitleUnitsSummaryTableHtmlFromData() DOĞRUDAN yeniden kullanılıyor
// (ikinci bir "tüm taşınmazları oku"/"HTML üret" fonksiyonu YAZILMADI).
//
// Bu test kapsamı:
//  1) "aynı ise gizlensin" kuralı: İl/İlçe/İdari Mahalle/Sokak-Cadde/
//     Site-Apartman'dan TÜM taşınmazlarda AYNI olanlar sütun listesinden
//     ÇIKARILIYOR, FARKLI olanlar KALIYOR.
//  2) "diğer bölümler" (Blok/Giriş/Dış Kapı No/Kat/İç Kapı No) HER ZAMAN
//     gösteriliyor; UAVT Sıra No'nun HEMEN ardından geliyor.
//  3) Tüm taşınmazlarda BOŞ olan sütun (ör. hiçbir taşınmazda "Giriş"
//     kullanılmıyorsa) tamamen kaldırılıyor (Tapu tablosuyla AYNI kural).
//  4) Tekil raporda (1 taşınmaz) null / boş HTML dönüyor.
//  5) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + HER ZAMAN
//     büyük harf + 2 satırlı başlık (buildTitleUnitsSummaryTableHtmlFromData
//     üzerinden, Tapu tablosuyla AYNI görsel dil).
//  6) template-engine.js'te {{TASINMAZLARADRESTABLOSU}} kayıtlı mı.

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

// app.js CRLF satır sonlarıyla saklanıyor — "[" / "]" derinliğine göre
// sabitin GERÇEK sonunu bulan yöntem (bkz. diğer test dosyalarındaki AYNI
// teknik, ör. test-title-units-summary-table.js).
function extractConst(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
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

// extractConst()'un "const X = new Set([...])" bicimindeki sabitler icin
// AYNI teknikle uyarlanmis hali (2026-08-22).
function extractSetConst(name) {
  const marker = `const ${name} = new Set([`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Set sabiti bulunamadı: ${name}`);
  let index = start + marker.length - 1; // "[" karakterinin kendisi
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, appSource.indexOf(")", index) + 1)};`;
    }
  }
  throw new Error(`Set sabiti sonu bulunamadı: ${name}`);
}

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  // TÜM 8 "çift taraflı" özet tablosunun PAYLAŞTIĞI son adım (2026-08-27).
  "finalizeTitleUnitsSummaryTableData",
  "buildAddressUnitsSummaryTableData",
  "buildAddressUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  // Çift Yönlü Düzenleme, Faz 2 (2026-08-15) — bkz. test-title-units-summary-table.js'teki
  // aynı isimli yorum: export'tan AYRI, yalnızca ekran-içi düzenlenebilir
  // önizleme için kullanılan (Tapu VE Adres tablosunca PAYLAŞILAN) renderer.
  "buildTitleUnitsSummaryTableHtmlEditable",
  // buildTitleUnitsSummaryTableHtmlEditable() 2026-08-27'den itibaren bu
  // fonksiyonu KOŞULSUZ çağırıyor (commonFields banner'ı, bkz. app.js).
  "buildTitleUnitsSummaryTableCommonFieldsHtml",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik bunlara bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  // "Ayni ada/parselde tumu bos olsa bile HER ZAMAN goster" istisnasi
  // (2026-08-22) icin.
  "computeTitleUnitsShareSameAdaParsel",
];
const constNames = ["ADDRESS_UNITS_TABLE_SHARED_FIELD_DEFS"];
const setConstNames = ["ADDRESS_UNITS_TABLE_ALWAYS_VISIBLE_WHEN_SAME_ADA_PARSEL_KEYS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${setConstNames.map(extractSetConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildAllTitleUnitsForSummaryTable,
    buildAddressUnitsSummaryTableData, buildAddressUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) İl/İlçe/İdari Mahalle/Sokak-Cadde/Site-Apartman: TÜM taşınmazlarda
// BİREBİR aynıysa artık SÜTUN OLARAK KALDIRILIP tablonun ÜSTÜNDE "Ortak
// Bilgiler" satırında gösterilir (0.0.581, kullanıcı talebi: "TÜM ÇİFT
// TARAFLI tabloların en üstünde ortak değerleri belirt örnek il ilçe
// mahalle gibi"). ESKİ davranış (2026-08-15: "Aynı ise gizlensin ... adres
// tablosu için iptal edilsin" — o zamanki "gizlensin" şikayeti, hiçbir
// yerde GÖSTERİLMEDEN sessizce kaybolmaktı) artık GEÇERSİZ — bilgi HÂLÂ
// görünür, yalnızca satır satır TEKRARLANMAK yerine ÜSTTE TEK satırda.
// Diğer (satır satır FARKLI olan) bölümler AYNI şekilde sütun olarak kalır.
{
  const shared = { city: "Bursa", district: "Nilüfer", neighborhood: "Özlüce", street: "Atatürk Caddesi", addressSiteName: "Yeşil Vadi Sitesi" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, uavt: "123456789", addressBlockName: "A", addressEntrance: "1", outerDoor: "3", addressFloor: "2", innerDoor: "5" },
    tables: {},
    titleUnits: [
      { fields: { ...shared, uavt: "123456790", addressBlockName: "A", addressEntrance: "1", outerDoor: "4", addressFloor: "2", innerDoor: "6" }, tables: {} },
      { fields: { ...shared, uavt: "123456791", addressBlockName: "B", addressEntrance: "2", outerDoor: "1", addressFloor: "1", innerDoor: "1" }, tables: {} },
    ],
  });
  const data = fns.buildAddressUnitsSummaryTableData();
  assert.ok(data, "3 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 3, "3 satır (3 taşınmaz) bekleniyordu.");
  // İl/İlçe/İdari Mahalle/Sokak-Cadde/Site-Apartman TAMAMI AYNI olduğundan
  // artık SÜTUN OLARAK KALKMALI (commonFields'e taşınmalı).
  ["İl", "İlçe", "İdari Mahalle", "Sokak / Cadde", "Site / Apartman"].forEach((col) => {
    assert.ok(!data.headers.includes(col), `"${col}" sütunu (TÜM taşınmazlarda aynı) KALDIRILIP commonFields'e taşınmalıydı, bulunan başlıklar: ${data.headers.join(", ")}`);
  });
  const commonLabels = data.commonFields.map((field) => field.label);
  ["İl", "İlçe", "İdari Mahalle", "Sokak / Cadde", "Site / Apartman"].forEach((label) => {
    assert.ok(commonLabels.includes(label), `"${label}" commonFields'te OLMALI, bulunan: ${commonLabels.join(", ")}`);
  });
  assert.equal(data.commonFields.find((field) => field.label === "İl")?.value, "Bursa", "\"İl\" ortak değeri doğru olmalı.");
  // Blok/Giriş/Dış Kapı No/Kat/İç Kapı No taşınmaz başına FARKLI olduğundan
  // normal sütun olarak KALMALI.
  ["Sıra No", "UAVT", "Blok", "Giriş", "Dış Kapı No", "Kat", "İç Kapı No"].forEach((col) => {
    assert.ok(data.headers.includes(col), `"${col}" sütunu (taşınmaz başına farklı) HER ZAMAN gösterilmeliydi, bulunan başlıklar: ${data.headers.join(", ")}`);
  });
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  assert.equal(data.headers[1], "UAVT", "\"UAVT\" Sıra No'nun HEMEN ardından gelmeli (Tapu tablosunun Taşınmaz Kimlik No deseniyle AYNI).");
  assert.deepEqual(data.rows.map((row) => row[0]), [1, 2, 3], "Sıra No 1'den başlayıp sırayla artmalı.");
  const uavtColumnIndex = data.headers.indexOf("UAVT");
  assert.equal(data.rows[0][uavtColumnIndex], "123456789", "1. taşınmazın UAVT'si doğru sütunda olmalı.");
  assert.equal(data.rows[2][uavtColumnIndex], "123456791", "3. taşınmazın UAVT'si doğru sütunda olmalı.");
  const outerDoorColumnIndex = data.headers.indexOf("Dış Kapı No");
  assert.equal(data.rows[1][outerDoorColumnIndex], "4", "2. taşınmazın Dış Kapı No'su doğru sütunda olmalı.");
  console.log("Il/Ilce/Idari Mahalle/Sokak-Cadde/Site-Apartman (ayni oldugundan ortak bilgi olarak ustte) + farkli bolumler sutun olarak kalma kurali testi tamam.");
}

// --- 1b) Mevkii/Ada/Parsel: Tapu ve Mülkiyet'in KENDİ alanlarından ---------
// (locationName/blockNo/parcelNo) çekilir (2026-08-17, kullanıcı talebi:
// "adres ve konumda yer alan çoklu taleplerde kullanılan tabloda Mevkii Ada
// ve Parsel Bilgisi Tapu Kayıtlarından çekilsin") — Adres ve Konum
// bölümünün KENDİ bir Mevkii/Ada/Parsel alanı YOK, bu üçü zaten Tapu
// bölümünün ("title" section) alanları; İdari Mahalle'den SONRA, Sokak/
// Cadde'den ÖNCE gelmeli, "scalar" (düzenlenebilir) olmalı ve Tapu
// tablosunda kullanılan AYNI anahtarları (locationName/blockNo/parcelNo)
// okumalı — iki ayrı kopya YOK, TEK kaynak.
{
  // NOT (2026-08-27): Mevkii/Ada/İdari Mahalle/Sokak-Cadde burada BİLEREK
  // taşınmaz başına FARKLI tutuldu (yalnızca Parsel değil) — aksi halde
  // "TÜM taşınmazlarda aynı" hoisting kuralı (bkz. finalizeTitleUnitsSummaryTableData)
  // bunları commonFields'e taşır, bu senaryonun ASIL amacı olan "sütun
  // sırası (İdari Mahalle ile Sokak/Cadde ARASINDA) + doğru kaynaktan
  // okuma" kontrolünü test edemez hale gelirdi (o iki anchor sütunun
  // kendisi de tabloda GÖRÜNMESİ gerekiyor).
  const shared = { city: "Bursa", district: "Nilüfer", addressSiteName: "Yeşil Vadi Sitesi" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, uavt: "123456789", neighborhood: "Özlüce", street: "Atatürk Caddesi", locationName: "Karaağaç Mevkii", blockNo: "1010", parcelNo: "5" },
    tables: {},
    titleUnits: [
      { fields: { ...shared, uavt: "123456790", neighborhood: "Görükle", street: "İnönü Caddesi", locationName: "Sahil Mevkii", blockNo: "1011", parcelNo: "6" }, tables: {} },
    ],
  });
  const data = fns.buildAddressUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  ["Mevkii", "Ada", "Parsel"].forEach((col) => {
    assert.ok(data.headers.includes(col), `"${col}" sütunu tabloya EKLENMİŞ olmalıydı, bulunan başlıklar: ${data.headers.join(", ")}`);
  });
  const neighborhoodIdx = data.headers.indexOf("İdari Mahalle");
  const mevkiiIdx = data.headers.indexOf("Mevkii");
  const adaIdx = data.headers.indexOf("Ada");
  const parselIdx = data.headers.indexOf("Parsel");
  const streetIdx = data.headers.indexOf("Sokak / Cadde");
  assert.ok(
    neighborhoodIdx < mevkiiIdx && mevkiiIdx < adaIdx && adaIdx < parselIdx && parselIdx < streetIdx,
    `Mevkii/Ada/Parsel, İdari Mahalle ile Sokak/Cadde ARASINDA (bu sırada) olmalı: ${data.headers.join(", ")}`
  );
  assert.equal(data.rows[0][mevkiiIdx], "Karaağaç Mevkii", "1. taşınmazın Mevkii'si locationName'den gelmeli.");
  assert.equal(data.rows[0][adaIdx], "1010", "1. taşınmazın Ada'sı blockNo'dan gelmeli.");
  assert.equal(data.rows[0][parselIdx], "5", "1. taşınmazın Parsel'i parcelNo'dan gelmeli.");
  assert.equal(data.rows[1][parselIdx], "6", "2. taşınmazın Parsel'i (farklı) kendi parcelNo'sundan gelmeli.");
  assert.equal(data.columnMeta[mevkiiIdx].kind, "scalar", "Mevkii sütunu 'scalar' (düzenlenebilir) olmalı.");
  assert.equal(data.columnMeta[mevkiiIdx].fieldKey, "locationName", "Mevkii -> locationName eslesmeli (Tapu ile AYNI alan, ikinci kopya yok).");
  assert.equal(data.columnMeta[adaIdx].fieldKey, "blockNo", "Ada -> blockNo eslesmeli.");
  assert.equal(data.columnMeta[parselIdx].fieldKey, "parcelNo", "Parsel -> parcelNo eslesmeli.");
  console.log("Mevkii/Ada/Parsel (Tapu Kayitlarindan) adres tablosuna eklenme testi tamam.");
}

// --- 2) Tüm taşınmazlarda BOŞ olan sütun TAMAMEN kaldırılır ---------------
// (Tapu tablosundaki AYNI kural, 0.0.451) — ör. site içi taşınmazlarda
// "Giriş" hiç kullanılmıyorsa (hepsi boş) kaldırılmalı, dolu kalan
// sütunlar (UAVT, Blok, Dış Kapı No, Kat) etkilenmemeli. "İç Kapı No" da
// (aşağıdaki 2b istisnasının TETİKLENMEMESİ için) burada BİLEREK FARKLI
// ada/parselli taşınmazlarla test ediliyor — aynı ada/parsel senaryosu
// AYRICA 2b'de test ediliyor.
{
  const shared = { city: "İzmir", district: "Bornova", neighborhood: "Erzene", street: "-", addressSiteName: "-" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, blockNo: "100", parcelNo: "5", uavt: "999001", addressBlockName: "C", addressEntrance: "", outerDoor: "12", addressFloor: "3", innerDoor: "" },
    tables: {},
    titleUnits: [
      { fields: { ...shared, blockNo: "200", parcelNo: "9", uavt: "999002", addressBlockName: "C", addressEntrance: "", outerDoor: "13", addressFloor: "4", innerDoor: "" }, tables: {} },
    ],
  });
  const data = fns.buildAddressUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  ["Giriş", "İç Kapı No"].forEach((col) => {
    assert.ok(!data.headers.includes(col), `Farklı ada/parselde, tüm taşınmazlarda BOŞ olan "${col}" sütunu KALDIRILMALIYDI, bulunan başlıklar: ${data.headers.join(", ")}`);
  });
  // İl/İlçe/İdari Mahalle DOLU ve TÜM taşınmazlarda AYNI ("İzmir"/"Bornova"/
  // "Erzene") — artık (0.0.581) sütun olarak KALKAR, commonFields'e taşınır.
  ["İl", "İlçe", "İdari Mahalle"].forEach((label) => {
    assert.ok(!data.headers.includes(label), `Dolu AMA TÜM taşınmazlarda aynı "${label}" sütunu commonFields'e taşınmalıydı, bulunan başlıklar: ${data.headers.join(", ")}`);
    assert.ok(data.commonFields.some((field) => field.label === label), `"${label}" commonFields'te bulunamadı.`);
  });
  ["Sıra No", "UAVT", "Blok", "Dış Kapı No", "Kat"].forEach((col) => {
    assert.ok(data.headers.includes(col), `Dolu VE taşınmaz başına farklı "${col}" sütunu KORUNMALIYDI, bulunan başlıklar: ${data.headers.join(", ")}`);
  });
  console.log("Tum tasinmazlarda bos olan sutunun kaldirilma + ayni-dolu sutunun ortak-bilgiye tasinma testi tamam.");
}

// --- 2b) YENİ (2026-08-22, ekran görüntüsüyle): "görselde mavi kutucuk ----
// ile işaretlenen alanlar aynı ada parsel taleplerinde mutlaka olması
// gereken alanlar ... bu alanlar tamamı boş olsa bile aynı ada parsel
// çoklu taleplerinde sütun olarak gözükmeli" — Sokak/Cadde, Blok, Dış
// Kapı No, İç Kapı No, UAVT AYNI ada/parselde TÜMÜ BOŞ olsa bile HER ZAMAN
// gösterilmeli (veri girişi hatırlatıcısı); "Giriş" (bu istisnaya DAHİL
// DEĞİL) yine de kaldırılmalı.
{
  const shared = { city: "Düzce", district: "Merkez", neighborhood: "Sancaklar", street: "", addressSiteName: "-", blockNo: "0", parcelNo: "709" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, uavt: "", addressBlockName: "", addressEntrance: "", outerDoor: "", addressFloor: "1", innerDoor: "" },
    tables: {},
    titleUnits: [
      { fields: { ...shared, uavt: "", addressBlockName: "", addressEntrance: "", outerDoor: "", addressFloor: "2", innerDoor: "" }, tables: {} },
    ],
  });
  const data = fns.buildAddressUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı (aynı ada/parsel) raporda tablo verisi dönmeli.");
  ["UAVT", "Sokak / Cadde", "Blok", "Dış Kapı No", "İç Kapı No"].forEach((col) => {
    assert.ok(data.headers.includes(col), `Aynı ada/parselde, "${col}" sütunu TÜMÜ BOŞ olsa bile HER ZAMAN gösterilmeliydi, bulunan başlıklar: ${data.headers.join(", ")}`);
  });
  assert.ok(!data.headers.includes("Giriş"), "\"Giriş\" (istisna listesine DAHİL DEĞİL) tümü boşken yine de kaldırılmalıydı.");
  assert.ok(data.headers.includes("Kat"), "Dolu olan \"Kat\" sütunu KORUNMALIYDI.");
  console.log("Ayni ada/parselde 5 kimlik alani (UAVT/Sokak-Cadde/Blok/Dis Kapi No/Ic Kapi No) tumu bos olsa bile HER ZAMAN gosterilir testi tamam.");
}

// --- 3) Tekil raporda (1 taşınmaz) tablo üretilmemeli ----------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: { city: "Bursa" }, tables: {}, titleUnits: [] });
  assert.equal(fns.buildAddressUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildAddressUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı (placeholder temiz silinsin).");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 4) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + BÜYÜK ------
// harf + 2 satırlı başlık (Tapu tablosuyla AYNI görsel dil, aynı
// buildTitleUnitsSummaryTableHtmlFromData üzerinden).
{
  const shared = { city: "Bursa", district: "Nilüfer", neighborhood: "Özlüce", street: "-", addressSiteName: "-" };
  fns.setState({
    activeTitleUnitIndex: 0,
    // Not: küçük harfli değer BİLEREK kullanıldı — "sistemde harfler
    // küçükte olsa büyükte olsa tabloda tüm harfler daima büyük olacak"
    // kuralının bu tabloda da (aynı ortak HTML üreticiden geldiği için)
    // geçerli olduğunu doğrulamak için.
    fields: { ...shared, uavt: "111", addressBlockName: "a blok", outerDoor: "5" },
    tables: {},
    titleUnits: [{ fields: { ...shared, uavt: "222", addressBlockName: "b blok", outerDoor: "6" }, tables: {} }],
  });
  const html = fns.buildAddressUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Geçerli bir <table> HTML'i üretilmeli.");
  assert.ok(html.includes("table-layout:auto"), "Sütun genişlikleri DİNAMİK (table-layout:auto) olmalı.");
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tüm hücreler yatay VE dikey ortalı olmalı.");
  assert.ok(html.includes("A BLOK") && html.includes("B BLOK"), "Küçük harfli girdi BÜYÜK harfe çevrilmeli.");
  assert.ok(!html.includes("a blok") && !html.includes("b blok"), "Küçük harfli orijinal metin HTML çıktısında KALMAMALI.");
  assert.ok(html.includes("DIŞ<br>KAPI NO") || html.includes("DIŞ KAPI<br>NO"), "\"Dış Kapı No\" başlığı BÜYÜK harfle VE <br> ile 2 satıra bölünmüş olmalı.");
  console.log("buildAddressUnitsSummaryWordTableHtml gercek HTML uretimi (dinamik genislik + ortalama + daima BUYUK harf) testi tamam.");
}

// --- 4b) columnMeta: headers ile hizali, tamami "scalar" (owner/computed --
// sütunu yok) — Çift Yönlü Düzenleme, Faz 2 (2026-08-15) --------------------
{
  const shared = { city: "Bursa", district: "Nilüfer", neighborhood: "Özlüce", street: "Atatürk Caddesi", addressSiteName: "Yeşil Vadi Sitesi" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { ...shared, uavt: "123456789", addressBlockName: "A", addressEntrance: "1", outerDoor: "3", addressFloor: "2", innerDoor: "5" },
    tables: {},
    titleUnits: [
      { fields: { ...shared, uavt: "123456790", addressBlockName: "A", addressEntrance: "1", outerDoor: "4", addressFloor: "2", innerDoor: "6" }, tables: {} },
    ],
  });
  const data = fns.buildAddressUnitsSummaryTableData();
  assert.ok(Array.isArray(data.columnMeta), "columnMeta dizisi donmeli.");
  assert.equal(data.columnMeta.length, data.headers.length, "columnMeta, headers ile AYNI uzunlukta olmali.");
  assert.equal(data.columnMeta[0].kind, "seq", "Ilk sutun (Sira No) 'seq' olmali.");
  const uavtColumnIndex = data.headers.indexOf("UAVT");
  assert.equal(data.columnMeta[uavtColumnIndex].kind, "scalar", "UAVT 'scalar' olmali.");
  assert.equal(data.columnMeta[uavtColumnIndex].fieldKey, "uavt", "UAVT -> uavt eslesmeli.");
  // NOT: "İl" burada KULLANILMIYOR — fixture'daki tüm taşınmazlarda aynı
  // olduğundan artık commonFields'e taşınıyor (bkz. finalizeTitleUnitsSummaryTableData);
  // fieldKey eşleme kontrolü için her zaman sütun olarak kalan (hoist-exempt)
  // "Blok" kullanılıyor.
  const blockColumnIndex = data.headers.indexOf("Blok");
  assert.equal(data.columnMeta[blockColumnIndex].fieldKey, "addressBlockName", "Blok -> addressBlockName eslesmeli.");
  assert.ok(data.columnMeta.every((meta) => meta.kind === "seq" || meta.kind === "scalar"), "Adres tablosunda 'owner'/'computed' turu OLMAMALI (tumu seq/scalar).");
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  // Çift Yönlü Düzenleme, Faz 3 (2026-08-15): "yalnızca aktif satır"
  // kısıtlaması kaldırıldı — artık TÜM satırların (data.rows.length) scalar
  // sütunları düzenlenebilir işaretlenir; aktif satır (index 0) yalnızca
  // GÖRSEL olarak "tus-active-row" sınıfıyla ayrıca vurgulanır.
  const expectedEditableCount = data.columnMeta.filter((meta) => meta.kind === "scalar").length * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `TUM satirlarin scalar sutunlari (${expectedEditableCount} adet) duzenlenebilir isaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  assert.ok(html.includes('<tr class="tus-active-row">'), "Aktif satir (index 0) GORSEL olarak 'tus-active-row' sinifiyla isaretlenmeli.");
  console.log("buildAddressUnitsSummaryTableData columnMeta esleme + buildTitleUnitsSummaryTableHtmlEditable isaretleme testi tamam.");
}

// --- 5) template-engine.js'te {{TASINMAZLARADRESTABLOSU}} kayıtlı mı -------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARADRESTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildAddressUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARADRESTABLOSU}} -> buildAddressUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARADRESTABLOSU}} template-engine.js kablolama testi tamam.");
}

console.log("Tasinmazlar adres ozeti tablosu testleri basarili.");
