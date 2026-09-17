"use strict";

/*
  Kullanici talebi (2026-09-17): "bina özellikleri bölümüne yapı ekle
  butonu koyalım" — bir parselde birden fazla bina bulunan taşınmazlar
  (fabrika örneği: ana üretim binası, depo, idari bina, bekçi kulübesi vb.)
  için "Bina Özellikleri" (building) bölümüne serbestçe çoğaltılabilen bir
  "Yapılar" listesi eklendi (createBuildingStructuresEditor, state.tables.buildings).

  0.0.822 takip talebi: "yapı ekle bölümünde anlaşamıyoruz" — kullanıcı
  gerçek bir fabrika raporu örneği paylaşıp önceki düz tablo tasarımının
  (isim/cins/kat sayısı/yıl/alan/kalite/açıklama sütunları) yetersiz
  kaldığını belirtti. AskUserQuestion ile netleştirilen yeni model: her
  yapı KENDİ SEKMESİNDE (title-unit-tab görsel deseni) açılır; sekme
  içinde yapının teknik alanları (Yapı Adı/Sınıfı/Tarzı/Nizamı/Kat Adedi/
  Yükseklik/Asansör/Yapım Yılı+Yaşı/Parsel Konumu/İç Hacim Özellikleri) VE
  KENDİ kat bazlı alan+iç hacim alt tablosu (+ otomatik toplam) bulunur.
  Eski düz-satır şeması TAMAMEN terk edildi.

  Bu test dört katmani dogrular:
  1) createBuildingStructuresEditor() ve alt fonksiyonlari gercek app.js
     kaynagindan izole calistirilir (DOM stub + classList/fragment destegi
     ekli): bos/dolu liste render'i, sekme gecisi, alan on-doldurma, hucre
     duzenleme, kat ekle/sil, toplam hesaplama, yapi silme davranislari.
  2) renderSection() kaynak-duzeyinde "building" bolumune
     createBuildingStructuresEditor() cagrisinin eklendigi (kaynak-duzeyi,
     tam dal sekli tools/test-mustakil-bina-section-merge.js'te).
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

// Not: bazi option dizileri (ör. buildingOrderOptions) TEK SATIRDA
// tanimlaniyor ("...];" satir sonunda degil) — toMarker "\n];" bu durumda
// bir SONRAKI (yanlis) coklu-satir dizisinin kapanisina kadar atlayip
// (ve o dizinin tanimini DA govdeye dahil edip) mukerrer `const` hatasina
// yol aciyordu. "];" (basindaki "\n" olmadan) hem tek hem coklu satir
// durumunda dogru (ilk gercek) kapanisi bulur.
function sliceConst(name) {
  return sliceFn(`const ${name} = [`, { toMarker: "];" }) + "];";
}

// --- Minimal DOM stub — classList + document fragment (icerik onceki -------
//     unit-floor testlerinden genisletildi, yeni kod .classList.add/toggle
//     ve document.createDocumentFragment() kullaniyor) -----------------------
function makeElementStub(tag) {
  const el = {
    tagName: String(tag || "").toUpperCase(),
    className: "",
    textContent: "",
    innerHTML: "",
    value: "",
    type: "",
    rows: 0,
    readOnly: false,
    placeholder: "",
    inputMode: "",
    children: [],
    _listeners: {},
    classList: {
      add(cls) {
        const parts = el.className ? el.className.split(/\s+/) : [];
        if (!parts.includes(cls)) parts.push(cls);
        el.className = parts.join(" ");
      },
      remove(cls) {
        el.className = (el.className ? el.className.split(/\s+/) : []).filter((c) => c !== cls).join(" ");
      },
      toggle(cls, force) {
        const has = (el.className ? el.className.split(/\s+/) : []).includes(cls);
        const shouldAdd = force === undefined ? !has : force;
        if (shouldAdd) el.classList.add(cls); else el.classList.remove(cls);
        return shouldAdd;
      },
      contains(cls) {
        return (el.className ? el.className.split(/\s+/) : []).includes(cls);
      },
    },
    append(...nodes) {
      nodes.forEach((node) => {
        if (node && node._isFragment) el.children.push(...node.children);
        else el.children.push(node);
      });
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

function makeFragmentStub() {
  return {
    _isFragment: true,
    children: [],
    append(...nodes) {
      nodes.forEach((node) => {
        if (node && node._isFragment) this.children.push(...node.children);
        else this.children.push(node);
      });
    },
  };
}

function findAllStubs(node, tag, acc = []) {
  if (!node) return acc;
  if (node.tagName === tag) acc.push(node);
  (node.children || []).forEach((child) => findAllStubs(child, tag, acc));
  return acc;
}

function makeContext(rows) {
  const context = {
    state: { tables: rows === undefined ? {} : { buildings: rows } },
    document: {
      createElement: (tag) => makeElementStub(tag),
      createDocumentFragment: () => makeFragmentStub(),
    },
    window: { confirm: () => true },
    autosave: () => {
      context.autosaveCalls = (context.autosaveCalls || 0) + 1;
    },
    renderSection: () => {
      context.renderSectionCalls = (context.renderSectionCalls || 0) + 1;
    },
    // Genel UI yardimcilari (formatUiHeading/escapeHtml zincirini gereksiz
    // yere buraya cekmemek icin stub'landi — bu ikisinin kendi dogrulugu bu
    // testin odagi degil, kendi cagri yerlerinde zaten test edilmiyor cunku
    // her yerde pervasif kullaniliyorlar).
    createSpan: (text) => {
      const span = makeElementStub("span");
      span.textContent = text;
      return span;
    },
    createUnitSubsection: (title, description) => {
      const panel = makeElementStub("div");
      panel.className = "subsection is-detail unit-subsection";
      panel._title = title;
      panel._description = description;
      return panel;
    },
  };
  vm.createContext(context);
  vm.runInContext(sliceConst("buildingFloorCountFields"), context);
  vm.runInContext(sliceConst("buildingStructureStyleOptions"), context);
  vm.runInContext(sliceConst("buildingOrderOptions"), context);
  vm.runInContext(sliceConst("buildingClassOptions"), context);
  vm.runInContext(sliceConst("buildingEntranceDirectionOptions"), context);
  vm.runInContext(sliceConst("unitFloorOptions"), context);
  vm.runInContext(sliceFn("let activeBuildingStructureTabIndex = 0;", { toMarker: ";" }), context);
  vm.runInContext(sliceFn("function createEmptyBuildingStructureFloorRow("), context);
  vm.runInContext(sliceFn("function createEmptyBuildingStructureRow("), context);
  vm.runInContext(sliceFn("function buildBuildingStructureFloorComposition("), context);
  vm.runInContext(sliceFn("function buildBuildingStructureElevatorOptions("), context);
  vm.runInContext(sliceFn("function getBuildingStructureRows("), context);
  vm.runInContext(sliceFn("function calculateSimpleBuildingAgeFromYear("), context);
  vm.runInContext(sliceFn("function parseBuildingStructureAreaNumber("), context);
  vm.runInContext(sliceFn("function formatBuildingStructureAreaNumber("), context);
  vm.runInContext(sliceFn("function normalizeNonNegativeInteger("), context);
  vm.runInContext(sliceFn("function parseBuildingFloorCount("), context);
  vm.runInContext(sliceFn("function createBuildingStructuresEditor("), context);
  vm.runInContext(sliceFn("function createBuildingStructureAddButton("), context);
  vm.runInContext(sliceFn("function createBuildingStructureTabContent("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorCountPanel("), context);
  vm.runInContext(sliceFn("function createBuildingStructureTextField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureSelectField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureConstructionYearField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureInteriorFeaturesField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorPanel("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorSelect("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorInput("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorDeleteButton("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorTotalsSummary("), context);
  vm.runInContext(sliceFn("function createBuildingStructureDeleteButton("), context);
  return context;
}

function runEditorScenario(rows) {
  const context = makeContext(rows);
  const panel = context.createBuildingStructuresEditor();
  return { panel, context };
}

// --- 1) Bos liste: yardimci mesaj + "+ Yapı Ekle" gosterilir, tab cubugu --
//        render EDILMEZ, state.tables.buildings [] olarak baslatilir.
{
  const { panel, context } = runEditorScenario(undefined);
  assert(Array.isArray(context.state.tables.buildings), "Bos durumda state.tables.buildings bir dizi olarak baslatilmadi.");
  assert.equal(context.state.tables.buildings.length, 0, "Bos durumda state.tables.buildings bos olmali.");
  const tabBars = findAllStubs(panel, "DIV").filter((n) => (n.className || "").includes("title-unit-tab-bar"));
  assert.equal(tabBars.length, 0, "Bos listede tab cubugu render edilmemeli.");
  const addButton = panel.children[panel.children.length - 1];
  assert.equal(addButton.textContent, "+ Yapı Ekle", "'+ Yapı Ekle' butonu bulunamadi veya metni yanlis.");
  assert.equal(addButton.className, "title-unit-tab-add", "'+ Yapı Ekle' butonu tab-ekleme gorsel sinifini kullanmiyor.");
}

// --- 2) "+ Yapı Ekle" tiklaninca TAM SEMALI bos bir satir eklenir --------
//        (name/buildingClass/.../floors[] alanlarinin HEPSI), aktif sekme
//        YENI satira gecer, autosave + renderSection cagrilir.
// Not: `activeBuildingStructureTabIndex` app.js'te modul-seviyeli `let` —
// vm.runInContext'te bu, contextin global sozcuksel ortamina baglanir,
// context NESNESININ kendi ozelligi OLMAZ (fonksiyon TANIMLARININ aksine).
// Bu yuzden testler bu degeri context.activeBuildingStructureTabIndex ile
// DOGRUDAN okuyup yazamaz — GERCEK fonksiyonlari (sekme tiklama/yeniden
// render) cagirip GOZLEMLENEBILIR yan etkiyi (is-active sinifi) kontrol
// eder.
{
  const rows = [{ name: "Ana Bina" }];
  const { panel, context } = runEditorScenario(rows);
  const tabBar = panel.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const actions = tabBar.children.find((n) => (n.className || "").includes("title-unit-tab-bar-actions"));
  const addButton = actions.children[0];
  assert.equal(addButton.textContent, "+ Yapı Ekle", "Dolu listede '+ Yapı Ekle' butonu bulunamadi.");
  addButton.fire("click");
  assert.equal(context.state.tables.buildings.length, 2, "Yapi Ekle tiklaninca yeni satir eklenmedi.");
  const newRow = context.state.tables.buildings[1];
  ["name", "buildingClass", "buildingStyle", "buildingOrder", "floorCounts", "floorCountText", "buildingHeight", "elevator", "freightElevator", "passengerElevator", "constructionYear", "parcelPosition", "interiorFeatures", "floors"].forEach((key) => {
    assert(Object.prototype.hasOwnProperty.call(newRow, key), `Yeni yapi satirinda '${key}' alani eksik.`);
  });
  assert(Array.isArray(newRow.floors) && newRow.floors.length === 0, "Yeni yapi satirinin 'floors' alani bos bir dizi olmali.");
  assert.equal(Object.keys(newRow.floorCounts).length, 0, "Yeni yapi satirinin 'floorCounts' alani bos bir nesne olmali.");
  assert.equal(context.autosaveCalls, 1, "Yapi Ekle sonrasi autosave() cagrilmadi.");
  assert.equal(context.renderSectionCalls, 1, "Yapi Ekle sonrasi renderSection() cagrilmadi.");

  const panel2 = context.createBuildingStructuresEditor();
  const tabBar2 = panel2.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const tabsWrap2 = tabBar2.children.find((n) => (n.className || "").includes("title-unit-tab-bar-tabs"));
  const [firstTab2, secondTab2] = tabsWrap2.children.filter((n) => n.tagName === "BUTTON");
  assert.equal(firstTab2.className, "title-unit-tab", "Yapi Ekle sonrasi ESKI sekme yanlislikla aktif kaldi.");
  assert.equal(secondTab2.className, "title-unit-tab is-active", "Yapi Ekle sonrasi aktif sekme YENI satira gecmedi.");
}

// --- 3) Dolu liste: tab cubugunda her yapi icin bir sekme, etiket row.name -
//        (bos ise "Yapı N"), aktif sekme is-active sinifiyla isaretli.
{
  const rows = [{ name: "Ana Bina" }, {}];
  const { panel } = runEditorScenario(rows);
  const tabBar = panel.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  assert(tabBar, "Tab cubugu bulunamadi.");
  const tabsWrap = tabBar.children.find((n) => (n.className || "").includes("title-unit-tab-bar-tabs"));
  const tabButtons = tabsWrap.children.filter((n) => n.tagName === "BUTTON");
  assert.deepEqual(tabButtons.map((b) => b.textContent), ["Ana Bina", "Yapı 2"], "Sekme etiketleri beklenenden farkli (isimsiz yapi 'Yapı N' fallback'i almali).");
  assert.equal(tabButtons[0].className, "title-unit-tab is-active", "Ilk sekme varsayilan olarak aktif isaretlenmemis.");
  assert.equal(tabButtons[1].className, "title-unit-tab", "Ikinci sekme yanlislikla aktif isaretlenmis.");
}

// --- 4) Sekmeye tiklamak SADECE render tetikler (autosave GEREKMEZ, veri --
//        degismedi), aktif sekmeyi degistirir; ZATEN aktif sekmeye tekrar
//        tiklamak NO-OP olmali (gereksiz renderSection yok).
{
  const rows = [{ name: "Ana Bina" }, { name: "Depo" }];
  const { panel, context } = runEditorScenario(rows);
  const tabBar = panel.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const tabsWrap = tabBar.children.find((n) => (n.className || "").includes("title-unit-tab-bar-tabs"));
  const [firstTab, secondTab] = tabsWrap.children.filter((n) => n.tagName === "BUTTON");

  firstTab.fire("click");
  assert.equal(context.renderSectionCalls || 0, 0, "Halihazirda aktif sekmeye tiklamak gereksiz yere renderSection() tetikledi.");

  secondTab.fire("click");
  assert.equal(context.renderSectionCalls, 1, "Sekme degisimi renderSection() tetiklemedi.");
  assert.equal(context.autosaveCalls || 0, 0, "Sadece sekme gecisi (veri degisikligi yok) autosave() TETIKLEMEMELI.");

  const panel2 = context.createBuildingStructuresEditor();
  const tabBar2 = panel2.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const tabsWrap2 = tabBar2.children.find((n) => (n.className || "").includes("title-unit-tab-bar-tabs"));
  const [firstTab2, secondTab2] = tabsWrap2.children.filter((n) => n.tagName === "BUTTON");
  assert.equal(firstTab2.className, "title-unit-tab", "Sekme degisiminden sonra ilk sekme hala aktif gorunuyor.");
  assert.equal(secondTab2.className, "title-unit-tab is-active", "Sekme degisiminden sonra ikinci sekme aktif isaretlenmedi.");
}

// --- 5) Aktif sekme icerigi: teknik alanlar row degerleriyle ON-DOLU ------
//        geliyor; Yapim Yili girildiginde Yapi Yasi CANLI hesaplaniyor.
{
  const currentYear = new Date().getFullYear();
  const rows = [{
    name: "Fabrika Binası",
    buildingClass: "2/C",
    buildingStyle: "Betonarme Karkas",
    buildingOrder: "Ayrık",
    buildingHeight: "8,00 metre",
    elevator: "Yok",
    freightElevator: "1 Adet Yük Asansörü",
    passengerElevator: "2 Adet Yolcu Asansörü",
    constructionYear: String(currentYear - 10),
    parcelPosition: "Kuzey",
    interiorFeatures: "Üretim ofisi mevcut",
    floors: [],
  }];
  const { panel, context } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  assert(content, "Sekme icerigi (building-structure-tab-content) bulunamadi.");
  const grid = content.children.find((n) => (n.className || "").includes("building-technical-grid"));
  assert(grid, "Teknik alanlar grid'i bulunamadi.");
  const fieldValue = (index) => grid.children[index].children[1].value;
  assert.equal(fieldValue(0), "Fabrika Binası", "Yapı Adı on-doldurulmadi.");
  assert.equal(fieldValue(1), "2/C", "Yapı Sınıfı on-doldurulmadi.");
  assert.equal(fieldValue(2), "Betonarme Karkas", "Bina Yapı Tarzı on-doldurulmadi.");
  assert.equal(fieldValue(3), "Ayrık", "Mevcut Yapı Nizamı on-doldurulmadi.");
  assert.equal(fieldValue(4), "8,00 metre", "Bina Yüksekliği on-doldurulmadi.");
  assert.equal(fieldValue(5), "Yok", "Asansör on-doldurulmadi.");
  assert.equal(fieldValue(6), "1 Adet Yük Asansörü", "Yük Asansörü on-doldurulmadi.");
  assert.equal(fieldValue(7), "2 Adet Yolcu Asansörü", "Yolcu Asansörü on-doldurulmadi.");
  const yearInput = grid.children[8].children[1];
  const ageInput = grid.children[9].children[1];
  assert.equal(yearInput.value, String(currentYear - 10), "Yapım Yılı on-doldurulmadi.");
  assert.equal(ageInput.value, "10 yıl", "Yapı Yaşı Yapım Yılı'ndan dogru hesaplanmadi.");
  assert.equal(ageInput.readOnly, true, "Yapı Yaşı alani salt-okunur olmali.");
  assert.equal(fieldValue(10), "Kuzey", "Parselin hangi kısmında yer aldığı on-doldurulmadi.");

  // Yapım Yılı degistirilince Yapı Yaşı ayni tikte (renderSection OLMADAN)
  // guncellenmeli.
  yearInput.value = String(currentYear - 25);
  yearInput.fire("input");
  assert.equal(context.state.tables.buildings[0].constructionYear, String(currentYear - 25), "Yapım Yılı satira yazilmadi.");
  assert.equal(ageInput.value, "25 yıl", "Yapı Yaşı, Yapım Yılı degisince canli guncellenmedi.");
  assert.equal(context.autosaveCalls, 1, "Yapım Yılı degisikligi autosave() tetiklemedi.");
  assert.equal(context.renderSectionCalls || 0, 0, "Yapım Yılı degisikligi gereksiz yere renderSection() tetikledi.");
}

// --- 6) Skaler alan duzenlemesi (ör. Yapı Adı) satira yazar, autosave -----
//        cagrilir, renderSection GEREKMEZ.
{
  const rows = [{ name: "Ana Bina" }];
  const { panel, context } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const grid = content.children.find((n) => (n.className || "").includes("building-technical-grid"));
  const nameInput = grid.children[0].children[1];
  nameInput.value = "Depo Binası";
  nameInput.fire("input");
  assert.equal(context.state.tables.buildings[0].name, "Depo Binası", "Hucre girdisi satir nesnesine yazilmadi.");
  assert.equal(context.autosaveCalls, 1, "Hucre girdisi sonrasi autosave() cagrilmadi.");
  assert.equal(context.renderSectionCalls || 0, 0, "Skaler alan duzenlemesi gereksiz yere renderSection() tetikledi.");
}

// --- 7) İç Hacim Özellikleri (tefrişat) textarea'si on-dolu + duzenlenebilir
{
  const rows = [{ name: "Ana Bina", interiorFeatures: "Ofis mobilyalı" }];
  const { panel, context } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const interiorField = content.children.find((n) => (n.className || "").includes("building-structure-interior-features-field"));
  assert(interiorField, "İç Hacim Özellikleri (tefrişat) alani bulunamadi.");
  const textarea = interiorField.children[1];
  assert.equal(textarea.value, "Ofis mobilyalı", "İç Hacim Özellikleri on-doldurulmadi.");
  textarea.value = "Depo raflı";
  textarea.fire("input");
  assert.equal(context.state.tables.buildings[0].interiorFeatures, "Depo raflı", "İç Hacim Özellikleri duzenlemesi satira yazilmadi.");
}

// --- 8) Kat Dağılımı paneli: Ana Taşınmaz Kat Dağılımı İLE AYNI mantık —
//        kat turu basina adet grid'i + "Hesapla" ile Toplam Kat Adedi metni
//        uretilir; kullanicinin metni ELLE duzenlemesi bir SONRAKI "Hesapla"
//        tiklanana kadar EZILMEZ.
{
  const rows = [{ name: "Fabrika Binası" }];
  const { panel, context } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const floorCountPanel = content.children.find((n) => (n.className || "").includes("building-structure-floor-count-panel"));
  assert(floorCountPanel, "Kat Dağılımı paneli bulunamadi.");
  const countGrid = floorCountPanel.children.find((n) => (n.className || "").includes("building-floor-count-grid"));
  assert(countGrid, "Kat dağılımı grid'i bulunamadi.");
  assert.deepEqual(
    countGrid.children.map((label) => label.children[0].textContent),
    ["Bodrum", "Zemin", "Asma", "Ara", "Normal", "Çatı", "Teras"],
    "Kat dağılımı grid'i buildingFloorCountFields ile AYNI kat turlerini icermiyor (Ana Taşınmaz Kat Dağılımı ile tutarsiz)."
  );

  const groundInput = countGrid.children[1].children[1];
  const normalInput = countGrid.children[4].children[1];
  groundInput.value = "1";
  normalInput.value = "1";

  const calculateButton = floorCountPanel.children.find((n) => n.tagName === "BUTTON");
  assert.equal(calculateButton.textContent, "Kat Dağılımını Hesapla", "'Kat Dağılımını Hesapla' butonu bulunamadi.");
  calculateButton.fire("click");

  const totalInput = floorCountPanel.children.find((n) => (n.children[0] || {}).textContent === "Toplam Kat Adedi").children[1];
  assert.equal(totalInput.value, "Zemin + 1 Normal Kat", "Toplam Kat Adedi metni kat dağılımından dogru uretilmedi.");
  assert.equal(context.state.tables.buildings[0].floorCounts.ground, "1", "Zemin adedi row.floorCounts'a yazilmadi.");
  assert.equal(context.state.tables.buildings[0].floorCounts.normal, "1", "Normal kat adedi row.floorCounts'a yazilmadi.");
  assert.equal(context.state.tables.buildings[0].floorCountText, "Zemin + 1 Normal Kat", "Toplam Kat Adedi row'a yazilmadi.");

  // Kullanici metni ELLE duzeltirse (ör. ek bir aciklama), sonraki "Hesapla"
  // tiklanana kadar bu deger KORUNMALI (autosave() cagrilir, ama grid'den
  // yeniden UZERINE YAZILMAZ).
  totalInput.value = "Zemin + 1 Normal Kat (çatı katı hariç)";
  totalInput.fire("input");
  assert.equal(context.state.tables.buildings[0].floorCountText, "Zemin + 1 Normal Kat (çatı katı hariç)", "Elle duzenlenen Toplam Kat Adedi metni satira yazilmadi.");
  assert(context.autosaveCalls > 0, "Toplam Kat Adedi elle duzenlemesi autosave() tetiklemedi.");
}

// --- 9) Kat Bazlı Alanlar paneli: bos durumda mesaj, "Kat ekle" ile satir -
//        eklenir (renderSection GEREKIR, yapisal degisiklik).
{
  const rows = [{ name: "Ana Bina", floors: [] }];
  const { panel, context } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const floorPanel = content.children.find((n) => (n.className || "").includes("building-structure-floor-panel"));
  assert(floorPanel, "Kat Bazlı Alanlar paneli bulunamadi.");
  const emptyNote = floorPanel.children.find((n) => (n.className || "").includes("empty-table-note"));
  assert(emptyNote, "Bos kat listesinde 'Henüz kat eklenmedi.' mesaji yok.");
  const addFloorButton = floorPanel.children[0].children[0];
  assert.equal(addFloorButton.textContent, "Kat ekle", "'Kat ekle' butonu bulunamadi.");
  addFloorButton.fire("click");
  assert.equal(context.state.tables.buildings[0].floors.length, 1, "'Kat ekle' yeni bir kat satiri eklemedi.");
  assert.equal(context.autosaveCalls, 1, "'Kat ekle' sonrasi autosave() cagrilmadi.");
  assert.equal(context.renderSectionCalls, 1, "'Kat ekle' sonrasi renderSection() cagrilmadi.");
}

// --- 10) Kat satirlari: alanlar duzenlenebilir, Toplam Yasal/Mevcut Alan --
//        otomatik hesaplanir, satir silme calisir.
{
  const rows = [{
    name: "Fabrika Binası",
    floors: [
      { floor: "Zemin", legalArea: "1000", currentArea: "1050", interiors: "Üretim salonu" },
      { floor: "1. Normal", legalArea: "500", currentArea: "600", interiors: "İdari ofis" },
    ],
  }];
  const { panel, context } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const floorPanel = content.children.find((n) => (n.className || "").includes("building-structure-floor-panel"));
  const totalsSummary = floorPanel.children.find((n) => (n.className || "").includes("unit-floor-reduced-total-summary"));
  assert(totalsSummary, "Toplam alan ozeti bulunamadi.");
  const [legalTotalLabel, currentTotalLabel] = totalsSummary.children;
  assert.equal(legalTotalLabel.children[1].value, "1.500", "Toplam Yasal Alan dogru hesaplanmadi.");
  assert.equal(currentTotalLabel.children[1].value, "1.650", "Toplam Mevcut Alan dogru hesaplanmadi.");

  const rowsWrapper = floorPanel.children.find((n) => (n.className || "").includes("unit-floor-rows"));
  assert.equal(rowsWrapper.children.length, 2, "Kat karti sayisi beklenenden farkli.");
  const [firstCard] = rowsWrapper.children;
  const head = firstCard.children.find((n) => (n.className || "").includes("unit-floor-card-head"));
  const floorSelect = head.children[0].children[1];
  const legalInput = head.children[1].children[1];
  const currentInput = head.children[2].children[1];
  assert.equal(floorSelect.value, "Zemin", "Kat secimi on-doldurulmadi.");
  assert.equal(legalInput.value, "1000", "Yasal Alan on-doldurulmadi.");
  assert.equal(currentInput.value, "1050", "Mevcut Alan on-doldurulmadi.");
  const interiorRow = firstCard.children.find((n) => (n.className || "").includes("unit-floor-card-interior-row"));
  assert.equal(interiorRow.children[0].children[1].value, "Üretim salonu", "İç Hacimler on-doldurulmadi.");

  const deleteButton = head.children[head.children.length - 1];
  assert.equal(deleteButton.textContent, "×", "Kat silme butonu bulunamadi.");
  deleteButton.fire("click");
  assert.equal(context.state.tables.buildings[0].floors.length, 1, "Kat silme sonrasi satir sayisi azalmadi.");
  assert.equal(context.state.tables.buildings[0].floors[0].floor, "1. Normal", "Yanlis kat satiri silindi.");
  assert.equal(context.renderSectionCalls, 1, "Kat silme sonrasi renderSection() cagrilmadi.");
}

// --- 11) "Bu Yapıyı Sil": onay reddedilirse hicbir sey degismez; onaylanirsa
//         satir silinir, aktif sekme indeksi sinira cekilir.
{
  const rows = [{ name: "Ana Bina" }, { name: "Depo" }];
  const { panel, context } = runEditorScenario(rows);
  const tabBar = panel.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const tabsWrap = tabBar.children.find((n) => (n.className || "").includes("title-unit-tab-bar-tabs"));
  const [, secondTab] = tabsWrap.children.filter((n) => n.tagName === "BUTTON");
  secondTab.fire("click"); // aktif sekme artik "Depo" (2. yapi)

  const panel2 = context.createBuildingStructuresEditor();
  const content = panel2.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const deleteWrap = content.children.find((n) => (n.className || "").includes("building-structure-delete-wrap"));
  assert(deleteWrap, "'Bu Yapıyı Sil' sarmalayicisi bulunamadi.");
  const deleteButton = deleteWrap.children[0];
  assert.equal(deleteButton.textContent, "Bu Yapıyı Sil", "'Bu Yapıyı Sil' butonu bulunamadi.");

  context.window.confirm = () => false;
  deleteButton.fire("click");
  assert.equal(context.state.tables.buildings.length, 2, "Onay reddedilmesine ragmen yapi silindi.");

  context.window.confirm = () => true;
  deleteButton.fire("click");
  assert.equal(context.state.tables.buildings.length, 1, "Onaylanan silme islemi (aktif sekmedeki 'Depo'yu) kaldirmadi.");
  assert.equal(context.state.tables.buildings[0].name, "Ana Bina", "Yanlis yapi silindi (aktif sekme 'Depo' silinmeliydi).");

  // Aktif sekme indeksi sinira cekildi mi? Tek satir kaldi -> bir sonraki
  // render'da o satirin sekmesi aktif gorunmeli (eski index artik gecersiz).
  const panel3 = context.createBuildingStructuresEditor();
  const tabBar3 = panel3.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const tabsWrap3 = tabBar3.children.find((n) => (n.className || "").includes("title-unit-tab-bar-tabs"));
  const [onlyTab3] = tabsWrap3.children.filter((n) => n.tagName === "BUTTON");
  assert.equal(onlyTab3.className, "title-unit-tab is-active", "Son yapi silinince aktif sekme indeksi sinira cekilmedi.");
  assert.equal(onlyTab3.textContent, "Ana Bina", "Aktif sekme yanlis yapiyi gosteriyor.");
}

console.log("createBuildingStructuresEditor() (Yapı Ekle, tab mantığı) davranış testleri tamam.");

// --- 12) renderSection() kaynak-duzeyinde "building" bolumune -------------
//        createBuildingStructuresEditor() cagrisi eklendi mi?
// Not: tam dal sekli (Musttakil Bina'da createUnitFeaturesEditor() birlesimi
// + "Yapı Ekle" en-uste/gizle-ac duzeni dahil) tools/test-mustakil-bina-section-merge.js'te
// dogrulanir - burada yalnizca UC cagrinin "building" dalinin govdesi
// ICINDE, dogru SIRADA (Kat Dagilimi -> Yapilar) gectigi (kesin bitisiklik
// ARANMADAN) kontrol edilir.
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

// --- 13) "buildings" tablosu TITLE_UNIT_SCOPED_TABLE_KEYS_BASE'e eklendi mi
//         (coklu tasinmaz sekmeleri arasinda veri sizmasin) — hem kaynak
//         duzeyinde hem GERCEK fonksiyonla.
assert.match(
  appSource,
  /"unitFloors", "buildingFloors",[\s\S]{0,400}?"buildings",\s*\n\s*\];/,
  "TITLE_UNIT_SCOPED_TABLE_KEYS_BASE icine 'buildings' eklenmemis (coklu tasinmazda veri sizintisi riski)."
);
{
  const context = { state: { fields: { requestType: "Çoklu Talep" } } };
  vm.createContext(context);
  vm.runInContext(sliceConst("TITLE_UNIT_SCOPED_TABLE_KEYS_BASE"), context);
  vm.runInContext(sliceFn("function isComparablesSharedAcrossUnits("), context);
  vm.runInContext(sliceFn("function getTitleUnitScopedTableKeys("), context);
  assert(
    context.getTitleUnitScopedTableKeys().includes("buildings"),
    "getTitleUnitScopedTableKeys() gercek cagrisinda 'buildings' bulunamadi."
  );
}
console.log("'buildings' tablosunun tasinmaza-ozgu scoped set'e eklenmesi testi tamam.");

console.log("Yapilar (Bina Ozellikleri 'Yapı Ekle', tab mantığı) testleri basarili.");
