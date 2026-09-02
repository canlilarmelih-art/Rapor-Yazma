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
// Kullanıcı takip talebi #4 (ÜÇÜNCÜ tur): "adreste dış kapı no yazmıyor.
// bloktan önce yazmalı farklı ise bloktaki mantıkta farklı olarak
// yazılmalı."
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
//  4) AYNI ada/parsel, TEK sokak, BLOK VAR, dış kapı YOK: kullanıcının
//     BLOK örneğiyle BİREBİR ("Asya Sitesi A Blok D:... ve B Blok D:...").
//  4b) Dış Kapı No artık HER ZAMAN gösterilir, Blok'tan HEMEN ÖNCE gelir;
//     AYNIYSA BİR KEZ, FARKLIYSA blok'la AYNI mantıkla kendi grubuna
//     göre ayrılır (ÜÇÜNCÜ tur düzeltmesi).
//  5) formatDaireListText(): sayısal sıralama + TAM liste (min-max DEĞİL),
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
  "formatDaireListText",
  "extractLeadingDoorNumber",
  "buildAddressBlockAndDaireText",
  "buildAddressDoorAndBlockText",
  "buildSameAdaParselOpenAddressText",
  // KULLANICI TAKİP TALEBİ (2026-09-02, FARKLI ada/parsel, Arsa/Tarla):
  // buildMultiUnitOpenAddressText() artık Arsa/Tarla raporlarında
  // isLandPropertyForBankTemplate()/isLandProjectReview()'e (ve onların
  // bağımlılıklarına) bağımlı.
  "isLandOwnershipType",
  "isLandPropertyForBankTemplate",
  "isLandProjectReview",
  "normalizeReportWhitespace",
  "toTitleCaseTr",
  "preserveReportSpecialWords",
  "escapeRegExp",
  "normalizeReportTitleText",
  "buildDifferentAdaParselLandOpenAddressText",
  "isUnitFieldsLandType",
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
    formatDaireListText,
    extractLeadingDoorNumber,
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

// --- 4) AYNI ada/parsel, TEK sokak, BLOK VAR, Dış Kapı No YOK: -----------
// kullanıcının BLOK örneği ("blok olsaydı Asya Sitesi A Blok D: 7-16 ve B
// Blok, D:8-12 şeklinde olmalı" — Site BİR KEZ, HER blok kendi "X Blok
// D:aralık" metnini alır, bloklar ' ve ' ile bağlanır; dış kapı no HİÇ
// girilmediğinden "No:" de HİÇ görünmez).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kılıç Sokak", addressSiteName: "Asya Sitesi",
      addressBlockName: "A", innerDoor: "7",
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
    `Site BİR KEZ, HER blok kendi 'X Blok D:aralık' metnini almalı, bloklar ' ve ' ile bağlanmalı. Bulunan: ${result}`
  );
  assert.ok(!result.includes("No:"), "Dış kapı no HİÇ girilmediyse 'No:' de HİÇ görünmemeli.");
  console.log("KULLANICI BLOK ORNEGI: AYNI sokak + BLOK VAR, dis kapi yok -> site bir kez + blok basina daire araligi testi tamam.");
}

