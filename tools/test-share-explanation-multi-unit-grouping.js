"use strict";

/*
  Kullanici talebi (2026-09-16): "HİSSELİ TAŞINMAZLAR içinde aynı mantığı
  kullanalım hisseli taşınmazlar için matbu olan cümleyi kuralım. tam
  mülkiyete sahip olanlar için bir cümle kurmaya gerek yok." — 5403 Sayılı
  Kanuna Göre Minimum Parsel Kontrolü işiyle (buildLandMinimumParcelAssessmentMultiUnitSentence,
  0.0.809) AYNI "raporda yer alan tüm taşınmazları tara" ilkesi.

  Kok durum: buildShareExplanation() (Hisse Açıklaması, matbu 3 varyanttan
  biri) ve panel görünürlüğü (isSharedTitleOwnership()) yalnızca AKTİF
  taşınmazın kendi titleOwnershipKind'ına bakıyordu - Coklu Talep
  raporlarinda diger tasinmazlarin hisseli olup olmadigi hic gorulmuyordu.

  Duzeltme: isHisseliTitleOwnershipKindForFields(fields) - cekirdek kontrol
  artik HERHANGI bir tasinmazin fields'iyla calisabiliyor. hasAnyHisseliTitleUnit()
  - panel gorunurlugu artik RAPORDAKI HERHANGI bir tasinmaza bakiyor.
  buildShareExplanationForAllTitleUnits() - (1) hic hisseli tasinmaz yoksa
  "" (tam mulkiyete cumle YOK), (2) TUMU hisseli ise matbu metin
  COGULLANARAK tek metin, (3) KARISIKSA yalnizca hisseli olanlar
  formatTitleUnitParcelLabel ile adlandirilip matbu metnin basina eklenir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

const start = appSource.indexOf("// Varyantlar docs/cumle-envanteri.md Bölüm 2'de belgelendi");
const end = appSource.indexOf("function inferTitleOwnershipKindFromOwnerRows");
assert(start >= 0 && end > start, "Hisse Açıklaması fonksiyonları bulunamadı.");
const source = appSource.slice(start, end);

function evaluate(activeFields, titleUnits) {
  const context = {
    state: { fields: activeFields, titleUnits, activeTitleUnitIndex: 0, primaryTitleUnitShadow: null },
    isMultiTitleUnitReportForNarrative: () => (titleUnits?.length || 0) > 0,
    getNarrativeTitleUnitFields: () => [activeFields, ...(titleUnits || []).map((u) => u.fields)],
    formatTitleUnitParcelLabel: (blockNo, parcelNo, fallbackIndex) => {
      const block = String(blockNo || "").trim();
      const parcel = String(parcelNo || "").trim();
      if (block && parcel) return `${block} Ada ${parcel} Parsel`;
      if (parcel) return `${parcel} Parsel`;
      if (block) return `${block} Ada`;
      return `${fallbackIndex + 1}. taşınmaz`;
    },
    formatTurkishList: (items = []) => {
      const list = items.map((item) => String(item || "").trim()).filter(Boolean);
      if (list.length <= 1) return list[0] || "";
      if (list.length === 2) return `${list[0]} ve ${list[1]}`;
      return `${list.slice(0, -1).join(", ")} ve ${list.at(-1)}`;
    },
    foldTurkish: (value) => String(value || "").toLocaleUpperCase("tr-TR")
      .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
      .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C"),
    selectVariant: () => 0,
    registerVariantGroup: () => {},
    pluralizeEnvironmentalSubjectText: (value, enabled = true) => {
      if (!enabled || !value) return value;
      return String(value)
        .replace(/\bTaşınmazın\b/g, "Taşınmazların").replace(/\bTaşınmaza\b/g, "Taşınmazlara").replace(/\bTaşınmazda\b/g, "Taşınmazlarda")
        .replace(/\btaşınmazın\b/g, "taşınmazların").replace(/\btaşınmaza\b/g, "taşınmazlara").replace(/\btaşınmazda\b/g, "taşınmazlarda")
        .replace(/\bTaşınmaz\b/g, "Taşınmazlar").replace(/\btaşınmaz\b/g, "taşınmazlar")
        .replace(/\bGayrimenkulün\b/g, "Gayrimenkullerin").replace(/\bGayrimenkule\b/g, "Gayrimenkullere")
        .replace(/\bgayrimenkulün\b/g, "gayrimenkullerin").replace(/\bgayrimenkule\b/g, "gayrimenkullere")
        .replace(/\bGayrimenkul\b/g, "Gayrimenkuller").replace(/\bgayrimenkul\b/g, "gayrimenkuller")
        .replace(/\bMülkün\b/g, "Mülklerin").replace(/\bMülke\b/g, "Mülklere")
        .replace(/\bmülkün\b/g, "mülklerin").replace(/\bmülke\b/g, "mülklere")
        .replace(/\bMülk\b/g, "Mülkler").replace(/\bmülk\b/g, "mülkler")
        .replace(/\bTAŞINMAZIN\b/g, "TAŞINMAZLARIN").replace(/\bGAYRİMENKULÜN\b/g, "GAYRİMENKULLERİN");
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  // "vm" ozelligi: top-level const/let baglamin KENDI ozelligi OLMAZ
  // (yalnizca var/function olur) - test-variant-selection.js'teki AYNI
  // teknikle disari acilir.
  vm.runInContext("globalThis.shareExplanationVariants = shareExplanationVariants;", context);
  return context;
}

// --- 1) TEKİL rapor: hisseli -> mevcut matbu metin, DEĞİŞMEDEN. ------------
{
  const ctx = evaluate({ titleOwnershipKind: "Hisseli Mülkiyet" }, []);
  const text = ctx.buildShareExplanationForAllTitleUnits();
  assert.equal(text, ctx.shareExplanationVariants[0], `REGRESYON: tekil raporda eski matbu metin AYNEN korunmalı, bulunan: ${text}`);
  assert.equal(ctx.hasAnyHisseliTitleUnit(), true, "sanity: tekil hisseli raporda panel görünmeli.");
  console.log("Tekil rapor: hisseli -> matbu metin (REGRESYON) testi tamam.");
}

// --- 2) TEKİL rapor: tam mülkiyet -> boş (cümle YOK). -----------------------
{
  const ctx = evaluate({ titleOwnershipKind: "Tam Mülkiyet" }, []);
  assert.equal(ctx.buildShareExplanationForAllTitleUnits(), "", "REGRESYON: tekil tam mülkiyet raporunda cümle olmamalı.");
  assert.equal(ctx.hasAnyHisseliTitleUnit(), false, "sanity: tekil tam mülkiyet raporunda panel gizlenmeli.");
  console.log("Tekil rapor: tam mülkiyet -> boş (REGRESYON) testi tamam.");
}

// --- 3) KULLANICI TALEBİ: Çoklu Talep + TÜM taşınmazlar hisseli -> --------
// TEK (çoğullanmış) matbu metin, taşınmaz-bazlı listeye GEREK YOK.
{
  const active = { titleOwnershipKind: "Hisseli Mülkiyet" };
  const unit2 = { fields: { titleOwnershipKind: "Hisseli Mülkiyet" } };
  const ctx = evaluate(active, [unit2]);
  assert.equal(ctx.hasAnyHisseliTitleUnit(), true, "sanity: panel görünmeli.");
  const text = ctx.buildShareExplanationForAllTitleUnits();
  assert.equal(
    text,
    "Değerleme konusu taşınmazlar hisseli olup, TAŞINMAZLARIN TÜM HİSSELERİNİN (AÇIKTA HİSSE KALMAYACAK ŞEKİLDE) İPOTEK ALTINA ALINMASI ŞARTIYLA uzman kanaati SATILABİLİR olarak takdir edilmiştir.",
    `KULLANICI TALEBİ: tüm taşınmazlar hisseliyken ÇOĞUL matbu metin (taşınmaz listesi OLMADAN) üretilmeli, bulunan: ${text}`,
  );
  console.log("KULLANICI TALEBİ: tüm taşınmazlar hisseli -> ÇOĞUL tek metin testi tamam.");
}

// --- 4) KULLANICI TALEBİ: Çoklu Talep + KARIŞIK (bazıları hisseli, ---------
// bazıları tam mülkiyet) -> yalnızca hisseli olanlar adlandırılır.
{
  const active = { titleOwnershipKind: "Hisseli Mülkiyet", blockNo: "0", parcelNo: "56" };
  const unit2 = { fields: { titleOwnershipKind: "Tam Mülkiyet", blockNo: "0", parcelNo: "215" } };
  const unit3 = { fields: { titleOwnershipKind: "Hisseli Mülkiyet", blockNo: "1", parcelNo: "10" } };
  const ctx = evaluate(active, [unit2, unit3]);
  assert.equal(ctx.hasAnyHisseliTitleUnit(), true, "sanity: en az bir hisseli varken panel görünmeli.");
  const text = ctx.buildShareExplanationForAllTitleUnits();
  assert.equal(
    text,
    "0 Ada 56 Parsel ve 1 Ada 10 Parsel hisseli olup, TAŞINMAZLARIN TÜM HİSSELERİNİN (AÇIKTA HİSSE KALMAYACAK ŞEKİLDE) İPOTEK ALTINA ALINMASI ŞARTIYLA uzman kanaati SATILABİLİR olarak takdir edilmiştir.",
    `KULLANICI TALEBİ: karışık durumda yalnızca hisseli taşınmazlar ada/parsel etiketiyle adlandırılmalı (tam mülkiyet OLAN ADI GEÇMEMELİ), bulunan: ${text}`,
  );
  assert.ok(!text.includes("215 Parsel"), `Tam mülkiyet taşınmazın (215 Parsel) adı HİÇ geçmemeli, bulunan: ${text}`);
  console.log("KULLANICI TALEBİ: karışık durumda yalnızca hisseli taşınmazlar adlandırılıyor testi tamam.");
}

// --- 5) KARIŞIK durumda TEK hisseli taşınmaz varsa çoğullama YAPILMAMALI --
// (yalnızca o tek taşınmaz adlandırılır, metin tekil kalır).
{
  const active = { titleOwnershipKind: "Hisseli Mülkiyet", blockNo: "0", parcelNo: "56" };
  const unit2 = { fields: { titleOwnershipKind: "Tam Mülkiyet", blockNo: "0", parcelNo: "215" } };
  const ctx = evaluate(active, [unit2]);
  const text = ctx.buildShareExplanationForAllTitleUnits();
  assert.equal(
    text,
    "0 Ada 56 Parsel hisseli olup, TAŞINMAZIN TÜM HİSSELERİNİN (AÇIKTA HİSSE KALMAYACAK ŞEKİLDE) İPOTEK ALTINA ALINMASI ŞARTIYLA uzman kanaati SATILABİLİR olarak takdir edilmiştir.",
    `Karışık durumda TEK hisseli taşınmaz varken metin TEKİL kalmalı (yalnızca adlandırma eklenir), bulunan: ${text}`,
  );
  console.log("Karışık durumda tek hisseli taşınmaz -> tekil metin + adlandırma testi tamam.");
}

// --- 6) REGRESYON: Çoklu Talep + TÜM taşınmazlar Tam Mülkiyet -> boş -------
// (kullanıcı talebi: "tam mülkiyete sahip olanlar için bir cümle kurmaya
// gerek yok").
{
  const active = { titleOwnershipKind: "Tam Mülkiyet" };
  const unit2 = { fields: { titleOwnershipKind: "Tam Mülkiyet" } };
  const ctx = evaluate(active, [unit2]);
  assert.equal(ctx.hasAnyHisseliTitleUnit(), false, "sanity: hiç hisseli yokken panel gizlenmeli.");
  assert.equal(ctx.buildShareExplanationForAllTitleUnits(), "", "KULLANICI TALEBİ: tüm taşınmazlar tam mülkiyetken cümle KURULMAMALI.");
  console.log("REGRESYON: tüm taşınmazlar tam mülkiyet -> boş testi tamam.");
}

// --- 7) Diğer 2 varyant da (gayrimenkul.../mülk...) doğru çoğullanmalı. ----
{
  const active = { titleOwnershipKind: "Hisseli Mülkiyet" };
  const unit2 = { fields: { titleOwnershipKind: "Hisseli Mülkiyet" } };

  const ctxV1 = evaluate(active, [unit2]);
  ctxV1.selectVariant = () => 1;
  const textV1 = ctxV1.buildShareExplanationForAllTitleUnits();
  assert.equal(
    textV1,
    "Değerlemeye konu gayrimenkuller hisseli mülkiyete tabi olup, GAYRİMENKULLERİN TÜM HİSSELERİNİN (AÇIKTA HİSSE BIRAKILMAKSIZIN) İPOTEK ALTINA ALINMASI KOŞULUYLA uzman kanaatimizce SATILABİLİR nitelikte olduğu değerlendirilmiştir.",
    `2. varyant (gayrimenkul...) da çoğullanmalı, bulunan: ${textV1}`,
  );

  const ctxV2 = evaluate(active, [unit2]);
  ctxV2.selectVariant = () => 2;
  const textV2 = ctxV2.buildShareExplanationForAllTitleUnits();
  assert.equal(
    textV2,
    "Söz konusu mülkler hisseli tapu kaydına sahip olup, TÜM HİSSELERİN (AÇIKTA HİSSE KALMAKSIZIN) İPOTEK KAPSAMINA ALINMASI ŞARTIYLA taşınmazların SATILABİLİR olduğu kanaatine varılmıştır.",
    `3. varyant (mülk...) da çoğullanmalı, bulunan: ${textV2}`,
  );
  console.log("Diğer 2 varyantın (gayrimenkul.../mülk...) çoğullanması testi tamam.");
}

console.log("Hisse Açıklaması çoklu taşınmaz gruplama testleri başarılı.");
