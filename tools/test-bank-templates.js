"use strict";

/*
  Banka şablonları regresyon testi.

  1) templates/*.html içindeki TÜM {{token}} adlarının şablon motoru
     tarafından çözümlenebildiğini (missing listesinin boş olduğunu) doğrular.
  2) Örnek state ile birkaç değerin doğru üretildiğini kontrol eder.
  3) foldTokenName eşdeğerliklerini (Türkçe/noktalama duyarsızlık) doğrular.

  Motor, app.js global'lerini çağrı anında kullandığından burada Node
  sanal ortamında stub'larla yüklenir; alan anahtarları GERÇEK app.js
  kaynağından, oluşturulan metin anahtarları GERÇEK
  collectGeneratedTextPlaceholders gövdesinden çıkarılır — yani app.js'te
  bir anahtar yeniden adlandırılırsa bu test kırılır (istenen davranış).
*/

const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

// --- app.js kaynağından gerçek anahtarları çıkar -----------------------
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

const sectionsStart = appSource.indexOf("const sections = [");
const sectionsEnd = appSource.indexOf("\n];", sectionsStart);
assert(sectionsStart > -1 && sectionsEnd > sectionsStart, "app.js icinde sections dizisi bulunamadi.");
const sectionsSlice = appSource.slice(sectionsStart, sectionsEnd);
const fieldKeys = [...sectionsSlice.matchAll(/key: "([A-Za-z0-9_]+)"/g)].map((m) => m[1]);
const dateFieldKeys = new Set(
  [...sectionsSlice.matchAll(/\{[^{}]*key: "([A-Za-z0-9_]+)"[^{}]*type: "date"[^{}]*\}/gs)].map((m) => m[1])
);
[
  "appointmentDate", "municipalityInspectionDate", "takbisDate", "planDate",
  "projectDate", "titleProjectDate", "municipalityProjectDate", "ekbIssueDate", "ekbValidUntil",
].forEach((key) => dateFieldKeys.add(key));
assert(fieldKeys.length > 100, `sections alan anahtari sayisi beklenenden az: ${fieldKeys.length}`);

const genStart = appSource.indexOf("function collectGeneratedTextPlaceholders()");
const genEnd = appSource.indexOf("\nfunction collectTablePlaceholders", genStart);
assert(genStart > -1 && genEnd > genStart, "collectGeneratedTextPlaceholders bulunamadi.");
const genSlice = appSource.slice(genStart, genEnd);
const valuationGenStart = appSource.indexOf("function getValuationFieldPlaceholderRows()");
const valuationGenEnd = appSource.indexOf("\nconst valuationMethodOptions", valuationGenStart);
assert(valuationGenStart > -1 && valuationGenEnd > valuationGenStart, "getValuationFieldPlaceholderRows bulunamadi.");
const valuationGenSlice = appSource.slice(valuationGenStart, valuationGenEnd);
const generatedKeys = [...new Set(
  [
    ...[genSlice, valuationGenSlice].flatMap((slice) => [...slice.matchAll(/key: "([A-Za-z0-9_]+)"/g)].map((m) => m[1])),
    ...[...valuationGenSlice.matchAll(/add\("([A-Za-z0-9_]+)"/g)].map((m) => m[1]),
    "legalValueArea",
    "currentRentUnit",
    "legalBuildingUnitCost",
    "currentBuildingDepreciationRate",
    "legalPremiumRate",
    "propertyTaxDeclarationValue",
  ]
)];
assert(generatedKeys.length >= 20, `olusturulan metin anahtari sayisi beklenenden az: ${generatedKeys.length}`);

// --- motoru sanal ortamda yükle ----------------------------------------
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

const sandboxWindow = {};
const stubState = {
  fields: {
    city: "Bursa",
    district: "Nilüfer",
    legalValue: "5400000",
    titleQuality: "Mesken",
  },
  tables: {
    title: [{ c0: "Ali Veli", c1: "1/2", c2: "Satış", c3: "05.03.2024", c4: "1234" }],
    documents: [{ c0: "Yapı Ruhsatı", c1: "Belediye", c2: "01.02.2020", c3: "55", c4: "Tam" }],
  },
};
stubState.fields.municipalityInspectionDate = "2026-7-6";
stubState.fields.projectDate = "1987-04-06";
const genericDateTestKeys = [...dateFieldKeys].filter((key) => !Object.prototype.hasOwnProperty.call(stubState.fields, key));
genericDateTestKeys.forEach((key) => { stubState.fields[key] = "2025-08-09"; });
stubState.tables.title[0].c3 = "2024-03-05";
stubState.tables.documents[0].c2 = "2020-02-01";
const stubSections = [{ id: "test", fields: fieldKeys.map((key) => ({ key, type: dateFieldKeys.has(key) ? "date" : "text" })) }];

globalThis.buildSimpleHtmlTable = (_headers, rows) => JSON.stringify(rows);

function stubEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const loader = new Function(
  "window", "state", "sections", "collectGeneratedTextPlaceholders",
  "escapeHtml", "formatWordParagraphs", "dateIsoToTr", "parseValuationNumber", "formatSchemeNumber",
  engineSource
);
loader(
  sandboxWindow,
  stubState,
  stubSections,
  () => generatedKeys.map((key) => ({ reference: key, value: "ornek metin" })),
  stubEscapeHtml,
  (text, paragraphClass) => {
    const classAttr = paragraphClass ? ` class="${stubEscapeHtml(paragraphClass)}"` : "";
    return `<p${classAttr}>${stubEscapeHtml(text)}</p>`;
  },
  (iso) => {
    const m = String(iso || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? `${m[3].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[1]}` : String(iso || "");
  },
  (value) => Number.parseFloat(String(value).replace(/\./g, "").replace(",", ".")),
  (value) => new Intl.NumberFormat("tr-TR").format(value)
);

const engine = sandboxWindow.RaporTemplates;
assert(Boolean(engine), "window.RaporTemplates olusmadi.");

[
  "LEGAL_VALUE_AREA",
  "CURRENT_RENT_UNIT",
  "LEGAL_BUILDING_UNIT_COST",
  "CURRENT_BUILDING_DEPRECIATION_RATE",
  "LEGAL_PREMIUM_RATE",
  "PROPERTY_TAX_DECLARATION_VALUE",
].forEach((name) => {
  assert(engine.resolveToken(name).ok, `${name} degerleme kutucugu placeholder'i cozumlenemedi.`);
});

globalThis.getValuationUnitAreaTotals = () => ({ legal: "185", current: "210" });
assert(
    engine.resolveToken("TOTAL_LEGAL_AREA").html === "185" &&
    engine.resolveToken("TOTAL_CURRENT_AREA").html === "210" &&
    engine.resolveToken("TOPLAM_YASAL_ALAN").html === "185" &&
    engine.resolveToken("TOPLAM_MEVCUT_ALAN").html === "210",
  "Toplam yasal/mevcut alan placeholderlari cozumlenemedi."
);
delete globalThis.getValuationUnitAreaTotals;

globalThis.getRoadSetbackAmount = () => "25";
globalThis.getPostRoadSetbackParcelArea = () => "975";
assert(
    engine.resolveToken("ROAD_SETBACK_AMOUNT").html === "25" &&
    engine.resolveToken("YOLA_TERK_MIKTARI").html === "25" &&
    engine.resolveToken("POST_ROAD_SETBACK_PARCEL_AREA").html === "975" &&
    engine.resolveToken("TERK_SONRASI_PARSEL_ALANI").html === "975",
  "Yola terk miktari / terk sonrasi parsel alani placeholderlari cozumlenemedi."
);
delete globalThis.getRoadSetbackAmount;
delete globalThis.getPostRoadSetbackParcelArea;

// --- 1) tüm şablon tokenları çözümlenmeli -------------------------------
const templateFiles = fs.readdirSync(path.join(appDir, "templates")).filter((f) => f.endsWith(".html"));
assert(templateFiles.length >= 10, `templates/ altinda beklenen sablon sayisi yok: ${templateFiles.length}`);

const tableBlockTokens = ["DEGERLENDIRME_TABLOSU", "KAT_BAZINDA_INDIRGENMIS_ALAN_TABLOSU", "DEGERLENDIRME_SEMASI", "EMSAL_DEGERLEME_TABLOSU"];
templateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  assert(
    /\.table-block\s*\{[^}]*margin-bottom:\s*16px;[^}]*page-break-inside:\s*avoid;[^}]*break-inside:\s*avoid;/s.test(text),
    `${file}: ortak table-block bosluk ve sayfa bolunmeme kurali bulunamadi.`
  );
  tableBlockTokens.forEach((token) => {
    if (!text.includes(`{{${token}}}`)) return;
    assert(
      new RegExp(`<div class="table-block">\\s*\\{\\{${token}\\}\\}\\s*</div>`, "s").test(text),
      `${file}: ${token} table-block kapsayicisina alinmamis.`
    );
  });
});

