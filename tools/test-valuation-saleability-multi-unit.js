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
// KULLANICI DÜZELTMESİ (2026-09-07, GERÇEK üretilen/talep edilen paragraf
// karşılaştırma görseli): İLK deneme (bu commit'ten ÖNCEki hali) karma
// durumda Satılabilir grubu İÇİN icat edilmiş sade bir "matbu" şablon
// ("X bağımsız bölümlerin satış kabiliyetinin Satılabilir olduğu
// değerlendirilmiştir.") kullanıyordu — YANLIŞTI. Kullanıcının GERÇEK
// örneği: Satılabilir grubu İÇİN "hikaye" varyant cümlesinin KENDİSİ,
// SADECE öznesi atıfla değiştirilerek kullanılmalı ("Diğer tüm
// taşınmazlar yukarıdaki özellikleri sebebiyle tercih edilmektedir. ...
// SATILABİLİR oldukları kanaatine varılmıştır."); Satılabilir-OLMAYAN
// grup İÇİN İSE etiket cümlenin GRAMERİNE ÖRÜLMEZ, SADECE BAŞINA eklenir,
// cümlenin kendisi ("taşınmazın satış kabiliyetinin ... olacağı")
// DEĞİŞMEDEN kalır ("A 8 No'lu Yapı denetim sözleşme feshi bulunmaktadır.
// Bu sebeple taşınmazın satış kabiliyetinin Alıcısı Az olacağı görüş ve
// kanaatindeyiz."). AYRICA sıralama: ÖZEL etiketli (azınlık/sorunlu)
// grup(lar) ÖNCE, jenerik "Diğer" (çoğunluk/olumlu) grubu HER ZAMAN EN
// SONA gelir.
//
// Bu test kapsamı:
//  1) Tek taşınmazlı / count<2 raporlarda davranış DEĞİŞMEDİ (eski
//     tek-taşınmaz fonksiyonuna aynen düşer).
//  2) TÜM taşınmazlar AYNI (Satılabilir DAHİL) ise atıfsız TEK ÇOĞUL
//     cümle — kullanıcının BİZZAT verdiği örnek metinle BİREBİR eşleşir.
//  3) TÜM taşınmazlar AYNI (Satılabilir OLMAYAN, AYNI not) ise atıfsız
//     TEK ÇOĞUL sonuç cümlesi.
//  4) KARMA durum (1'e-1): HER İKİ taraf da kendi özel etiketiyle,
//     Satılabilir tarafı KENDİ "hikaye" cümlesinin (öznesi değişmiş)
//     tekil hali, diğer taraf not+sonuç cümlesinin BAŞINA etiket eklenmiş
//     hali.
//  5) KULLANICI ÖRNEĞİNİN BİREBİR REPRODÜKSİYONU: 1 Alıcısı Az (özel
//     etiket, not ile) + 2 Satılabilir ("Diğer", hikaye cümlesi öznesi
//     değişmiş) — sıralama: özel etiketli ÖNCE, "Diğer" SONRA.
//  6) "1'e-1 basit fark"ın TERSİ: sole=Satılabilir, "Diğer"=Satılamaz
//     (2+ üye) — jenerik etiket + not-öncesi-etiket kombinasyonu.
//  7) 3+ grup (fallback): HİÇBİRİ "Diğer" almaz, HER grup kendi özel
//     etiketleriyle anılır.
//  8) Farklı notlar AYNI saleability değerine sahip olsa bile taşınmazları
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
  "function joinTurkishList(items) {",
  "async function processKmlFile"
);
const suitabilityLabelSource = sourceBetween(
  "function formatTitleUnitSuitabilityLabel(fields, index) {",
  "function formatTitleUnitSuitabilityShortLabel"
);

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

// --- 4) KARMA durum (1'e-1): 1 Satılabilir + 1 Satılamaz -> HER İKİSİ de -
// KENDİ özel etiketiyle ("Diğer" YOK, ikisi de tekil).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "5 No'lu taşınmaz yukarıdaki özellikleri sebebiyle tercih edilmektedir. Konumu, ulaşım imkânları ve diğer özellikleri dikkate alındığında SATILABİLİR olduğu kanaatine varılmıştır. " +
      "8 No'lu Bölgedeki talep çok düşüktür. Bu sebeple taşınmazın satış kabiliyetinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "1'e-1 karma durumda: Satılabilir taraf KENDİ 'hikaye' cümlesinin (öznesi '5 No'lu taşınmaz' olan) tekil hali, Satılamaz taraf ise not+sonuç cümlesinin BAŞINA '8 No'lu' etiketi eklenmiş (cümlenin İÇİ 'taşınmazın' olarak DEĞİŞMEDEN kalmalı) hali almalı."
  );
  console.log("Karma (1 Satılabilir + 1 Satılamaz, 1'e-1) -> iki özel etiketli cümle testi tamam.");
}

