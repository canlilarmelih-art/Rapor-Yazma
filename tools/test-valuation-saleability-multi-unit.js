// "Değerleme" (valuation) Satış Kabiliyeti Açıklaması, çoklu taşınmazlı
// raporlarda artık YALNIZCA aktif taşınmazı değil, TÜM taşınmazları
// yansıtıyor (2026-09-07).
//
// Kullanıcı talebi: "benim istediğim değerleme ile ilgili açıklamaların
// çoğullanması eğer tüm taşınmazlar satılabilir ise cümleyi çoğullamamız
// lazım. yada satış kabiliyetine göre taşınmazlara gruplayıp cümle
// yapılarını kurmamız gerekiyor." + takip talebi: "tamam satılabilir ise
// '[...] SATILABİLİR oldukları kanaatine varılmıştır.' bu cümle. bir
// grup satılabilir ise bağımsız bölümleri gruplayarak X, Y, Z bağımsız
// bölümler matbu cümle. kalan var ise kalan taşınmazları gruplandırma
// var ise yine gruplandır."
//
// Kök neden: saleability/saleabilityNote artık taşınmaza-özgü (rapor-
// geneli paylaşım ÇIKARILDI, bkz. handoff) olduğundan,
// buildValuationSaleabilityExplanation() çoklu taşınmazlı raporlarda
// YALNIZCA AKTİF taşınmazın verisini okuyordu — diğer taşınmazların
// (farklı olabilecek) satış kabiliyeti tamamen görmezden geliniyordu.
//
// Bu test kapsamı:
//  1) Tek taşınmazlı / count<2 raporlarda davranış DEĞİŞMEDİ (eski
//     tek-taşınmaz fonksiyonuna aynen düşer).
//  2) TÜM taşınmazlar AYNI (Satılabilir DAHİL) ise atıfsız TEK ÇOĞUL
//     cümle — kullanıcının BİZZAT verdiği örnek metinle BİREBİR eşleşir.
//  3) TÜM taşınmazlar AYNI (Satılabilir OLMAYAN, AYNI not) ise atıfsız
//     TEK ÇOĞUL sonuç cümlesi.
//  4) KARMA durum: bir grup Satılabilir, kalan grup(lar) kendi
//     aralarında (satış kabiliyeti + not) gruplanıp HER GRUP kendi
//     atıflı "matbu" cümlesini alır.
//  5) "1'e-1 basit fark" (composeSoleRestDecorativeSentence ile AYNI
//     ilke): tam 2 grup, HER İKİSİ de tekil ise "Diğer" YERİNE ikisi de
//     kendi özel etiketini alır.
//  6) 3+ grup (fallback): HİÇBİRİ "Diğer" almaz, HER grup kendi özel
//     etiketleriyle anılır.
//  7) Farklı notlar AYNI saleability değerine sahip olsa bile taşınmazları
//     AYRI gruplara düşürür (grup anahtarı saleability+not ÇİFTİ).

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

// buildValuationSaleabilityExplanation() İLE onun HEMEN ardına eklenen
// TÜM yeni multi-unit fonksiyonlarını (groupValuationSaleabilityEntries,
// shouldUseGenericOtherLabelForValuationGroup, buildValuationSaleabilityGroupSentence,
// VALUATION_SALEABILITY_EXPLANATION_PLURAL_MAP, pluralizeValuationSaleabilityNarrativeText,
// buildValuationSaleabilityExplanationForAllTitleUnits) TEK BLOKTA kapsar —
// tools/test-tarla-saleability-explanation.js'in AYNI aralığı (yalnızca
// buildValuationSaleabilityExplanation'ı çağıran, yeni fonksiyonları HİÇ
// çağırmayan) kullanmasıyla REGRESYONSUZ bir arada yaşar.
const saleabilitySource = sourceBetween(
  "const tarlaSaleabilityRiskExplanation",
  "const valuationSaleabilityExplanationFallback"
);
const joinTurkishListSource = sourceBetween(
  "function joinTurkishList(items = []) {",
  "function fillWorkplaceFloorCalculationTableBody"
);
const suitabilityLabelSource = sourceBetween(
  "function formatTitleUnitSuitabilityLabel(fields, index) {",
  "function formatTitleUnitSuitabilityShortLabel"
);

function makeContext({ selectVariantIndex = 0 } = {}) {
  const context = {
    state: { fields: {} },
    saleabilityOptions: ["Satılabilir", "Alıcısı Az", "Satışı Güç", "Satılamaz"],
    normalizeReportDescriptionText: (value) => String(value || "").trim().replace(/\s+/g, " "),
    selectVariant: () => selectVariantIndex,
    registerVariantGroup: () => {},
    getTitleUnitCount: () => (context.__units ? context.__units.length : 1),
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
  };
  vm.createContext(context);
  vm.runInContext(`${joinTurkishListSource}\n${suitabilityLabelSource}\n${saleabilitySource}`, context);
  return context;
}