// Şablon dosyalarında eski Excel adları KULLANILMAMALI (kullanıcı kararı
// 2026-07-12): motor eski adları hâlâ çözer (tolerans) ama bizim
// dosyalarımız programın kendi placeholder adlarını içermeli.
const FORBIDDEN_LEGACY_TOKENS = [
  "{{SEHIR}}", "{{ILCE}}", "{{MAHALLE}}", "{{İDARİMAHALLE}}", "{{SOKAK}}",
  "{{ADRES2025}}", "{{ADRESAPTSİTE}}", "{{BLOKADI}}", "{{DIŞ.KAPI.NO}}",
  "{{BB.NO}}", "{{TAPUKAT}}", "{{kat.2}}", "{{ENLEM}}", "{{BOYLAM}}",
  "{{ZEMİNTİPİ}}", "{{TAPUNİTELİKBB}}", "{{ADA}}", "{{PARSEL}}", "{{PAFTA}}",
  "{{YÜZÖLÇÜMÜ}}", "{{arsapay}}", "{{payda}}", "{{CILT}}", "{{TAŞINMAZID}}",
  "{{TAPUTARIH}}", "{{TAPUYEVMIYE}}", "{{EDINME}}", "{{SAHIPLER}}",
  "{{takyidattarih}}", "{{takyidatsaat}}", "{{TAKYİDAT2025}}",
  "{{İMARPLANADI}}", "{{PLANÖLÇEĞİ}}", "{{İMARTARİHİ}}", "{{İMARLEJANT}}",
  "{{İMARNİZAM}}", "{{HESAPLANANEMSAL}}", "{{ÖNBAHÇE}}", "{{YANBAHÇE}}",
  "{{İMARDURUMUKISA}}", "{{INCELEMELER}}", "{{RUHSATVEİSKANLAR2025}}",
  "{{PROJEYEUYGUNLUK2025}}", "{{CEZAİ2025}}", "{{STATİK2025SON}}",
  "{{ANAGAYRİMENKUL2025}}", "{{BAĞIMSIZBÖLÜM2025}}", "{{KATBAZLIİCHACİMLER}}",
  "{{ANAGY}}", "{{TOPLAM_BB}}", "{{ANA_GY_TOPLAM_KAT_ADEDİ}}",
  "{{BİNA_YAPI_TARZI}}", "{{YAPISINIFI}}", "{{YAPIYILI}}",
  "{{sosyaltesisler}}", "{{ISINMASİSTEMİ}}", "{{YAPIKALİTESİ2025}}",
  "{{YASALDURUMDEĞERİ}}", "{{MEVCUTDURUMDEĞERİ}}", "{{MEVCUTKIRA}}",
  "{{YASALKULLANIMALANI}}", "{{MEVCUTKULLANIMALANI}}", "{{DEĞERLEME2025}}",
  "{{STKAÇIKLAMA2025}}", "{{satışaçıklama}}", "{{OLUMLUFAKTÖR}}",
  "{{OLUMSUZFAKTÖR}}", "{{EMSALTABLOSU}}", "{{EMSAL1}}", "{{KISAEMSAL1}}",
  "{{EKBSINIF}}", "{{EKBBELGENO}}", "{{İSKANVARMI}}", "{{HİSSELİMİ}}",
  "{{RANDEVUTARİHİ}}", "{{ISBANKMUSTERI}}", "{{ZRTYASAL}}", "{{ZRTMEVCUT}}",
];

// Kullanici karari 2026-07-13: Malikler Tablosu ekrandaki panelle (7 sutun +
// TOPLAM satiri) BIREBIR ayni olmali. MALIKLERTABLO artik eski
// formatTextTableForWord(buildMaliklerTableText()) yerine (TOPLAM satirini
// URETMEYEN, 6+ sutunda zorla yatay sayfaya sokan eski yol) dogrudan
// buildMaliklerTableWordHtml() cagirmali (TOPLAM satiri + tam hizalama
// iceren, satir ici renkli, portrait sayfada kalan gercek kopya).
assert(
  engineSource.includes('MALIKLERTABLO: { h: () => safeCall("buildMaliklerTableWordHtml") }'),
  "MALIKLERTABLO artik buildMaliklerTableWordHtml() kullanmiyor (TOPLAM satirsiz eski formata donulmus olabilir)."
);
assert(
  appSource.includes("function buildMaliklerTableWordHtml()") &&
  appSource.includes('colspan="5"') &&
  appSource.includes(">TOPLAM<"),
  "buildMaliklerTableWordHtml() bulunamadi veya TOPLAM satirini uretmiyor."
);

assert(
  engineSource.includes("EMSAL_ARSA_PIYASA_DEGERI") &&
  engineSource.includes("getComparablePlaceholderValue") &&
  engineSource.includes("EMSAL${i}_${token}"),
  "Emsal tablo ve satir placeholder baglantilari bulunamadi."
);

templateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  const { missing } = engine.fillTemplate(text);
  assert(
    missing.length === 0,
    `${file}: cozumlenemeyen placeholder(lar): ${[...new Set(missing)].join(", ")}`
  );
  const leftovers = FORBIDDEN_LEGACY_TOKENS.filter((token) => text.includes(token));
  assert(
    leftovers.length === 0,
    `${file}: eski Excel placeholder adi kalmis: ${leftovers.join(", ")}`
  );
});

