// "Açık Adres (Çoklu Taşınmaz)" — çoklu taleplerde açık adresin aynı/
// farklı ada-parsel durumuna göre nasıl birleştirileceği (2026-09-02).
// Kullanıcı talebi #1: "çoklu taleplerde açık adres aynı ada parsel ve
// farklı ada parselli raporlarda nasıl yazılmalı ... öncelikle açık
// adres çoklu olarak açıklamalar kısmına yeni bir bölüm oluştur ve bu
// bölüme placeholder ata."
// Kullanıcı takip talebi #2 (TAM örnekle, AYNI ada/parsel kuralı, İLK
// tur): "önce aynı ada parsel yapalım. aynı ada parselde mahalle ortak
// olacak, tüm taşınmazlar aynı sokak yada cadde üzerinde ise sokak ismi
// yazılacak, farklı sokak yada caddede ise sokak/cadde bölümlerine göre
// gruplanacak (Örnek: Osmaniye Mahallesi, Kılıç Sokak, Asya Sitesi, No:
// 13A, A Blok K:1, D: 3 ve Kalkan Caddesi B Blok No: 13B, D:11)."
// Kullanıcı takip talebi #3 (GERÇEK çıktı üzerinden düzeltme, İKİNCİ
// tur): "Teferrüç Mahallesi, 2.Aydın Caddesi, Asya Apartmanı, No: 1-3,
// Kat: 2, D: 7, Asya Apartmanı, No: 1-3, Kat: 3.+ Çatı, D: 16 bu
// sistemin oluşturduğu. ancak benim istediğim farklı. Benim istediğim
// çıktı: Teferrüç Mahallesi, 2.Aydın Caddesi, Asya Apartmanı, No: 1-3,
// D:7-16, Yıldırım / Bursa ... çoklu aynı ada parsel taleplerinde kat
// bölümünü yazmana gerek yok blok olsaydı Asya Sitesi A Blok D: 7-16 ve
// B Blok, D:8-12 şeklinde olmalı."
//
// buildOpenAddressText() (GERÇEK fonksiyon, isLandPropertyForBankTemplate
// gibi geniş bir bağımlılık ağacına sahip) FARKLI-ada/parsel dalında
// HÂLÂ BİLEREK extract EDİLMEZ (davranış-koruyan SAHTE) — proje
// konvansiyonu. AYNI-ada/parsel dalı ise (buildSameAdaParselOpenAddressText)
// buildOpenAddressText()'e HİÇ bağımlı DEĞİL (ham state.fields alanlarını
// doğrudan okur, kendi stil sistemini — openAddressStyleVariants/
// formatOpenAddressNeighborhood/formatOpenAddressBuildingName/
// selectVariant — kullanır) — bunlar GERÇEK olarak extract edilir.
//
// Kapsanan senaryolar:
//  1) Tekil rapor (1 taşınmaz): buildOpenAddressText() SONUCU AYNEN döner
//     (davranış DEĞİŞMEDİ).
//  2) AYNI ada/parsel, TÜM taşınmazlar AYNI sokakta, BLOK YOK: kullanıcının
//     GÜNCEL (2. tur) hedefiyle BİREBİR — Site/No BİR KEZ, Kat HİÇ
//     yazılmaz, daireler TEK aralığa ("D:min-max") indirgenir, İlçe/İl
//     en sona eklenir.
//  3) AYNI ada/parsel, FARKLI sokak/caddede, BLOK YOK: gruplar " ve "
//     ile bağlanır.
//  4) AYNI ada/parsel, TEK sokak, BLOK VAR: kullanıcının BLOK örneğiyle
//     BİREBİR ("Asya Sitesi A Blok D:... ve B Blok D:...").
//  5) formatDaireRangeList(): sayısal sıralama + min-max aralığı,
//     tek değer, sayısal olmayan değerler için ilk-son.
//  6) FARKLI ada/parsel: HER taşınmaz KENDİ Ada Parsel etiketiyle ayrı
//     satırda (DEĞİŞMEDİ — bu dal henüz kullanıcı tarafından
//     netleştirilmedi, "önce aynı ada parsel yapalım").
//  7) "explanations" bölümünde yeni alan tanımlı mı (kaynak-düzeyi).
//  8) refreshMultiUnitOpenAddressTextFromCurrentFields merkezi
//     dispatcher'a kablolanmış mı (kaynak-düzeyi, 2 çağrı noktası).
//  9) template-engine.js'te {{ACIKADRESCOKLU}} kayıtlı mı.
//  10) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı.

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
// sabitin GERÇEK sonunu bulan yöntem (diğer test dosyalarındaki AYNI teknik).
function extractConstArray(name) {
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

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "computeTitleUnitTabLabel",
  "computeTitleUnitsShareSameAdaParsel",
  "groupMainPropertyBlocksByText",
  "normalizeTextForSimilarityComparison",
  "foldTurkish",
  "selectVariant",
  "formatOpenAddressNeighborhood",
  "formatOpenAddressBuildingName",
  "joinAddressGroupTexts",
  "formatDaireRangeList",
  "buildSameAdaParselOpenAddressText",
  "buildMultiUnitOpenAddressText",
];
const constArrayNames = ["openAddressStyleVariants"];

