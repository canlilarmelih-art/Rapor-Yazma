// "Değerleme" (valuation) "Değerleme Yöntemi Açıklaması", çoklu taşınmazlı
// raporlarda artık YALNIZCA aktif taşınmazı değil, TÜM taşınmazları
// yansıtıyor (2026-09-07).
//
// Kullanıcı talebi: "Değerleme Yöntemi Açıklamasını çoğul olarak tekrar
// oluştur. burada bana gönder sonra kodla." — sohbette gösterilen taslak
// metinler kullanıcı tarafından onaylandı, ardından "3 ek cümleye de aynı
// çoğullama/gruplama mantığı uygulansın" talebiyle kapsam genişletildi.
//
// Kök neden: valuationMethod ARTIK taşınmaza-özgü (rapor-geneli paylaşım
// daha önce ÇIKARILMIŞTI, bkz. handoff) olduğundan, buildValuationMethodExplanation()
// çoklu taşınmazlı raporlarda YALNIZCA AKTİF taşınmazın seçtiği yöntem(ler)i
// yansıtıyordu. "Değerleme Yöntemi Açıklaması" 4 parçadan oluşur:
//  1) Yöntem cümlesi (valuationMethod — taşınmaza-özgü, GRUP+ATIF gerekir).
//  2) Dışarıdan ekspertiz ek paragrafı (appointmentType/vb. — rapor-geneli
//     PAYLAŞIMLI, yalnızca ÇOĞUL sözcük gerekir, gruplama YOK).
//  3) Kullanım niteliği farkı (legalUsageNature/vb. — rapor-geneli
//     PAYLAŞIMLI, yalnızca ÇOĞUL sözcük gerekir, gruplama YOK).
//  4) İnşaat seviyesi riski (unitConstructionLevel — taşınmaza-özgü,
//     GRUP+ATIF gerekir, (1) ile AYNI mimari).
//
// Bu test kapsamı:
//  1) count<2 -> eski tek-taşınmaz fonksiyonlarına AYNEN düşer (4 parça).
//  2) Yöntem cümlesi: TÜM taşınmazlar AYNI yöntem(ler)i kullanıyorsa
//     atıfsız TEK ÇOĞUL cümle.
//  3) Yöntem cümlesi: FARKLI yöntemler -> gruplanıp atıflı, "Diğer" SONA.
//  4) Dışarıdan ekspertiz: rapor-geneli paylaşımlı olduğundan gruplama
//     YOK, yalnızca ÇOĞUL sözcüklerle yeniden yazılır.
//  5) Kullanım niteliği farkı (tarımsal + genel): AYNI ilke, ÇOĞUL.
//  6) İnşaat seviyesi riski: TÜM taşınmazlar AYNI seviyede -> ÇOĞUL;
//     FARKLI seviyeler -> gruplanıp atıflı; %100 (tamamlanmış) taşınmazlar
//     sessizce atlanır.
//  7) Sadece bir kısmı (ör. sadece 1 taşınmaz) yöntem/inşaat seviyesi
//     alanını doldurmuşsa (diğerleri boş) -> tekil, atıfsız (regresyon
//     kilidi: "az veri" durumunda yanlışlıkla atıf/çoğul üretilmemeli).

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

// parseValuationMultiValue'dan valuationMethodExplanationFallback'a kadar
// TÜM yöntem/ekspertiz/kullanım-niteliği/inşaat-seviyesi ailesini (eski
// tek-taşınmaz fonksiyonları + yeni çoklu-taşınmaz fonksiyonları) TEK
// BLOKTA kapsar.
const methodSource = sourceBetween(
  "function parseValuationMultiValue",
  "const valuationMethodExplanationFallback"
);
const joinTurkishListSource = sourceBetween(
  "function joinTurkishList(items = []) {",
  "function fillWorkplaceFloorCalculationTableBody"
);
const suitabilityLabelSource = sourceBetween(
  "function formatTitleUnitSuitabilityLabel(fields, index) {",
  "function formatTitleUnitSuitabilityShortLabel"
);
const genericOtherLabelSource = sourceBetween(
  "function shouldUseGenericOtherLabelForValuationGroup(groups, index) {",
  "// valuationSaleabilityExplanationVariants'ın"
);