// --- 2) örnek değer çözümlemeleri ---------------------------------------
function resolved(name) {
  const r = engine.resolveToken(name);
  return r.ok ? r.html : null;
}
genericDateTestKeys.forEach((key) => {
  assert(resolved(key) === "09.08.2025", `${key} gun.ay.yil biciminde degil: ${resolved(key)}`);
});
assert(resolved("CİTY") === "Bursa", `CITY cozumu hatali: ${resolved("CİTY")}`);
assert(resolved("SEHIR") === "Bursa", `eski ad tolerans katmani calismiyor (SEHIR): ${resolved("SEHIR")}`);
assert(resolved("şehir") === "Bursa", "kucuk harf/Turkce katlama calismiyor (sehir).");
assert(resolved("LEGAL_VALUE") === "5.400.000 TL", `LEGAL_VALUE para bicimi hatali: ${resolved("LEGAL_VALUE")}`);
assert(resolved("PROJECT_DATE") === "06.04.1987", `PROJECT_DATE gun.ay.yil biciminde degil: ${resolved("PROJECT_DATE")}`);
assert(resolved("MUNICIPALITY_INSPECTION_DATE") === "06.07.2026", `MUNICIPALITY_INSPECTION_DATE gun.ay.yil biciminde degil: ${resolved("MUNICIPALITY_INSPECTION_DATE")}`);
assert(resolved("TAPU_TARİHİ") === "05.03.2024", `TAPU_TARIHI ilk malik satirindan gelmedi: ${resolved("TAPU_TARİHİ")}`);
assert(resolved("TAPU_YEVMİYESİ") === "1234", `TAPU_YEVMIYESI hatali: ${resolved("TAPU_YEVMİYESİ")}`);
assert(resolved("EDİNME_SEBEBİ") === "Satış", `EDINME_SEBEBI hatali: ${resolved("EDİNME_SEBEBİ")}`);
assert(resolved("ZRT_BELGE_TÜRÜ") === "Yapı Ruhsatı", `ZRT_BELGE_TURU hatali: ${resolved("ZRT_BELGE_TÜRÜ")}`);
assert(engine.resolveToken("İNCELENEN_BELGELER_TABLO").ok, "INCELENEN_BELGELER_TABLO cozumlenemedi.");
assert(engine.resolveToken("İSKAN_VAR_MI").ok, "ISKAN_VAR_MI cozumlenemedi.");
assert(engine.resolveToken("SOCİAL_FACİLİTİES").ok, "SOCIAL_FACILITIES (ek alan indeksi) cozumlenemedi.");
assert(engine.resolveToken("UNİT_CONSTRUCTİON_LEVEL").ok, "UNIT_CONSTRUCTION_LEVEL cozumlenemedi.");
assert(engine.resolveToken("BOYLE_BIR_AD_YOK").ok === false, "tanimsiz ad yanlislikla cozumlendi.");

assert(resolved("ZRTDATE") === "01.02.2020", `ZRTDATE gun.ay.yil biciminde degil: ${resolved("ZRTDATE")}`);
assert(
  resolved("INCELENENBELGELERTABLO").includes("01.02.2020") && !resolved("INCELENENBELGELERTABLO").includes("2020-02-01"),
  `INCELENENBELGELERTABLO tarihi gun.ay.yil biciminde degil: ${resolved("INCELENENBELGELERTABLO")}`
);

stubState.fields.projectReviewDescription = "Proje inceleme metni";
stubState.fields.reviewedDocumentsDescription = "Belge inceleme metni";
stubState.fields.projectConformity = "Ham proje notu";
assert(
  resolved("PROJEYEUYGUNLUK2025").includes("Proje inceleme metni") && !resolved("PROJEYEUYGUNLUK2025").includes("Belge inceleme metni"),
  `PROJEYEUYGUNLUK2025 proje aciklamasindan gelmiyor: ${resolved("PROJEYEUYGUNLUK2025")}`
);
assert(
  resolved("RUHSATVEISKANLAR2025").includes("Belge inceleme metni") && !resolved("RUHSATVEISKANLAR2025").includes("Proje inceleme metni"),
  `RUHSATVEISKANLAR2025 belge aciklamasindan gelmiyor: ${resolved("RUHSATVEISKANLAR2025")}`
);

// Takyidat özeti HTML olarak yalnızca bir kez üretilmeli; aksi halde Word
// çıktısında <p class="encumbrance-summary"> etiketleri görünür metne dönüşür.
stubState.fields.takbisSummary = "Birinci takyidat satırı\nİkinci takyidat satırı";
const takbisSummaryHtml = engine.resolveToken("TAKBİS_SUMMARY").html;
assert(
  takbisSummaryHtml.includes('<p class="encumbrance-summary">') && !takbisSummaryHtml.includes("&lt;p") && !takbisSummaryHtml.includes("<p class=\"encumbrance-summary\"><p"),
  `TAKBİS_SUMMARY HTML iki kez işleniyor: ${takbisSummaryHtml}`
);

stubState.fields.shareExplanation = "Hisse açıklaması metni";
const shareExplanationHtml = engine.resolveToken("HİSSE_AÇIKLAMASI").html;
assert(
  shareExplanationHtml.includes('class="share-explanation"') && shareExplanationHtml.includes("Hisse açıklaması metni"),
  `HISSE_ACIKLAMASI 10 punto sinifiyla uretilmiyor: ${shareExplanationHtml}`
);

