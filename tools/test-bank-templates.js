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
assert(fieldKeys.length > 100, `sections alan anahtari sayisi beklenenden az: ${fieldKeys.length}`);

const genStart = appSource.indexOf("function collectGeneratedTextPlaceholders()");
const genEnd = appSource.indexOf("\nfunction collectTablePlaceholders", genStart);
assert(genStart > -1 && genEnd > genStart, "collectGeneratedTextPlaceholders bulunamadi.");
const genSlice = appSource.slice(genStart, genEnd);
const generatedKeys = [...genSlice.matchAll(/key: "([A-Za-z0-9_]+)"/g)].map((m) => m[1]);
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
const stubSections = [{ id: "test", fields: fieldKeys.map((key) => ({ key })) }];

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
  (text) => `<p>${stubEscapeHtml(text)}</p>`,
  (iso) => {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  },
  (value) => Number.parseFloat(String(value).replace(/\./g, "").replace(",", ".")),
  (value) => new Intl.NumberFormat("tr-TR").format(value)
);

const engine = sandboxWindow.RaporTemplates;
assert(Boolean(engine), "window.RaporTemplates olusmadi.");

// --- 1) tüm şablon tokenları çözümlenmeli -------------------------------
const templateFiles = fs.readdirSync(path.join(appDir, "templates")).filter((f) => f.endsWith(".html"));
assert(templateFiles.length >= 10, `templates/ altinda beklenen sablon sayisi yok: ${templateFiles.length}`);

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
assert(resolved("CİTY") === "Bursa", `CITY cozumu hatali: ${resolved("CİTY")}`);
assert(resolved("SEHIR") === "Bursa", `eski ad tolerans katmani calismiyor (SEHIR): ${resolved("SEHIR")}`);
assert(resolved("şehir") === "Bursa", "kucuk harf/Turkce katlama calismiyor (sehir).");
assert(resolved("LEGAL_VALUE") === "5.400.000 TL", `LEGAL_VALUE para bicimi hatali: ${resolved("LEGAL_VALUE")}`);
assert(resolved("TAPU_TARİHİ") === "05.03.2024", `TAPU_TARIHI ilk malik satirindan gelmedi: ${resolved("TAPU_TARİHİ")}`);
assert(resolved("TAPU_YEVMİYESİ") === "1234", `TAPU_YEVMIYESI hatali: ${resolved("TAPU_YEVMİYESİ")}`);
assert(resolved("EDİNME_SEBEBİ") === "Satış", `EDINME_SEBEBI hatali: ${resolved("EDİNME_SEBEBİ")}`);
assert(resolved("ZRT_BELGE_TÜRÜ") === "Yapı Ruhsatı", `ZRT_BELGE_TURU hatali: ${resolved("ZRT_BELGE_TÜRÜ")}`);
assert(engine.resolveToken("İNCELENEN_BELGELER_TABLO").ok, "INCELENEN_BELGELER_TABLO cozumlenemedi.");
assert(engine.resolveToken("İSKAN_VAR_MI").ok, "ISKAN_VAR_MI cozumlenemedi.");
assert(engine.resolveToken("SOCİAL_FACİLİTİES").ok, "SOCIAL_FACILITIES (ek alan indeksi) cozumlenemedi.");
assert(engine.resolveToken("UNİT_CONSTRUCTİON_LEVEL").ok, "UNIT_CONSTRUCTION_LEVEL cozumlenemedi.");
assert(engine.resolveToken("BOYLE_BIR_AD_YOK").ok === false, "tanimsiz ad yanlislikla cozumlendi.");

// --- 2b) Emsaller bölümü tek format kullanmalı (kullanıcı kararı 2026-07-13):
// dinamik sütunlu emsal matrisi (EMSAL_MATRISI, kaç emsal varsa o kadar
// sütun) + altında "Emsal Açıklaması" başlıklı EMSAL_PIYASA_ANALIZI metni.
// Eski EMSAL_TABLOSU / EMSAL_1../EMSAL_7 paragraf listesi artık HİÇBİR
// şablonda kullanılmamalı (motor hâlâ çözer, sadece şablonlarda yasak).
const comparableTemplateFiles = templateFiles.filter(
  (file) => !["isbankasi-masraf.html", "ziraat-ek-tablo.html"].includes(file)
);
comparableTemplateFiles.forEach((file) => {
  const text = fs.readFileSync(path.join(appDir, "templates", file), "utf8");
  assert(text.includes("{{EMSAL_MATRISI}}"), `${file}: EMSAL_MATRISI (dinamik sutunlu emsal matrisi) bulunamadi.`);
  assert(text.includes("Emsal Açıklaması"), `${file}: "Emsal Açıklaması" basligi bulunamadi.`);
  assert(!text.includes("{{EMSAL_TABLOSU}}"), `${file}: eski EMSAL_TABLOSU hala kullanimda (tek format kuralina aykiri).`);
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
