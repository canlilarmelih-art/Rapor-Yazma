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

// --- 3) renderSection() "building" dalı - GERÇEK DAVRANIŞ testi -----------
// Kullanıcı takip talebi (2026-09-17): "yapi ekle en üstte olmalı hatta
// yapi ekle altındaki bütün alanlar ilk başta gizli olmalı yapi ekle
// butonuna basıldığında gizlenen hücreler açılmalı." Bu, kaynak-düzeyi bir
// regex'le değil, snippet'in GERÇEKTEN çalıştırılmasıyla doğrulanır (DOM
// stub + gerçek isMustakilBinaOwnershipType()).
function extractBuildingBranchSrc() {
  const buildingStart = appSource.indexOf('if (section.id === "building") {');
  assert(buildingStart >= 0, "renderSection() 'building' dalı bulunamadı.");
  const unitStart = appSource.indexOf('\n  if (section.id === "unit") {', buildingStart);
  assert(unitStart > buildingStart, "'building' dalının sonu ('unit' dalı) bulunamadı.");
  return appSource.slice(buildingStart, unitStart);
}

function makeStub(tag, marker) {
  return { tagName: tag, _marker: marker, hidden: false, className: "", children: [], append(...nodes) { this.children.push(...nodes); } };
}

function runBuildingBranch({ ownershipType, buildings, sectionFields = [{ key: "x" }] }) {
  const bodyEl = makeStub("DIV", "body");
  const context = {
    state: { fields: { ownershipType }, tables: { buildings } },
    section: { id: "building", fields: sectionFields },
    body: bodyEl,
    document: { createElement: (tag) => makeStub(tag, "wrapper") },
    createForm: () => makeStub("DIV", "form"),
    createBuildingFloorDistribution: () => makeStub("DIV", "floorDistribution"),
    createUnitFeaturesEditor: () => makeStub("DIV", "unitFeatures"),
    createBuildingStructuresEditor: () => makeStub("DIV", "structuresEditor"),
  };
  vm.createContext(context);
  vm.runInContext(sliceFn("function foldTurkish("), context);
  vm.runInContext(sliceFn("function normalizeOwnershipTypeForSectionVisibility("), context);
  vm.runInContext(sliceFn("function isMustakilBinaOwnershipType("), context);
  vm.runInContext(extractBuildingBranchSrc(), context);
  return bodyEl;
}

// 3a) Müstakil Bina + HENÜZ yapı eklenmemiş -> detay sarmalayıcı GİZLİ,
//     "Yapılar" (structuresEditor) EN ÜSTTE.
{
  const body = runBuildingBranch({ ownershipType: "Müstakil Bina", buildings: [] });
  assert.equal(body.children.length, 2, "Müstakil Bina'da 'building' gövdesine tam olarak 2 üst-düzey eleman eklenmeli (Yapılar + detay sarmalayıcı).");
  const [first, wrapper] = body.children;
  assert.equal(first._marker, "structuresEditor", "'Yapılar' (createBuildingStructuresEditor) EN ÜSTTE olmalı.");
  assert.equal(wrapper.hidden, true, "Henüz yapı eklenmemişken detay sarmalayıcı GİZLİ olmalı.");
  assert.deepEqual(wrapper.children.map((c) => c._marker), ["form", "floorDistribution", "unitFeatures"], "Detay sarmalayıcının içeriği (form + kat dağılımı + bağımsız bölüm alanları) eksik/yanlış sırada.");
}

// 3b) Müstakil Bina + state.tables.buildings undefined (hiç dokunulmamış) ->
//     AYNI şekilde gizli davranmalı (regresyon: Array.isArray kontrolü).
{
  const body = runBuildingBranch({ ownershipType: "Müstakil Bina", buildings: undefined });
  assert.equal(body.children[1].hidden, true, "state.tables.buildings tanımsızken de detay sarmalayıcı GİZLİ olmalı.");
}

// 3c) Müstakil Bina + EN AZ BİR yapı eklenmiş -> detay sarmalayıcı AÇIK.
{
  const body = runBuildingBranch({ ownershipType: "Müstakil Bina", buildings: [{ name: "Ana Bina" }] });
  const [first, wrapper] = body.children;
  assert.equal(first._marker, "structuresEditor", "'Yapılar' yine EN ÜSTTE olmalı.");
  assert.equal(wrapper.hidden, false, "'+ Yapı Ekle' ile en az bir satır eklendiğinde detay sarmalayıcı AÇILMALI.");
}

// 3d) REGRESYON: Müstakil Bina DIŞI mülkiyet türlerinde (ör. Dikey Kat
//     İrtifakı) eski davranış DEĞİŞMEMELİ - alanlar HER ZAMAN görünür,
//     "Yapılar" EN ALTTA kalır, createUnitFeaturesEditor() ÇAĞRILMAZ
//     ("unit" sekmesi zaten ayrı ve görünür kalmaya devam ediyor).
{
  const body = runBuildingBranch({ ownershipType: "Dikey Kat İrtifakı", buildings: [] });
  assert.equal(body.children.length, 2, "Müstakil Bina DIŞINDA da 2 üst-düzey eleman olmalı (sarmalayıcı + Yapılar), sadece SIRA ters.");
  const [wrapper, last] = body.children;
  assert.equal(wrapper._marker, "wrapper", "Müstakil Bina DIŞINDA detay sarmalayıcı EN ÜSTTE (eski davranış) olmalı.");
  assert.equal(wrapper.hidden, false, "Müstakil Bina DIŞINDA detay sarmalayıcı HİÇBİR ZAMAN gizlenmemeli.");
  assert.equal(last._marker, "structuresEditor", "Müstakil Bina DIŞINDA 'Yapılar' EN ALTTA kalmalı (eski davranış, REGRESYON).");
  assert.deepEqual(wrapper.children.map((c) => c._marker), ["form", "floorDistribution"], "Müstakil Bina DIŞINDA createUnitFeaturesEditor() ÇAĞRILMAMALI (REGRESYON — 'unit' sekmesi zaten ayrı).");
}

