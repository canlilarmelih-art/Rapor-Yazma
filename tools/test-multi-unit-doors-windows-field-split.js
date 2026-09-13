"use strict";

/*
  Kullanıcı bildirimi (2026-09-13, devam — "yap bunu da sonra test
  edeceğim"): "işyerleri için aynı konutlardaki gibi gruplandırma yapmak
  istedik ama istediğimiz sonuca ulaşamadık" ekran görüntüsünün İKİNCİ
  (0.0.758'in kapsam dışı bıraktığı) yarısı — "Kapı/Pencere" cümlesi.

  Kullanıcının GERÇEK örneği:
    ÖNCEKİ (hatalı): "C 1 No'lu taşınmazın dış kapısı camlı alüminyum ve
    pencereleri PVC doğramadır. Diğer taşınmazların dış kapıları camlı
    alüminyum, iç kapıları amerikan panel ve pencereleri PVC doğramadır."
    — dış kapı VE pencere AYNI olduğu halde İKİ KEZ yazılıyordu, çünkü
    composeDoorsWindowsSentence() üç alanı (dış kapı/iç kapı/pencere) TEK
    STRING olarak birleştirip çoklu taşınmaz gruplaması bu TEK stringi
    bütün olarak karşılaştırıyordu.
    İSTENEN: "Taşınmazların dış kapısı camlı alüminyum ve pencereleri PVC
    doğramadır. C2 ve C3 Nolu taşınmazların iç kapıları amerikan panel
    doğramadır." — dış kapı+pencere (TÜM taşınmazlarda AYNI) TEK ortak
    cümlede, yalnızca iç kapı (yalnızca BAZI taşınmazlarda dolu) KENDİ
    AYRI, açık atıflı cümlesinde.

  Çözüm (bkz. app.js, composeDoorsWindowsSentence'ın HEMEN altı): üç YENİ
  fonksiyon (getDoorsWindowsFieldParts/composeDoorsWindowsFieldSentenceFromParts/
  buildMultiUnitDoorsWindowsPartsForMerge) composeDoorsWindowsSentence'ın
  (TEK taşınmaz/canlı panel — DOKUNULMADI) KENDİ alan-çıkarma mantığını
  KASITLI OLARAK küçük bir kod tekrarıyla üç AYRI alana böler
  ("doorsWindows:exterior"/"doorsWindows:interior"/"doorsWindows:windows").
  buildMultiUnitInteriorDescriptionText() içinde YENİ composeMultiUnitDoorsWindowsParagraphSentence()
  bu üç alanı okuyup TÜM taşınmazlarda AYNI (missing OLMAYAN) olanları TEK
  ortak listede birleştirir, geri kalanları (farklı DEĞER YA DA yalnızca
  BAZI taşınmazlarda dolu) composeDoorsWindowsFieldAttributedSentence ile
  KENDİ ayrı cümlesinde bırakır — "yalnızca BAZI taşınmazlarda dolu"
  durumunda (ör. iç kapı bazı birimlerde mimariye bağlı olarak hiç yok)
  "Taşınmazların"/"Diğer taşınmazların" YANLIŞ olurdu (ne TÜMÜ ne net bir
  çoğunluk/azınlık bölünmesi var) — bunun yerine AÇIK numaralı atıf
  kullanılır; TÜM taşınmazlar katkı sağlıyorsa (gerçek azınlık/çoğunluk
  YA DA hepsi aynı) davranış composeDecorativeAttributedSentence'a
  (diğer TÜM slotlarla PAYLAŞILAN, tutarlı mekanizma) AYNEN devredilir.

  Yan bulgu (bizzat bu düzeltme SIRASINDA bulunup düzeltilen kusur):
  applyDoorsWindowsPossessiveSuffix()'in `\bİç kapılar\b` deseni cümle
  BAŞINDAKİ büyük "İ" (ASCII olmayan, `\b`'nin "kelime karakteri"
  saymadığı) yüzünden ASLA eşleşmiyordu — composeDoorsWindowsSentence'ın
  TEK-birleşik-cümle biçiminde dış kapı HER ZAMAN İLK sırada geldiğinden
  "İç kapılar" ASLA cümle-başı OLMADIĞI için bu şimdiye kadar hiç fark
  edilmemişti; yeni STANDALONE "İç kapılar ..." cümlesinde gerçekten
  tetikleniyordu. TURKISH_WORD_START_LOOKBEHIND (negatif lookbehind) ile
  düzeltildi.

  Bu test dosyası:
  1) getDoorsWindowsFieldParts(): üç alanın (present/missing/absent)
     doğru ayrıştırıldığını doğrular.
  2) buildMultiUnitDoorsWindowsPartsForMerge(): her alan için AYRI bir
     "doorsWindows:*" anahtarı ürettiğini (composeDoorsWindowsSentence'ın
     ESKİ TEK "doorsWindows" anahtarından FARKLI) doğrular.
  3) composeMultiUnitDoorsWindowsParagraphSentence(): kullanıcının TAM
     örneği (dış kapı+pencere ortak, iç kapı yalnızca 2/3 taşınmazda) +
     3 ek senaryo (hepsi aynı -> tek cümle; iç kapı DEĞERİ farklı ama
     TÜMÜNDE VAR -> gerçek azınlık/çoğunluk; pencere "missing" -> ayrı
     kalır, malzeme ile KARIŞMAZ).
  4) applyDoorsWindowsPossessiveSuffix(): cümle-başı büyük "İç kapılar"
     düzeltmesi (TURKISH_WORD_START_LOOKBEHIND) — stash ile eski koda
     karşı gerçekten kırıldığı doğrulanacak.
  5) Kaynak-düzeyi regresyon kilidi: TEK taşınmaz listesi
     (buildUnitDecorativeDescriptionPartsList) HÂLÂ composeDoorsWindowsSentence()'ı
     DOĞRUDAN kullanıyor (DEĞİŞMEDİ); ÇOKLU taşınmaz listesi
     (buildUnitDecorativeDescriptionPartsListForMultiUnitMerge) artık
     buildMultiUnitDoorsWindowsPartsForMerge()'i kullanıyor.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  return extractFunctionBodyFrom(start);
}
function extractFunctionBodyFrom(start) {
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") { parenDepth -= 1; if (parenDepth === 0) break; }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") { depth -= 1; if (depth === 0) return appSource.slice(start + 1, index + 1); }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}
function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert.ok(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") { depth -= 1; if (depth === 0) return `${appSource.slice(start, index + 1)};`; }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}
function extractConstLine(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(marker);
  assert.ok(start >= 0, `Sabit bulunamadı: ${name}`);
  const end = appSource.indexOf(";", start);
  return appSource.slice(start, end + 1);
}

const functionNames = [
  "foldTurkish",
  "isNotInstalledDecorative",
  "formatDoorWindowMaterial",
  "toLowerText",
  "capitalizeSentence",
  "formatTurkishList",
  "getDoorsWindowsFieldParts",
  "composeDoorsWindowsFieldSentenceFromParts",
  "buildMultiUnitDoorsWindowsPartsForMerge",
  "groupUnitInteriorTextEntries",
  "normalizeTextForSimilarityComparison",
  "levenshteinDistance",
  "computeTextSimilarityRatio",
  "formatTitleUnitSuitabilityLabel",
  "formatTitleUnitAttributionPhrase",
  "normalizeBlockLabelPrefixForAttribution",
  "formatDocumentBlockAttributionPhrase",
  "applyDoorsWindowsPossessiveSuffix",
  "applyKitchenPossessiveSuffix",
  "pluralizeDecorativeLocativePrefix",
  "applyDecorativeSlotPossessiveConversion",
  "replaceDecorativeLeadingSubject",
  "lowercaseFirstLetterTr",
  "stripTurkishTerminalDirSuffix",
  "decorativeSentenceHasOwnSubject",
  "canWeaveDecorativeSentence",
  "composeWovenSoleRestDecorativeSentence",
  "composeSoleRestDecorativeSentence",
  "composeDecorativeSentenceWithAttribution",
  "composeDecorativeAttributedSentence",
  "composeDoorsWindowsFieldAttributedSentence",
  "composeMultiUnitDoorsWindowsParagraphSentence",
  "joinNonEmptySentences",
  "attributeMultiUnitGroupedText",
  "pluralizeUnitDecorativeSentence",
  "pluralizeUnitDecorativeText",
  "joinTurkishList",
];
const constArrayNames = ["KITCHEN_PLURAL_OWNER_POSSESSIVE_MAP", "DECORATIVE_LOCATIVE_PREFIX_PLURAL_MAP", "doorsWindowsFieldMissingVariants"];
const constLineNames = ["TURKISH_WORD_END_LOOKAHEAD", "TURKISH_WORD_START_LOOKBEHIND", "DECORATIVE_LEADING_SUBJECT_PATTERN"];

function buildSandbox() {
  const sandboxSource = `
    let state = {};
    function selectVariant() { return 0; }
    function registerVariantGroup() {}
    function normalizeReportTitleText(value) { return String(value || "").trim(); }
    function normalizeReportDescriptionText(value) { return String(value || "").trim(); }
    ${constLineNames.map(extractConstLine).join("\n")}
    ${constArrayNames.map(extractConstArray).join("\n")}
    ${functionNames.map(extractFunction).join("\n")}
    return {
      setState: (s) => { state = s; },
      getDoorsWindowsFieldParts,
      buildMultiUnitDoorsWindowsPartsForMerge,
      composeMultiUnitDoorsWindowsParagraphSentence,
      applyDoorsWindowsPossessiveSuffix,
    };
  `;
  return new Function(sandboxSource)();
}

function unitFields(unitNo, { exterior = "Camlı Alüminyum", windows = "PVC", interior = "" } = {}) {
  return { titleBlockName: "C", unitNo: String(unitNo), unitExteriorDoor: exterior, unitWindows: windows, unitInteriorDoors: interior };
}

function buildSlot(fns, units) {
  const slot = {};
  units.forEach((unit, index) => {
    fns.setState({ fields: unit.fields });
    fns.buildMultiUnitDoorsWindowsPartsForMerge().forEach((part) => {
      if (!slot[part.key]) slot[part.key] = [];
      slot[part.key].push({ index, fields: unit.fields, value: part.value, doorsWindowsMeta: part.doorsWindowsMeta });
    });
  });
  return slot;
}

// --- 1) getDoorsWindowsFieldParts(): present/missing/absent ayrımı -----
{
  const fns = buildSandbox();
  fns.setState({ fields: { unitExteriorDoor: "Çelik", unitWindows: "PVC", unitInteriorDoors: "" } });
  assert.deepEqual(fns.getDoorsWindowsFieldParts("exterior"), { missing: false, phrase: "dış kapı çelik" }, "Dolu dış kapı doğru ayrıştırılmalı.");
  assert.equal(fns.getDoorsWindowsFieldParts("interior"), null, "Boş iç kapı null dönmeli (katkı YOK, 'missing' de DEĞİL).");
  assert.deepEqual(fns.getDoorsWindowsFieldParts("windows"), { missing: false, phrase: "pencereler PVC" }, "Dolu pencere doğru ayrıştırılmalı.");

  fns.setState({ fields: { unitExteriorDoor: "Henüz Takılmamış", unitWindows: "", unitInteriorDoors: "Demonte" } });
  assert.deepEqual(fns.getDoorsWindowsFieldParts("exterior"), { missing: true, label: "dış kapı" }, "'Henüz takılmamış' dış kapı missing olmalı.");
  assert.deepEqual(fns.getDoorsWindowsFieldParts("interior"), { missing: true, label: "iç kapı" }, "'Demonte' iç kapı missing olmalı.");
  assert.equal(fns.getDoorsWindowsFieldParts("windows"), null, "Boş pencere null dönmeli.");

  fns.setState({ fields: { unitExteriorDoor: "", unitWindows: "", unitInteriorDoors: "Yok" } });
  assert.equal(fns.getDoorsWindowsFieldParts("interior"), null, "'Yok' iç kapı null dönmeli (missing DEĞİL — mimari olarak yok).");

  console.log("getDoorsWindowsFieldParts(): present/missing/absent ayrımı testi tamam.");
}

// --- 2) buildMultiUnitDoorsWindowsPartsForMerge(): 3 AYRI anahtar ------
{
  const fns = buildSandbox();
  fns.setState({ fields: unitFields(1, { interior: "Amerikan Panel" }) });
  const parts = fns.buildMultiUnitDoorsWindowsPartsForMerge();
  assert.equal(parts.length, 3, `Üçü de dolu -> 3 ayrı parça dönmeli: ${parts.length}`);
  const keys = parts.map((p) => p.key).sort();
  assert.deepEqual(keys, ["doorsWindows:exterior", "doorsWindows:interior", "doorsWindows:windows"], `3 AYRI anahtar (ESKİ tek "doorsWindows" DEĞİL): ${keys}`);
  assert.equal(parts.find((p) => p.key === "doorsWindows:exterior").value, "Dış kapı camlı alüminyum doğramadır.", "Dış kapı STANDALONE cümlesi kendi 'doğramadır' ekini taşımalı.");

  fns.setState({ fields: unitFields(1, {}) }); // iç kapı boş
  const partsNoInterior = fns.buildMultiUnitDoorsWindowsPartsForMerge();
  assert.equal(partsNoInterior.length, 2, "İç kapı boşken yalnızca 2 parça (dış kapı+pencere) dönmeli.");
  console.log("buildMultiUnitDoorsWindowsPartsForMerge(): 3 AYRI anahtar testi tamam.");
}

// --- 3) composeMultiUnitDoorsWindowsParagraphSentence(): 4 senaryo -----
{
  // 3a) KULLANICININ TAM ÖRNEĞİ: dış kapı+pencere ORTAK, iç kapı yalnızca
  // C2/C3'te dolu (C1'de YOK — mimariye bağlı, "missing" DEĞİL).
  const fns = buildSandbox();
  const units = [
    { fields: unitFields(1, {}) },
    { fields: unitFields(2, { interior: "Amerikan Panel" }) },
    { fields: unitFields(3, { interior: "Amerikan Panel" }) },
  ];
  const slot = buildSlot(fns, units);
  const sentence = fns.composeMultiUnitDoorsWindowsParagraphSentence(slot, units.length, { previousRunKey: null });
  assert.equal(
    sentence,
    "Taşınmazların dış kapıları camlı alüminyum ve pencereleri PVC doğramadır. C 2 No'lu ve C 3 No'lu taşınmazların iç kapıları amerikan panel doğramadır.",
    `Ortak dış kapı+pencere TEK cümlede, yalnızca-bazılarında-dolu iç kapı AÇIK numaralı atıfla KENDİ ayrı cümlesinde olmalı: "${sentence}"`
  );
  // Dış kapı/pencere metni SADECE BİR KEZ geçmeli (0.0.756 öncesi hatanın
  // tam tersi — "camlı alüminyum" YALNIZCA 1 kez görünmeli).
  assert.equal((sentence.match(/camlı alüminyum/g) || []).length, 1, `"camlı alüminyum" TEKRARLANMAMALI (eski hata): "${sentence}"`);
  assert.equal((sentence.match(/\bPVC\b/g) || []).length, 1, `"PVC" TEKRARLANMAMALI (eski hata): "${sentence}"`);

  // 3b) TÜM alanlar TÜM taşınmazlarda AYNI -> TEK, tam liste birleşik cümle.
  const unitsSame = [{ fields: unitFields(1, { interior: "Amerikan Panel" }) }, { fields: unitFields(2, { interior: "Amerikan Panel" }) }];
  const slotSame = buildSlot(fns, unitsSame);
  const sentenceSame = fns.composeMultiUnitDoorsWindowsParagraphSentence(slotSame, unitsSame.length, { previousRunKey: null });
  assert.equal(
    sentenceSame,
    "Taşınmazların dış kapıları camlı alüminyum, iç kapıları amerikan panel ve pencereleri PVC doğramadır.",
    `Üçü de tüm taşınmazlarda aynıysa TEK birleşik liste cümlesi olmalı: "${sentenceSame}"`
  );

  // 3c) İç kapı TÜM taşınmazlarda VAR ama DEĞERİ farklı -> gerçek
  // azınlık/çoğunluk (composeDecorativeAttributedSentence'a devredilir).
  const unitsDiff = [
    { fields: unitFields(1, { interior: "Çelik" }) },
    { fields: unitFields(2, { interior: "Amerikan Panel" }) },
    { fields: unitFields(3, { interior: "Amerikan Panel" }) },
  ];
  const slotDiff = buildSlot(fns, unitsDiff);
  const sentenceDiff = fns.composeMultiUnitDoorsWindowsParagraphSentence(slotDiff, unitsDiff.length, { previousRunKey: null });
  assert.equal(
    sentenceDiff,
    "Taşınmazların dış kapıları camlı alüminyum ve pencereleri PVC doğramadır. C 1 No'lu taşınmazın iç kapıları çelik doğramadır. Diğer taşınmazların iç kapıları amerikan panel doğramadır.",
    `İç kapı TÜMÜNDE var ama değeri farklıysa GERÇEK azınlık/çoğunluk ("Diğer taşınmazların") kullanılmalı, sayı-listesi DEĞİL: "${sentenceDiff}"`
  );

  // 3d) Pencere "missing" (henüz takılmamış) bir taşınmazda, diğerinde
  // dolu -> ayrı kalır, malzeme cümlesiyle KARIŞMAZ.
  const unitsMissing = [
    { fields: unitFields(1, { exterior: "Çelik", windows: "Henüz Takılmamış" }) },
    { fields: unitFields(2, { exterior: "Çelik", windows: "PVC" }) },
  ];
  const slotMissing = buildSlot(fns, unitsMissing);
  const sentenceMissing = fns.composeMultiUnitDoorsWindowsParagraphSentence(slotMissing, unitsMissing.length, { previousRunKey: null });
  assert.equal(
    sentenceMissing,
    "Taşınmazların dış kapıları çelik doğramadır. C 1 No'lu taşınmazın pencere montajı henüz yapılmamıştır. C 2 No'lu taşınmazın pencereleri PVC doğramadır.",
    `Pencere "missing" durumu malzeme cümlesiyle KARIŞTIRILMAMALI, ayrı kalmalı: "${sentenceMissing}"`
  );

  console.log("composeMultiUnitDoorsWindowsParagraphSentence(): 4 senaryo (kullanıcı örneği + hepsi-aynı + gerçek azınlık/çoğunluk + missing) testi tamam.");
}

// --- 4) applyDoorsWindowsPossessiveSuffix(): cümle-başı büyük "İç kapılar" ---
{
  const fns = buildSandbox();
  const result = fns.applyDoorsWindowsPossessiveSuffix("İç kapılar amerikan panel doğramadır.", true);
  assert.equal(
    result,
    "İç kapıları amerikan panel doğramadır.",
    `Cümle-başı büyük "İç kapılar" -> "İç kapıları" dönüşümü TURKISH_WORD_START_LOOKBEHIND ile ÇALIŞMALI (bizzat bulunan kusur): "${result}"`
  );
  // Cümle-ortası küçük "iç kapılar" (composeDoorsWindowsSentence'ın TEK-
  // birleşik-cümle biçimindeki ESKİ, ZATEN ÇALIŞAN davranış) REGRESYON
  // OLMADAN devam etmeli.
  const midSentence = fns.applyDoorsWindowsPossessiveSuffix("Dış kapı X, iç kapılar Y ve pencereler Z doğramadır.", true);
  assert.equal(midSentence, "Dış kapıları X, iç kapıları Y ve pencereleri Z doğramadır.", `Cümle-ortası küçük harfli dönüşüm REGRESYON olmadan çalışmalı: "${midSentence}"`);
  console.log("applyDoorsWindowsPossessiveSuffix(): cümle-başı büyük 'İç kapılar' düzeltmesi testi tamam.");
}

// --- 5) Kaynak-düzeyi kablolama regresyon kilidi ------------------------
{
  const singleUnitMarker = appSource.indexOf("function buildUnitDecorativeDescriptionPartsList(");
  const singleUnitEnd = appSource.indexOf("\nfunction ", singleUnitMarker + 10);
  const singleUnitBody = appSource.slice(singleUnitMarker, singleUnitEnd);
  assert.ok(
    singleUnitBody.includes('{ key: "doorsWindows", value: composeDoorsWindowsSentence() }'),
    "TEK taşınmaz listesi (buildUnitDecorativeDescriptionPartsList) HÂLÂ composeDoorsWindowsSentence()'ı DOĞRUDAN kullanmalı (DEĞİŞMEMELİ)."
  );

  const multiUnitMarker = appSource.indexOf("function buildUnitDecorativeDescriptionPartsListForMultiUnitMerge(");
  const multiUnitEnd = appSource.indexOf("\nfunction ", multiUnitMarker + 10);
  const multiUnitBody = appSource.slice(multiUnitMarker, multiUnitEnd);
  assert.ok(
    multiUnitBody.includes("...buildMultiUnitDoorsWindowsPartsForMerge()"),
    "ÇOKLU taşınmaz listesi (buildUnitDecorativeDescriptionPartsListForMultiUnitMerge) buildMultiUnitDoorsWindowsPartsForMerge()'i kullanmalı."
  );
  assert.ok(
    !multiUnitBody.includes('{ key: "doorsWindows", value: composeDoorsWindowsSentence() }'),
    "ÇOKLU taşınmaz listesinde ESKİ tek-alan 'doorsWindows' girdisi KALMAMALI."
  );
  console.log("Kaynak-düzeyi kablolama (tekil DEĞİŞMEDİ, çoklu alan-bazında bölündü) testi tamam.");
}

console.log("Çoklu taşınmaz Kapı/Pencere alan-bazında bölünme testleri başarılı.");
