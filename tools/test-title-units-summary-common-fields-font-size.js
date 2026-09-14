// Kullanıcı bildirimi (2026-09-14): "rapor çıktılarında ortak bölümler
// tablosunda puntoyu 7 ye indir şu an normal tablolara göre çok büyük
// duruyor" — ekran görüntüsünde "Taşınmazlar Tapu Özeti" tablosunun
// "ORTAK BİLGİLER" kutucuklarındaki DEĞER metni (ör. "BURSA", "OSMANGAZİ")
// 10pt kalın punto ile, normal tablo hücrelerine (6.5pt, bkz.
// buildTitleUnitsSummaryTableHtmlEditable'daki baseCell) göre orantısız
// büyük görünüyordu. Bu tablo tüm "Taşınmazlar X Özeti" bölümlerinin
// (Tapu/Adres/İmar/Arsa/Değerleme/Bağımsız Bölüm/Belgeler/Gabim/Proje
// Uygunluk/Bina Bloğu) PAYLAŞTIĞI TEK üretici fonksiyon
// (buildTitleUnitsSummaryTableCommonFieldsHtml) tarafından hem EKRAN
// önizlemesinde HEM DE banka şablonu Word export'unda kullanılıyor — tek
// yerden düzeltmek hepsini kapsar.
//
// Bu test: fonksiyonun kaynağını çıkarıp gerçekten çalıştırarak ürettiği
// HTML'de hem ETİKET hem DEĞER stilinin artık 7pt olduğunu, eski büyük
// (7.5pt/10pt) puntoların ARTIK üretilmediğini doğruluyor.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadı: ${startMarker}`);
  return appSource.slice(start, end);
}

const fnSource = sourceBetween(
  "function buildTitleUnitsSummaryTableCommonFieldsHtml(commonFields, maxColumns = 4) {",
  "function buildTitleUnitsSummaryTableHtmlEditable("
);

function makeContext() {
  const context = {
    getReportThemeToken: (name, fallback) => fallback,
    escapeHtml: (value) => String(value ?? ""),
  };
  vm.createContext(context);
  vm.runInContext(fnSource, context);
  return context;
}

// --- 1) Gerçek üretilen HTML'de DEĞER punto artık 7pt, eski 10pt YOK -----
{
  const context = makeContext();
  const html = context.buildTitleUnitsSummaryTableCommonFieldsHtml([
    { label: "İl", value: "BURSA" },
    { label: "İlçe", value: "OSMANGAZİ" },
  ]);
  assert(html.includes("BURSA") && html.includes("OSMANGAZİ"), "Ortak alan değerleri HTML'e yansımalı.");
  assert(!html.includes("font-size:10pt"), "Eski (10pt) büyük DEĞER puntosu artık ÜRETİLMEMELİ.");
  assert(!html.includes("font-size:7.5pt"), "Eski (7.5pt) ETİKET puntosu artık ÜRETİLMEMELİ.");
  const valueDivCount = (html.match(/font-size:7pt;font-weight:700;/g) || []).length;
  const labelDivCount = (html.match(/font-size:7pt;font-weight:800;letter-spacing:0\.3pt;/g) || []).length;
  assert.equal(valueDivCount, 2, `2 DEĞER hücresi de 7pt olmalı, bulunan: ${valueDivCount}.`);
  assert.equal(labelDivCount, 2, `2 ETİKET hücresi de 7pt olmalı, bulunan: ${labelDivCount}.`);
  console.log("ORTAK BİLGİLER kutucukları: DEĞER/ETİKET puntosu 7pt'ye indirildi testi tamam.");
}

// --- 2) Boş girişte hâlâ boş string döner (regresyon) --------------------
{
  const context = makeContext();
  assert.equal(context.buildTitleUnitsSummaryTableCommonFieldsHtml([]), "", "Boş commonFields listesi boş string dönmeli (regresyon).");
  assert.equal(context.buildTitleUnitsSummaryTableCommonFieldsHtml(null), "", "null commonFields boş string dönmeli (regresyon).");
  console.log("Boş/null commonFields regresyon testi tamam.");
}

console.log("Tasinmazlar Ozeti Ortak Bilgiler punto testleri basarili.");