const sandboxSource = `
  let state = {};
  // registerVariantGroup: openAddressStyleVariants sabitinin HEMEN
  // ardından çağrılan admin-varyant-kayıt fonksiyonu — bu testin kapsamı
  // DEĞİL, zararsız bir SAHTE ile değiştirilir.
  function registerVariantGroup() {}
  // GERÇEK buildOpenAddressText() (bkz. dosya başı yorumu) BİLEREK
  // extract EDİLMEZ — davranış-koruyan basit bir SAHTE: state.fields.mockAddress'i
  // aynen döner (her taşınmazın "hesaplanmış açık adresi" olarak, YALNIZCA
  // FARKLI-ada/parsel dalı için kullanılır).
  function buildOpenAddressText() {
    return state.fields.mockAddress || "";
  }
  ${constArrayNames.map(extractConstArray).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    buildMultiUnitOpenAddressText,
    formatDaireRangeList,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

// --- 1) Tekil rapor: buildOpenAddressText() sonucu AYNEN döner -----------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { mockAddress: "Merkez Mahallesi, Atatürk Caddesi No:5, Kadıköy / İstanbul" },
    tables: {},
    titleUnits: [],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(result, "Merkez Mahallesi, Atatürk Caddesi No:5, Kadıköy / İstanbul", "Tekil raporda buildOpenAddressText() sonucu AYNEN dönmeli.");
  console.log("Tekil rapor (davranis degismedi) testi tamam.");
}

// --- 2) AYNI ada/parsel, TÜM taşınmazlar AYNI sokakta, BLOK YOK ----------
// (kullanıcının GÜNCEL/2. tur örneğiyle BİREBİR — Site/No BİR KEZ, Kat
// HİÇ yazılmaz, daireler "D:min-max" aralığına indirgenir, İlçe/İl sona
// eklenir).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Teferrüç", street: "2.Aydın Caddesi", addressSiteName: "Asya Apartmanı",
      outerDoor: "1-3", addressFloor: "2", innerDoor: "7",
      district: "Yıldırım", city: "Bursa",
    },
    tables: {},
    titleUnits: [unit({
      blockNo: "100", parcelNo: "5",
      neighborhood: "Teferrüç", street: "2.Aydın Caddesi", addressSiteName: "Asya Apartmanı",
      outerDoor: "1-3", addressFloor: "3.+ Çatı", innerDoor: "16",
      district: "Yıldırım", city: "Bursa",
    })],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    result,
    "Teferrüç Mahallesi, 2.Aydın Caddesi, Asya Apartmanı, No: 1-3, D: 7-16, Yıldırım / Bursa",
    `Site/No BİR KEZ, Kat HİÇ yazılmamalı, daireler tek aralığa ("D: 7-16") indirgenmeli, İlçe/İl sona eklenmeli. Bulunan: ${result}`
  );
  assert.ok(!result.includes("Kat"), "Kat (floor) HİÇ yazılmamalı (kullanıcı: 'kat bölümünü yazmana gerek yok').");
  assert.ok(!result.includes(" ve "), "TEK sokak grubunda ' ve ' bağlacı OLMAMALI.");
  console.log("KULLANICI DUZELTMESI (2. tur): AYNI sokak + BLOK YOK -> Site/No bir kez, Kat yok, daire araligi, Ilce/Il sonda testi tamam.");
}

// --- 3) AYNI ada/parsel, FARKLI sokak/cadde, BLOK YOK --------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kılıç Sokak", addressSiteName: "Asya Sitesi",
      outerDoor: "13A", innerDoor: "3",
    },
    tables: {},
    titleUnits: [unit({
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kalkan Caddesi",
      outerDoor: "13B", innerDoor: "11",
    })],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    result,
    "Osmaniye Mahallesi, Kılıç Sokak, Asya Sitesi, No: 13A, D: 3 ve Kalkan Caddesi, No: 13B, D: 11",
    `FARKLI sokak/caddede HER grup kendi sokak adıyla başlamalı, gruplar ' ve ' ile bağlanmalı. Bulunan: ${result}`
  );
  console.log("AYNI ada/parsel + FARKLI sokak/cadde, BLOK YOK -> mahalle ortak + sokak bazli gruplama testi tamam.");
}

// --- 4) AYNI ada/parsel, TEK sokak, BLOK VAR: kullanıcının BLOK örneği ----
// ("blok olsaydı Asya Sitesi A Blok D: 7-16 ve B Blok, D:8-12 şeklinde
// olmalı" — Site BİR KEZ, HER blok kendi "X Blok D:aralık" metnini alır,
// bloklar ' ve ' ile bağlanır, No: YAZILMAZ).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kılıç Sokak", addressSiteName: "Asya Sitesi",
      addressBlockName: "A", outerDoor: "13A", innerDoor: "7",
    },
    tables: {},
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Osmaniye", street: "Kılıç Sokak", addressBlockName: "A", innerDoor: "16" }),
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Osmaniye", street: "Kılıç Sokak", addressBlockName: "B", innerDoor: "8" }),
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Osmaniye", street: "Kılıç Sokak", addressBlockName: "B", innerDoor: "12" }),
    ],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    result,
    "Osmaniye Mahallesi, Kılıç Sokak, Asya Sitesi, A Blok D: 7-16 ve B Blok D: 8-12",
    `Site BİR KEZ, HER blok kendi 'X Blok D:aralık' metnini almalı, bloklar ' ve ' ile bağlanmalı, No: YAZILMAMALI. Bulunan: ${result}`
  );
  assert.ok(!result.includes("No:"), "Blok VARKEN 'No:' (dış kapı) YAZILMAMALI (site+blok kimliği yeterli).");
  console.log("KULLANICI BLOK ORNEGI: AYNI sokak + BLOK VAR -> site bir kez + blok basina daire araligi testi tamam.");
}

// --- 5) formatDaireRangeList(): sayısal aralık / tek değer / sayısal ------
// olmayan değerler.
{
  assert.equal(fns.formatDaireRangeList(["7", "16"]), "7-16", "İki sayısal değer küçükten büyüğe 'min-max' olmalı.");
  assert.equal(fns.formatDaireRangeList(["16", "7"]), "7-16", "Sıra ne olursa olsun SIRALANMALI (min-max).");
  assert.equal(fns.formatDaireRangeList(["7", "16", "8", "12"]), "7-16", "3+ değerde de yalnızca EN KÜÇÜK-EN BÜYÜK kullanılmalı.");
  assert.equal(fns.formatDaireRangeList(["7"]), "7", "TEK değer aynen dönmeli (aralık YOK).");
  assert.equal(fns.formatDaireRangeList([]), "", "Boş girdi boş string dönmeli.");
  assert.equal(fns.formatDaireRangeList(["7A", "3B"]), "7A-3B", "Sayısal OLMAYAN değerlerde sıralama YAPILMADAN ilk-son '-' ile birleşmeli.");
  console.log("formatDaireRangeList() testi tamam.");
}

// --- 6) FARKLI ada/parsel: HER taşınmaz KENDİ Ada Parsel etiketiyle -------
// ayrı satırda (DEĞİŞMEDİ — "önce aynı ada parsel yapalım").
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", mockAddress: "1. taşınmazın adresi" },
    tables: {},
    titleUnits: [unit({ blockNo: "200", parcelNo: "9", mockAddress: "2. taşınmazın adresi" })],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  const lines = result.split("\n");
  assert.equal(lines.length, 2, "FARKLI ada/parselde 2 AYRI satır olmalı.");
  assert.ok(lines[0].startsWith("100 5:"), `1. satır 'Ada Parsel' etiketiyle başlamalı, bulunan: ${lines[0]}`);
  assert.ok(lines[1].startsWith("200 9:"), `2. satır 'Ada Parsel' etiketiyle başlamalı, bulunan: ${lines[1]}`);
  console.log("FARKLI ada/parsel -> Ada Parsel etiketiyle ayri satirlar testi tamam (degismedi).");
}

// --- 7) "explanations" bölümünde yeni alan tanımlı mı (kaynak-düzeyi) -----
{
  assert.match(
    appSource,
    /\{ key: "multiUnitOpenAddressText", label: "Açık Adres \(Çoklu Taşınmaz\)", type: "textarea", wide: true \}/,
    "'explanations' bölümünde 'multiUnitOpenAddressText' alanı tanımlı değil."
  );
  console.log("explanations bolumunde yeni alan tanimi testi tamam.");
}

// --- 8) refreshMultiUnitOpenAddressTextFromCurrentFields merkezi ----------
// dispatcher'a kablolanmış mı (2 çağrı noktası).
{
  const matches = appSource.match(/refreshMultiUnitOpenAddressTextFromCurrentFields\(field\.key\);/g) || [];
  assert.equal(matches.length, 2, `refreshMultiUnitOpenAddressTextFromCurrentFields(field.key) merkezi dispatcher'daki İKİ çağrı noktasına da eklenmeli, bulunan: ${matches.length}`);
  assert.match(
    appSource,
    /function refreshMultiUnitOpenAddressTextFromCurrentFields\(changedKey = ""\) \{/,
    "refreshMultiUnitOpenAddressTextFromCurrentFields fonksiyonu bulunamadı."
  );
  console.log("refreshMultiUnitOpenAddressTextFromCurrentFields kaynak-duzeyi kablolama testi tamam.");
}

// --- 9) template-engine.js'te {{ACIKADRESCOKLU}} kayıtlı mı ---------------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /ACIKADRESCOKLU:\s*\{\s*t:\s*\(\)\s*=>\s*field\("multiUnitOpenAddressText"\)\s*\|\|\s*safeCall\("buildMultiUnitOpenAddressText"\)\s*\}/,
    "template-engine.js'te {{ACIKADRESCOKLU}} -> buildMultiUnitOpenAddressText kablolaması bulunamadı."
  );
  console.log("{{ACIKADRESCOKLU}} template-engine.js kablolama testi tamam.");
}

// --- 10) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı --------
{
  assert.match(
    appSource,
    /key: "multi_unit_open_address_text",\s*\n\s*title: "Açık Adres \(Çoklu Taşınmaz\)",\s*\n\s*value: state\.fields\.multiUnitOpenAddressText \|\| buildMultiUnitOpenAddressText\(\),/,
    "collectGeneratedTextPlaceholders() katalogunda 'Açık Adres (Çoklu Taşınmaz)' girdisi bulunamadı."
  );
  console.log("collectGeneratedTextPlaceholders katalog kaydi testi tamam.");
}

console.log("Acik Adres (Coklu Tasinmaz) testleri basarili.");