function makeContext({ selectVariantIndex = 0, agriculturalOptions = ["Tarla", "Meyve Bahçesi", "Kayısı Bahçesi", "Armut Bahçesi"] } = {}) {
  const context = {
    state: { fields: {} },
    agriculturalUsageNatureOptions: agriculturalOptions,
    normalizeReportDescriptionText: (value) => String(value || "").trim().replace(/\s+/g, " "),
    normalizeReportTitleText: (value) => String(value || "").trim(),
    parseValuationNumber: (value) => {
      const n = Number.parseFloat(String(value ?? "").replace(",", "."));
      return Number.isFinite(n) ? n : Number.NaN;
    },
    isExternalAppointmentType: (value) => String(value || "").includes("Dışarıdan"),
    selectVariant: () => selectVariantIndex,
    registerVariantGroup: () => {},
    getTitleUnitCount: () => (context.__units ? context.__units.length : 1),
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
  };
  vm.createContext(context);
  vm.runInContext(`${joinTurkishListSource}\n${suitabilityLabelSource}\n${genericOtherLabelSource}\n${methodSource}`, context);
  return context;
}

function withUnits(context, unitFieldsList) {
  context.__units = unitFieldsList.map((fields) => ({ fields }));
  context.state.fields = { ...unitFieldsList[0] };
}

const unit = (overrides = {}) => ({ unitNo: "", titleBlockName: "", valuationMethod: "Emsal Karşılaştırma Yöntemi", ...overrides });

// --- 1) count < 2 -> eski tek-taşınmaz fonksiyonlarına AYNEN düşer ------
{
  const context = makeContext();
  context.state.fields = { valuationMethod: "Emsal Karşılaştırma Yöntemi" };
  context.getTitleUnitCount = () => 1;
  assert.equal(
    context.buildValuationMethodExplanationForAllTitleUnits(),
    context.buildValuationMethodExplanation(),
    "count<2 iken yeni fonksiyon eski tek-taşınmaz fonksiyonuyla BİREBİR aynı sonucu vermeli."
  );
  console.log("count<2 (tek taşınmaz) geriye dönük uyumluluk testi tamam.");
}

// --- 2) Yöntem cümlesi: TÜM taşınmazlar AYNI yöntem -> atıfsız TEK ------
// ÇOĞUL cümle.
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5" }),
    unit({ unitNo: "8" }),
    unit({ unitNo: "11" }),
  ]);
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.equal(
    result,
    "Konu gayrimenkullerin değerlemesinde Emsal Karşılaştırma yaklaşımı kullanılmıştır. Konumuz taşınmazların değerlendirmesinde civardaki alım satım rayiç değerleri ve günümüz ekonomik koşulları, taşınmazların konumu, yaşı, fiziki özellikleri, emsallerdeki pazarlık payları, arz/talep dengesi gibi dışsal etkenler dikkate alınmıştır.",
    "Tüm taşınmazlar AYNI yöntemi kullanıyorsa atıfsız TEK ÇOĞUL cümle üretilmeli."
  );
  assert.ok(!/No'lu/.test(result), "Tüm taşınmazlar AYNI ise hiçbir atıf eklenmemeli.");
  console.log("Yöntem cümlesi: tüm taşınmazlar aynı -> çoğul cümle testi tamam.");
}

// --- 2b) Diğer 2 varyantın da doğru çoğullandığı ------------------------
{
  const context1 = makeContext({ selectVariantIndex: 1 });
  withUnits(context1, [unit(), unit()]);
  assert.equal(
    context1.buildValuationMethodExplanationForAllTitleUnits(),
    "Değerlemeye konu gayrimenkullerin değer tespitinde Emsal Karşılaştırma yaklaşımı esas alınmıştır. Söz konusu taşınmazların değerlendirilmesinde bölgedeki alım-satım rayiç bedelleri ile güncel ekonomik koşullar, taşınmazların konumu, yaşı, fiziksel nitelikleri, emsallerdeki pazarlık payları ve arz-talep dengesi gibi dışsal faktörler göz önünde bulundurulmuştur.",
    "2. varyantın çoğul hali doğru olmalı."
  );
  const context2 = makeContext({ selectVariantIndex: 2 });
  withUnits(context2, [unit(), unit()]);
  assert.equal(
    context2.buildValuationMethodExplanationForAllTitleUnits(),
    "Rapor konusu mülklerin değerlemesinde Emsal Karşılaştırma yaklaşımı uygulanmıştır. Mülklerin değerlendirilme sürecinde civar alım-satım rayiçleri ve mevcut ekonomik konjonktür, taşınmazların konumu, yaşı, fiziki durumu, emsallerdeki pazarlık marjları ve arz-talep dengesi gibi harici unsurlar dikkate alınmıştır.",
    "3. varyantın çoğul hali doğru olmalı."
  );
  console.log("Diğer iki yöntem varyantının çoğullanması testi tamam.");
}

