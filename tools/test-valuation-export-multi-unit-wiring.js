// Kullanıcı bildirimi (2026-09-14): "kuveyttürk rapor çıktısında
// değerleme bölümündeki cümleler rapor çoklu olmasına rağmen tekli rapor
// formatında geldi."
//
// Kök neden: "Değerleme Yöntemi Açıklaması" / "Satış Kabiliyeti Açıklaması"
// / "Kira Açıklaması" panelleri ZATEN çoklu-taşınmaz-farkında
// (buildValuationMethodExplanationForAllTitleUnits/
// buildValuationSaleabilityExplanationForAllTitleUnits/
// buildValuationRentExplanationForAllTitleUnits — hepsi 0.0.6xx'te
// eklendi, refreshValuation*Explanation() ile panel her değişiklikte bu
// fonksiyonları çağırıyor) AMA banka şablonu EXPORT'u
// (src/templates/template-engine.js'teki DEGERLEMEYONTEMIACIKLAMASI/
// KIRAACIKLAMASI/VALUATIONSALEABILITYEXPLANATION/DEGERLEME2025/
// HALKBANKDEGERLEME token'ları) hâlâ bu fonksiyonların TEKİL (yalnızca
// AKTİF taşınmazı okuyan) öncüllerini çağırıyordu — panel ekranda DOĞRU
// (çoklu) metni gösterirken, dışa aktarılan Word/banka şablonu çıktısı
// yalnızca aktif taşınmazı yansıtıyordu. Bu tutarsızlık TÜM 10 gerçek
// banka şablonunda (akbank/halkbank/isbankasi/kuveytturk/kuveytturk-
// arsa-arazi/vakifbank/vakifkatilim/yapikredi/ziraat/ziraat-arsa-arazi)
// mevcuttu, kullanıcı yalnızca Kuveyt Türk çıktısında fark etti.
//
// Ayrıca buildValuationSaleabilityExplanationForExport() (SATIS_KABILIYETI_
// ACIKLAMASI token'ının bağlı olduğu, tek taşınmazlı raporlarda "Satılabilir"
// (varsayılan) ise metni BİLEREK boş bırakan sarmalayıcı) da SADECE aktif
// taşınmazın saleability alanına bakıyordu — çoklu taşınmazlı bir raporda
// aktif taşınmaz "Satılabilir" olsa bile DİĞER taşınmazlardan biri
// "Satılamaz" gibi problemli bir durumdaysa, bu bilgi export'tan TAMAMEN
// düşüyordu.
//
// Bu test kapsamı:
//  1) template-engine.js kaynak seviyesinde: DEGERLEMEYONTEMIACIKLAMASI/
//     KIRAACIKLAMASI/VALUATIONSALEABILITYEXPLANATION/DEGERLEME2025/
//     HALKBANKDEGERLEME artık "ForAllTitleUnits" sürümünü çağırıyor
//     (SATISKABILIYETIACIKLAMASI ayrı — kendi export sarmalayıcısını
//     kullanmaya devam ediyor, aşağıda #2'de ayrıca test edilir).
//  2) buildValuationSaleabilityExplanationForExport(): çoklu taşınmazlı
//     raporda TÜM taşınmazlar "Satılabilir" (varsayılan) DEĞİLSE artık
//     TÜM taşınmazları yansıtır (yalnızca aktif değil); TÜMÜ varsayılansa
//     (tek taşınmazlı davranışla TUTARLI şekilde) boş döner.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const templateEngineSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "templates", "template-engine.js"),
  "utf8"
);

