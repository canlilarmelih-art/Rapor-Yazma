"use strict";

// Cezai Karar/Statik Uygunluk/Yapı Denetim Açıklamaları — blok atıflı
// çoğullama (2026-08-26). Kullanıcı talebi: "Cezai Karar Açıklaması Statik
// Uygunluk Açıklaması Yapı Denetim Açıklaması bu açıklamalar çoğul olmalı."
// Bu üç açıklama DOCUMENTS_BLOCK_SHARED_FIELD_KEYS'te (blok içinde
// paylaşımlı) olsa da, üretimleri yalnızca AKTİF bloğun alanlarını
// okuyordu — "Çoklu Talep" + FARKLI bloklarda bu üç sorunun cevabı FARKLI
// olabildiğinde açıklama yalnızca aktif bloğu yansıtıyor, diğerleri
// SESSİZCE kayboluyordu (buildEkbExplanationParts/buildProjectReviewExplanationParts
// ile AYNI sınıf kusur, bkz. test-ekb-explanation-block-attribution.js).
//
// Yeni buildDocumentsBlockAttributedExplanationParts(buildExplanationFn)
// bu üç açıklamanın (buildPenaltyDecisionExplanationParts/
// buildStaticSuitabilityExplanationParts/buildBuildingInspectionExplanationParts)
// ORTAK genel çekirdeği. Bu dosya SADECE bu genel çekirdeği KENDİ (fake)
// bir buildExplanationFn ile test eder — üç gerçek açıklamanın kendi iç
// metin üretimi (varyant seçimi, kurum formatlaması, vb.) ZATEN ayrı
// testlerde (test-building-inspection-law-exemption.js vb.) kapsanıyor.
// Üç gerçek wrapper'ın doğru şekilde bu çekirdeğe delege ettiği VE üç
// refresh fonksiyonunun artık \n\n-birleştirilmiş Parts çıktısını yazdığı
// ayrıca kaynak-düzeyinde (grep tabanlı) doğrulanır (bkz. senaryo 5).

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

// Gerçek formatDocumentBlockAttributionPhrase/normalizeBlockLabelPrefixForAttribution/
// joinTurkishList kullanılır (atıf metninin GERÇEK biçimini doğrulamak
// için) — computeDocumentsBlockGroups/computeDocumentsBlockLabel/
// buildAllTitleUnitsForSummaryTable ise bu testin odağı DIŞINDA (ayrı
// testlerde kapsanan gerçek gruplama mantığı) FAKE'lenir; bu dosya
// yalnızca "aynı/farklı metin üreten bloklar nasıl birleşir/ayrılır"
// sorusuna odaklanır.
const functionNames = [
  "normalizeBlockLabelPrefixForAttribution",
  "formatDocumentBlockAttributionPhrase",
  "buildDocumentsBlockAttributedExplanationParts",
];

