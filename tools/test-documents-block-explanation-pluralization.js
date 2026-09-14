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
//
// GÜNCELLEME (2026-09-14, ekran görüntüsü — "DEĞERLEME — GENEL BİLGİLER",
// C-1/C-2/C-3 üç bağımsız bölüm AYNI blokta): "ALTTA bazı cümleler hala
// tekil olarak oluşuyor." Kök neden: yukarıdaki (2026-08-26) düzeltme
// yalnızca `isDocumentsBlockGroupingActive()` (2+ FARKLI blok) şartına
// bakıyordu — AYNI blokta 2+ bağımsız bölüm varsa bu şart hiç sağlanmıyor,
// üstelik "order.length<=1" dalı metni OLDUĞU GİBİ (tekil gramerle)
// döndürüyordu, GERÇEK bir çoğullama hiç yapılmıyordu.
// buildDocumentsBlockAttributedExplanationParts artık `isDocumentsBlockGroupingActive()`
// KULLANMIYOR — bunun yerine TOPLAM taşınmaz sayısına (`buildAllTitleUnitsForSummaryTable().length`)
// bakıyor, her metin-grubunun KAÇ taşınmazı temsil ettiğini (`unitIndices`,
// blok sınırlarını AŞARAK toplanır) izliyor, 2+ taşınmaz AYNI metni
// paylaşıyorsa `buildExplanationFn(true)` ile GERÇEKTEN çoğul gramerli
// sürüm istiyor (senaryo 2b/2c, aşağıda YENİ).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const templateEngineSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "templates", "template-engine.js"),
  "utf8"
);

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
//
// `markerToPluralText` (opsiyonel, 2026-09-14): gerçek buildStaticSuitabilityExplanation(isPlural)
// gibi fonksiyonları taklit eder — verilirse, `isPlural=true` ile
// çağrıldığında (buildDocumentsBlockAttributedExplanationParts 2+
// taşınmaz AYNI metni ürettiğinde bunu talep eder) FARKLI bir metin
// döner; verilmezse (varsayılan davranış, 2/3/4. senaryolarda kullanılan
// fake builder'lar) isPlural argümanı YOK SAYILIR — gerçek fonksiyonun
// plural varyant SAĞLAMADIĞI durumda (buildPenaltyDecisionExplanation
// gibi) tekil metne sessizce geri düşüldüğünü doğrular.
function makeMarkerExplanationFn(markerToText, markerToPluralText = null) {
  return (isPlural = false) => {
    const marker = fns.getState().fields?.marker;
    if (isPlural && markerToPluralText) return markerToPluralText[marker] || "";
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
  const wrappedBuilder = (isPlural) => { callCount += 1; return builder(isPlural); };
  const parts = fns.buildDocumentsBlockAttributedExplanationParts(wrappedBuilder);
  // 2 çağrı: her blok için (temsilci alanlarla, metin-tespiti için,
  // isPlural=false) + 1 EK çağrı: 2+ taşınmaz (A Blok'taki 1 + B Blok'taki
  // 1) AYNI metni paylaştığından SONUNDA isPlural=true ile GERÇEKTEN
  // çoğul sürüm istenir (2026-09-14) — fake builder plural pool
  // sağlamadığından (markerToPluralText verilmedi) aynı metne sessizce
  // geri düşer, ama çağrı YİNE DE yapılır.
  assert.equal(callCount, 3, "2 blok tespiti + 1 plural-cozumleme cagrisi (2026-09-14) toplam 3 cagri beklenir.");
  assert.deepEqual(parts, ["Ortak sonuç cümlesi."], "Tüm bloklar AYNI metni ürettiğinde TEK atıfsız cümle dönmeli (fake builder plural saglamadigindan tekil metne geri duser).");
  assert.equal(fns.getState().fields.marker, "DIŞ", "REGRESYON: temp-swap sonrası state.fields ORİJİNALE geri yüklenmeli.");
  console.log("Blok gruplama ACIK + TUM bloklar AYNI metin -> tek atifsiz cumle testi tamam.");
}

// --- 2b) YENİ (2026-09-14): 2+ taşınmaz AYNI metni paylaşıyor VE builder --
// GERÇEKTEN bir plural sürüm sağlıyor -> final metin PLURAL sürüm olmalı
// (kullanıcının "ALTTA bazı cümleler hala tekil" bildirdiği asıl senaryo:
// AYNI TEK blokta 2+ bağımsız bölüm, ör. C-1/C-2/C-3).
{
  fns.setState({ fields: {} });
  fns.setFakeUnitsAndGroups(
    [{ fields: { marker: "AYNI" } }, { fields: { marker: "AYNI" } }, { fields: { marker: "AYNI" } }],
    // TEK blok, 3 taşınmazın HEPSİ o bloğa ait (kullanıcının C-1/C-2/C-3
    // örneğiyle BİREBİR — isDocumentsBlockGroupingActive() ESKİDEN bunu
    // "2+ blok yok" diye tamamen atlıyordu).
    [{ label: "C Blok", unitIndices: [0, 1, 2] }]
  );
  const builder = makeMarkerExplanationFn(
    { AYNI: "Taşınmazın statik projesi incelenmiştir." },
    { AYNI: "Taşınmazların statik projesi incelenmiştir." }
  );
  const parts = fns.buildDocumentsBlockAttributedExplanationParts(builder);
  assert.deepEqual(
    parts,
    ["Taşınmazların statik projesi incelenmiştir."],
    "AYNI TEK blokta 3 tasinmaz ayni metni paylasiyorsa GERCEK plural surum donmeli (eskiden tekil metin OLDUGU GIBI donuyordu)."
  );
  console.log("YENI: AYNI TEK blokta 2+ tasinmaz + plural saglayan builder -> gercek cogul metin testi tamam.");
}

// --- 2c) YENİ (2026-09-14): FARKLI metin üreten bloklardan biri kendi ----
// İÇİNDE 2+ taşınmaz barındırıyor -> O GRUP kendi plural sürümünü alır,
// TEK taşınmazlı diğer grup tekil kalır (attribution ile birlikte).
{
  fns.setState({ fields: {} });
  fns.setFakeUnitsAndGroups(
    [{ fields: { marker: "COK" } }, { fields: { marker: "COK" } }, { fields: { marker: "TEK" } }],
    [
      { label: "A Blok", unitIndices: [0, 1] },
      { label: "B Blok", unitIndices: [2] },
    ]
  );
  const builder = makeMarkerExplanationFn(
    { COK: "Taşınmazın statik projesi incelenmiştir.", TEK: "Taşınmazın statik projesi uyumsuzdur." },
    { COK: "Taşınmazların statik projesi incelenmiştir." } // TEK icin plural pool YOK -> tekil kalmali
  );
  const parts = fns.buildDocumentsBlockAttributedExplanationParts(builder);
  assert.equal(parts.length, 2, `2 FARKLI metin bekleniyordu, bulunan: ${JSON.stringify(parts)}`);
  assert.ok(
    parts.includes("A Blok'a ait: Taşınmazların statik projesi incelenmiştir."),
    `A Blok (2 tasinmaz) kendi PLURAL surumunu almali, bulunan: ${JSON.stringify(parts)}`
  );
  assert.ok(
    parts.includes("B Blok'a ait: Taşınmazın statik projesi uyumsuzdur."),
    `B Blok (1 tasinmaz, plural pool yok) TEKIL kalmali, bulunan: ${JSON.stringify(parts)}`
  );
  console.log("YENI: FARKLI metinli bloklardan biri kendi icinde 2+ tasinmaz -> SADECE o grup plural testi tamam.");
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
    // Takip görevi (2026-09-14): {{BUILDING_INSPECTION_TERMINATION_EXPLANATION_TEXT}}
    // artık AYNI çekirdeğe delege ediyor — buildBuildingInspectionExplanation'ın
    // (2026-08-26'da düzeltilen) üç kardeşinden AYRI kalmış son örnekti.
    ["buildBuildingInspectionTerminationExplanationParts", "buildBuildingInspectionTerminationExplanation"],
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
    // EKB (2026-08-27, kullanıcı bildirimi): "bu şekilde geldi çoklu
    // formata uygun olmalı" — AYNI kusur, buildEkbExplanationParts()
    // (0.0.554'ten beri VAR olan, ayrı bir çekirdeğe sahip) ile.
    ["refreshEkbExplanationFromCurrentFields", "ekbExplanation", "buildEkbExplanationParts"],
  ].forEach(([refreshFnName, fieldKey, partsFnName]) => {
    const body = extractFunction(refreshFnName);
    assert.ok(
      body.includes(`state.fields.${fieldKey} = normalizeReportDescriptionText(${partsFnName}().join("\\n\\n"));`),
      `${refreshFnName}() artık \\n\\n-birleştirilmiş ${partsFnName}() çıktısını yazmalı (eski tekil/atıfsız builder DEĞİL).`
    );
  });

  console.log("Uc gercek wrapper + refresh fonksiyonunun kaynak-duzeyi kablolamasi testi tamam.");
}