// --- 2c) TÜM taşınmazlar AYNI BİRDEN FAZLA yöntem kullanıyorsa (ve/ki ---
// bağlacı) doğru çoğullanır.
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", valuationMethod: "Emsal Karşılaştırma Yöntemi, Maliyet Yöntemi" }),
    unit({ unitNo: "8", valuationMethod: "Emsal Karşılaştırma Yöntemi, Maliyet Yöntemi" }),
  ]);
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(result.startsWith("Konu gayrimenkullerin değerlemesinde Emsal Karşılaştırma ve Maliyet yaklaşımları kullanılmıştır."), "Birden fazla yöntem 've' ile birleşip 'yaklaşımları' (çoğul kelime sayısı) almalı.");
  console.log("Tüm taşınmazlar aynı BİRDEN FAZLA yöntem -> doğru çoğullama testi tamam.");
}

// --- 3) Yöntem cümlesi: FARKLI yöntemler -> gruplanıp atıflı, "Diğer" ---
// SONA (satış kabiliyeti düzeltmesiyle AYNI sıralama ilkesi).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5" }),
    unit({ titleBlockName: "A", unitNo: "8", valuationMethod: "Maliyet Yöntemi" }),
    unit({ titleBlockName: "A", unitNo: "11" }),
  ]);
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.equal(
    result,
    "A 8 No'lu taşınmazın değerlemesinde Maliyet yaklaşımı kullanılmıştır. Değerlendirmede civardaki alım satım rayiç değerleri ve günümüz ekonomik koşulları, konumu, yaşı, fiziki özellikleri, emsallerdeki pazarlık payları, arz/talep dengesi gibi dışsal etkenler dikkate alınmıştır. " +
      "Diğer taşınmazların değerlemesinde Emsal Karşılaştırma yaklaşımı kullanılmıştır. Değerlendirmede civardaki alım satım rayiç değerleri ve günümüz ekonomik koşulları, konumu, yaşı, fiziki özellikleri, emsallerdeki pazarlık payları, arz/talep dengesi gibi dışsal etkenler dikkate alınmıştır.",
    "Özel etiketli (azınlık) grup ÖNCE, jenerik 'Diğer' (çoğunluk) grup SONRA gelmeli; 2. cümledeki özne tekrarı DÜŞÜRÜLMÜŞ olmalı."
  );
  console.log("Yöntem cümlesi: farklı yöntemler -> gruplanıp atıflı, Diğer sona testi tamam.");
}

// --- 4) Dışarıdan ekspertiz: rapor-geneli paylaşımlı, gruplama YOK, -----
// yalnızca ÇOĞUL sözcüklerle yeniden yazılır.
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5" }),
    unit({ unitNo: "8" }),
  ]);
  context.state.fields.appointmentType = "Dışarıdan ekspertiz";
  context.state.fields.externalAppraisalReason = "Müşteri talebi ile";
  context.state.fields.projectInstitution = "Belediye";
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(
    result.includes("Müşteri talebi ile sebebi ile dışarıdan ekspertiz yapılmış, taşınmazların alan ve mimari açıdan proje ile uygunluğu kontrol edilememiş olup proje ile uygun oldukları kabul edilmiştir."),
    "Dışarıdan ekspertiz paragrafı ÇOĞUL sözcüklerle (taşınmazların/oldukları) yeniden yazılmalı."
  );
  console.log("Dışarıdan ekspertiz paragrafının çoğullanması testi tamam.");
}