// --- 4b) KULLANICI DÜZELTMESİ (2026-09-02): "adreste dış kapı no --------
// yazmıyor. bloktan önce yazmalı farklı ise bloktaki mantıkta farklı
// olarak yazılmalı" — Dış Kapı No artık HER ZAMAN gösterilir, Blok'tan
// HEMEN ÖNCE gelir. (a) TÜM taşınmazlarda AYNI dış kapı + BLOK VAR: "No:"
// BİR KEZ, ardından blok grupları. (b) Dış kapı FARKLIYSA: blok'la AYNI
// mantıkla (kendi grubuna göre) ayrılır.
{
  // (a) AYNI dış kapı ("13A"), FARKLI blok.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kılıç Sokak", addressSiteName: "Asya Sitesi",
      addressBlockName: "A", outerDoor: "13A", innerDoor: "7",
    },
    tables: {},
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Osmaniye", street: "Kılıç Sokak", addressBlockName: "B", outerDoor: "13A", innerDoor: "8" }),
    ],
  });
  const sameDoorResult = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    sameDoorResult,
    "Osmaniye Mahallesi, Kılıç Sokak, Asya Sitesi, No: 13A, A Blok D: 7 ve B Blok D: 8",
    `AYNI dış kapı ("No: 13A") BİR KEZ, Blok'tan HEMEN ÖNCE gelmeli. Bulunan: ${sameDoorResult}`
  );

  // (b) FARKLI dış kapı, SAYISAL kısmı da UYUŞMUYOR ("13"/"25") — TAM
  // FARKLI kabul edilip blok'la AYNI mantıkla (kendi grubuna göre) ayrılmalı.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kılıç Sokak", addressSiteName: "Asya Sitesi",
      addressBlockName: "A", outerDoor: "13", innerDoor: "7",
    },
    tables: {},
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Osmaniye", street: "Kılıç Sokak", addressBlockName: "B", outerDoor: "25", innerDoor: "8" }),
    ],
  });
  const diffDoorResult = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    diffDoorResult,
    "Osmaniye Mahallesi, Kılıç Sokak, Asya Sitesi, No: 13, A Blok D: 7 ve No: 25, B Blok D: 8",
    `SAYISAL kısmı da FARKLI dış kapı, blok'la AYNI mantıkla (kendi grubuna göre) ayrılmalı. Bulunan: ${diffDoorResult}`
  );

  // (c) KULLANICI TALEBİ (2026-09-02): "dış kapı no blok bazında farklı
  // olabilir örnek a blok no: 13a b blok no:13b bunlar eğer sayısal değer
  // aynı ise yani taşınmazların dış kapı numaraları 13a 13b 13c ise Dış
  // Kapı no: 13 A Blok D: 5, B Blok D: 16 şeklinde yazılabilir" — dış
  // kapı METİN OLARAK farklı ("13A"/"13B") ama SAYISAL kısmı (13) AYNIYSA
  // TEK bir "No: 13" yazılıp bloklar normal şekilde devam etmeli.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Osmaniye", street: "Kılıç Sokak", addressSiteName: "Asya Sitesi",
      addressBlockName: "A", outerDoor: "13A", innerDoor: "5",
    },
    tables: {},
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Osmaniye", street: "Kılıç Sokak", addressBlockName: "B", outerDoor: "13B", innerDoor: "16" }),
    ],
  });
  const sharedNumericDoorResult = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    sharedNumericDoorResult,
    "Osmaniye Mahallesi, Kılıç Sokak, Asya Sitesi, No: 13, A Blok D: 5 ve B Blok D: 16",
    `Dış kapı METİN olarak farklı ("13A"/"13B") ama SAYISAL kısmı (13) AYNIYSA TEK "No: 13" yazılıp bloklar normal devam etmeli. Bulunan: ${sharedNumericDoorResult}`
  );
  console.log("KULLANICI DUZELTMESI: Dis Kapi No artik HER ZAMAN gosterilir, bloktan once gelir, farkliysa blok mantigiyla ayrilir, sayisal kismi ayniysa TEK No: yazilir testi tamam.");
}

// --- 4d) extractLeadingDoorNumber(): baştaki sayısal kısmı çıkarır -------
{
  assert.equal(fns.extractLeadingDoorNumber("13A"), "13", "'13A' -> '13' (baştaki sayısal kısım).");
  assert.equal(fns.extractLeadingDoorNumber("13"), "13", "Salt sayısal değer aynen dönmeli.");
  assert.equal(fns.extractLeadingDoorNumber("A13"), "", "RAKAMLA BAŞLAMAYAN değerlerde boş string dönmeli.");
  assert.equal(fns.extractLeadingDoorNumber(""), "", "Boş girdi boş string dönmeli.");
  assert.equal(fns.extractLeadingDoorNumber("13/A"), "13", "Rakamdan SONRAKİ her şey (harf, ayraç vb.) yok sayılmalı.");
  console.log("extractLeadingDoorNumber() testi tamam.");
}

