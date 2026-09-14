"use strict";

// Kullanıcı bildirimi (2026-09-14, ekran görüntüsü — "DEĞERLEME — GENEL
// BİLGİLER", C-1/C-2/C-3 üç bağımsız bölüm AYNI blokta): "ALTTA bazı
// cümleler hala tekil olarak oluşuyor." İki ayrı kök neden vardı:
//
//  1) "*** Taşınmazın değerlemesi takyidatlardan bağımsız yapılmıştır."
//     (kuveytturk.html/kuveytturk-arsa-arazi.html) ve "** Taşınmazın satış
//     kabiliyeti takyidatlardan bağımsız olarak belirlenmiştir."
//     (yapikredi.html) şablonlara DÜZ METİN olarak yazılmıştı — hiçbir
//     token/fonksiyona bağlı DEĞİLDİ, HER ZAMAN tekil basıyordu. Artık
//     {{TAKYIDAT_BAGIMSIZ_DEGERLEME_NOTU}}/{{TAKYIDAT_BAGIMSIZ_SATIS_KABILIYETI_NOTU}}
//     token'larına bağlı, `buildTakyidatIndependentValuationNoteText()`/
//     `buildTakyidatIndependentSaleabilityNoteText()` üretir.
//
//  2) `buildStaticSuitabilityExplanation()`/`buildBuildingInspectionExplanation()`/
//     `buildBuildingInspectionLawExemptionExplanation()` (buildDocumentsBlockAttributedExplanationParts
//     ailesi) artık `isPlural` parametresi alıyor — bu dosya bu üç
//     fonksiyonun GERÇEK kaynağını çalıştırıp isPlural=true/false için
//     doğru metni ürettiğini doğrular (ortak çekirdeğin KENDİSİ zaten
//     tools/test-documents-block-explanation-pluralization.js'te fake
//     builder'larla test ediliyor — bu dosya GERÇEK varyant metinlerine
//     odaklanır).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const templateEngineSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "templates", "template-engine.js"),
  "utf8"
);