function withUnits(context, unitFieldsList) {
  context.__units = unitFieldsList.map((fields) => ({ fields }));
  context.state.fields = { ...unitFieldsList[0] };
}

const unit = (overrides = {}) => ({ unitNo: "", titleBlockName: "", saleability: "Satılabilir", saleabilityNote: "", ...overrides });

// --- 1) count < 2 -> eski tek-taşınmaz davranışına AYNEN düşer ----------
{
  const context = makeContext();
  context.state.fields = { saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." };
  context.getTitleUnitCount = () => 1;
  const single = context.buildValuationSaleabilityExplanation();
  const multi = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(multi, single, "count<2 iken buildValuationSaleabilityExplanationForAllTitleUnits(), eski tek-taşınmaz fonksiyonuyla BİREBİR aynı sonucu vermeli.");
  console.log("count<2 (tek taşınmaz) geriye dönük uyumluluk testi tamam.");
}

// --- 2) TÜM taşınmazlar Satılabilir -> atıfsız TEK ÇOĞUL cümle ----------
// (kullanıcının BİZZAT onayladığı örnek metinle BİREBİR eşleşir).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5" }),
    unit({ unitNo: "8" }),
    unit({ unitNo: "11" }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "Değerlemeye konu taşınmazlar yukarıdaki özellikleri sebebiyle tercih edilmektedir. Konumları, ulaşım imkânları ve diğer özellikleri dikkate alındığında SATILABİLİR oldukları kanaatine varılmıştır.",
    "KULLANICI ÖRNEĞİ: tüm taşınmazlar Satılabilir ise TAM BU çoğul cümle üretilmeli."
  );
  assert.ok(!/No'lu/.test(result), "Tüm taşınmazlar AYNI ise HİÇBİR atıf (taşınmaz no'su) eklenmemeli.");
  console.log("Tüm taşınmazlar Satılabilir -> kullanıcı örneği çoğul cümle testi tamam.");
}

// --- 2b) Diğer 2 Satılabilir varyantının da doğru çoğullandığı ----------
{
  const context1 = makeContext({ selectVariantIndex: 1 });
  withUnits(context1, [unit(), unit()]);
  assert.equal(
    context1.buildValuationSaleabilityExplanationForAllTitleUnits(),
    "Söz konusu gayrimenkuller yukarıda belirtilen özellikleri nedeniyle tercih edilen taşınmazlar niteliğindedir. Konumları, ulaşım olanakları ve diğer nitelikleri birlikte değerlendirildiğinde SATILABİLİR oldukları görüş ve kanaatine varılmıştır.",
    "2. Satılabilir varyantının çoğul hali doğru olmalı."
  );
  const context2 = makeContext({ selectVariantIndex: 2 });
  withUnits(context2, [unit(), unit()]);
  assert.equal(
    context2.buildValuationSaleabilityExplanationForAllTitleUnits(),
    "Rapor konusu mülkler, sahip oldukları yukarıdaki özellikler nedeniyle talep gören gayrimenkuller niteliğindedir. Konumları, ulaşım imkânları ve diğer nitelikleri birlikte ele alındığında SATILABİLİR nitelikte oldukları değerlendirilmiştir.",
    "3. Satılabilir varyantının çoğul hali doğru olmalı."
  );
  console.log("Diğer iki Satılabilir varyantının çoğullanması testi tamam.");
}

// --- 3) TÜM taşınmazlar AYNI (Satılamaz, AYNI not) -> atıfsız TEK ÇOĞUL --
// sonuç cümlesi.
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "Bölgedeki talep çok düşüktür. Bu sebeple taşınmazların satış kabiliyetlerinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "Tüm taşınmazlar AYNI (saleability+not) ise atıfsız çoğul sonuç cümlesi kurulmalı."
  );
  assert.ok(!/No'lu/.test(result), "Tüm taşınmazlar AYNI ise atıf eklenmemeli.");
  console.log("Tüm taşınmazlar AYNI (Satılamaz) -> atıfsız çoğul sonuç cümlesi testi tamam.");
}

// --- 4) KARMA durum: 1 Satılabilir + 1 Satılamaz -> HER İKİSİ de KENDİ --
// özel etiketiyle (1'e-1 basit fark kuralı: "Diğer" YOK).
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "5 No'lu bağımsız bölümünün satış kabiliyetinin Satılabilir olduğu değerlendirilmiştir. " +
      "Bölgedeki talep çok düşüktür. Bu sebeple 8 No'lu bağımsız bölümünün satış kabiliyetinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "1'e-1 karma durumda HER İKİ taşınmaz da 'Diğer' YERİNE KENDİ özel etiketiyle anılmalı."
  );
  console.log("Karma (1 Satılabilir + 1 Satılamaz, 1'e-1) -> iki özel etiketli cümle testi tamam.");
}

