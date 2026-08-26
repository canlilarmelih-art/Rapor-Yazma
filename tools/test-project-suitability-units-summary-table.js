// Taşınmazlar Proje Uygunluk Özeti — çift taraflı tablo (2026-08-26).
// Kullanıcı talebi: "uygunluk durumu ile ilgili bu bölüme çift taraflı
// tablo oluşturalım. sütunları sen belirle." "Proje Uygunluk Durumu -
// Bağımsız Bölüm" (createProjectSuitabilityControl), "Belgeler ve
// Proje"deki TEK bağımsız-bölüme-özel alan grubu — geri kalan HER ŞEY
// blok ortak/otomatik senkron (bkz. app.js~3221 notu). Blok gruplama
// AKTİFKEN (Dikey/Yatay Kat İrtifakı + 2+ blok — bu konuşmadaki ASIL
// senaryo) mevcut "Taşınmazlar Belgeler Özeti" tablosu HİÇ GÖRÜNMÜYORDU
// (yalnızca nadir bir fallback'te) — bu yüzden Değerleme/Bağımsız Bölüm
// Özeti'yle AYNI, blok-gruplamadan BAĞIMSIZ (yalnızca "2+ taşınmaz var
// mı") bir gate kullanan AYRI bir tablo eklendi.
//
// Kullanıcı takip talebi (2026-08-26, BU sürüm): "tabloyu komple kaldır
// senden istediğim tablo sütunları sıra no; blok; bb no; Proje Uygunluk
// Durumu - Bağımsız Bölüm; Açıklama; Basit bir tadilat ile .... bu
// sütunlar başka hiç bir sütun istemiyorum." — "Tapu/Belediye Proje
// Farkı Var" = Evet dalının 6 sütunu (titleProjectSuitability*/
// municipalityProjectSuitability*, ve daha önceki 0.0.553'te kaldırılan
// Ana Gayrimenkul Projesine Uygunluk) tablodan TAMAMEN çıkarıldı — bu
// dosya artık YALNIZCA kalan 6 sabit sütunu (columnHasData gizleme
// mantığı olmadan, her zaman hepsi gösterilir) test eder.
//
// Bu test kapsamı:
//  1) 2+ taşınmazda tablo verisi döner, sütun sırası TAM OLARAK
//     PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS'in 6 sütunuyla eşleşir
//     (Tapu/Belediye Proje Farkı dalı YOK, columnHasData gizleme
//     mantığından ETKİLENMEZ — sütunlar HER ZAMAN sabit).
//  2) Tekil raporda (1 taşınmaz) null döner.
//  3) columnMeta: Blok/BB No "readonly", diğer tüm alanlar "scalar".
//  4) buildProjectSuitabilityUnitsSummaryWordTableHtml(): geçerli HTML
//     tablo üretir, başlıkları içerir.
//  5) getSelectOptionsForFieldKey(): projectSuitabilityStatus ailesi
//     -> projectSuitabilityOptions, repair alanı -> ["Evet","Hayır"]
//     (kaynak-düzeyi: sections[]'te DEKLARATİF OLMADIKLARI için elle
//     eklenen dal var mı — bu eşlemeler BAŞKA alanlar için de
//     kullanıldığından KALDIRILMADI, yalnızca bu tablonun sütunlarından
//     çıkarıldı).
//  6) renderSection() "documents" gate'i: yeni tablo blok gruplama AKTİF/
//     PASİF FARK ETMEKSİZİN eklendi mi (kaynak-düzeyi kablolama).
//  7) refresh fonksiyonları + debounce + commitTitleUnitsSummaryCellEdit +
//     createProjectSuitabilityField/createMainRealEstateProjectSuitabilityControl
//     kancaları (kaynak-düzeyi kablolama).
//  8) template-engine.js'te {{TASINMAZLARPROJEUYGUNLUKTABLOSU}} ve
//     report-tables-xlsx.js'te "Taşınmazlar Proje Uygunluk Özeti" sayfası
//     kayıtlı mı.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
const xlsxSource = fs.readFileSync(path.join(__dirname, "..", "src", "exports", "report-tables-xlsx.js"), "utf8");

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