// --- 5) formatDaireListText(): sayısal sıralama + TAM liste, tek değer, --
// sayısal olmayan değerler.
// KULLANICI DÜZELTMESİ (2026-09-02, GERÇEK 4-taşınmazlı rapor örneğiyle):
// "aynı blok 4 bağımsız bölümden oluşan bir raporda adres bölümünde 5-15
// şeklinde gelmiş 5-10-11-15 olarak gelmeliydi" — İLK sürüm (formatDaireRangeList,
// bkz. eski isim) YALNIZCA en küçük-en büyük İKİ değeri birleştiriyordu
// ("min-max aralığı"); DOĞRUSU TÜM benzersiz değerlerin SIRALANIP HEPSİNİN
// "-" ile birleştirilmesi.
{
  assert.equal(fns.formatDaireListText(["7", "16"]), "7-16", "İki değerde (min-max ile TAM liste AYNI sonucu verdiğinden) fark edilmemişti.");
  assert.equal(fns.formatDaireListText(["5", "10", "11", "15"]), "5-10-11-15", "KULLANICI BULGUSU: 4 değerde TÜM benzersiz daire numaraları sıralanıp listelenmeli, yalnızca ilk-son (5-15) DEĞİL.");
  assert.equal(fns.formatDaireListText(["15", "5", "11", "10"]), "5-10-11-15", "Sıra ne olursa olsun SIRALANMALI.");
  assert.equal(fns.formatDaireListText(["7", "7", "16"]), "7-16", "Tekrarlanan (aynı) değerler TEKRAR EDİLMEMELİ (benzersizleştirilir).");
  assert.equal(fns.formatDaireListText(["7"]), "7", "TEK değer aynen dönmeli (liste/aralık YOK).");
  assert.equal(fns.formatDaireListText([]), "", "Boş girdi boş string dönmeli.");
  assert.equal(fns.formatDaireListText(["7A", "3B"]), "7A-3B", "Sayısal OLMAYAN değerlerde sıralama YAPILMADAN, verilen sırayla '-' ile birleşmeli.");
  console.log("formatDaireListText() testi tamam.");
}

// --- 6) KULLANICI BULGUSU (GERÇEK 4-taşınmazlı rapor, TAM örnekle): -------
// "Yunuseli Mahallesi, 792. Sokak, Sema Hatun Konakları Sitesi, A Blok D:
// 5-15, Osmangazi / Bursa ... aynı blok 4 bağımsız bölümden oluşan bir
// raporda adres bölümünde 5-15 şeklinde gelmiş 5-10-11-15 olarak
// gelmeliydi." Uçtan uca buildMultiUnitOpenAddressText() ile doğrulanır
// (yalnızca formatDaireListText() birim testi DEĞİL — gerçek 4-taşınmazlı
// entegrasyon).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5",
      neighborhood: "Yunuseli", street: "792. Sokak", addressSiteName: "Sema Hatun Konakları Sitesi",
      addressBlockName: "A", innerDoor: "5",
      district: "Osmangazi", city: "Bursa",
    },
    tables: {},
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Yunuseli", street: "792. Sokak", addressBlockName: "A", innerDoor: "10" }),
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Yunuseli", street: "792. Sokak", addressBlockName: "A", innerDoor: "11" }),
      unit({ blockNo: "100", parcelNo: "5", neighborhood: "Yunuseli", street: "792. Sokak", addressBlockName: "A", innerDoor: "15" }),
    ],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    result,
    "Yunuseli Mahallesi, 792. Sokak, Sema Hatun Konakları Sitesi, A Blok D: 5-10-11-15, Osmangazi / Bursa",
    `4 bağımsız bölümün TÜM daire numaraları (5,10,11,15) listelenmeli, yalnızca ilk-son (5-15) DEĞİL. Bulunan: ${result}`
  );
  console.log("KULLANICI BULGUSU: 4-tasinmazli GERCEK rapor ornegiyle TAM daire listesi (min-max DEGIL) testi tamam.");
}

// --- 7) FARKLI ada/parsel, BİNA (Arsa/Tarla DEĞİL): HER taşınmaz KENDİ --
// Ada Parsel etiketiyle ayrı satırda (DEĞİŞMEDİ — henüz kullanıcı
// tarafından netleştirilmedi).
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
  console.log("FARKLI ada/parsel, BINA -> Ada Parsel etiketiyle ayri satirlar testi tamam (degismedi).");
}