// --- 5) KARMA durum: 2 Satılabilir + 1 Satılamaz -> tam 2 GRUP, biri ----
// (Satılamaz) TEKİL olduğundan composeSoleRestDecorativeSentence ile AYNI
// "sole/rest" kuralı gereği 2+ üyeli Satılabilir grubu jenerik "Diğer"
// alır, TEKİL Satılamaz taşınmaz KENDİ özel etiketini korur (bkz. 5b'nin
// TERSİ — burada "az" taraf sole, "çok" taraf Satılabilir).
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Satılabilir" }),
    unit({ unitNo: "11", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "Diğer bağımsız bölümlerin satış kabiliyetlerinin Satılabilir olduğu değerlendirilmiştir. " +
      "Bölgedeki talep çok düşüktür. Bu sebeple 11 No'lu bağımsız bölümünün satış kabiliyetinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "Tam 2 grup + biri (Satılamaz) tekil ise, 2+ üyeli Satılabilir grubu jenerik 'Diğer' almalı, tekil taraf KENDİ etiketini korumalı."
  );
  console.log("Karma (2 Satılabilir + 1 Satılamaz, sole/rest) -> 'Diğer' + tekil özel etiket testi tamam.");
}

// --- 5b) "Diğer" jenerik etiketi: 1 Satılabilir (tekil) + 2 Satılamaz ----
// (AYNI not, çoğul) -> Satılamaz grubu "Diğer bağımsız bölümlerin" alır
// (composeSoleRestDecorativeSentence ile AYNI ilke: karşı taraf TEKİLSE
// bu taraf jenerik "Diğer" alabilir).
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
    unit({ unitNo: "11", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "5 No'lu bağımsız bölümünün satış kabiliyetinin Satılabilir olduğu değerlendirilmiştir. " +
      "Bölgedeki talep çok düşüktür. Bu sebeple Diğer bağımsız bölümlerin satış kabiliyetlerinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "Karşı taraf (Satılabilir) TEKİLSE, 2+ üyeli Satılamaz grubu jenerik 'Diğer' etiketini almalı."
  );
  console.log("'Diğer' jenerik etiketi (karşı taraf tekil) testi tamam.");
}

// --- 6) 3+ grup (fallback): HİÇBİRİ 'Diğer' almaz, HER grup KENDİ -------
// etiketleriyle anılır.
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Alıcısı Az", saleabilityNote: "Bölgede benzer emsal azdır." }),
    unit({ unitNo: "11", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.ok(!/\bDiğer\b/.test(result), "3+ grupta HİÇBİR grup jenerik 'Diğer' almamalı.");
  assert.ok(result.includes("5 No'lu bağımsız bölümünün satış kabiliyetinin Satılabilir olduğu değerlendirilmiştir."), "Satılabilir grubu kendi etiketiyle yer almalı.");
  assert.ok(result.includes("Bölgede benzer emsal azdır. Bu sebeple 8 No'lu bağımsız bölümünün satış kabiliyetinin Alıcısı Az olacağı görüş ve kanaatindeyiz."), "Alıcısı Az grubu kendi etiketi+notuyla yer almalı.");
  assert.ok(result.includes("Bölgedeki talep çok düşüktür. Bu sebeple 11 No'lu bağımsız bölümünün satış kabiliyetinin Satılamaz olacağı görüş ve kanaatindeyiz."), "Satılamaz grubu kendi etiketi+notuyla yer almalı.");
  console.log("3+ grup (fallback, hiçbiri Diğer almaz) testi tamam.");
}

// --- 7) AYNI saleability, FARKLI not -> AYRI gruplara düşer -------------
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "İmar durumu belirsizdir." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.ok(result.includes("5 No'lu bağımsız bölümünün satış kabiliyetinin Satılamaz olacağı"), "Farklı notlu 5 No'lu KENDİ ayrı cümlesinde kalmalı.");
  assert.ok(result.includes("8 No'lu bağımsız bölümünün satış kabiliyetinin Satılamaz olacağı"), "Farklı notlu 8 No'lu KENDİ ayrı cümlesinde kalmalı.");
  assert.ok(result.includes("Bölgedeki talep çok düşüktür."), "5 No'lunun notu korunmalı.");
  assert.ok(result.includes("İmar durumu belirsizdir."), "8 No'lunun notu korunmalı.");
  console.log("Aynı saleability, farklı not -> ayrı gruplara düşme testi tamam.");
}

console.log("Degerleme satis kabiliyeti coklu tasinmaz testleri basarili.");