// --- 2b) Emsaller bölümü tek format kullanmalı (kullanıcı kararı 2026-07-13):
// dinamik sütunlu emsal matrisi (EMSAL_MATRISI, kaç emsal varsa o kadar
// sütun) + altında "Emsal Açıklaması" başlıklı EMSAL_PIYASA_ANALIZI metni.
// Eski EMSAL_TABLOSU / EMSAL_1../EMSAL_7 paragraf listesi artık HİÇBİR
// şablonda kullanılmamalı; Emsal Değerleme Tablosu için ayrı ve açık adla
// EMSAL_DEGERLEME_TABLOSU kullanılır.
const comparableTemplateFiles = templateFiles.filter(
  (file) => !["isbankasi-masraf.html", "ziraat-ek-tablo.html"].includes(file)
);
const valuationSectionOrderTokens = [
  "{{DEGERLEME_YONTEMI_ACIKLAMASI}}",
  "{{HISSE_ACIKLAMASI}}",
  "{{SATIS_KABILIYETI_ACIKLAMASI}}",
  "{{KIRA_ACIKLAMASI}}",
  "{{EMLAK_BEYAN_DEGERI_ACIKLAMASI}}",
  "{{DEGERLENDIRME_TABLOSU}}",
  "{{KAT_BAZINDA_INDIRGENMIS_ALAN_TABLOSU}}",
  "{{DEGERLENDIRME_SEMASI}}",
];
comparableTemplateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  const isZiraatSystemTemplate = file === "ziraat.html";
  let previousIndex = text.indexOf("{{DEGERLEME_YONTEMI_ACIKLAMASI}}") - 1;
  const expectedValuationTokens = file === "halkbank.html"
    ? valuationSectionOrderTokens.filter((token) => token !== "{{KIRA_ACIKLAMASI}}")
    : valuationSectionOrderTokens;
  expectedValuationTokens.forEach((token) => {
    const index = text.indexOf(token, previousIndex + 1);
    assert(index >= 0, `${file}: degerleme bolumu tokeni bulunamadi: ${token}`);
    assert(index > previousIndex, `${file}: ${token} gorseldeki degerleme sirasinda degil.`);
    previousIndex = index;
  });
  assert(
    isZiraatSystemTemplate
      ? text.includes(".encumbrance-summary, .share-explanation { font-size: 7pt; text-align: left;")
      : text.includes(".share-explanation { font-size: 10pt; text-align: justify; }"),
    `${file}: hisse aciklamasi metin stili ilgili banka sablonu icin bulunamadi.`
  );
  assert(
    isZiraatSystemTemplate
      ? text.includes("margin: 3pt 5pt 6pt")
      : (text.includes("margin: 5pt 0 12pt") || text.includes("margin: 3pt 0 12pt")),
    `${file}: tablo araligi ilgili banka sablonu icin ayarlanmamis.`
  );
  assert(
    text.includes("@page WordSection1") &&
    (isZiraatSystemTemplate
      ? text.includes("margin: 21pt; mso-header-margin:18pt; mso-footer-margin:18pt; mso-paper-source:0;")
      : text.includes("margin: 36pt; mso-header-margin:35.4pt; mso-footer-margin:35.4pt; mso-paper-source:0;")) &&
    text.includes("div.WordSection1 { page: WordSection1; }") &&
    text.includes('<div class="WordSection1">'),
    `${file}: Word sayfa duzeni WordSection1 bolumune baglanmamis.`
  );
});
assert(
  appSource.includes("@page WordSection1 { size: 595.35pt 841.95pt; margin: 36pt; mso-header-margin:35.4pt; mso-footer-margin:35.4pt; mso-paper-source:0; }") &&
  appSource.includes("@page WordLandscape { size: 841.95pt 595.35pt; mso-page-orientation: landscape; margin: 36pt; }"),
  "Word export sayfa duzeni Dar (36pt / 0.5 inch margin) degil."
);
assert(
  appSource.includes("div.WordSection1 { page: WordSection1; }") &&
  appSource.includes('<div class="WordSection1">'),
  "Word export govdesi WordSection1 sayfa duzenine baglanmiyor."
);
assert(
  appSource.includes('margin:${compact ? "3pt 0 12pt" : "5pt 0 12pt"}') &&
  appSource.includes("margin:5pt 0 12pt;table-layout:fixed;font-size:7pt;") &&
  appSource.includes("margin:3pt 0 12pt;table-layout:fixed"),
  "Uretilen Word tablolarinda tablo arasi 12pt bosluk standardi korunmuyor."
);
const kuveytturkTemplate = fs.readFileSync(path.join(appDir, "templates", "kuveytturk.html"), "utf8");
const kuveytturkNoteIndex = kuveytturkTemplate.indexOf("*** Taşınmazın değerlemesi takyidatlardan bağımsız yapılmıştır.");
const kuveytturkStaticIndex = kuveytturkTemplate.indexOf("{{STATIC_SUITABILITY_EXPLANATION_TEXT}}");
const kuveytturkValuationTableIndex = kuveytturkTemplate.indexOf("{{DEGERLENDIRME_TABLOSU}}");
assert(
  kuveytturkNoteIndex > -1 && kuveytturkStaticIndex > kuveytturkNoteIndex && kuveytturkValuationTableIndex > kuveytturkStaticIndex,
  "kuveytturk.html: takyidattan bagimsiz degerleme notu ve statik uygunluk aciklamasi tablolardan once gelmiyor."
);
assert(
  !kuveytturkTemplate.includes("Notlar / Düşünceler / Fiyatlandırma") &&
  !kuveytturkTemplate.includes("<div class=\"kt-subsec\">Statik Uygunluk Açıklaması</div>"),
  "kuveytturk.html: degerleme tablo onu not/statik uygunluk metinlerinde alt baslik kalmis."
);
comparableTemplateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  assert(text.includes("{{EMSAL_MATRISI}}"), `${file}: EMSAL_MATRISI (dinamik sutunlu emsal matrisi) bulunamadi.`);
  assert(text.includes("Emsal Açıklaması"), `${file}: "Emsal Açıklaması" basligi bulunamadi.`);
  assert(!text.includes("{{EMSAL_TABLOSU}}"), `${file}: eski EMSAL_TABLOSU hala kullanimda (tek format kuralina aykiri).`);
  assert(text.includes("{{EMSAL_DEGERLEME_TABLOSU}}"), `${file}: Emsal Degerleme Tablosu placeholder'i bulunamadi.`);
  const valuationTableIndex = text.lastIndexOf("{{EMSAL_DEGERLEME_TABLOSU}}");
  const lastComparableSectionContent = Math.max(text.lastIndexOf("{{EMSAL_MATRISI}}"), text.lastIndexOf("{{COMPARABLE_SKETCH_SECTION}}"));
  assert(valuationTableIndex > lastComparableSectionContent, `${file}: Emsal Degerleme Tablosu emsaller bolumunun sonunda degil.`);
  for (let i = 1; i <= 7; i += 1) {
    assert(!text.includes(`{{EMSAL_${i}}}`), `${file}: eski EMSAL_${i} paragraf placeholder'i hala kullanimda.`);
  }
});

// --- 2c) Gabim Veri Seti bölümü GDYS'nin gerçek, türe göre koşullu şeklini
// yansıtmalı (kullanıcı 2026-07-17: 4 gayrimenkul türü ekran görüntüsü ile
// karşılaştırma). Tüm tam rapor şablonlarında {{GABIM_VERI_SETI}} bloğu
// olmalı; eski sabit (her zaman aynı alanları gösteren) düz tablo formatına
// dönülmemiş olmalı.
comparableTemplateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  assert(text.includes("{{GABIM_VERI_SETI}}"), `${file}: GABIM_VERI_SETI placeholder'i bulunamadi.`);
  assert(
    !text.includes("KENTSEL DÖNÜŞÜM BÖLGESİNDE Mİ</td><td>{{URBAN_TRANSFORMATİON_AREA}}") &&
    !text.includes("Kentsel Dönüşüm Bölgesinde mi:</td><td class=\"v\">{{URBAN_TRANSFORMATİON_AREA}}"),
    `${file}: eski sabit (turden bagimsiz) Gabim Veri Seti duz tablosu hala mevcut.`
  );
});
assert(
  engineSource.includes('GABIMVERISETI: { h: () => safeCall("buildGabimDataSetWordHtml") }'),
  "GABIMVERISETI placeholder'i template-engine.js icinde bulunamadi."
);
assert(
  appSource.includes("function gabimPropertyProfile()") &&
  appSource.includes("function buildGabimExportGroups()") &&
  appSource.includes("function buildGabimDataSetWordHtml()"),
  "Gabim Veri Seti icin turden bagimsiz olmayan (koşullu) uretici fonksiyonlar bulunamadi."
);
assert(
  appSource.includes('"Araziye Özel Bilgiler"') && appSource.includes('key: "landClassification"'),
  "Araziye Özel Bilgiler grubu veya Arazi Siniflandirmasi alani bulunamadi."
);

