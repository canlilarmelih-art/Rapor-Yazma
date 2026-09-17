"use strict";

/*
  Kullanici bildirimi (2026-09-17): "bina özellikleri bölümü yok ana
  başlıklarda bu kısımı eklememiş miydik" — "Bina Özellikleri" adı o ana
  kadar SADECE Müstakil Bina banka şablonu ÇIKTISINDA (0.0.812/0.0.813)
  kullanılmıştı, sol panelde (ana başlıklar/sidebar) hiç yoktu; orada hâlâ
  İKİ AYRI sekme vardı: "Ana Gayrimenkul Özellikleri" ve "Bağımsız Bölüm
  Özellikleri". AskUserQuestion ile netleştirildi: "Ana Gayrimenkul
  Özellikleri"ni yeniden adlandır (Müstakil Bina'da "Bina Özellikleri"
  olsun) VE "Bağımsız Bölüm Özellikleri" sekmesini gizle — AMA içindeki
  ~20+ alan (Oda/Salon/Mutfak/Banyo/WC/Balkon sayıları, Yapı Kalitesi,
  Isınma Sistemi, Asansör, İç Kapı, Pencere, iç mekan açıklama metinleri)
  KAYBOLMASIN, "Bina Özellikleri"nin İÇİNE taşınsın (ikinci netleştirme
  sorusuyla onaylandı).

  Bu test:
  1) getSectionDisplayTitle() gerçek kaynaktan — yalnızca "building"
     bölümü + Müstakil Bina'da "Bina Özellikleri" döner, diğer tüm
     durumlarda section.title değişmeden döner.
  2) shouldHideSectionForOwnership() gerçek kaynaktan — "unit" SADECE
     Müstakil Bina'da gizlenir; Arsa/Tarla'da "building"+"unit" (REGRESYON,
     davranış DEĞİŞMEMELİ), Kat İrtifakı'nda "land" (REGRESYON) hâlâ
     doğru çalışır.
  3) renderSection()'ın "building" dalının kaynak-düzeyinde
     createUnitFeaturesEditor()'ü SADECE Müstakil Bina'da (isMustakilBinaOwnershipType())
     çağırdığı, "unit" dalının (normal, Müstakil Bina DIŞI raporlar için)
     DEĞİŞMEDEN kaldığı.
  4) createNav()'ın (sidebar + mobil alt nav) section.title yerine
     getSectionDisplayTitle(section) kullandığı.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

function makeContext(ownershipType) {
  const context = { state: { fields: { ownershipType } } };
  vm.createContext(context);
  vm.runInContext(sliceFn("function foldTurkish("), context);
  vm.runInContext(sliceFn("function normalizeOwnershipTypeForSectionVisibility("), context);
  vm.runInContext(sliceFn("function isMustakilBinaOwnershipType("), context);
  vm.runInContext(sliceFn("function shouldHideSectionForOwnership("), context);
  vm.runInContext(sliceFn("function getSectionDisplayTitle("), context);
  return context;
}

// --- 1) getSectionDisplayTitle() ------------------------------------------
{
  const context = makeContext("Müstakil Bina");
  assert.equal(
    context.getSectionDisplayTitle({ id: "building", title: "Ana Gayrimenkul Özellikleri" }),
    "Bina Özellikleri",
    "Müstakil Bina'da 'building' bölümü 'Bina Özellikleri' olarak gösterilmeli."
  );
  assert.equal(
    context.getSectionDisplayTitle({ id: "unit", title: "Bağımsız Bölüm Özellikleri" }),
    "Bağımsız Bölüm Özellikleri",
    "'unit' bölümünün adı ETKİLENMEMELİ (zaten gizli, ama başka bir yerden çağrılırsa bile adı değişmemeli)."
  );
  assert.equal(
    context.getSectionDisplayTitle({ id: "land", title: "Arsa Özellikleri" }),
    "Arsa Özellikleri",
    "'land' bölümünün adı ETKİLENMEMELİ."
  );
}
["Dikey Kat İrtifakı", "Yatay Kat İrtifakı", "Arsa", "Tarla", ""].forEach((ownershipType) => {
  const context = makeContext(ownershipType);
  assert.equal(
    context.getSectionDisplayTitle({ id: "building", title: "Ana Gayrimenkul Özellikleri" }),
    "Ana Gayrimenkul Özellikleri",
    `"${ownershipType || "(boş)"}" mülkiyetinde 'building' bölümünün adı DEĞİŞMEMELİ (REGRESYON).`
  );
});
console.log("getSectionDisplayTitle() gerçek-kaynak testleri tamam.");

// --- 2) shouldHideSectionForOwnership() ------------------------------------
{
  const context = makeContext("Müstakil Bina");
  assert.equal(context.shouldHideSectionForOwnership("unit"), true, "Müstakil Bina'da 'unit' bölümü gizlenmeli.");
  assert.equal(context.shouldHideSectionForOwnership("building"), false, "Müstakil Bina'da 'building' bölümü GİZLENMEMELİ (yeniden adlandırılıp kullanılmaya devam ediyor).");
  assert.equal(context.shouldHideSectionForOwnership("land"), false, "Müstakil Bina'da 'land' bölümü zaten görünür kalmalı (REGRESYON, 0.0.813).");
}
// REGRESYON: Arsa/Tarla ve Kat İrtifakı davranışı DEĞİŞMEMELİ.
[
  ["Arsa", "building", true], ["Arsa", "unit", true], ["Arsa", "land", false],
  ["Tarla", "building", true], ["Tarla", "unit", true], ["Tarla", "land", false],
  ["Dikey Kat İrtifakı", "land", true], ["Dikey Kat İrtifakı", "building", false], ["Dikey Kat İrtifakı", "unit", false],
  ["Yatay Kat İrtifakı", "land", true], ["Yatay Kat İrtifakı", "building", false], ["Yatay Kat İrtifakı", "unit", false],
  ["", "building", false], ["", "unit", false], ["", "land", false],
].forEach(([ownershipType, sectionId, expected]) => {
  const context = makeContext(ownershipType);
  assert.equal(
    context.shouldHideSectionForOwnership(sectionId),
    expected,
    `REGRESYON: "${ownershipType || "(boş)"}" mülkiyetinde "${sectionId}" için beklenen gizleme durumu ${expected}, farklı çıktı.`
  );
});
console.log("shouldHideSectionForOwnership() REGRESYON + Müstakil Bina 'unit' gizleme testleri tamam.");

// --- 3) renderSection() "building" dalı kaynak-düzeyi kablolaması ----------
assert.match(
  appSource,
  /if \(section\.id === "building"\) \{\s*\n\s*body\.append\(createBuildingFloorDistribution\(\)\);[\s\S]{0,600}?if \(isMustakilBinaOwnershipType\(\)\) \{\s*\n\s*body\.append\(createUnitFeaturesEditor\(\)\);\s*\n\s*\}\s*\n\s*body\.append\(createBuildingStructuresEditor\(\)\);\s*\n\s*\}/,
  "renderSection() 'building' dalı artık Müstakil Bina'da createUnitFeaturesEditor()'ü çağırmıyor (veya sıra/yapı bozulmuş)."
);
assert.match(
  appSource,
  /if \(section\.id === "unit"\) \{\s*\n\s*body\.append\(createUnitFeaturesEditor\(\)\);\s*\n\s*\}/,
  "renderSection() 'unit' dalı (Müstakil Bina DIŞI raporlar için hâlâ gerekli) bozulmuş/kaldırılmış."
);
console.log("renderSection() 'building' dalı Müstakil Bina birleştirme kablolaması testi tamam.");

// --- 4) createNav() getSectionDisplayTitle() kullanıyor mu ------------------
assert.match(
  appSource,
  /<span class="nav-title">\$\{formatUiHeading\(getSectionDisplayTitle\(section\)\)\}<\/span>/,
  "createNav() sidebar başlığı artık getSectionDisplayTitle() kullanmıyor (sol panelde 'Bina Özellikleri' görünmez)."
);
assert.match(
  appSource,
  /<span class="bottom-nav-title">\$\{formatMobileNavTitle\(getSectionDisplayTitle\(section\)\)\}<\/span>/,
  "createNav() mobil alt nav başlığı artık getSectionDisplayTitle() kullanmıyor."
);
console.log("createNav() getSectionDisplayTitle() kablolama testi tamam.");

console.log("Müstakil Bina 'Bina Özellikleri' birleştirme testleri başarılı.");