// --- 5) KULLANICI ÖRNEĞİNİN BİREBİR REPRODÜKSİYONU: 1 Alıcısı Az (özel --
// etiket + not) + 2 Satılabilir ("Diğer", hikaye cümlesi öznesi
// değişmiş) — sıralama: özel etiketli ÖNCE, "Diğer" SONRA (gerçek
// üretilen/talep edilen paragraf karşılaştırma görseliyle BİREBİR eşleşir,
// yalnızca örnekteki "Yapı denetim sözleşme feshi bulunmaktadır." notu ve
// "A 8 No'lu" etiketiyle).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", saleability: "Satılabilir" }),
    unit({ titleBlockName: "A", unitNo: "8", saleability: "Alıcısı Az", saleabilityNote: "Yapı denetim sözleşme feshi bulunmaktadır." }),
    unit({ titleBlockName: "A", unitNo: "11", saleability: "Satılabilir" }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "A 8 No'lu Yapı denetim sözleşme feshi bulunmaktadır. Bu sebeple taşınmazın satış kabiliyetinin Alıcısı Az olacağı görüş ve kanaatindeyiz. " +
      "Diğer tüm taşınmazlar yukarıdaki özellikleri sebebiyle tercih edilmektedir. Konumları, ulaşım imkânları ve diğer özellikleri dikkate alındığında SATILABİLİR oldukları kanaatine varılmıştır.",
    "KULLANICI ÖRNEĞİ: özel etiketli (Alıcısı Az) grup ÖNCE, jenerik 'Diğer tüm taşınmazlar' (Satılabilir, hikaye cümlesi öznesi değişmiş) grup SONRA gelmeli."
  );
  console.log("KULLANICI ÖRNEĞİNİN BİREBİR REPRODÜKSİYONU (1 Alıcısı Az + 2 Satılabilir, 'Diğer' sona) testi tamam.");
}

// --- 6) "1'e-1 basit fark"ın TERSİ: sole=Satılabilir (özel etiket, ------
// tekil hikaye cümlesi), "Diğer"=Satılamaz (2+ üye, not+sonuç cümlesinin
// BAŞINA "Diğer taşınmazların" etiketi eklenir) — sıralama: özel etiketli
// (Satılabilir) ÖNCE, "Diğer" (Satılamaz) SONRA.
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
    unit({ unitNo: "11", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.equal(
    result,
    "5 No'lu taşınmaz yukarıdaki özellikleri sebebiyle tercih edilmektedir. Konumu, ulaşım imkânları ve diğer özellikleri dikkate alındığında SATILABİLİR olduğu kanaatine varılmıştır. " +
      "Diğer taşınmazların Bölgedeki talep çok düşüktür. Bu sebeple taşınmazların satış kabiliyetlerinin Satılamaz olacağı görüş ve kanaatindeyiz.",
    "Sole=Satılabilir (özel etiket, tekil hikaye) ÖNCE, 'Diğer'=Satılamaz (2+ üye, çoğul not+sonuç) SONRA gelmeli."
  );
  console.log("'1e-1 basit fark'in tersi (sole=Satilabilir, Diger=Satilamaz) testi tamam.");
}

// --- 7) 3+ grup (fallback): HİÇBİRİ 'Diğer' almaz, HER grup KENDİ -------
// etiketleriyle anılır (hiçbiri generic olmadığından sıralama title-unit
// index sırasını korur).
{
  const context = makeContext({ selectVariantIndex: 0 });
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılabilir" }),
    unit({ unitNo: "8", saleability: "Alıcısı Az", saleabilityNote: "Bölgede benzer emsal azdır." }),
    unit({ unitNo: "11", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.ok(!/\bDiğer\b/.test(result), "3+ grupta HİÇBİR grup jenerik 'Diğer' almamalı.");
  assert.ok(result.includes("5 No'lu taşınmaz yukarıdaki özellikleri sebebiyle tercih edilmektedir."), "Satılabilir grubu kendi 'hikaye' cümlesiyle (özneli) yer almalı.");
  assert.ok(result.includes("8 No'lu Bölgede benzer emsal azdır. Bu sebeple taşınmazın satış kabiliyetinin Alıcısı Az olacağı görüş ve kanaatindeyiz."), "Alıcısı Az grubu kendi etiketi+notuyla (cümle içi 'taşınmazın' değişmeden) yer almalı.");
  assert.ok(result.includes("11 No'lu Bölgedeki talep çok düşüktür. Bu sebeple taşınmazın satış kabiliyetinin Satılamaz olacağı görüş ve kanaatindeyiz."), "Satılamaz grubu kendi etiketi+notuyla yer almalı.");
  console.log("3+ grup (fallback, hiçbiri Diğer almaz) testi tamam.");
}

// --- 8) AYNI saleability, FARKLI not -> AYRI gruplara düşer -------------
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", saleability: "Satılamaz", saleabilityNote: "Bölgedeki talep çok düşüktür." }),
    unit({ unitNo: "8", saleability: "Satılamaz", saleabilityNote: "İmar durumu belirsizdir." }),
  ]);
  const result = context.buildValuationSaleabilityExplanationForAllTitleUnits();
  assert.ok(result.includes("5 No'lu Bölgedeki talep çok düşüktür. Bu sebeple taşınmazın satış kabiliyetinin Satılamaz olacağı"), "Farklı notlu 5 No'lu KENDİ ayrı cümlesinde kalmalı.");
  assert.ok(result.includes("8 No'lu İmar durumu belirsizdir. Bu sebeple taşınmazın satış kabiliyetinin Satılamaz olacağı"), "Farklı notlu 8 No'lu KENDİ ayrı cümlesinde kalmalı.");
  console.log("Aynı saleability, farklı not -> ayrı gruplara düşme testi tamam.");
}

console.log("Degerleme satis kabiliyeti coklu tasinmaz testleri basarili.");
