"use strict";

/*
  Kullanici talebi (2026-09-17): "bina özellikleri bölümüne yapı ekle
  butonu koyalım" — bir parselde birden fazla bina bulunan taşınmazlar
  (fabrika örneği: ana üretim binası, depo, idari bina, bekçi kulübesi vb.)
  için "Ana Gayrimenkul Özellikleri" (building) bölümüne serbestçe
  çoğaltılabilen bir "Yapılar" listesi eklendi (createBuildingStructuresEditor,
  state.tables.buildings).

  Bu test dört katmani dogrular:
  1) createBuildingStructuresEditor() gercek app.js kaynagindan izole
     calistirilir; minimal DOM stub (createBuildingFloorRowsTable'in kendi
     testindeki AYNI teknik, tools/test-building-floor-common-lowercase.js)
     ile bos/dolu liste render'i, hucre duzenleme, satir ekleme/silme
     davranislari dogrulanir.
  2) renderSection() kaynak-duzeyinde "building" bolumune
     createBuildingStructuresEditor() cagrisinin eklendigi.
  3) "buildings" tablosunun TITLE_UNIT_SCOPED_TABLE_KEYS_BASE'e eklendigi
     (coklu tasinmaz sekmeleri arasinda veri sizmamasi icin) - hem
     kaynak-duzeyinde hem GERCEK getTitleUnitScopedTableKeys() ile.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const buildingStructureFieldDefsSrc = sliceFn("const BUILDING_STRUCTURE_FIELD_DEFS = [", { toMarker: "\n];" }) + "\n];";
const createBuildingStructuresEditorSrc = sliceFn("function createBuildingStructuresEditor(");

// --- Minimal DOM stub (test-building-floor-common-lowercase.js ile AYNI ----
//     teknik) ---------------------------------------------------------------
function makeElementStub(tag) {
  const el = {
    tagName: String(tag || "").toUpperCase(),
    className: "",
    textContent: "",
    innerHTML: "",
    value: "",
    type: "",
    rows: 0,
    children: [],
    _listeners: {},
    append(...nodes) {
      el.children.push(...nodes);
    },
    addEventListener(type, handler) {
      el._listeners[type] = handler;
    },
    fire(type, event = {}) {
      el._listeners[type]?.(event);
    },
    setAttribute() {},
  };
  return el;
}

function findAllStubs(node, tag, acc = []) {
  if (!node) return acc;
  if (node.tagName === tag) acc.push(node);
  (node.children || []).forEach((child) => findAllStubs(child, tag, acc));
  return acc;
}

function runEditorScenario(rows) {
  const context = {
    state: { tables: rows === undefined ? {} : { buildings: rows } },
    document: { createElement: (tag) => makeElementStub(tag) },
    autosave: () => {
      context.autosaveCalls = (context.autosaveCalls || 0) + 1;
    },
    renderSection: () => {
      context.renderSectionCalls = (context.renderSectionCalls || 0) + 1;
    },
  };
  vm.createContext(context);
  vm.runInContext(buildingStructureFieldDefsSrc, context);
  vm.runInContext(createBuildingStructuresEditorSrc, context);
  const panel = context.createBuildingStructuresEditor();
  return { panel, context };
}

// --- 1) Bos liste: yardimci mesaj gosterilir, state.tables.buildings [] ----
//        olarak baslatilir, "+ Yapı Ekle" butonu VAR.
{
  const { panel, context } = runEditorScenario(undefined);
  // Not: state.tables.buildings [] fonksiyonun VM baglaminda olusturuldugu
  // icin (cross-realm) assert.deepEqual([], []) yaniltici sekilde basarisiz
  // olabilir — Array.isArray + uzunluk kontrolu realm-bagimsiz calisir.
  assert(Array.isArray(context.state.tables.buildings), "Bos durumda state.tables.buildings bir dizi olarak baslatilmadi.");
  assert.equal(context.state.tables.buildings.length, 0, "Bos durumda state.tables.buildings bos olmali.");
  const [table] = findAllStubs(panel, "TABLE");
  assert.equal(table, undefined, "Bos listede tablo render edilmemeli.");
  const emptyMessage = panel.children.find((child) => child.className === "table-shell");
  assert(emptyMessage, "Bos durumda 'table-shell' konteyner bulunamadi.");
  const addButton = panel.children[panel.children.length - 1];
  assert.equal(addButton.textContent, "+ Yapı Ekle", "'+ Yapı Ekle' butonu bulunamadi veya metni yanlis.");
}

// --- 2) "+ Yapı Ekle" tiklaninca yeni bos satir eklenir, autosave + --------
//        renderSection cagrilir.
{
  const { panel, context } = runEditorScenario([]);
  const addButton = panel.children[panel.children.length - 1];
  addButton.fire("click");
  assert.equal(context.state.tables.buildings.length, 1, "Yapi Ekle tiklaninca yeni satir eklenmedi.");
  assert.equal(Object.keys(context.state.tables.buildings[0]).length, 0, "Yeni satir bos bir nesne olmali.");
  assert.equal(context.autosaveCalls, 1, "Yapi Ekle sonrasi autosave() cagrilmadi.");
  assert.equal(context.renderSectionCalls, 1, "Yapi Ekle sonrasi renderSection() cagrilmadi.");
}

// --- 3) Dolu liste: tablo basliklari 7 alan + islem sutunu, hucreler ------
//        mevcut deerlerle onceden doldurulmus olmali.
{
  const rows = [{ name: "Ana Bina", buildingType: "Betonarme", floorCount: "3", constructionYear: "2015", area: "1200", materialQuality: "İyi", note: "Üretim binası" }];
  const { panel } = runEditorScenario(rows);
  // Not: gercek fonksiyon thead.innerHTML'i tek bir sablon dizesi olarak
  // yazar (createBuildingFloorRowsTable'daki AYNI desen) — bu hafif DOM
  // stub'u innerHTML'i alt eleman agacina ayristirmaz, bu yuzden ham dize
  // icerigi dogrudan kontrol edilir.
  const [thead] = findAllStubs(panel, "THEAD");
  ["Yapı Adı", "Yapı Cinsi", "Kat Sayısı", "İnşaat Yılı", "Toplam İnşaat Alanı (m²)", "Yapı Kalitesi", "Açıklama"].forEach((label) => {
    assert(thead.innerHTML.includes(`<th>${label}</th>`), `Tablo basliginda "${label}" bulunamadi.`);
  });
  const [tbody] = findAllStubs(panel, "TBODY");
  const [firstRow] = tbody.children;
  const cellValues = firstRow.children.slice(0, 7).map((td) => td.children[0].value);
  assert.deepEqual(
    cellValues,
    ["Ana Bina", "Betonarme", "3", "2015", "1200", "İyi", "Üretim binası"],
    "Mevcut satir degerleri hucrelere dogru yansitilmadi."
  );
}

// --- 4) Hucreye yazmak (input olayi) alttaki satir nesnesini gunceller, ---
//        autosave cagrilir, renderSection GEREKMEZ (tek hucre duzenlemede
//        tum tablo yeniden cizilmemeli).
{
  const rows = [{ name: "Ana Bina" }];
  const { panel, context } = runEditorScenario(rows);
  const [tbody] = findAllStubs(panel, "TBODY");
  const [firstRow] = tbody.children;
  const nameInput = firstRow.children[0].children[0];
  nameInput.value = "Depo Binası";
  nameInput.fire("input");
  assert.equal(context.state.tables.buildings[0].name, "Depo Binası", "Hucre girdisi satir nesnesine yazilmadi.");
  assert.equal(context.autosaveCalls, 1, "Hucre girdisi sonrasi autosave() cagrilmadi.");
  assert.equal(context.renderSectionCalls || 0, 0, "Tek hucre duzenlemesi gereksiz yere renderSection() tetikledi.");
}

// --- 5) Satir silme butonu satiri kaldirir, autosave + renderSection ------
//        cagrilir.
{
  const rows = [{ name: "Ana Bina" }, { name: "Depo" }];
  const { panel, context } = runEditorScenario(rows);
  const [tbody] = findAllStubs(panel, "TBODY");
  const secondRow = tbody.children[1];
  const deleteButton = secondRow.children[secondRow.children.length - 1].children[0];
  assert.equal(deleteButton.textContent, "×", "Silme butonu bulunamadi.");
  deleteButton.fire("click");
  assert.equal(context.state.tables.buildings.length, 1, "Silme sonrasi satir sayisi azalmadi.");
  assert.equal(context.state.tables.buildings[0].name, "Ana Bina", "Yanlis satir silindi.");
  assert.equal(context.autosaveCalls, 1, "Silme sonrasi autosave() cagrilmadi.");
  assert.equal(context.renderSectionCalls, 1, "Silme sonrasi renderSection() cagrilmadi.");
}

console.log("createBuildingStructuresEditor() (Yapı Ekle) davranış testleri tamam.");

// --- 6) renderSection() kaynak-duzeyinde "building" bolumune -------------
//        createBuildingStructuresEditor() cagrisi eklendi mi?
// Not: tam dal sekli (Musttakil Bina'da createUnitFeaturesEditor() birlesimi
// + "Yapı Ekle" en-uste/gizle-ac duzeni dahil) tools/test-mustakil-bina-section-merge.js'te
// dogrulanir - burada yalnizca UC cagrinin "building" dalinin (2026-09-17'de
// buyuk olcude genisleyen) govdesi ICINDE, dogru SIRADA (Kat Dagilimi ->
// Yapilar) gectigi (kesin bitisiklik ARANMADAN) kontrol edilir.
{
  const buildingBranchStart = appSource.indexOf('if (section.id === "building") {');
  assert(buildingBranchStart >= 0, "renderSection() 'building' dali bulunamadi.");
  const buildingBranchEnd = appSource.indexOf('\n  if (section.id === "unit") {', buildingBranchStart);
  assert(buildingBranchEnd > buildingBranchStart, "'building' dalinin sonu ('unit' dali) bulunamadi.");
  const buildingBranchSrc = appSource.slice(buildingBranchStart, buildingBranchEnd);
  const floorDistIndex = buildingBranchSrc.indexOf("createBuildingFloorDistribution()");
  const structuresIndex = buildingBranchSrc.indexOf("createBuildingStructuresEditor()");
  assert(floorDistIndex >= 0, "'building' dalinda createBuildingFloorDistribution() cagrisi bulunamadi.");
  assert(structuresIndex >= 0, "'building' dalinda createBuildingStructuresEditor() cagrisi bulunamadi.");
  assert(structuresIndex > floorDistIndex, "createBuildingStructuresEditor() createBuildingFloorDistribution()'dan ONCE geliyor (beklenen sira bozulmus).");
}
console.log("renderSection 'building' bolumu Yapilar kablolamasi kaynak-duzeyi testi tamam.");

// --- 7) "buildings" tablosu TITLE_UNIT_SCOPED_TABLE_KEYS_BASE'e eklendi mi -
//        (coklu tasinmaz sekmeleri arasinda veri sizmasin) — hem kaynak
//        duzeyinde hem GERCEK fonksiyonla.
assert.match(
  appSource,
  /"unitFloors", "buildingFloors",[\s\S]{0,400}?"buildings",\s*\n\s*\];/,
  "TITLE_UNIT_SCOPED_TABLE_KEYS_BASE icine 'buildings' eklenmemis (coklu tasinmazda veri sizintisi riski)."
);
{
  const context = { state: { fields: { requestType: "Çoklu Talep" } } };
  vm.createContext(context);
  vm.runInContext(sliceFn("const TITLE_UNIT_SCOPED_TABLE_KEYS_BASE = [", { toMarker: "\n];" }) + "\n];", context);
  vm.runInContext(sliceFn("function isComparablesSharedAcrossUnits("), context);
  vm.runInContext(sliceFn("function getTitleUnitScopedTableKeys("), context);
  assert(
    context.getTitleUnitScopedTableKeys().includes("buildings"),
    "getTitleUnitScopedTableKeys() gercek cagrisinda 'buildings' bulunamadi."
  );
}
console.log("'buildings' tablosunun tasinmaza-ozgu scoped set'e eklenmesi testi tamam.");

console.log("Yapilar (Bina Ozellikleri 'Yapı Ekle') testleri basarili.");