function sourceBetween(startMarker, endMarker, label) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak bulunamadı: ${label || startMarker}`);
  return appSource.slice(start, end);
}

// --- 1) buildTakyidatIndependent*NoteText(): tekil/çoğul --------------------
{
  const source = sourceBetween(
    "function buildTakyidatIndependentValuationNoteText() {",
    "function isPropertyTaxDeclarationEnabled() {",
    "buildTakyidatIndependent*NoteText"
  );
  const context = { state: { titleUnits: [] }, getTitleUnitCount: () => 1 + (Array.isArray(context.state.titleUnits) ? context.state.titleUnits.length : 0) };
  vm.createContext(context);
  vm.runInContext(source, context);

  assert.equal(
    context.buildTakyidatIndependentValuationNoteText(),
    "Taşınmazın değerlemesi takyidatlardan bağımsız yapılmıştır.",
    "Tek taşınmaz (titleUnits boş) -> tekil 'Taşınmazın' olmalı."
  );
  assert.equal(
    context.buildTakyidatIndependentSaleabilityNoteText(),
    "Taşınmazın satış kabiliyeti takyidatlardan bağımsız olarak belirlenmiştir.",
    "Tek taşınmaz -> tekil 'Taşınmazın' olmalı."
  );

  context.state.titleUnits = [{}, {}]; // + primary = 3 taşınmaz
  assert.equal(
    context.buildTakyidatIndependentValuationNoteText(),
    "Taşınmazların değerlemesi takyidatlardan bağımsız yapılmıştır.",
    "3 taşınmaz -> çoğul 'Taşınmazların' olmalı (KULLANICI ÖRNEĞİ: C-1/C-2/C-3)."
  );
  assert.equal(
    context.buildTakyidatIndependentSaleabilityNoteText(),
    "Taşınmazların satış kabiliyeti takyidatlardan bağımsız olarak belirlenmiştir.",
    "3 taşınmaz -> çoğul 'Taşınmazların' olmalı."
  );
  console.log("buildTakyidatIndependentValuationNoteText/buildTakyidatIndependentSaleabilityNoteText tekil/coğul testi tamam.");
}

// --- 2) template-engine.js token kablolaması + 3 şablonda literal metin -----
// artık YOK, dinamik token VAR.
{
  assert.ok(
    templateEngineSource.includes('TAKYIDATBAGIMSIZDEGERLEMENOTU: { t: () => safeCall("buildTakyidatIndependentValuationNoteText") }'),
    "TAKYIDATBAGIMSIZDEGERLEMENOTU token'i buildTakyidatIndependentValuationNoteText'e sarili olmali."
  );
  assert.ok(
    templateEngineSource.includes('TAKYIDATBAGIMSIZSATISKABILIYETINOTU: { t: () => safeCall("buildTakyidatIndependentSaleabilityNoteText") }'),
    "TAKYIDATBAGIMSIZSATISKABILIYETINOTU token'i buildTakyidatIndependentSaleabilityNoteText'e sarili olmali."
  );

  const templatesDir = path.join(__dirname, "..", "templates");
  const kuveytturk = fs.readFileSync(path.join(templatesDir, "kuveytturk.html"), "utf8");
  const kuveytturkArsaArazi = fs.readFileSync(path.join(templatesDir, "kuveytturk-arsa-arazi.html"), "utf8");
  const yapikredi = fs.readFileSync(path.join(templatesDir, "yapikredi.html"), "utf8");

  for (const [name, html] of [["kuveytturk.html", kuveytturk], ["kuveytturk-arsa-arazi.html", kuveytturkArsaArazi]]) {
    assert.ok(!/Taşınmazın değerlemesi takyidatlardan bağımsız yapılmıştır\./.test(html), `${name}: eski DÜZ METİN (her zaman tekil) artık BULUNMAMALI.`);
    assert.ok(html.includes("{{TAKYIDAT_BAGIMSIZ_DEGERLEME_NOTU}}"), `${name}: {{TAKYIDAT_BAGIMSIZ_DEGERLEME_NOTU}} token'i bulunamadı.`);
  }
  assert.ok(!/Taşınmazın satış kabiliyeti takyidatlardan bağımsız olarak belirlenmiştir\./.test(yapikredi), "yapikredi.html: eski DÜZ METİN artık BULUNMAMALI.");
  assert.ok(yapikredi.includes("{{TAKYIDAT_BAGIMSIZ_SATIS_KABILIYETI_NOTU}}"), "yapikredi.html: {{TAKYIDAT_BAGIMSIZ_SATIS_KABILIYETI_NOTU}} token'i bulunamadı.");
  console.log("template-engine.js token kablolamasi + 3 sablonda dinamik token testi tamam.");
}

// --- 3) buildStaticSuitabilityExplanation(isPlural): GERÇEK varyant --------
// metinleri.
{
  const source = sourceBetween(
    "const staticSuitabilityOkVariants = [",
    "function buildStaticSuitabilityExplanationParts() {",
    "buildStaticSuitabilityExplanation ailesi"
  );
  const context = {
    state: { fields: { staticSuitability: "Evet", documentReviewInstitution: "Osmangazi Belediyesi" } },
    normalizeYesNoChoice: (v) => v,
    normalizeReportDescriptionText: (v) => String(v || "").replace(/\s+/g, " ").trim(),
    normalizeReportTitleText: (v) => String(v || "").trim(),
    foldTurkish: (v) => String(v || "").toUpperCase(),
    buildDefaultDocumentReviewInstitution: () => "",
    selectVariant: () => 0,
    registerVariantGroup: () => {},
  };
  vm.createContext(context);
  vm.runInContext(source, context);

  assert.equal(
    context.buildStaticSuitabilityExplanation(false),
    "Taşınmazın Osmangazi Belediyesi dosyasında bulunan statik proje incelenmiştir. Statik proje, mimari proje ve mahal durum ile uyumludur.",
    "isPlural=false -> tekil (KULLANICI EKRAN GÖRÜNTÜSÜNDEKİ metin) beklenir."
  );
  assert.equal(
    context.buildStaticSuitabilityExplanation(true),
    "Taşınmazların Osmangazi Belediyesi dosyasında bulunan statik proje incelenmiştir. Statik proje, mimari proje ve mahal durum ile uyumludur.",
    "isPlural=true -> 'Taşınmazın'->'Taşınmazların' DIŞINDA metin AYNI kalmalı."
  );

  context.state.fields.staticSuitability = "Hayır";
  context.state.fields.staticSuitabilityNote = "";
  assert.equal(
    context.buildStaticSuitabilityExplanation(true),
    "Taşınmazların Osmangazi Belediyesi dosyasında bulunan statik proje incelenmiştir. Statik proje, mimari proje ve mahal durum ile uyumlu değildir.",
    "Hayır + isPlural=true -> uyumsuz çoğul varyant beklenir."
  );
  console.log("buildStaticSuitabilityExplanation(isPlural): gercek Evet/Hayir cogul varyant testi tamam.");
}