// --- 2d) Halkbank INVEX ekran akisi -------------------------------------
const halkbankTemplate = fs.readFileSync(path.join(appDir, "templates", "halkbank.html"), "utf8");
[
  "Konum ve Adres Bilgileri",
  "Tapu Kaydı ve Tapu Bilgileri",
  "İmar Bilgileri",
  "İncelenen Belgeler ve Proje",
  "Ruhsat Özellikleri ve Dosya İncelemeleri",
  "Tapu Rapor Özellikleri",
  "Değerleme Bilgileri",
  "Emsal Listesi",
].forEach((heading) => assert(halkbankTemplate.includes(heading), `halkbank.html: eksik INVEX bolumu: ${heading}`));
[
  "{{PROJECT_REVIEW_DESCRIPTION}}",
  "{{REVIEWED_DOCUMENTS_DESCRIPTION}}",
  "{{MAİN_PROPERTY_FLOOR_COUNT_TEXT}}",
  "{{VALUATİON_SALEABİLİTY_EXPLANATİON}}",
  "{{KIRA_ACIKLAMASI}}",
  "{{HALKBANK_DEGERLEME_DETAY_TABLO}}",
  "{{HALKBANK_EMSAL_ARALIGI}}",
].forEach((token) => assert(halkbankTemplate.includes(token), `halkbank.html: eksik Halkbank tokeni: ${token}`));
const halkbankCount = (token) => (halkbankTemplate.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
const halkbankSection = (start, end) => halkbankTemplate.slice(halkbankTemplate.indexOf(start), halkbankTemplate.indexOf(end));
assert(
  halkbankTemplate.indexOf("{{MALIKLER_TABLO}}") < halkbankTemplate.indexOf("İL / İLÇE"),
  "halkbank.html: Malikler tablosu tapu Il/Ilce bilgisinden once gelmiyor."
);
assert(
  halkbankCount("{{PLANNING_NOTE_TEXT}}") === 1 &&
    halkbankTemplate.indexOf("{{PLANNING_NOTE_TEXT}}") > halkbankTemplate.indexOf("8. Tapu Rapor Özellikleri"),
  "halkbank.html: Imar aciklamasi ust bolumde tekrar ediyor."
);
assert(
  halkbankCount("{{PROJECT_REVIEW_DESCRIPTION}}") === 1 &&
    halkbankTemplate.indexOf("{{PROJECT_REVIEW_DESCRIPTION}}") > halkbankTemplate.indexOf("8. Tapu Rapor Özellikleri"),
  "halkbank.html: Proje inceleme aciklamasi ust bolumde tekrar ediyor."
);
assert(
  halkbankCount("{{REVIEWED_DOCUMENTS_DESCRIPTION}}") === 1 &&
    halkbankTemplate.indexOf("{{REVIEWED_DOCUMENTS_DESCRIPTION}}") > halkbankTemplate.indexOf("8. Tapu Rapor Özellikleri"),
  "halkbank.html: Incelenen Belgeler Aciklamasi ust bolumde tekrar ediyor."
);
assert(
  !halkbankTemplate.includes("{{EKB_EXPLANATION_TEXT}}"),
  "halkbank.html: EKB aciklamasi incelenen belgeler metnine ek olarak tekrar basiliyor."
);
assert(
  !halkbankSection("6. Ruhsat Özellikleri", "7. Ana Gayrimenkul").match(/\{\{(?:PENALTY_DECISION_EXPLANATION_TEXT|STATIC_SUITABILITY_EXPLANATION_TEXT|BUILDING_INSPECTION_EXPLANATION_TEXT)\}\}/),
  "halkbank.html: Ruhsat bolumunde alt tarafta bulunan aciklamalar tekrar ediyor."
);
assert(
  !halkbankSection("7. Ana Gayrimenkul", "8. Tapu Rapor Özellikleri").match(/\{\{(?:MAIN_PROPERTY_DESCRIPTION_TEXT|UNIT_INTERIOR_DESCRIPTION_TEXT|UNIT_DECORATIVE_DESCRIPTION_TEXT)\}\}/) &&
    halkbankCount("{{UNIT_INTERIOR_DESCRIPTION_TEXT}}") === 1 &&
    halkbankCount("{{UNIT_DECORATIVE_DESCRIPTION_TEXT}}") === 0,
  "halkbank.html: Gayrimenkul, ic ozellik veya tefrisat aciklamasi tekrar ediyor."
);
assert(
  halkbankTemplate.includes("BİNA KAT DAĞILIMI ÖZETİ</td><td>{{MAİN_PROPERTY_FLOOR_COUNT_TEXT}}"),
  "halkbank.html: Bina kat dagilimi ozeti ayri satirda bulunamadi."
);
const halkbankImportantNote = halkbankSection("Önemli Not ve Sonuç Cümlesi", "İmar Bilgileri Açıklaması");
assert(
  halkbankImportantNote.indexOf("{{VALUATİON_SALEABİLİTY_EXPLANATİON}}") > halkbankImportantNote.indexOf("{{SALEABILITY_NOTE}}") &&
    halkbankImportantNote.indexOf("{{KIRA_ACIKLAMASI}}") > halkbankImportantNote.indexOf("{{VALUATİON_SALEABİLİTY_EXPLANATİON}}"),
  "halkbank.html: Satis kabiliyeti ve kira aciklamalari Onemli Not bolumunun sonunda degil."
);
assert(
  halkbankSection("10. Değerleme Bilgileri", "11. Emsal Listesi").indexOf("{{KIRA_ACIKLAMASI}}") === -1,
  "halkbank.html: kira aciklamasi 10. Degerleme Bilgileri bolumunde tekrar ediyor."
);
assert(
  halkbankTemplate.includes("Merkez Bankası verilerinde herhangi bir sorun bulunmamaktadır.") &&
    !halkbankTemplate.includes("{{HALKBANK_MERKEZ_BANKASI_ACIKLAMA}}"),
  "halkbank.html: Merkez Bankasi aciklamasi istenen sabit cumle degil."
);
const halkbankComparableSection = halkbankSection("11. Emsal Listesi", "12. GDYS Yardımcı Bilgiler");
assert(
  halkbankComparableSection.indexOf("{{EMSAL_PIYASA_ANALIZI}}") < halkbankComparableSection.indexOf("{{COMPARABLE_SKETCH_SECTION}}") &&
    halkbankComparableSection.indexOf("{{COMPARABLE_SKETCH_SECTION}}") < halkbankComparableSection.indexOf("{{HALKBANK_EMSAL_ARALIGI}}") &&
    halkbankTemplate.includes('<h2 style="page-break-before:always;">11. Emsal Listesi</h2>'),
  "halkbank.html: Emsal krokisi aciklamanin hemen altinda degil veya Emsaller yeni sayfada baslamiyor."
);
assert(
  !halkbankTemplate.includes("{{HALKBANK_EMSAL_LISTESI_TABLO}}") &&
    halkbankTemplate.includes("{{EMSAL_MATRISI}}"),
  "halkbank.html: kaldirilmasi istenen ozel emsal listesi halen var veya ana matris eksik."
);
assert(
  halkbankTemplate.includes("padding: 1.7pt 3pt") &&
    halkbankTemplate.includes("padding: 1.55pt 2.8pt") &&
    halkbankTemplate.includes("padding: 0.85pt 1.8pt") &&
    halkbankTemplate.includes("table.meta tr { height: 20pt; mso-height-source: userset; mso-height-rule: at-least; }") &&
    halkbankTemplate.includes("table.meta td { height: 20pt;") &&
    halkbankTemplate.includes("vertical-align: middle; line-height: 1;"),
  "halkbank.html: tablo kutularinin yuksekligi yuzde 30 azaltilmamis."
);
assert(
  engineSource.includes("function halkbankValuationDetailsTableHtml()") &&
    engineSource.includes("function halkbankComparableListTableHtml()") &&
    engineSource.includes("function halkbankComparableRangeText()"),
  "Halkbank degerleme/emsal ozel cikti ureticileri bulunamadi."
);
assert(
  engineSource.includes("VALUATIONSALEABILITYEXPLANATION") &&
    engineSource.includes('VALUATIONSALEABILITYEXPLANATION: { t: () => safeCall("buildValuationSaleabilityExplanation") }'),
  "Halkbank valuation saleability placeholder aliasi bulunamadi."
);
globalThis.buildValuationSaleabilityExplanation = () => "SATILABİLİR olduğu kanaatine varılmıştır.";
const halkbankSaleabilityHtml = engine.resolveToken("VALUATİON_SALEABİLİTY_EXPLANATİON").html;
delete globalThis.buildValuationSaleabilityExplanation;
assert(
  halkbankSaleabilityHtml.includes("SATILABİLİR olduğu kanaatine varılmıştır."),
  "Halkbank Onemli Not satis kabiliyeti aciklamasi cozumlenirken bos kaliyor."
);
assert(
  appSource.includes('key: "halkbankCentralBankExplanation"'),
  "Halkbank Merkez Bankasi aciklama alani bulunamadi."
);
assert(
  appSource.includes('const alwaysUppercaseFieldKeys = new Set(["ekbDocumentNo"])') &&
    appSource.includes("if (alwaysUppercaseFieldKeys.has(field.key))") &&
    appSource.includes("event.target.value = toTitleFieldUppercase(event.target.value)"),
  "EKB belge no alani daima buyuk harfe donusturulmuyor."
);
assert(
  appSource.includes('function refreshUrgentSaleValues()') &&
    appSource.includes('function getUrgentSaleValueText(mode)') &&
    appSource.includes('roundComparableValuationValue(marketValue * 0.9, 50000)') &&
    appSource.includes('state.fields.legalUrgentSaleValue = getUrgentSaleValueText("legal")') &&
    appSource.includes('state.fields.currentUrgentSaleValue = getUrgentSaleValueText("current")') &&
    engineSource.includes('LEGALURGENTSALEVALUE: { fn: () => safeCall("getUrgentSaleValueText", "legal") }') &&
    engineSource.includes('CURRENTURGENTSALEVALUE: { fn: () => safeCall("getUrgentSaleValueText", "current") }'),
  "Yasal/mevcut acil satis degerleri %10 indirim ve 50.000 TL yuvarlama kuralini korumuyor."
);

// --- 2e) Konum haritasi ve emsal krokisi Word'e gomulmeli ----------------
comparableTemplateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  const locationTokens = text.match(/\{\{LOCATION_MAP_SECTION\}\}/g) || [];
  const comparableTokens = text.match(/\{\{COMPARABLE_SKETCH_SECTION\}\}/g) || [];
  assert(locationTokens.length === 1, `${file}: LOCATION_MAP_SECTION tam bir kez bulunmali.`);
  assert(comparableTokens.length === 1, `${file}: COMPARABLE_SKETCH_SECTION tam bir kez bulunmali.`);
  assert(!text.includes("{{REPORT_MAPS_SECTION}}"), `${file}: birlesik REPORT_MAPS_SECTION kullanilmamali.`);
});
const reportMapPlacementRules = {
  "akbank.html": ["Konum Sekmesi", "Özellikler Sekmesi"],
  "halkbank.html": ["1. Konum ve Adres Bilgileri", "2. Tapu Kaydı ve Tapu Bilgileri"],
  "isbankasi.html": ["KONUM BİLGİLERİ", "ÖZELLİKLER SEKMESİ"],
  "kuveytturk.html": ["GAYRİMENKULÜN AÇIK ADRESİ", "NİTELİĞİ"],
  "vakifbank.html": ["HARİTA KONUM", "TAKYİDAT"],
  "vakifkatilim.html": ["Tapu Sekmesi ve Konum", "Özellikler Sekmesi"],
  "yapikredi.html": ["Adres Bilgileri", "Ana Gayrimenkul Site Özellikleri"],
  "ziraat.html": ["MALİK BİLGİLERİ", "4. GAYRİMENKUL NİTELİK BİLGİLERİ"],
};
Object.entries(reportMapPlacementRules).forEach(([file, [before, after]]) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  const mapIndex = text.indexOf("{{LOCATION_MAP_SECTION}}");
  assert(
    text.indexOf(before) < mapIndex && mapIndex < text.indexOf(after, mapIndex),
    `${file}: konum krokisi adres/konum verilerinin hemen ardinda degil.`
  );
});
const comparableSketchNextSection = {
  "akbank.html": "GDYS YARDIMCI BİLGİLER",
  "halkbank.html": "12. GDYS Yardımcı Bilgiler",
  "isbankasi.html": "GDYS YARDIMCI BİLGİLER",
  "kuveytturk.html": "GDYS YARDIMCI BİLGİLER",
  "vakifbank.html": "GDYS YARDIMCI BİLGİLER",
  "vakifkatilim.html": "GDYS YARDIMCI BİLGİLER",
  "yapikredi.html": "Takyidatlar",
  "ziraat.html": "ZİRAAT EKSPERTİZ SİSTEMİ YARDIMCI BİLGİLERİ",
};
Object.entries(comparableSketchNextSection).forEach(([file, nextSection]) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  const analysisIndex = text.indexOf("{{EMSAL_PIYASA_ANALIZI}}");
  const sketchIndex = text.indexOf("{{COMPARABLE_SKETCH_SECTION}}");
  assert(
    analysisIndex < sketchIndex && sketchIndex < text.indexOf(nextSection, sketchIndex),
    `${file}: emsal krokisi Emsaller bolumunun sonunda degil.`
  );
});
assert(
  appSource.includes("function saveLocationMapForReport(") &&
    appSource.includes("function saveComparableSketchForReport(") &&
    appSource.includes("async function buildSavedReportImageAssets("),
  "Harita/kroki kaydetme veya Word gorsel varligi ureticileri bulunamadi."
);
const ziraatTemplateSource = fs.readFileSync(path.join(appDir, "templates", "ziraat.html"), "utf8");
assert(
  ziraatTemplateSource.indexOf("<h2>1. GAYRİMENKUL GABİM BİLGİLERİ</h2>") < ziraatTemplateSource.indexOf("<h2>2. GAYRİMENKUL MERKEZ BANKASI VERİLERİ</h2>") &&
    ziraatTemplateSource.indexOf("<h2>2. GAYRİMENKUL MERKEZ BANKASI VERİLERİ</h2>") < ziraatTemplateSource.indexOf("<h2>2. GAYRİMENKUL TAPU BİLGİLERİ</h2>") &&
    ziraatTemplateSource.includes(".ziraat-gabim-screen") &&
    ziraatTemplateSource.includes("Talep Referansı") &&
    ziraatTemplateSource.includes("Zincir İşletme mi?") &&
    ziraatTemplateSource.includes("Açık Otopark Var mı?") &&
    ziraatTemplateSource.includes("AVM / Plaza vb. İçinde Olma Durumu") &&
    ziraatTemplateSource.includes("İndirgenmiş Toplam Yasal Alan (m²)") &&
    ziraatTemplateSource.includes("{{TOTAL_LEGAL_REDUCED_AREA}}") &&
    ziraatTemplateSource.includes("{{TOTAL_CURRENT_REDUCED_AREA}}") &&
    ziraatTemplateSource.includes("Aylık Kira Değeri (TL/m²)</td><td class=\"zg-value\"><div>{{LEGAL_RENT_UNIT}}</div>") &&
    ziraatTemplateSource.includes("{{ORDER}} Nizam") &&
    ziraatTemplateSource.includes("<div>Hasarsız</div>") &&
    ziraatTemplateSource.includes("Değ. Rap. Konu Gayr. Fiili Kullanım Amacı</td><td class=\"zg-value\"><div>{{CURRENT_USAGE_NATURE}}</div>") &&
    ziraatTemplateSource.includes("{{TİTLE_QUALİTY}} olarak kullanılmaktadır.") &&
    ziraatTemplateSource.includes("<div>Hayır</div>") &&
    ziraatTemplateSource.includes("{{MUTFAK}}"),
  "Ziraat'in iki GABIM giriş bölümü, raporun başında banka ekranındaki kapsamlı form düzeninde yer almıyor."
);
assert(
  ziraatTemplateSource.indexOf("<h2 style=\"page-break-before:always;\">ZİRAAT EKSPERTİZ SİSTEMİ YARDIMCI BİLGİLERİ</h2>") < ziraatTemplateSource.indexOf("<h2>GABİM VERİ SETİ</h2>") &&
    ziraatTemplateSource.indexOf("<h2>GABİM VERİ SETİ</h2>") < ziraatTemplateSource.indexOf("<h2>ÇALIŞMA KAĞIDI</h2>"),
  "Ziraat GABİM Veri Seti, Ziraat Ekspertiz Sistemi Yardımcı Bilgileri bölümünden sonra yer almıyor."
);
assert(
  ziraatTemplateSource.includes("#d9d9d9") &&
    ziraatTemplateSource.includes("#9f9f9f") &&
    ziraatTemplateSource.includes("border-radius: 0") &&
    ziraatTemplateSource.includes("Ziraat Ekspertiz Sistemi referans paleti") &&
    !ziraatTemplateSource.includes("background: #213f77"),
  "Ziraat Word sablonu, referans sistemin gri panel ve keskin kenarli veri kutusu dilini korumuyor."
);
const ziraatTapuSectionStart = ziraatTemplateSource.indexOf("<h2>2. GAYRİMENKUL TAPU BİLGİLERİ</h2>");
const ziraatTapuSectionEnd = ziraatTemplateSource.indexOf("<h2 style=\"page-break-before:always;\">4. GAYRİMENKUL NİTELİK BİLGİLERİ</h2>");
const ziraatTapuSection = ziraatTemplateSource.slice(ziraatTapuSectionStart, ziraatTapuSectionEnd);
assert(
  ziraatTapuSectionStart >= 0 &&
    ziraatTapuSectionEnd > ziraatTapuSectionStart &&
    ziraatTemplateSource.includes(".tapu-form") &&
    ziraatTapuSection.includes('<table class="tapu-form">') &&
    ziraatTapuSection.includes("PARSELİN YÜZ ÖLÇÜMÜ (m²)") &&
    ziraatTapuSection.includes('KAT NO</td><td class="tapu-value"><div>&nbsp;</div>') &&
    ziraatTapuSection.includes('BUCAĞI</td><td class="tapu-value"><div>&nbsp;</div>') &&
    ziraatTapuSection.includes('SOKAĞI</td><td class="tapu-value"><div>&nbsp;</div>') &&
    ziraatTapuSection.includes('DAİRE NO</td><td class="tapu-value"><div>{{INNER_DOOR}}</div>') &&
    ziraatTapuSection.indexOf('MAHALLE</td><td class="tapu-value"><div>{{NEİGHBORHOOD}}</div>') < ziraatTapuSection.indexOf('KAT NO</td><td class="tapu-value"><div>{{TİTLE_FLOOR}}</div>') &&
    ziraatTapuSection.indexOf('KAT NO</td><td class="tapu-value"><div>{{TİTLE_FLOOR}}</div>') < ziraatTapuSection.indexOf('BUCAĞI</td><td class="tapu-value"><div>&nbsp;</div>') &&
    ziraatTapuSection.includes("<div class=\"tapu-owner-panel\"><h3>MALİK BİLGİLERİ</h3>{{MALIKLER_TABLO}}</div>") &&
    !ziraatTapuSection.includes('<table class="field-grid">'),
  "Ziraat tapu bolumu, referans ekrandaki iki bloklu etiket + veri kutusu yerlesimini korumuyor."
);
assert(
  engineSource.includes('INNERDOOR: { f: ["innerDoor"] }'),
  "Ziraat tapu Daire No icin INNER_DOOR placeholder aliasi bulunamadi."
);
assert(
  engineSource.includes('SALEABILITY: { f: ["saleability"] }'),
  "Ziraat satis kabiliyeti secimi icin SALEABILITY placeholder aliasi bulunamadi."
);
const ziraatPropertySectionStart = ziraatTemplateSource.indexOf("<h2 style=\"page-break-before:always;\">4. GAYRİMENKUL NİTELİK BİLGİLERİ</h2>");
const ziraatPropertySectionEnd = ziraatTemplateSource.indexOf("<h2>5. İNCELEMELER</h2>");
const ziraatPropertySection = ziraatTemplateSource.slice(ziraatPropertySectionStart, ziraatPropertySectionEnd);
assert(
  ziraatPropertySectionStart >= 0 &&
    ziraatPropertySectionEnd > ziraatPropertySectionStart &&
    ziraatPropertySection.includes("İnşaat Alanı (m²)</td><td class=\"pi-value\">&nbsp;</td>") &&
    ziraatPropertySection.includes("{{BAGIMSIZBOLUM2025}}") &&
    ziraatPropertySection.includes("{{UNIT_DESCRIPTION_INTRO}}") &&
    ziraatPropertySection.indexOf("Birimler (Adet)") < ziraatPropertySection.indexOf("{{UNIT_DESCRIPTION_INTRO}}") &&
    ziraatPropertySection.indexOf("{{UNIT_DESCRIPTION_INTRO}}") < ziraatPropertySection.indexOf("{{BAGIMSIZBOLUM2025}}") &&
    !ziraatPropertySection.includes("{{KAT_BAZLI_İÇ_HACİMLER}}") &&
    ziraatPropertySection.includes("{{SALON}}") &&
    ziraatPropertySection.includes("{{ODA}}") &&
    ziraatPropertySection.includes("{{BANYO}}") &&
    ziraatPropertySection.includes("{{TUVALET}}") &&
    ziraatPropertySection.includes("{{BALKON}}") &&
    !ziraatPropertySection.includes("{{UNİT_İNTERİOR_DESCRİPTİON_TEXT}}") &&
    !ziraatPropertySection.includes("{{UNİT_DECORATİVE_DESCRİPTİON_TEXT}}") &&
    ziraatPropertySection.includes("{{SALEABILITY}}") &&
    ziraatPropertySection.includes("{{VALUATİON_SALEABİLİTY_EXPLANATİON}}"),
  "Ziraat nitelik bolumu, tekil insai aciklama, bos insaat alani veya satis kabiliyeti aciklamasini korumuyor."
);
assert(
  engineSource.includes('BAGIMSIZBOLUM2025: { t: () => safeCall("composeUnitInteriorDetailsDescription") }') &&
    engineSource.includes('UNITDESCRIPTIONINTRO: { t: () => safeCall("composeUnitDescriptionIntroForReport") }') &&
    engineSource.includes('TUVALET: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).tuvalet || "" }') &&
    appSource.includes('banyo: countMentions("banyo", "dus")') &&
    appSource.includes('balkon: countMentions("balkon", "teras")'),
  "Ziraat insai metni ikinci dekoratif aciklamayi veya birim adet hesaplarini yeniden getiriyor."
);
globalThis.getGabimUnitInteriorCounts = () => ({ salon: "1", oda: "2", banyo: "2", tuvalet: "1", balkon: "3" });
const ziraatUnitCountValues = ["SALON", "ODA", "BANYO", "TUVALET", "BALKON"].map((token) => engine.resolveToken(token).html);
delete globalThis.getGabimUnitInteriorCounts;
assert(
  ziraatUnitCountValues.join("|") === "1|2|2|1|3",
  "Ziraat birim adet placeholderlari otomatik hesaplanan degerleri cozumlemiyor."
);
const ziraatReviewsSectionStart = ziraatTemplateSource.indexOf("<h2>5. İNCELEMELER</h2>");
const ziraatReviewsSectionEnd = ziraatTemplateSource.indexOf("<h2>6. GAYRİMENKUL DEĞERLEME</h2>");
const ziraatReviewsSection = ziraatTemplateSource.slice(ziraatReviewsSectionStart, ziraatReviewsSectionEnd);
assert(
  ziraatReviewsSectionStart >= 0 &&
    ziraatReviewsSectionEnd > ziraatReviewsSectionStart &&
    ziraatReviewsSection.includes("{{PROJECT_REVIEW_DESCRIPTION}}") &&
    ziraatReviewsSection.includes("{{REVIEWED_DOCUMENTS_DESCRIPTION}}") &&
    ziraatReviewsSection.includes("{{BUILDING_INSPECTION_EXPLANATION_TEXT}}") &&
    ziraatReviewsSection.includes("{{PENALTY_DECISION_EXPLANATION}}") &&
    ziraatReviewsSection.includes("{{İSKAN_VAR_MI}}") &&
    ziraatReviewsSection.includes("{{OCCUPANCY_PERMIT_DATE}}") &&
    ziraatReviewsSection.includes("{{MUNICIPALITY_BOUNDARY_STATUS}}") &&
    ziraatReviewsSection.includes("{{DOCUMENT_REVIEW_INSTITUTION}}") &&
    ziraatReviewsSection.includes("{{EKB_STATUS}}") &&
    ziraatReviewsSection.includes("{{EKB_DOCUMENT_NO}}") &&
    ziraatReviewsSection.includes("{{EKB_ENERGY_CLASS}}") &&
    !ziraatReviewsSection.includes("{{PROJECT_CONFORMİTY}}"),
  "Ziraat incelemeler bolumu proje/ruhsat aciklamalari ile iskan, belediye ve EKB alanlarini referans ekrandaki akista tutmuyor."
);
assert(
  ziraatTemplateSource.indexOf("{{İNCELENEN_BELGELER_TABLO}}") > ziraatTemplateSource.indexOf("<h2>ÇALIŞMA KAĞIDI</h2>") &&
    ziraatTemplateSource.indexOf("{{TAKYIDAT_TABLO}}") > ziraatTemplateSource.indexOf("{{İNCELENEN_BELGELER_TABLO}}") &&
    !ziraatReviewsSection.includes("{{İNCELENEN_BELGELER_TABLO}}") &&
    !ziraatReviewsSection.includes("{{TAKYIDAT_TABLO}}"),
  "Ziraat takyidat ve incelenen belgeler tablolari Incelemeler bolumunden rapor sonuna tasinmamis."
);
assert(
  engineSource.includes("BUILDINGINSPECTIONEXPLANATIONTEXT") &&
    engineSource.includes("PENALTYDECISIONEXPLANATION") &&
    engineSource.includes("OCCUPANCYPERMITDATE") &&
    engineSource.includes("MUNICIPALITYBOUNDARYSTATUS") &&
    engineSource.includes("DOCUMENTREVIEWINSTITUTION") &&
    engineSource.includes("EKBSTATUS"),
  "Ziraat incelemeler bolumu icin gereken placeholder aliaslari bulunamadi."
);
assert(
  engineSource.includes("GABIMCALCULATEDEMSAL") &&
    engineSource.includes("GABIMTRANSPORTATION") &&
    engineSource.includes("GABIMSECURITY") &&
    engineSource.includes("GABIMSALEABILITY") &&
    engineSource.includes("TOTALLEGALREDUCEDAREA") &&
    engineSource.includes("TOTALCURRENTREDUCEDAREA") &&
    engineSource.includes("MUTFAK:"),
  "Ziraat GABIM ekranlarindaki secimli alanlarin placeholder baglantilari bulunamadi."
);
stubState.tables.documents.push({ c0: "Yapı Kullanma İzin Belgesi", c1: "Belediye", c2: "2021-06-15", c3: "19", c4: "Tam" });
stubState.fields.hasEkb = "Evet";
const ziraatReviewFieldValues = [
  engine.resolveToken("OCCUPANCY_PERMIT_DATE").html,
  engine.resolveToken("EKB_STATUS").html,
  engine.resolveToken("MUNICIPALITY_BOUNDARY_STATUS").html,
];
assert(
  ziraatReviewFieldValues.join("|") === "15.06.2021|VAR|Evet",
  `Ziraat incelemeler iskan tarihi, EKB durumu veya belediye siniri degeri cozumlenemiyor: ${ziraatReviewFieldValues.join("|")}`
);
assert(
  engineSource.includes("LOCATIONMAPIMAGE") &&
    engineSource.includes("COMPARABLESKETCHIMAGE") &&
    engineSource.includes("LOCATIONMAPSECTION") &&
    engineSource.includes("COMPARABLESKETCHSECTION") &&
    engineSource.includes("REPORTMAPSSECTION") &&
    engineSource.includes('safeCall("buildWordMhtmlPackage", html, reportImageAssetsCache)'),
  "Banka sablonu gorsel placeholder veya MHTML gomulu gorsel baglantisi eksik."
);
assert(
  appSource.includes('`Content-Type: ${asset.mimeType || "image/png"}`'),
  "Word MHTML paketi JPEG/PNG varliklarinin MIME turunu korumuyor."
);
assert(
  appSource.includes("function ensureReportMapImagesForExport()") &&
    appSource.includes("Konum ve emsal krokisi kaydedilmedi. Otomatik olarak kaydedilerek devam edilecektir.") &&
    appSource.includes("ensureReportMapImagesForExport();"),
  "Word export oncesi eksik konum/emsal krokisi otomatik kayit uyarisi bulunamadi."
);
assert(
  appSource.includes('getMapExportCanvasSize("16:9", 1200)') &&
    appSource.includes('width="640" height="360" style="width:480pt;height:270pt;') &&
    engineSource.includes("const width = Math.round(480 * scale)") &&
    engineSource.includes("const height = Math.round(270 * scale)") &&
    engineSource.includes('key === "location" ? 0.7 : 1'),
  "Word harita/kroki gorselleri 16:9 geometriyi veya konu tasinmaz haritasi icin %30 kucultmeyi korumuyor."
);
assert(
  appSource.includes("function getLocationMapViewportSnapshot()") &&
    appSource.includes("function getLocationMapLabelScale(config, canvas)") &&
    appSource.includes("viewport: getLocationMapViewportSnapshot()") &&
    appSource.includes("getLocationMapLabelScale(config, canvas)") &&
    appSource.includes("Math.round(12 * scale)") &&
    appSource.includes("Math.round(11 * scale)"),
  "Konum krokisi kayit anindaki viewport/zoom etiket olcegini Word ciktisina tasimiyor."
);
assert(
  appSource.includes("function isExportPointVisible(pixel, canvas)") &&
    appSource.includes("if (!isExportPointVisible(pixel, context.canvas)) return;"),
  "Konum krokisi gorunmeyen POI verilerini viewport disinda filtrelemiyor."
);
assert(
  engineSource.includes('class="report-map-figure" style="page-break-inside:avoid;break-inside:avoid;"') &&
    engineSource.includes('page-break-after:avoid;break-after:avoid;') &&
    !engineSource.includes('class="pg-section" style="page-break-before:always;">\n      <h2>KONUM VE EMSAL'),
  "Kroki basligi ve gorseli Word'de ayni sayfada tutulmuyor."
);

// --- 3) katlama eşdeğerlikleri ------------------------------------------
assert(engine.foldTokenName("DIŞ.KAPI.NO") === engine.foldTokenName("dis_kapi_no"), "katlama: DIS.KAPI.NO != dis_kapi_no");
assert(engine.foldTokenName("BÖLGE.YAP.KUL.AMACI") === "BOLGEYAPKULAMACI", "katlama: BOLGE.YAP.KUL.AMACI hatali");
assert(engine.foldTokenName("kat.2") === "KAT2", "katlama: kat.2 hatali");

// --- sonuç ---------------------------------------------------------------
if (failures.length) {
  console.error("Banka sablonlari testi BASARISIZ:");
  failures.forEach((f) => console.error(" - " + f));
  process.exit(1);
}
console.log("Banka sablonlari testi tamam.");