console.log("renderSection() 'building' dalı: Yapılar en üstte + gizle/aç GERÇEK DAVRANIŞ testleri tamam.");

assert.match(
  appSource,
  /if \(section\.id === "unit"\) \{\s*\n\s*body\.append\(createUnitFeaturesEditor\(\)\);\s*\n\s*\}/,
  "renderSection() 'unit' dalı (Müstakil Bina DIŞI raporlar için hâlâ gerekli) bozulmuş/kaldırılmış."
);
console.log("renderSection() 'unit' dalı regresyon testi tamam.");

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

// --- 5) Müstakil Bina'da yinelenen bağımsız bölüm panelleri gizli ---------
// Kullanıcı talebi (2026-09-18): Bina Özellikleri içine taşınan eski
// bağımsız-bölüm akışında Ana Gayrimenkul Açıklaması, Bağımsız Bölüm Genel
// Bilgileri, Katlar/Alanlar/İç Hacimler ve Bağımsız Bölüm İç Hacimler
// Açıklaması görünmemeli; Dekoratif Özellikler görünmeye devam etmeli.
{
  const context = {
    state: { fields: { mainPropertyDescription: "" } },
    buildMainPropertyDescription: () => "üretilen açıklama",
    refreshMainPropertyFloorCountTextFromCounts: () => {},
    isMustakilBinaOwnershipType: () => true,
    canViewSensitiveContent: () => true,
    document: {
      createDocumentFragment: () => ({ _marker: "fragment" }),
      createElement: () => { throw new Error("Müstakil Bina'da açıklama paneli DOM'a hiç oluşturulmamalı."); },
    },
  };
  vm.createContext(context);
  vm.runInContext(sliceFn("function createMainPropertyDescriptionPanel("), context);
  const result = context.createMainPropertyDescriptionPanel();
  assert.equal(result._marker, "fragment", "Müstakil Bina'da Ana Gayrimenkul Açıklaması gizlenmeli.");
  assert.equal(
    context.state.fields.mainPropertyDescription,
    "üretilen açıklama",
    "Panel gizlenirken rapor açıklaması state hesabı korunmalı."
  );
}

function runUnitFeaturesEditorForVisibility(isMustakil) {
  const calls = [];
  const wrapper = { children: [], append(...nodes) { this.children.push(...nodes); } };
  const marker = (name) => ({ _marker: name });
  const context = {
    document: { createElement: () => wrapper },
    isMustakilBinaOwnershipType: () => isMustakil,
    createUnitGeneralPanel: () => { calls.push("general"); return marker("general"); },
    createUnitAreaInteriorPanel: () => { calls.push("areaInterior"); return marker("areaInterior"); },
    shouldHideUnitDecorativePanel: () => false,
    createUnitDecorativePanel: () => { calls.push("decorative"); return marker("decorative"); },
    canViewSensitiveContent: () => true,
    createUnitInteriorDescriptionField: () => { calls.push("description"); return marker("description"); },
    updateUnitInteriorDescription: () => { calls.push("descriptionStateUpdate"); },
  };
  vm.createContext(context);
  vm.runInContext(sliceFn("function createUnitFeaturesEditor("), context);
  const result = context.createUnitFeaturesEditor();
  return { calls, children: result.children.map((item) => item._marker) };
}

{
  const mustakil = runUnitFeaturesEditorForVisibility(true);
  assert.deepEqual(
    mustakil.children,
    ["decorative"],
    "Müstakil Bina'da yalnız Dekoratif Özellikler görünmeli; genel bilgiler, kat/alan/iç hacim ve açıklama gizlenmeli."
  );
  assert.deepEqual(
    mustakil.calls,
    ["decorative", "descriptionStateUpdate"],
    "Gizli paneller oluşturulmamalı; açıklama state hesabı görünürlükten bağımsız korunmalı."
  );
}

{
  const regular = runUnitFeaturesEditorForVisibility(false);
  assert.deepEqual(
    regular.children,
    ["general", "areaInterior", "decorative", "description"],
    "Müstakil Bina dışındaki raporlarda mevcut dört panel sırası değişmemeli."
  );
}
console.log("Müstakil Bina dört panel gizleme + Dekoratif Özellikler regresyon testleri tamam.");

// --- 6) Ana Taşınmaz Kat Dağılımı da yalnız Müstakil Bina'da gizli ------
{
  const floorDistributionSource = sliceFn("function createBuildingFloorDistribution(");
  assert.match(
    floorDistributionSource,
    /if \(!isMustakilBinaOwnershipType\(\)\) \{\s*wrapper\.append\(countPanel\);\s*\}/,
    "Ana Taşınmaz Kat Dağılımı paneli yalnız Müstakil Bina'da gizlenecek koşula bağlanmamış."
  );
  assert.match(
    floorDistributionSource,
    /if \(!isMustakilBinaOwnershipType\(\)\) \{\s*wrapper\.append\(createBuildingTechnicalOptionsPanel\(\)\);\s*\}/,
    "Ana Taşınmaz Teknik Bilgileri paneli yalnız Müstakil Bina'da gizlenecek koşula bağlanmamış."
  );
}
console.log("Müstakil Bina ana teknik bilgiler ve kat dağılımı gizleme testleri tamam.");

console.log("Müstakil Bina 'Bina Özellikleri' birleştirme testleri başarılı.");