const sandboxSource = `
  let state = {};
  let blockGroupingActive = false;
  let fakeUnits = [];
  let fakeGroups = [];
  function isDocumentsBlockGroupingActive() { return blockGroupingActive; }
  function buildAllTitleUnitsForSummaryTable() { return fakeUnits; }
  function computeDocumentsBlockGroups() { return fakeGroups; }
  function computeDocumentsBlockLabel(group) { return group.label; }
  function joinTurkishList(items = []) {
    const clean = (items || []).map((item) => String(item || "").replace(/\\s+/g, " ").trim()).filter(Boolean);
    if (!clean.length) return "";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return \`\${clean[0]} ve \${clean[1]}\`;
    return \`\${clean.slice(0, -1).join(", ")} ve \${clean[clean.length - 1]}\`;
  }
  function normalizeReportDescriptionText(value) {
    return String(value || "").replace(/\\s+/g, " ").trim();
  }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    setBlockGroupingActive: (v) => { blockGroupingActive = v; },
    setFakeUnitsAndGroups: (units, groups) => { fakeUnits = units; fakeGroups = groups; },
    buildDocumentsBlockAttributedExplanationParts,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// Dıştan geçirilen builder, buildDocumentsBlockAttributedExplanationParts
// TARAFINDAN çağrıldığı anda sandbox'ın (temp-swap edilmiş) GÜNCEL
// state.fields'ını fns.getState() üzerinden okuyabilir — sandbox `state`
// nesnesini YENİDEN ATAMAZ, yalnızca `state.fields`'ı değiştirir, bu
// yüzden `fns.getState()`'in döndürdüğü referans HER ZAMAN güncel kalır
// (gerçek buildPenaltyDecisionExplanation/vb.'nin "state.fields'tan
// hesaplanan bir metin döner" davranışını doğru taklit eder).
function makeMarkerExplanationFn(markerToText) {
  return () => {
    const marker = fns.getState().fields?.marker;
    return markerToText[marker] || "";
  };
}

// --- 1) Blok gruplama AKTİF DEĞİLKEN: davranış AYNEN korunur (regresyon) --
{
  fns.setBlockGroupingActive(false);
  fns.setState({ fields: {} });
  assert.deepEqual(fns.buildDocumentsBlockAttributedExplanationParts(() => "TEK METİN"), ["TEK METİN"], "Blok gruplama kapalıyken tek/atıfsız metin AYNEN dönmeli.");
  assert.deepEqual(fns.buildDocumentsBlockAttributedExplanationParts(() => ""), [], "Boş metin -> boş dizi (regresyon, eski davranış).");
  console.log("Blok gruplama KAPALI -> regresyon (tek/atifsiz metin) testi tamam.");
}

// --- 2) Blok gruplama AKTİF, TÜM bloklar AYNI metni üretiyor -> TEK ------
// (atıfsız) cümle — "hepsi aynıysa blok adı tekrar etmeden tek genel
// cümle" ilkesi (buildProjectReviewConsolidatedSentences ile AYNI).
{
  fns.setBlockGroupingActive(true);
  fns.setState({ fields: { marker: "DIŞ" } }); // originalFields — temp-swap sonrası GERİ YÜKLENMELİ
  fns.setFakeUnitsAndGroups(
    [{ fields: { marker: "AYNI" } }, { fields: { marker: "AYNI" } }],
    [
      { label: "A Blok", unitIndices: [0] },
      { label: "B Blok", unitIndices: [1] },
    ]
  );
  let callCount = 0;
  const builder = makeMarkerExplanationFn({ AYNI: "Ortak sonuç cümlesi." });
  const wrappedBuilder = () => { callCount += 1; return builder(); };
  const parts = fns.buildDocumentsBlockAttributedExplanationParts(wrappedBuilder);
  assert.equal(callCount, 2, "HER blok için (temsilci alanlarla) builder ÇAĞRILMALI.");
  assert.deepEqual(parts, ["Ortak sonuç cümlesi."], "Tüm bloklar AYNI metni ürettiğinde TEK atıfsız cümle dönmeli.");
  assert.equal(fns.getState().fields.marker, "DIŞ", "REGRESYON: temp-swap sonrası state.fields ORİJİNALE geri yüklenmeli.");
  console.log("Blok gruplama ACIK + TUM bloklar AYNI metin -> tek atifsiz cumle testi tamam.");
}

// --- 3) Blok gruplama AKTİF, bloklar FARKLI metin üretiyor -> HER FARKLI --
// metin KENDİ blok atfıyla ayrı cümlede kalır; AYNI metni üreten bloklar
// (A ve C) TEK birleşik atıfla kalır ("A ve C Blok'a ait: ...").
{
  fns.setBlockGroupingActive(true);
  fns.setState({ fields: {} });
  fns.setFakeUnitsAndGroups(
    [{ fields: { marker: "A" } }, { fields: { marker: "B" } }, { fields: { marker: "C" } }],
    [
      { label: "A Blok", unitIndices: [0] },
      { label: "B Blok", unitIndices: [1] },
      { label: "C Blok", unitIndices: [2] },
    ]
  );
  const builder = makeMarkerExplanationFn({
    A: "Sözleşme aktif.",
    B: "Sözleşme feshedilmiş.",
    C: "Sözleşme aktif.",
  });
  const parts = fns.buildDocumentsBlockAttributedExplanationParts(builder);
  assert.equal(parts.length, 2, `2 FARKLI metin (A+C ortak, B ayrı) -> 2 parça beklenir, bulunan: ${JSON.stringify(parts)}`);
  assert.ok(parts.includes("A ve C Blok'a ait: Sözleşme aktif."), `A+C ortak metni TEK birleşik atıfla gelmeli, bulunan: ${JSON.stringify(parts)}`);
  assert.ok(parts.includes("B Blok'a ait: Sözleşme feshedilmiş."), `B kendi ayrı atıflı cümlesinde kalmalı, bulunan: ${JSON.stringify(parts)}`);
  console.log("Blok gruplama ACIK + FARKLI metinler -> AYNI metin birlesik/FARKLI ayri atifli cumle testi tamam.");
}

// --- 4) Bir blok BOŞ metin üretirse (ör. o sorunun cevabı yok) o blok -----
// SESSİZCE atlanır, diğer bloklar etkilenmez.
{
  fns.setBlockGroupingActive(true);
  fns.setState({ fields: {} });
  fns.setFakeUnitsAndGroups(
    [{ fields: { marker: "A" } }, { fields: { marker: "BOS" } }],
    [
      { label: "A Blok", unitIndices: [0] },
      { label: "B Blok", unitIndices: [1] },
    ]
  );
  const builder = makeMarkerExplanationFn({ A: "Cezai karara rastlanmamıştır." });
  const parts = fns.buildDocumentsBlockAttributedExplanationParts(builder);
  assert.deepEqual(parts, ["Cezai karara rastlanmamıştır."], "Bos metin ureten blok atlanmali, TEK (atifsiz - kalan tek metin oldugundan) cumle donmeli.");
  console.log("Bos metin ureten blogun sessizce atlanmasi testi tamam.");
}

// --- 5) Kaynak-düzeyi kablolama: üç gerçek wrapper + üç refresh ----------
// fonksiyonu doğru şekilde bu çekirdeğe delege ediyor mu?
{
  [
    ["buildPenaltyDecisionExplanationParts", "buildPenaltyDecisionExplanation"],
    ["buildStaticSuitabilityExplanationParts", "buildStaticSuitabilityExplanation"],
    ["buildBuildingInspectionExplanationParts", "buildBuildingInspectionExplanation"],
  ].forEach(([partsFnName, singleFnName]) => {
    const body = extractFunction(partsFnName);
    assert.ok(
      body.includes(`buildDocumentsBlockAttributedExplanationParts(${singleFnName})`),
      `${partsFnName}() ortak çekirdeğe (${singleFnName} ile) delege etmeli.`
    );
  });

  [
    ["refreshPenaltyDecisionExplanationFromCurrentFields", "penaltyDecisionExplanation", "buildPenaltyDecisionExplanationParts"],
    ["refreshStaticSuitabilityExplanationFromCurrentFields", "staticSuitabilityExplanation", "buildStaticSuitabilityExplanationParts"],
    ["refreshBuildingInspectionExplanationFromCurrentFields", "buildingInspectionExplanation", "buildBuildingInspectionExplanationParts"],
  ].forEach(([refreshFnName, fieldKey, partsFnName]) => {
    const body = extractFunction(refreshFnName);
    assert.ok(
      body.includes(`state.fields.${fieldKey} = normalizeReportDescriptionText(${partsFnName}().join("\\n\\n"));`),
      `${refreshFnName}() artık \\n\\n-birleştirilmiş ${partsFnName}() çıktısını yazmalı (eski tekil/atıfsız builder DEĞİL).`
    );
  });

  console.log("Uc gercek wrapper + refresh fonksiyonunun kaynak-duzeyi kablolamasi testi tamam.");
}

console.log("Belgeler ve Proje aciklamalari (Cezai Karar/Statik Uygunluk/Yapi Denetim) blok-atifli cogullama testleri basarili.");