// --- 7b) KULLANICI TAKİP TALEBİ (2026-09-02, GERÇEK örnekle, Arsa/Tarla, -
// FARKLI ada/parsel): "farklı ada parselde yer alan çoklu talepte adres
// şu şekilde çıkıyor: 0 56: Canbazlarköyü Mahallesi, Mevkii SAZLIK, 0 Ada
// 56 Parsel, Gürsu / Bursa / 0 315: Canbazlarköyü Mahallesi, Mevkii
// SARITAŞ, 0 Ada 315 Parsel, Gürsu / Bursa oysa benim istediğim yine
// gruplandırma Canbazlarköyü Mahallesi Sazlık Mevkii 56 Parsel ve
// Sarıtaş Mevkii 315 parsel, gürsu/bursa şeklinde 0 Ada yazmaya gerek
// yok ada numarası yoksa, aynı mevkiide yer alsaydı taşınmazlar mevkii 1
// kere yazıp daha sonra ada parselleri yazacaktık."
{
  // (a) kullanıcının TAM örneği: FARKLI mevkii (SAZLIK/SARITAŞ), Ada "0"
  // (gerçek ada YOK).
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      ownershipType: "Arsa",
      neighborhood: "Canbazlarköyü", locationName: "SAZLIK", blockNo: "0", parcelNo: "56",
      district: "Gürsu", city: "Bursa",
    },
    tables: {},
    titleUnits: [
      unit({ neighborhood: "Canbazlarköyü", locationName: "SARITAŞ", blockNo: "0", parcelNo: "315" }),
    ],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    result,
    "Canbazlarköyü Mahallesi, Sazlık Mevkii 56 Parsel ve Sarıtaş Mevkii 315 Parsel, Gürsu / Bursa",
    `Mahalle bir kez, FARKLI mevkiiler ' ve ' ile ayrı gruplanmalı, Ada "0" iken HİÇ yazılmamalı. Bulunan: ${result}`
  );
  assert.ok(!result.includes("Ada"), "Gerçek bir Ada numarası YOKSA (\"0\") 'Ada' kelimesi HİÇ görünmemeli.");
  console.log("KULLANICI TAKIP TALEBI: Arsa/Tarla FARKLI ada/parsel - mahalle ortak + Mevkii bazli gruplama + 0 Ada gizleme testi tamam.");

  // (b) AYNI mevkii, FARKLI parsel — kullanıcı: "aynı mevkiide yer
  // alsaydı taşınmazlar mevkii 1 kere yazıp daha sonra ada parselleri
  // yazacaktık".
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      ownershipType: "Arsa",
      neighborhood: "Canbazlarköyü", locationName: "SAZLIK", blockNo: "0", parcelNo: "56",
      district: "Gürsu", city: "Bursa",
    },
    tables: {},
    titleUnits: [
      unit({ neighborhood: "Canbazlarköyü", locationName: "SAZLIK", blockNo: "0", parcelNo: "78" }),
    ],
  });
  const sameMevkiiResult = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    sameMevkiiResult,
    "Canbazlarköyü Mahallesi, Sazlık Mevkii 56 Parsel ve 78 Parsel, Gürsu / Bursa",
    `AYNI mevkii TEK kez yazılıp ardından TÜM parseller listelenmeli. Bulunan: ${sameMevkiiResult}`
  );
  console.log("KULLANICI TAKIP TALEBI: Arsa/Tarla FARKLI ada/parsel, AYNI mevkii - mevkii bir kez + parseller listelenir testi tamam.");

  // (c) GERÇEK bir Ada numarası VARSA (\"0\" veya boş DEĞİLSE) normal
  // şekilde gösterilmeli.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      ownershipType: "Arsa",
      neighborhood: "Canbazlarköyü", locationName: "SAZLIK", blockNo: "12", parcelNo: "56",
      district: "Gürsu", city: "Bursa",
    },
    tables: {},
    titleUnits: [
      unit({ neighborhood: "Canbazlarköyü", locationName: "SARITAŞ", blockNo: "34", parcelNo: "315" }),
    ],
  });
  const realBlockResult = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    realBlockResult,
    "Canbazlarköyü Mahallesi, Sazlık Mevkii 12 Ada 56 Parsel ve Sarıtaş Mevkii 34 Ada 315 Parsel, Gürsu / Bursa",
    `GERÇEK bir Ada numarası varsa normal şekilde ("X Ada Y Parsel") gösterilmeli. Bulunan: ${realBlockResult}`
  );
  console.log("Arsa/Tarla FARKLI ada/parsel, GERCEK Ada numarasi varsa normal gosterilir testi tamam.");
}

