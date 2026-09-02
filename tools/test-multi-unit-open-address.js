// "Açık Adres (Çoklu Taşınmaz)" — çoklu taleplerde açık adresin aynı/
// farklı ada-parsel durumuna göre nasıl birleştirileceği (2026-09-02).
// Kullanıcı talebi: "çoklu taleplerde açık adres aynı ada parsel ve
// farklı ada parselli raporlarda nasıl yazılmalı ... öncelikle açık
// adres çoklu olarak açıklamalar kısmına yeni bir bölüm oluştur ve bu
// bölüme placeholder ata."
//
// buildOpenAddressText() (GERÇEK fonksiyon, openAddressStyleVariants/
// selectVariant/formatOpenAddressNeighborhood/formatOpenAddressBuildingName/
// isLandPropertyForBankTemplate gibi geniş bir bağımlılık ağacına sahip)
// burada BİLEREK extract EDİLMEZ — proje konvansiyonu ("gerçek zinciri
// çıkarmak pratik değilse basit sahte ile test et") gereği
// state.fields.mockAddress okuyan davranış-koruyan bir SAHTE ile
// değiştirilir. Asıl doğrulanan şey buildMultiUnitOpenAddressText()'in
// GERÇEK orkestrasyonu: her taşınmaz için (temp state.fields değişimi
// ile) kendi adresinin hesaplanması, groupMainPropertyBlocksByText() ile
// metin bazlı gruplama, computeTitleUnitTabLabel() ile doğru etiketleme
// (aynı ada/parselde Blok-BB No, farklı ada/parselde Ada Parsel).
//
// Kapsanan senaryolar:
//  1) Tekil rapor (1 taşınmaz): buildOpenAddressText() SONUCU AYNEN döner
//     (davranış DEĞİŞMEDİ).
//  2) 2+ taşınmaz, TÜM adresler BİREBİR AYNI: TEK (atıfsız) satır.
//  3) AYNI ada/parsel, adresler FARKLI (kat/daire farkı): HER taşınmaz
//     KENDİ Blok-BB No etiketiyle ayrı satırda.
//  4) FARKLI ada/parsel: HER taşınmaz KENDİ Ada Parsel etiketiyle ayrı
//     satırda.
//  5) "explanations" bölümünde yeni alan tanımlı mı (kaynak-düzeyi).
//  6) refreshMultiUnitOpenAddressTextFromCurrentFields merkezi
//     dispatcher'a kablolanmış mı (kaynak-düzeyi, 2 çağrı noktası).
//  7) template-engine.js'te {{ACIKADRESCOKLU}} kayıtlı mı.
//  8) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı.

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
  "computeTitleUnitTabLabel",
  "groupMainPropertyBlocksByText",
  "normalizeTextForSimilarityComparison",
  "foldTurkish",
  "buildMultiUnitOpenAddressText",
];

const sandboxSource = `
  let state = {};
  // GERÇEK buildOpenAddressText() (bkz. dosya başı yorumu) BİLEREK
  // extract EDİLMEZ — davranış-koruyan basit bir SAHTE: state.fields.mockAddress'i
  // aynen döner (her taşınmazın "hesaplanmış açık adresi" olarak).
  function buildOpenAddressText() {
    return state.fields.mockAddress || "";
  }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    buildMultiUnitOpenAddressText,
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

// --- 2) 2+ taşınmaz, TÜM adresler BİREBİR AYNI: TEK atıfsız satır --------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", mockAddress: "Merkez Mahallesi, Atatürk Caddesi No:5, Kadıköy / İstanbul" },
    tables: {},
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", mockAddress: "Merkez Mahallesi, Atatürk Caddesi No:5, Kadıköy / İstanbul" })],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  assert.equal(result, "Merkez Mahallesi, Atatürk Caddesi No:5, Kadıköy / İstanbul", "TÜM adresler AYNIYSA TEK (atıfsız) satır dönmeli, etiket EKLENMEMELİ (adresin KENDİSİ, başına 'A-3:' gibi bir etiket EKLENMEDEN).");
  console.log("2+ tasinmaz, TUM adresler AYNI -> TEK atifsiz satir testi tamam.");
}

// --- 3) AYNI ada/parsel, adresler FARKLI (kat/daire farkı): HER taşınmaz -
// KENDİ Blok-BB No etiketiyle ayrı satırda.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", titleBlockName: "A", unitNo: "3", mockAddress: "... Zemin Kat 3 No'lu Bağımsız Bölüm ..." },
    tables: {},
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", titleBlockName: "A", unitNo: "7", mockAddress: "... 1. Kat 7 No'lu Bağımsız Bölüm ..." })],
  });
  const result = fns.buildMultiUnitOpenAddressText();
  const lines = result.split("\n");
  assert.equal(lines.length, 2, "AYNI ada/parselde adresler FARKLIYSA 2 AYRI satır olmalı.");
  assert.ok(lines[0].startsWith("A-3:"), `1. satır 'A-3:' (Blok-BB No) ile başlamalı, bulunan: ${lines[0]}`);
  assert.ok(lines[1].startsWith("A-7:"), `2. satır 'A-7:' (Blok-BB No) ile başlamalı, bulunan: ${lines[1]}`);
  console.log("AYNI ada/parsel + FARKLI adres -> Blok-BB No etiketiyle ayri satirlar testi tamam.");
}

// --- 4) FARKLI ada/parsel: HER taşınmaz KENDİ Ada Parsel etiketiyle -------
// ayrı satırda.
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
  console.log("FARKLI ada/parsel -> Ada Parsel etiketiyle ayri satirlar testi tamam.");
}

// --- 5) "explanations" bölümünde yeni alan tanımlı mı (kaynak-düzeyi) -----
{
  assert.match(
    appSource,
    /\{ key: "multiUnitOpenAddressText", label: "Açık Adres \(Çoklu Taşınmaz\)", type: "textarea", wide: true \}/,
    "'explanations' bölümünde 'multiUnitOpenAddressText' alanı tanımlı değil."
  );
  console.log("explanations bolumunde yeni alan tanimi testi tamam.");
}

// --- 6) refreshMultiUnitOpenAddressTextFromCurrentFields merkezi ----------
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

// --- 7) template-engine.js'te {{ACIKADRESCOKLU}} kayıtlı mı ---------------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /ACIKADRESCOKLU:\s*\{\s*t:\s*\(\)\s*=>\s*field\("multiUnitOpenAddressText"\)\s*\|\|\s*safeCall\("buildMultiUnitOpenAddressText"\)\s*\}/,
    "template-engine.js'te {{ACIKADRESCOKLU}} -> buildMultiUnitOpenAddressText kablolaması bulunamadı."
  );
  console.log("{{ACIKADRESCOKLU}} template-engine.js kablolama testi tamam.");
}

// --- 8) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı ---------
{
  assert.match(
    appSource,
    /key: "multi_unit_open_address_text",\s*\n\s*title: "Açık Adres \(Çoklu Taşınmaz\)",\s*\n\s*value: state\.fields\.multiUnitOpenAddressText \|\| buildMultiUnitOpenAddressText\(\),/,
    "collectGeneratedTextPlaceholders() katalogunda 'Açık Adres (Çoklu Taşınmaz)' girdisi bulunamadı."
  );
  console.log("collectGeneratedTextPlaceholders katalog kaydi testi tamam.");
}

console.log("Acik Adres (Coklu Tasinmaz) testleri basarili.");