// --- 6) Yapı Denetim Fesih Açıklaması (buildingInspectionExplanation'ın ----
// düzenlenebilir bir textarea/state.fields önbelleği OLMAYAN kardeşi):
// buildBuildingInspectionTerminationExplanationText() Parts çıktısını \n\n
// ile birleştirmeli VE template-engine.js'teki {{BUILDING_INSPECTION_TERMINATION_EXPLANATION_TEXT}}
// token'ı artık eski tekil safeCall("buildBuildingInspectionTerminationExplanation")
// DEĞİL, bu birleştirilmiş metin fonksiyonuna sarılı olmalı.
{
  const textFnBody = extractFunction("buildBuildingInspectionTerminationExplanationText");
  assert.ok(
    textFnBody.includes('buildBuildingInspectionTerminationExplanationParts().join("\\n\\n")'),
    "buildBuildingInspectionTerminationExplanationText() Parts cikisini \\n\\n ile birlestirmeli."
  );

  assert.ok(
    templateEngineSource.includes(
      'BUILDINGINSPECTIONTERMINATIONEXPLANATIONTEXT: { t: () => safeCall("buildBuildingInspectionTerminationExplanationText") }'
    ),
    "{{BUILDING_INSPECTION_TERMINATION_EXPLANATION_TEXT}} token'i artik cogullama-farkinda buildBuildingInspectionTerminationExplanationText'e sarili olmali (eski tekil buildBuildingInspectionTerminationExplanation DEGIL)."
  );
  assert.ok(
    !templateEngineSource.includes('safeCall("buildBuildingInspectionTerminationExplanation")'),
    "Eski tekil (cogullama-farkinda OLMAYAN) safeCall(\"buildBuildingInspectionTerminationExplanation\") cagrisi template-engine.js'te KALMAMALI."
  );

  assert.ok(
    appSource.includes("value: buildBuildingInspectionTerminationExplanationText(),"),
    "collectGeneratedTextPlaceholders() 'building_inspection_termination_explanation_text' girdisi de ayni cogullama-farkinda fonksiyonu kullanmali."
  );

  console.log("Yapi Denetim Fesih Aciklamasi (Parts + template-engine kablolamasi) testi tamam.");
}

console.log("Belgeler ve Proje aciklamalari (Cezai Karar/Statik Uygunluk/Yapi Denetim) blok-atifli cogullama testleri basarili.");