// --- 7c) KULLANICI BULGUSU (2026-09-02): "sonuç değişmedi" — Arsa/Tarla -
// dalı HİÇ TETİKLENMİYORDU. Kök neden: isLandPropertyForBankTemplate()/
// isLandProjectReview() YALNIZCA AKTİF taşınmazı (state.fields) okur;
// "ownershipType" ise BİLEREK taşınmaza-özgüdür — AKTİF taşınmaz "Arsa"
// DEĞİLSE (veya hiç girilmemişse) bu kontrol state.fields hiç
// DEĞİŞTİRİLMEDEN çağrıldığından yanlışlıkla "false" dönüyordu. Bu
// senaryo TAM O DURUMU simüle eder: AKTİF taşınmazın ownershipType'ı
// BOŞ, yalnızca İKİNCİ (aktif OLMAYAN) taşınmazın "Arsa".
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      // ownershipType BİLEREK YOK — tam da kullanıcının bulduğu hata.
      neighborhood: "Canbazlarköyü", locationName: "SAZLIK", blockNo: "0", parcelNo: "56",
      district: "Gürsu", city: "Bursa",
    },
    tables: {},
    titleUnits: [
      unit({ ownershipType: "Arsa", neighborhood: "Canbazlarköyü", locationName: "SARITAŞ", blockNo: "0", parcelNo: "315" }),
    ],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(
    result,
    "Canbazlarköyü Mahallesi, Sazlık Mevkii 56 Parsel ve Sarıtaş Mevkii 315 Parsel, Gürsu / Bursa",
    `AKTİF taşınmazın ownershipType'ı BOŞ olsa bile, DİĞER taşınmaz "Arsa" ise Mevkii bazlı composer TETİKLENMELİ. Bulunan: ${result}`
  );
  console.log("KULLANICI BULGUSU: aktif tasinmaz Arsa DEGILSE bile, diger tasinmaz Arsa ise Mevkii composer tetiklenir testi tamam.");
}

// --- 8) "explanations" bölümünde yeni alan tanımlı mı (kaynak-düzeyi) -----
{
  assert.match(
    appSource,
    /\{ key: "multiUnitOpenAddressText", label: "Açık Adres \(Çoklu Taşınmaz\)", type: "textarea", wide: true \}/,
    "'explanations' bölümünde 'multiUnitOpenAddressText' alanı tanımlı değil."
  );
  console.log("explanations bolumunde yeni alan tanimi testi tamam.");
}

// --- 9) refreshMultiUnitOpenAddressTextFromCurrentFields merkezi ----------
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

// --- 10) KULLANICI BULGUSU (2026-09-02): canlıda üretilen metin bir -------
// taşınmazın Blok bilgisini kaybediyordu — kök neden muhtemelen
// refreshMultiUnitOpenAddressTextFromCurrentFields()'in yalnızca CANLI
// alan-değişikliği olayına bağlı olması (Excel/JSON/KML/TAKBİS içe
// aktarma gibi programatik veri girişleri bunu HİÇ tetiklemez — 0.0.613/
// 0.0.614'teki AYNI sınıf İnş. Sev. hatası). Düzeltme: "Açıklamalar"
// bölümü HER render edildiğinde (refreshAllVariantDependentExplanationFields())
// KOŞULSUZ (argümansız) bir çağrı EKLENDİ — diğer refresh*FromCurrentFields
// fonksiyonlarıyla AYNI desen.
{
  assert.match(
    appSource,
    /\(\) => refreshMultiUnitOpenAddressTextFromCurrentFields\(\),\s*\n\s*\];\s*\n\s*refreshers\.forEach/,
    "refreshMultiUnitOpenAddressTextFromCurrentFields() 'Açıklamalar' bölümü HER render edildiğinde KOŞULSUZ çağrılan refreshAllVariantDependentExplanationFields() listesine eklenmemiş."
  );
  console.log("KULLANICI BULGUSU: Acik Adres (Coklu) her bolum render'inda KOSULSUZ tazelenir (programatik veri girisi guvenligi) testi tamam.");
}

// --- 11) template-engine.js'te {{ACIKADRESCOKLU}} kayıtlı mı --------------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /ACIKADRESCOKLU:\s*\{\s*t:\s*\(\)\s*=>\s*field\("multiUnitOpenAddressText"\)\s*\|\|\s*safeCall\("buildMultiUnitOpenAddressText"\)\s*\}/,
    "template-engine.js'te {{ACIKADRESCOKLU}} -> buildMultiUnitOpenAddressText kablolaması bulunamadı."
  );
  console.log("{{ACIKADRESCOKLU}} template-engine.js kablolama testi tamam.");
}

// --- 12) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı --------
{
  assert.match(
    appSource,
    /key: "multi_unit_open_address_text",\s*\n\s*title: "Açık Adres \(Çoklu Taşınmaz\)",\s*\n\s*value: state\.fields\.multiUnitOpenAddressText \|\| buildMultiUnitOpenAddressText\(\),/,
    "collectGeneratedTextPlaceholders() katalogunda 'Açık Adres (Çoklu Taşınmaz)' girdisi bulunamadı."
  );
  console.log("collectGeneratedTextPlaceholders katalog kaydi testi tamam.");
}

console.log("Acik Adres (Coklu Tasinmaz) testleri basarili.");