// --- 4) buildBuildingInspectionExplanation(isPlural)/LawExemption: GERÇEK --
// varyant metinleri.
{
  const source = sourceBetween(
    "const BUILDING_INSPECTION_LAW_EFFECTIVE_ISO_DATE",
    "function buildBuildingInspectionTerminationExplanationParts() {",
    "buildBuildingInspectionExplanation ailesi"
  );
  function makeContext(overrides = {}) {
    const context = {
      state: { fields: { buildingInspectionContractActive: "Evet", ...overrides } },
      hasReviewedOccupancyPermitDocument: () => false,
      getLatestBuildingPermitDocumentRow: () => null,
      parseReviewedDocumentDate: () => "",
      dateIsoToTr: () => "",
      getProjectReviewDistrictText: () => "Osmangazi",
      normalizeReportDescriptionText: (v) => String(v || "").replace(/\s+/g, " ").trim(),
      selectVariant: () => 0,
      registerVariantGroup: () => {},
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
  }

  // 4a) Aktif sözleşme, seviye YOK.
  {
    const context = makeContext({ buildingInspectionContractActive: "Evet", buildingInspectionProgressLevel: "" });
    assert.equal(
      context.buildBuildingInspectionExplanation(false),
      "Osmangazi Belediyesinden alınan sözlü bilgiye göre taşınmazın yer aldığı binanın yapı denetim sözleşmesinin aktif olduğu bilgisine ulaşılmıştır.",
      "isPlural=false -> tekil 'taşınmazın' beklenir."
    );
    assert.equal(
      context.buildBuildingInspectionExplanation(true),
      "Osmangazi Belediyesinden alınan sözlü bilgiye göre taşınmazların yer aldığı binanın yapı denetim sözleşmesinin aktif olduğu bilgisine ulaşılmıştır.",
      "isPlural=true -> 'taşınmazın'->'taşınmazların' DIŞINDA metin AYNI ('binanın' TEKİL kalmalı — aynı bina)."
    );
    console.log("buildBuildingInspectionExplanation(isPlural): aktif sozlesme cogul testi tamam.");
  }

  // 4b) Feshedilmiş sözleşme.
  {
    const context = makeContext({ buildingInspectionContractActive: "Hayır (Fesihli)", buildingInspectionTerminationLevel: "" });
    const plural = context.buildBuildingInspectionExplanation(true);
    assert.ok(plural.includes("taşınmazların yer aldığı binanın"), `Fesihli + isPlural=true -> 'taşınmazların yer aldığı binanın' icermeli, bulunan: ${plural}`);
    assert.ok(plural.includes("feshedildiği"), `Fesih metni korunmali, bulunan: ${plural}`);
    console.log("buildBuildingInspectionExplanation(isPlural): feshedilmis sozlesme cogul testi tamam.");
  }

  // 4c) Yapı Denetim Kanunu kapsamı dışı (law exemption sub-path).
  {
    const context = makeContext({ buildingInspectionContractActive: "Evet" });
    context.getLatestBuildingPermitDocumentRow = () => ({ c2: "2000-01-01" });
    context.parseReviewedDocumentDate = () => "2000-01-01";
    context.dateIsoToTr = (iso) => (iso === "2000-01-01" ? "01.01.2000" : "");
    assert.equal(
      context.buildBuildingInspectionExplanation(false),
      "Ekspertize konu taşınmazın yeni yapı ruhsat tarihi 01.01.2000 olup, 13.07.2001 tarih ve 4708 sayılı Yapı Denetimi Hakkında Kanun'un kapsamı dışında kalmaktadır.",
      "Kanun kapsami disi + isPlural=false -> tekil metin beklenir."
    );
    assert.equal(
      context.buildBuildingInspectionExplanation(true),
      "Ekspertize konu taşınmazların yeni yapı ruhsat tarihi 01.01.2000 olup, 13.07.2001 tarih ve 4708 sayılı Yapı Denetimi Hakkında Kanun'un kapsamı dışında kalmaktadır.",
      "Kanun kapsami disi + isPlural=true -> isPlural, buildBuildingInspectionLawExemptionExplanation'a DOGRU sekilde ILETILMELI (kullanicinin bildirdigi ikinci fonksiyon zinciri kirigi)."
    );
    console.log("buildBuildingInspectionExplanation(isPlural) -> buildBuildingInspectionLawExemptionExplanation(isPlural) zincirleme aktarim testi tamam.");
  }

  // 4d) YENİ (2026-09-14, takip görevi): buildBuildingInspectionTerminationExplanation(isPlural)
  // — {{BUILDING_INSPECTION_TERMINATION_EXPLANATION_TEXT}} için AYRI üretilen
  // (buildBuildingInspectionExplanation'dan TAMAMEN BAĞIMSIZ çağrılan) fonksiyon
  // — AYNI "feshedilmiş" plural varyant havuzunu (buildingInspectionTerminatedPluralVariants)
  // isPlural ile paylaştığını doğrular. Sözleşme "Hayır (Fesihli)" DIŞINDaki
  // durumlarda hâlâ "" dönmeli (regresyon).
  {
    const context = makeContext({ buildingInspectionContractActive: "Hayır (Fesihli)", buildingInspectionTerminationLevel: "" });
    assert.equal(
      context.buildBuildingInspectionTerminationExplanation(false),
      "Osmangazi Belediyesinden alınan sözlü bilgiye göre taşınmazın yer aldığı binanın yapı denetim sözleşmesinin feshedildiği bilgisine ulaşılmıştır.",
      "isPlural=false -> tekil 'taşınmazın' beklenir."
    );
    assert.equal(
      context.buildBuildingInspectionTerminationExplanation(true),
      "Osmangazi Belediyesinden alınan sözlü bilgiye göre taşınmazların yer aldığı binanın yapı denetim sözleşmesinin feshedildiği bilgisine ulaşılmıştır.",
      "isPlural=true -> 'taşınmazın'->'taşınmazların' DIŞINDA metin AYNI ('binanın' TEKİL kalmalı — aynı bina) — AYNI plural havuzu buildBuildingInspectionExplanation ile PAYLAŞILMALI."
    );
    console.log("buildBuildingInspectionTerminationExplanation(isPlural): feshedilmis sozlesme cogul testi tamam.");

    const activeContext = makeContext({ buildingInspectionContractActive: "Evet" });
    assert.equal(
      activeContext.buildBuildingInspectionTerminationExplanation(true),
      "",
      "Sözleşme 'Evet' (fesihli DEĞİL) iken isPlural=true olsa bile boş metin dönmeli (regresyon)."
    );
  }
}

console.log("Statik Uygunluk/Yapi Denetim/Takyidat notu cogullama testleri basarili.");