// app.js CRLF satır sonlarıyla saklanıyor — "[" derinliğine göre sabitin
// GERÇEK sonunu bulan yöntem (diğer özet-tablo test dosyalarındaki AYNI teknik).
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

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "buildProjectSuitabilityUnitsSummaryTableData",
  "buildProjectSuitabilityUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "escapeHtml",
  "formatWordCell",
  "getReportThemeToken",
  "createEmptyTitleUnit",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
];
const constNames = ["PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  function normalizeReportTitleText(value) { return String(value || "").trim(); }
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildProjectSuitabilityUnitsSummaryTableData,
    buildProjectSuitabilityUnitsSummaryWordTableHtml,
    PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(fields) {
  return { fields, tables: {} };
}

function freshState(fields, titleUnits = []) {
  return { fields, tables: {}, titleUnits, activeTitleUnitIndex: 0, primaryTitleUnitShadow: null };
}

// --- 1) Tekil taşınmaz -> null ---------------------------------------------
{
  fns.setState(freshState({}));
  assert.equal(fns.buildProjectSuitabilityUnitsSummaryTableData(), null, "1 taşınmazda (titleUnits boş) null dönmeli.");
  console.log("Tekil taşınmazda null donus testi tamam.");
}

// --- 2) 2+ taşınmaz, 6 sabit sütun (Tapu/Belediye Proje Farkı dalı ---------
// TAMAMEN yok, columnHasData gizleme mantığından bağımsız her zaman ------
// gösterilir) ----------------------------------------------------------
{
  fns.setState(freshState(
    {
      titleBlockName: "A Blok", unitNo: "1",
      projectSuitabilityStatus: "uygundur.", projectConformity: "", projectSuitabilitySimpleRepair: "",
    },
    [unit({
      titleBlockName: "B Blok", unitNo: "2",
      projectSuitabilityStatus: "mimari olarak uygun değildir.", projectConformity: "Balkon farklı.", projectSuitabilitySimpleRepair: "Evet",
    })],
  ));
  const data = fns.buildProjectSuitabilityUnitsSummaryTableData();
  assert.ok(data && data.rows.length === 2, "2 taşınmazda 2 satır dönmeli.");
  assert.deepEqual(
    data.headers,
    ["Sıra No", "Blok", "BB No", "Proje Uygunluk Durumu - Bağımsız Bölüm", "Açıklama", "Basit Bir Tadilat İle Düzeltilebilir mi?"],
    `Yalnizca 6 sabit sutun olmali, sutun etiketleri canli paneldeki GERCEK etiketlerle BIREBIR eslesmeli, bulunan: ${JSON.stringify(data.headers)}`,
  );
  assert.deepEqual(data.rows[0], [1, "A Blok", "1", "uygundur.", "-", "-"], `1. satır (temsilci/aktif taşınmaz) beklenen degerlerle eslesmeli, bulunan: ${JSON.stringify(data.rows[0])}`);
  assert.deepEqual(data.rows[1], [2, "B Blok", "2", "mimari olarak uygun değildir.", "Balkon farklı.", "Evet"], `2. satir (titleUnits[0]) beklenen degerlerle eslesmeli, bulunan: ${JSON.stringify(data.rows[1])}`);
  assert.deepEqual(data.columnMeta.map((m) => m.kind), ["seq", "readonly", "readonly", "scalar", "scalar", "scalar"], "columnMeta: Sira No 'seq', Blok/BB No 'readonly', geri kalanı 'scalar' olmalı.");
  console.log("2+ tasinmaz, 6 sabit sutun testi tamam.");
}

// --- 3) "Tapu/Belediye Proje Farkı Var" alanları DOLU olsa bile bu -------
// tabloda HİÇ görünmemeli (tablodan TAMAMEN çıkarıldı, columnHasData'nın --
// "bos oldugu icin gizlendi" durumuyla KARIŞTIRILMASIN) --------------------
{
  fns.setState(freshState(
    {
      titleBlockName: "A Blok", unitNo: "1",
      // Kept 3 alan (bu senaryonun asil odagi DEGIL) da doldurulmus - aksi
      // halde bunlar da columnHasData tarafindan (tum tasinmazlarda bos
      // oldugu icin) gizlenir, bu da "kaldirilan alanlar hic gorunmuyor"
      // iddiasini yanlislikla dogrulamis gibi gosterirdi.
      projectSuitabilityStatus: "uygundur.", projectConformity: "Not.", projectSuitabilitySimpleRepair: "Evet",
      titleProjectSuitabilityStatus: "uygundur.", titleProjectSuitabilityNote: "Dolu bir deger",
      municipalityProjectSuitabilityStatus: "uygundur.", municipalityProjectSuitabilityNote: "Dolu bir deger",
      mainRealEstateProjectSuitable: "Hayır", mainRealEstateProjectSuitabilityNote: "Dolu bir deger",
    },
    [unit({ titleBlockName: "B Blok", unitNo: "2" })],
  ));
  const data = fns.buildProjectSuitabilityUnitsSummaryTableData();
  assert.deepEqual(
    data.headers,
    ["Sıra No", "Blok", "BB No", "Proje Uygunluk Durumu - Bağımsız Bölüm", "Açıklama", "Basit Bir Tadilat İle Düzeltilebilir mi?"],
    `Tapu/Belediye Proje Farki VE Ana Gayrimenkul alanlari DOLU olsa bile bu tabloda GORUNMEMELI (kullanicinin 'başka hiç bir sütun istemiyorum' talebi), bulunan: ${JSON.stringify(data.headers)}`,
  );
  console.log("Tapu/Belediye Proje Farki + Ana Gayrimenkul alanlari DOLU olsa bile GORUNMEZ testi tamam.");
}

// --- 4) buildProjectSuitabilityUnitsSummaryWordTableHtml() -----------------
{
  fns.setState(freshState(
    { titleBlockName: "A Blok", unitNo: "1", projectSuitabilityStatus: "uygundur." },
    [unit({ titleBlockName: "B Blok", unitNo: "2", projectSuitabilityStatus: "uygundur." })],
  ));
  const html = fns.buildProjectSuitabilityUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Gecerli bir HTML tablosu uretilmeli.");
  // Basliklar buyuk harfe cevrilip 2 satira bolunuyor (diger 7 tablonun
  // AYNI kurali, bkz. toTitleFieldUppercase/splitTableHeaderLabelIntoTwoLines).
  assert.ok(html.includes("PROJE UYGUNLUK") && html.includes("DURUMU"), "Tablo basligi (buyuk harf) HTML iceriginde gorunmeli.");
  console.log("buildProjectSuitabilityUnitsSummaryWordTableHtml() testi tamam.");
}

// --- 5) getSelectOptionsForFieldKey(): yeni alanlar (kaynak-duzeyi) --------
{
  const src = appSource;
  const fnStart = src.indexOf("function getSelectOptionsForFieldKey(");
  const fnEnd = src.indexOf("\n}", fnStart);
  const fnBody = src.slice(fnStart, fnEnd);
  assert.ok(
    fnBody.includes('"projectSuitabilityStatus", "titleProjectSuitabilityStatus", "municipalityProjectSuitabilityStatus"') && fnBody.includes("return projectSuitabilityOptions;"),
    "getSelectOptionsForFieldKey() Proje Uygunluk Durumu alanları için projectSuitabilityOptions dönmeli (sections[]'te deklaratif olmadıkları için elle eklenmeli).",
  );
  assert.ok(
    fnBody.includes('"mainRealEstateProjectSuitable"') && fnBody.includes('return ["Evet", "Hayır"];'),
    "getSelectOptionsForFieldKey() basit-tadilat/Ana Gayrimenkul alanları için [\"Evet\",\"Hayır\"] dönmeli.",
  );
  console.log("getSelectOptionsForFieldKey() yeni alan eslemeleri (kaynak-duzeyi) testi tamam.");
}

// --- 6) renderSection() "documents" gate: blok gruplamadan BAĞIMSIZ -------
{
  const gateStart = appSource.indexOf('if (section.id === "documents" && isCurrentUserAdmin() && state.fields.requestType === "Çoklu Talep") {');
  assert(gateStart >= 0, "'documents' bölümü render gate'i bulunamadı.");
  const gateEnd = appSource.indexOf("\n  }\n", gateStart);
  const gateBody = appSource.slice(gateStart, gateEnd);
  assert.ok(gateBody.includes("createProjectSuitabilityUnitsSummaryTablePreview()"), "Yeni tablo 'documents' gate'ine eklenmeli.");
  // Kritik: yeni tablo if/else-if (isDocumentsBlockGroupingActive/
  // isDocumentsScopedByBlock) bloğunun DIŞINDA, koşulsuz eklenmeli - aksi
  // halde blok gruplama aktifken (ASIL senaryo) hiç görünmez.
  const ifElseBlockEnd = gateBody.indexOf("}\n    // Kullanıcı talebi (2026-08-26)");
  assert(ifElseBlockEnd >= 0 || gateBody.indexOf("createProjectSuitabilityUnitsSummaryTablePreview()") > gateBody.indexOf("isDocumentsScopedByBlock()"), "Yeni tablo çağrısı if/else-if blogunun disinda (kosulsuz) olmali.");
  console.log("renderSection() 'documents' gate - blok gruplamadan bagimsiz kablolama testi tamam.");
}

// --- 7) Refresh/debounce/commit/field-handler kablolaması (kaynak-duzeyi) --
{
  assert.ok(appSource.includes("function refreshProjectSuitabilityUnitsSummaryTablePreview()"), "refreshProjectSuitabilityUnitsSummaryTablePreview() tanımlı olmalı.");
  assert.ok(appSource.includes('document.querySelector(".project-suitability-units-summary-table-preview")'), "Refresh fonksiyonu BENZERSİZ sınıfla sorgulamalı (documents tablosuyla çakışmamak için).");
  assert.ok(appSource.includes("const refreshProjectSuitabilityUnitsSummaryTablePreviewDebounced = debounce(refreshProjectSuitabilityUnitsSummaryTablePreview, 350);"), "Debounce'lu varyant tanımlı olmalı.");
  assert.ok(appSource.includes("refreshProjectSuitabilityUnitsSummaryTablePreview();"), "commitTitleUnitsSummaryCellEdit() (ya da benzeri) aninda/debounce'suz refresh cagirmali.");
  const projectSuitabilityFieldStart = appSource.indexOf("function createProjectSuitabilityField(");
  const projectSuitabilityFieldEnd = appSource.indexOf("\n}", projectSuitabilityFieldStart);
  assert.ok(
    appSource.slice(projectSuitabilityFieldStart, projectSuitabilityFieldEnd).includes("refreshProjectSuitabilityUnitsSummaryTablePreviewDebounced();"),
    "createProjectSuitabilityField() kendi 'input' handler'inda tabloyu tazelemeli.",
  );
  const mainSuitabilityStart = appSource.indexOf("function createMainRealEstateProjectSuitabilityControl(");
  const mainSuitabilityEnd = appSource.indexOf("\n}", mainSuitabilityStart);
  assert.ok(
    appSource.slice(mainSuitabilityStart, mainSuitabilityEnd).includes("refreshProjectSuitabilityUnitsSummaryTablePreviewDebounced();"),
    "createMainRealEstateProjectSuitabilityControl() kendi 'input' handler'inda tabloyu tazelemeli.",
  );
  console.log("Refresh/debounce/commit/field-handler kablolamasi (kaynak-duzeyi) testi tamam.");
}

// --- 7b) REGRESYON (2026-08-26, kullanıcı bildirimi: "basit bir tadilat --
// durumunu tümüne uygula dediğim anda ekran görüntüsündeki [Belgeler ------
// Özeti] tabloya dönüştü"): "documents" bölümünde İKİ panel (Belgeler -----
// Özeti + Proje Uygunluk Özeti) AYNI ANDA var olabildiğinden, İKİSİ DE ----
// BENZERSİZ (paylaşılan ".title-units-summary-table-preview" DIŞINDA) -----
// sınıflarla sorgulanmalı — aksi halde refreshDocumentsUnitsSummaryTablePreview()
// (genel sınıfla sorgulayan ESKİ hali) Proje Uygunluk panelini YANLIŞLIKLA
// bulup KENDİSİYLE DEĞİŞTİRİYORDU (kullanıcının gördüğü hata BUYDU) -------
{
  assert.ok(
    appSource.includes('wrap.className = "title-units-summary-table-preview documents-units-summary-table-preview";'),
    "createDocumentsUnitsSummaryTablePreview() artık paylaşılan sınıfın YANINDA benzersiz '.documents-units-summary-table-preview' sınıfını taşımıyor."
  );
  const refreshDocsStart = appSource.indexOf("function refreshDocumentsUnitsSummaryTablePreview()");
  const refreshDocsEnd = appSource.indexOf("\n}", refreshDocsStart);
  assert.ok(
    appSource.slice(refreshDocsStart, refreshDocsEnd).includes('document.querySelector(".documents-units-summary-table-preview")'),
    "refreshDocumentsUnitsSummaryTablePreview() artık BENZERSİZ sınıfla sorgulamıyor (genel sınıfla sorgulasaydı 'documents' bölümündeki DİĞER panelle - Proje Uygunluk Özeti - çakışırdı)."
  );
  assert.ok(
    !appSource.slice(refreshDocsStart, refreshDocsEnd).includes('document.querySelector(".title-units-summary-table-preview")'),
    "refreshDocumentsUnitsSummaryTablePreview() ESKİ (yanlış, çakışan) genel sınıf sorgusunu HİÇ İÇERMEMELİ."
  );
  console.log("REGRESYON: Belgeler Ozeti + Proje Uygunluk Ozeti panel-cakismasi duzeltmesi testi tamam.");
}

// --- 7c) REGRESYON (2026-08-26, kullanıcı bildirimi): "tabloda düzeltme --
// yapınca dinamik olarak açıklama değişmiyor, proje tarihi veya başka bir
// kısmı değiştirince değişiyor. bu dinamik olarak tetiklenmeli" — kök
// neden: commitTitleUnitsSummaryCellEdit() AKTİF OLMAYAN bir taşınmazın
// hücresini düzenlerken (setTitleUnitFieldValue ile DOĞRUDAN yazan dal)
// hiçbir "input" event dispatch ETMİYORDU, bu yüzden "Proje İnceleme
// Açıklaması"nı besleyen refreshReviewedDocumentsDescriptionFromCurrentFields
// hiç tetiklenmiyordu (yalnızca AKTİF taşınmazın hücresi, sentetik input
// event'i sayesinde, DOLAYLI olarak tetikleniyordu).
{
  const commitStart = appSource.indexOf("function commitTitleUnitsSummaryCellEdit(");
  const commitEnd = appSource.indexOf("\n}", commitStart);
  const commitBody = appSource.slice(commitStart, commitEnd);
  assert.ok(
    commitBody.includes("refreshReviewedDocumentsDescriptionFromCurrentFields(fieldKey);"),
    "commitTitleUnitsSummaryCellEdit() artık HANGİ taşınmazın hücresi düzenlenirse düzenlensin (aktif olsun ya da olmasın) Proje İnceleme Açıklaması'nı da tazelemeli."
  );
  // Sıralama önemli: refreshReviewedDocumentsDescriptionFromCurrentFields
  // çağrısı, alan yazma dallarından (if/else if/else) SONRA gelmeli - aksi
  // halde henüz yazılmamış ESKİ değeri okurdu.
  const writeIndex = commitBody.indexOf("setTitleUnitFieldValue(unitIndex, fieldKey,");
  const refreshIndex = commitBody.indexOf("refreshReviewedDocumentsDescriptionFromCurrentFields(fieldKey);");
  assert.ok(writeIndex >= 0 && refreshIndex > writeIndex, "Aciklama tazeleme cagrisi alan YAZILDIKTAN SONRA gelmeli (guncel degeri okusun).");

  console.log("REGRESYON: commitTitleUnitsSummaryCellEdit() Proje Inceleme Aciklamasini AKTIF-OLMAYAN tasinmaz duzenlemesinde de tetikliyor testi tamam.");
}

// --- 8) template-engine.js + report-tables-xlsx.js kayitlari ---------------
{
  assert.ok(
    engineSource.includes('TASINMAZLARPROJEUYGUNLUKTABLOSU: { h: () => safeCall("buildProjectSuitabilityUnitsSummaryWordTableHtml") },'),
    "template-engine.js'te {{TASINMAZLARPROJEUYGUNLUKTABLOSU}} kayıtlı olmalı.",
  );
  assert.ok(
    xlsxSource.includes('generatedCellGridFor("buildProjectSuitabilityUnitsSummaryWordTableHtml")') && xlsxSource.includes('"Taşınmazlar Proje Uygunluk Özeti"'),
    "report-tables-xlsx.js'te \"Taşınmazlar Proje Uygunluk Özeti\" sayfası kayıtlı olmalı.",
  );
  console.log("template-engine.js + report-tables-xlsx.js kayit testi tamam.");
}

console.log("Taşınmazlar Proje Uygunluk Özeti (cift tarafli tablo) testleri basarili.");