// --- 5) Kullanım niteliği farkı: tarımsal + genel, AYNI ilke, ÇOĞUL -----
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [unit(), unit()]);
  context.state.fields.usageNatureDifference = "Evet";
  context.state.fields.legalUsageNature = "Tarla";
  context.state.fields.currentUsageNature = "Meyve Bahçesi";
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(
    result.includes("Değerlemeye konu taşınmazlar Tarla nitelikli olup mevcut durumda Meyve Bahçesi niteliklidir."),
    "Tarımsal nitelik farkı cümlesi ÇOĞUL ('taşınmazlar') özneyle üretilmeli."
  );
  console.log("Kullanım niteliği farkı (tarımsal) çoğullama testi tamam.");
}

{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [unit(), unit()]);
  context.state.fields.usageNatureDifference = "Evet";
  context.state.fields.legalUsageNature = "Konut";
  context.state.fields.currentUsageNature = "İşyeri";
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(
    result.includes('Ekspertize konu taşınmazlar Tapu Kayıtlarına göre "Konut" Nitelikli olup, Mevcut Kullanımları "İşyeri" nitelikli olduğu gözlemlenmiştir.'),
    "Genel kullanım niteliği farkı giriş cümlesi ÇOĞUL ('taşınmazlar'/'Kullanımları') özneyle üretilmeli."
  );
  console.log("Kullanım niteliği farkı (genel) çoğullama testi tamam.");
}

// --- 6) İnşaat seviyesi riski: TÜM taşınmazlar AYNI seviyede -> ÇOĞUL ---
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", unitConstructionLevel: "80" }),
    unit({ unitNo: "8", unitConstructionLevel: "80" }),
  ]);
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(
    result.includes("Konu taşınmazlar hali hazırda %80 inşaat seviyeli olup"),
    "Tüm taşınmazlar AYNI inşaat seviyesindeyse atıfsız ÇOĞUL cümle üretilmeli."
  );
  console.log("İnşaat seviyesi riski: tüm taşınmazlar aynı seviye -> çoğul testi tamam.");
}

// --- 6b) İnşaat seviyesi riski: FARKLI seviyeler -> gruplanıp atıflı, ---
// %100 (tamamlanmış) taşınmaz sessizce atlanır.
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", unitConstructionLevel: "80" }),
    unit({ unitNo: "8", unitConstructionLevel: "60" }),
    unit({ unitNo: "11", unitConstructionLevel: "100" }),
  ]);
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(result.includes("5 No'lu taşınmaz hali hazırda %80 inşaat seviyeli olup"), "5 No'lu KENDİ seviyesiyle (%80) yer almalı.");
  assert.ok(result.includes("8 No'lu taşınmaz hali hazırda %60 inşaat seviyeli olup"), "8 No'lu KENDİ seviyesiyle (%60) yer almalı.");
  assert.ok(!/11 No'lu/.test(result), "Tamamlanmış (%100) taşınmaz İNŞAAT SEVİYESİ cümlesinde HİÇ geçmemeli.");
  console.log("İnşaat seviyesi riski: farklı seviyeler + %100 atlama testi tamam.");
}

// --- 7) Yalnızca 1 taşınmaz veri doldurmuşsa (diğerleri boş) -> tekil, --
// atıfsız (regresyon kilidi: "az veri" durumunda yanlışlıkla çoğul/atıf
// üretilmemeli).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", valuationMethod: "" }),
    unit({ unitNo: "8" }),
    unit({ unitNo: "11", valuationMethod: "" }),
  ]);
  const result = context.buildValuationMethodExplanationForAllTitleUnits();
  assert.ok(result.startsWith("Konu gayrimenkulün değerlemesinde Emsal Karşılaştırma yaklaşımı kullanılmıştır."), "Yalnızca 1 taşınmaz veri doldurmuşsa TEKİL (atıfsız) cümle üretilmeli, diğerlerinin BOŞ olması yanlışlıkla atıf/çoğul TETİKLEMEMELİ.");
  assert.ok(!/No'lu/.test(result), "Tek gerçek veri kaynağı varken atıf eklenmemeli.");
  console.log("Yalnızca 1 taşınmaz veri doldurmuş (az veri) -> tekil regresyon testi tamam.");
}

console.log("Degerleme yontemi aciklamasi coklu tasinmaz testleri basarili.");