function sourceBetween(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak bulunamadı: ${label || startMarker}`);
  return source.slice(start, end);
}

// --- 1) template-engine.js kaynak seviyesinde doğru fonksiyonlara sarılı --
{
  const wiringChecks = [
    { token: "DEGERLEME2025", expected: "buildValuationMethodExplanationForAllTitleUnits" },
    { token: "DEGERLEMEYONTEMIACIKLAMASI", expected: "buildValuationMethodExplanationForAllTitleUnits" },
    { token: "VALUATIONSALEABILITYEXPLANATION", expected: "buildValuationSaleabilityExplanationForAllTitleUnits" },
    { token: "KIRAACIKLAMASI", expected: "buildValuationRentExplanationForAllTitleUnits" },
    { token: "HALKBANKDEGERLEME", expected: "buildValuationMethodExplanationForAllTitleUnits" },
  ];
  for (const { token, expected } of wiringChecks) {
    const lineMatch = new RegExp(`${token}:\\s*\\{[^}]*\\}`, "s").exec(templateEngineSource);
    assert(lineMatch, `${token} placeholder tanımı bulunamadı.`);
    assert(
      lineMatch[0].includes(expected),
      `${token} artık "${expected}" fonksiyonunu çağırmalı (çoklu taşınmaz farkında), bulunan: ${lineMatch[0]}`
    );
    // Eski, tekil (yalnızca aktif taşınmazı okuyan) fonksiyon adı TAM
    // olarak (sondan "ForAllTitleUnits" eki OLMADAN) artık kullanılmamalı.
    const singularName = expected.replace(/ForAllTitleUnits$/, "");
    const usesBareSingular = new RegExp(`safeCall\\("${singularName}"\\)`).test(lineMatch[0]);
    assert(!usesBareSingular, `${token} hâlâ tekil ${singularName}() fonksiyonunu çağırıyor, çoklu taşınmazlı raporlarda bilgi kaybına yol açar.`);
  }
  console.log("template-engine.js placeholder kablolama (ForAllTitleUnits) testi tamam.");
}

// --- 2) buildValuationSaleabilityExplanationForExport() çoklu-taşınmaz ---
const joinTurkishListSource = sourceBetween(appSource, "function joinTurkishList(items = []) {", "async function processKmlFile", "joinTurkishList");
const suitabilityLabelSource = sourceBetween(appSource, "function formatTitleUnitSuitabilityLabel(fields, index) {", "function formatTitleUnitSuitabilityShortLabel", "formatTitleUnitSuitabilityLabel");
const saleabilitySource = sourceBetween(appSource, "const tarlaSaleabilityRiskExplanation", "const valuationSaleabilityExplanationFallback", "saleability block");
const exportSource = sourceBetween(appSource, "function buildValuationSaleabilityExplanationForExport", "// \"Emlak Beyan Değeri Açıklaması\"", "buildValuationSaleabilityExplanationForExport");

function makeContext({ selectVariantIndex = 0 } = {}) {
  const context = {
    state: { fields: {} },
    saleabilityOptions: ["Satılabilir", "Alıcısı Az", "Satışı Güç", "Satılamaz"],
    cleanupPlaceName: (value) => String(value || "").trim(),
    normalizeReportDescriptionText: (value) => String(value || "").trim().replace(/\s+/g, " "),
    selectVariant: () => selectVariantIndex,
    registerVariantGroup: () => {},
    getTitleUnitCount: () => (context.__units ? context.__units.length : 1),
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
  };
  vm.createContext(context);
  vm.runInContext(`${joinTurkishListSource}\n${suitabilityLabelSource}\n${saleabilitySource}\n${exportSource}`, context);
  return context;
}

function withUnits(context, unitFieldsList) {
  context.__units = unitFieldsList.map((fields) => ({ fields }));
  context.state.fields = { ...unitFieldsList[0] };
}

const unit = (overrides = {}) => ({ unitNo: "", titleBlockName: "", saleability: "Satılabilir", saleabilityNote: "", ...overrides });

// 2a) tek taşınmaz, Satılabilir -> boş (davranış DEĞİŞMEDİ)
{
  const context = makeContext();
  context.state.fields = { saleability: "Satılabilir" };
  context.getTitleUnitCount = () => 1;
  assert.equal(context.buildValuationSaleabilityExplanationForExport(), "", "Tek taşınmaz + Satılabilir -> export boş dönmeli (mevcut davranış).");
  console.log("Tek taşınmaz Satılabilir export boş testi tamam.");
}

// 2b) çoklu taşınmaz, TÜMÜ Satılabilir (varsayılan) -> boş
{
  const context = makeContext();
  withUnits(context, [unit(), unit(), unit()]);
  assert.equal(
    context.buildValuationSaleabilityExplanationForExport(),
    "",
    "Çoklu taşınmaz, TÜMÜ Satılabilir ise export boş dönmeli (tekil davranışla tutarlı)."
  );
  console.log("Çoklu taşınmaz, tümü Satılabilir -> export boş testi tamam.");
}

// 2c) KULLANICI SENARYOSU: aktif taşınmaz Satılabilir ama BAŞKA bir
// taşınmaz Satılamaz -> export artık BUNU YANSITMALI (eskiden aktif
// taşınmaz Satılabilir olduğu için TAMAMEN boş dönerdi, diğer taşınmazın
// sorunu export'tan kaybolurdu).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }), // aktif/ilk taşınmaz
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const exported = context.buildValuationSaleabilityExplanationForExport();
  const expected = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.notEqual(exported, "", "Diğer taşınmazlardan biri Satılamaz ise export ARTIK boş dönmemeli.");
  assert.equal(exported, expected, "Export metni, ForAllTitleUnits sürümüyle BİREBİR aynı olmalı.");
  assert.ok(exported.includes("8 No'lu"), "8 No'lu taşınmazın Satılamaz durumu export metninde yer almalı.");
  console.log("Karma durum (aktif Satılabilir, diğeri Satılamaz) -> export artık TÜM taşınmazları yansıtıyor testi tamam.");
}

// 2d) TÜM taşınmazlar AYNI (Satılamaz) -> export ForAllTitleUnits ile aynı
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const exported = context.buildValuationSaleabilityExplanationForExport();
  assert.equal(
    exported,
    "Bölgedeki talep çok düşüktür. Bu sebeple taşınmazların satış kabiliyetlerinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "Tüm taşınmazlar aynı Satılamaz durumundaysa export atıfsız çoğul sonuç cümlesini vermeli."
  );
  console.log("Tüm taşınmazlar aynı Satılamaz -> export çoğul cümle testi tamam.");
}

console.log("Degerleme export coklu tasinmaz kablolama testleri basarili.");
