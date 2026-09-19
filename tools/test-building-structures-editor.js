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

// `const X = [...]` vm.runInContext ile calistirildiginda context NESNESININ
// ozelligi OLMAZ (bkz. activeBuildingStructureTabIndex ile ayni gerekce,
// yukarida) — DIS-realm'de DOGRUDAN erisim gereken sabit dizi degerleri
// icin (fonksiyon govdesi degil, salt veri oldugundan) bu yardimci diziyi
// duz Node baglaminda (vm OLMADAN) degerlendirip GERCEK bir Array dondurur.
function evalConstArray(name) {
  const src = sliceConst(name);
  const arrayLiteral = src.slice(src.indexOf("[")).replace(/;\s*$/, "");
  return new Function(`return ${arrayLiteral}`)();
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
    // createBuildingStructureFloorInteriorPicker() (10-select İç Hacimler
    // secici, 0.0.824) `list.querySelectorAll("select")` kullanıyor — bu
    // sadece BASİT tag-adı secicilerini destekleyen, o cagriyi calistirmaya
    // yeten minimal bir karsilik.
    querySelectorAll(selector) {
      const tag = String(selector || "").toUpperCase();
      const results = [];
      const walk = (node) => {
        (node.children || []).forEach((child) => {
          if (child.tagName === tag) results.push(child);
          walk(child);
        });
      };
      walk(el);
      return results;
    },
    querySelector(selector) {
      return el.querySelectorAll(selector)[0];
    },
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

function makeContext(rows, fields = {}) {
  const context = {
    state: { fields, tables: rows === undefined ? {} : { buildings: rows } },
    document: {
      createElement: (tag) => makeElementStub(tag),
      createDocumentFragment: () => makeFragmentStub(),
      querySelectorAll: () => [],
    },
    window: { confirm: () => true },
    // openConfirmActionModal (2026-09-19, native window.confirm() yerine —
    // bkz. app.js yorumu: bazı tarayıcı durumlarında confirm() sessizce ve
    // kalıcı olarak false dönebiliyordu) — davranış-koruyan SAHTE:
    // context.confirmActionShouldConfirm true (varsayılan, eski
    // window.confirm:()=>true ile AYNI) ise onConfirm'i HEMEN çağırır.
    confirmActionShouldConfirm: true,
    openConfirmActionModal: (message, onConfirm) => {
      context.lastConfirmActionMessage = message;
      if (context.confirmActionShouldConfirm) onConfirm();
    },
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
    normalizeBuildingStructureRow: (row) => ({
      id: row.id || `building-test-${Math.random().toString(36).slice(2, 8)}`,
      documentProfile: row.documentProfile || {},
      technicalProfile: row.technicalProfile || {},
      factorDecisions: row.factorDecisions || {},
      ...row,
    }),
    createBuildingStructureTechnicalProfilePanel: () => makeElementStub("div"),
    createBuildingStructureFactorPanel: () => makeElementStub("div"),
    getBuildingParts: () => [],
    refreshDocumentScopeSummary: () => {},
    commitStructureDocumentDescriptionChange: () => {},
    isCentralStructureRegistryMode: () => false,
    activeDocumentsStructureTarget: "parcel",
  };
  vm.createContext(context);
  vm.runInContext(sliceConst("buildingFloorCountFields"), context);
  vm.runInContext(sliceConst("buildingStructureStyleOptions"), context);
  vm.runInContext(sliceConst("buildingOrderOptions"), context);
  vm.runInContext(sliceConst("buildingClassOptions"), context);
  vm.runInContext(sliceConst("buildingEntranceDirectionOptions"), context);
  vm.runInContext(sliceConst("BUILDING_STRUCTURE_STATUS_OPTIONS"), context);
  vm.runInContext(sliceConst("BUILDING_STRUCTURE_USAGE_OPTIONS"), context);
  vm.runInContext(sliceConst("unitInteriorValidationOptions"), context);
  vm.runInContext(sliceConst("commercialUnitInteriorValidationOptions"), context);
  vm.runInContext(sliceConst("shopUnitInteriorValidationOptions"), context);
  vm.runInContext(sliceConst("officeUnitInteriorValidationOptions"), context);
  vm.runInContext(sliceConst("commercialBuildingUnitInteriorValidationOptions"), context);
  vm.runInContext(sliceConst("industrialUnitInteriorValidationOptions"), context);
  vm.runInContext(sliceFn("function foldTurkish("), context);
  vm.runInContext(sliceFn("function getUnitInteriorValidationOptions("), context);
  vm.runInContext(sliceFn("function escapeHtml("), context);
  vm.runInContext(sliceFn("let activeBuildingStructureTabIndex = 0;", { toMarker: ";" }), context);
  vm.runInContext(sliceFn("function createEmptyBuildingStructureRow("), context);
  vm.runInContext(sliceFn("function buildBuildingStructureFloorComposition("), context);
  vm.runInContext(sliceConst("BUILDING_STRUCTURE_ELEVATOR_OPTIONS"), context);
  vm.runInContext(sliceFn("function getBuildingStructureElevatorValues("), context);
  vm.runInContext(sliceFn("function formatBuildingStructureElevatorSummary("), context);
  vm.runInContext(sliceFn("function createBuildingStructureElevatorControl("), context);
  vm.runInContext(sliceFn("function getBuildingStructureRows("), context);
  vm.runInContext(sliceFn("function calculateSimpleBuildingAgeFromYear("), context);
  vm.runInContext(sliceFn("function parseBuildingStructureAreaNumber("), context);
  vm.runInContext(sliceFn("function formatBuildingStructureAreaNumber("), context);
  vm.runInContext(sliceFn("function normalizeNonNegativeInteger("), context);
  vm.runInContext(sliceFn("function parseBuildingFloorCount("), context);
  vm.runInContext(sliceFn("function getBuildingFloorNamesFromCounts("), context);
  vm.runInContext(sliceFn("function buildBuildingStructureFloorRowsFromCounts("), context);
  vm.runInContext(sliceFn("function createBuildingStructuresEditor("), context);
  vm.runInContext(sliceFn("function commitPendingParcelBuildingRegistryControls("), context);
  vm.runInContext(sliceFn("function createBuildingStructureAddButton("), context);
  vm.runInContext(sliceFn("function createBuildingStructureTabContent("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorCountPanel("), context);
  vm.runInContext(sliceFn("function createBuildingStructureTextField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureSelectField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureConstructionYearField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureInteriorFeaturesField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorPanel("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorNameField("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorInput("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorInteriorPicker("), context);
  vm.runInContext(sliceFn("function createBuildingStructureFloorTotalsSummary("), context);
  vm.runInContext(sliceFn("function createBuildingStructureDeleteButton("), context);
  vm.runInContext(sliceFn("function deleteBuildingStructureRowById("), context);
  vm.runInContext(sliceFn("function createParcelBuildingsRegistryEditor("), context);
  return context;
}

function runEditorScenario(rows, fields = {}) {
  const context = makeContext(rows, fields);
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
  ["name", "buildingClass", "buildingStyle", "buildingOrder", "floorCounts", "floorCountText", "buildingHeight", "elevator", "constructionYear", "parcelPosition", "interiorFeatures", "floors"].forEach((key) => {
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
    elevator: "1 Adet Yük Asansörü, 2 Adet Yolcu Asansörü",
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

  // Asansör (0.0.826, "yük asansörü ve yolcu asansörünü asansör bölümüne
  // al, açılır listeyi çoktan seçmeli yap") artık AYRI select'ler DEGIL,
  // ozet-buton + coktan-secmeli modal deseninde TEK bir alan.
  const elevatorField = grid.children[5];
  const elevatorButton = elevatorField.children[1];
  assert.equal(elevatorButton.tagName, "BUTTON", "Asansör alani artik ozet-buton (coktan secmeli) olmali, select DEGIL.");
  assert.equal(elevatorButton.className, "multi-checkbox-summary", "Asansör butonu Sosyal Tesisler ile AYNI 'multi-checkbox-summary' gorsel sinifini kullanmiyor.");
  assert.equal(elevatorButton.textContent, "1 Adet Yük Asansörü, 2 Adet Yolcu Asansörü", "Asansör ozeti mevcut secimleri dogru gostermiyor.");

  const yearInput = grid.children[6].children[1];
  const ageInput = grid.children[7].children[1];
  assert.equal(yearInput.value, String(currentYear - 10), "Yapım Yılı on-doldurulmadi.");
  assert.equal(ageInput.value, "10 yıl", "Yapı Yaşı Yapım Yılı'ndan dogru hesaplanmadi.");
  assert.equal(ageInput.readOnly, true, "Yapı Yaşı alani salt-okunur olmali.");
  assert.equal(fieldValue(8), "Kuzey", "Parselin hangi kısmında yer aldığı on-doldurulmadi.");

  // Yapım Yılı degistirilince Yapı Yaşı ayni tikte (renderSection OLMADAN)
  // guncellenmeli.
  yearInput.value = String(currentYear - 25);
  yearInput.fire("input");
  assert.equal(context.state.tables.buildings[0].constructionYear, String(currentYear - 25), "Yapım Yılı satira yazilmadi.");
  assert.equal(ageInput.value, "25 yıl", "Yapı Yaşı, Yapım Yılı degisince canli guncellenmedi.");
  assert.equal(context.autosaveCalls, 1, "Yapım Yılı degisikligi autosave() tetiklemedi.");
  assert.equal(context.renderSectionCalls || 0, 0, "Yapım Yılı degisikligi gereksiz yere renderSection() tetikledi.");
}

// --- 6) Asansör coktan-secmeli alan (0.0.827: "pop-up yerine Proje --------
//        İncelenen Kurum'daki gibi acilir-ice-gomulu liste yap" — modal
//        YERİNE createMultiCheckboxControl() (Proje İncelenen Kurum) İLE
//        AYNI .multi-checkbox-dropdown/.inline-checkbox-list deseni).
//        Secenek listesi + deger ayiklama/ozetleme saf fonksiyonlari TAM
//        calistirilarak, ac/kapa etkilesimi DOM stub'la GERCEKTEN dogrulanir;
//        onay kutusu satirlarinin GOVDESI (innerHTML sablonu, stub HTML
//        parse ETMEDIGINDEN diger innerHTML-agirlikli testlerde de izlenen
//        desenle) kaynak-duzeyinde dogrulanir.
{
  const context = makeContext([{}]);
  const elevatorOptions = evalConstArray("BUILDING_STRUCTURE_ELEVATOR_OPTIONS");
  assert.deepEqual(
    elevatorOptions.slice(0, 4),
    ["1 Adet Yolcu Asansörü", "2 Adet Yolcu Asansörü", "3 Adet Yolcu Asansörü", "4 Adet Yolcu Asansörü"],
    "Asansör secenek listesi Yolcu Asansörü adetleriyle baslamiyor."
  );
  assert.deepEqual(
    elevatorOptions.slice(4, 8),
    ["1 Adet Yük Asansörü", "2 Adet Yük Asansörü", "3 Adet Yük Asansörü", "4 Adet Yük Asansörü"],
    "Asansör secenek listesi Yük Asansörü adetlerini icermiyor."
  );
  assert.equal(
    elevatorOptions[elevatorOptions.length - 1],
    "Montajı henüz yapılmamıştır",
    "'Montajı henüz yapılmamıştır' secenegi listede yok."
  );

  const rowWithGarbage = { elevator: "1 Adet Yük Asansörü, Bilinmeyen Deger, 2 Adet Yolcu Asansörü" };
  assert.equal(
    context.getBuildingStructureElevatorValues(rowWithGarbage).join(","),
    "1 Adet Yük Asansörü,2 Adet Yolcu Asansörü",
    "Gecerli olmayan degerler (eski/bozuk veri) ayiklanmadan gecti."
  );
  assert.equal(context.formatBuildingStructureElevatorSummary({ elevator: "" }), "Yok", "Bos secimde ozet 'Yok' olmali.");
  assert.equal(
    context.formatBuildingStructureElevatorSummary({ elevator: "1 Adet Yük Asansörü, 2 Adet Yolcu Asansörü" }),
    "1 Adet Yük Asansörü, 2 Adet Yolcu Asansörü",
    "Dolu secimde ozet virgullu metni birebir yansitmiyor."
  );
}
{
  // document.addEventListener/removeEventListener + setTimeout, sadece
  // BU test icin: gercek kod "disari tiklayinca kapat" icin document
  // seviyesinde pointerdown dinliyor ve kaydi bir setTimeout(...,0) ile
  // erteliyor (createMultiCheckboxControl ile AYNI teknik) — testte
  // setTimeout'u ESZAMANLI calistirmak yeterli, gercek zamanlayiciya
  // gerek yok.
  const context = makeContext([{}]);
  context.document.addEventListener = () => {};
  context.document.removeEventListener = () => {};
  context.setTimeout = (fn) => fn();

  const row = { elevator: "1 Adet Yolcu Asansörü" };
  const wrapper = context.createBuildingStructureElevatorControl(row);
  assert.equal(wrapper.className, "field multi-checkbox-dropdown", "Asansör kontrolu artik Proje İncelenen Kurum ile AYNI 'field multi-checkbox-dropdown' sinifini kullanmiyor (pop-up'a geri donulmus olabilir).");
  const [, summaryButton, list] = wrapper.children;
  assert.equal(summaryButton.tagName, "BUTTON", "Ozet dugmesi bulunamadi.");
  assert.equal(summaryButton.className, "multi-checkbox-summary", "Ozet dugmesi yanlis sinifta.");
  assert.equal(summaryButton.textContent, "1 Adet Yolcu Asansörü", "Ozet metni mevcut secimi yansitmiyor.");
  assert.equal(list.className, "inline-checkbox-list", "Onay kutusu listesi bulunamadi.");
  assert.equal(list.hidden, true, "Liste baslangicta GİZLİ olmali (pop-up gibi ayri bir modal DEGIL, ice-gomulu ac/kapa).");

  summaryButton.fire("click");
  assert.equal(list.hidden, false, "Ozet dugmesine tiklamak listeyi ACMALI.");
  assert(wrapper.className.includes("is-open"), "Liste acikken sarmalayiciya 'is-open' sinifi eklenmeli.");

  summaryButton.fire("click");
  assert.equal(list.hidden, true, "Ozet dugmesine TEKRAR tiklamak listeyi KAPATMALI.");
  assert(!wrapper.className.includes("is-open"), "Liste kapaninca 'is-open' sinifi kaldirilmali.");
}
{
  const controlSrc = sliceFn("function createBuildingStructureElevatorControl(");
  assert.match(controlSrc, /const options = BUILDING_STRUCTURE_ELEVATOR_OPTIONS/, "Onay kutulari BUILDING_STRUCTURE_ELEVATOR_OPTIONS'tan uretilmiyor.");
  assert.match(controlSrc, /type="checkbox"/, "Onay kutusu <input type=\"checkbox\"> govdesi bulunamadi.");
  assert.match(controlSrc, /addEventListener\("change"[\s\S]{0,200}row\.elevator\s*=/, "Onay kutusu degisince row.elevator guncellenmiyor.");
  assert.match(controlSrc, /row\.elevator\s*=[\s\S]{0,150}autosave\(\)/, "Secim degisince autosave() cagrilmiyor.");
  assert.match(controlSrc, /summaryButton\.textContent\s*=\s*formatBuildingStructureElevatorSummary\(row\)/, "Secim degisince ozet metni yeniden hesaplanmiyor.");
}
console.log("Asansör coktan-secmeli (ice-gomulu acilir liste) alan testleri tamam.");

// --- 7) Skaler alan duzenlemesi (ör. Yapı Adı) satira yazar, autosave -----
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

// --- 8) İç Hacim Özellikleri (tefrişat) textarea'si on-dolu + duzenlenebilir
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

// --- 9) Kat Dağılımı paneli: Ana Taşınmaz Kat Dağılımı İLE AYNI mantık —
//        kat turu basina adet grid'i + "Hesapla" ile Toplam Kat Adedi metni
//        VE kat satirlari (row.floors) BİRLİKTE uretilir; kullanicinin
//        Toplam Kat Adedi metnini ELLE duzenlemesi bir SONRAKI "Hesapla"
//        tiklanana kadar EZILMEZ. "Hesapla" artik yapisal (floors) bir
//        degisiklik ureettiginden renderSection() de tetikler.
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
  normalInput.value = "2";

  const calculateButton = floorCountPanel.children.find((n) => n.tagName === "BUTTON");
  assert.equal(calculateButton.textContent, "Kat Dağılımını Hesapla", "'Kat Dağılımını Hesapla' butonu bulunamadi.");
  calculateButton.fire("click");

  const totalInput = floorCountPanel.children.find((n) => (n.children[0] || {}).textContent === "Toplam Kat Adedi").children[1];
  assert.equal(totalInput.value, "Zemin + 2 Normal Kat", "Toplam Kat Adedi metni kat dağılımından dogru uretilmedi.");
  assert.equal(context.state.tables.buildings[0].floorCounts.ground, "1", "Zemin adedi row.floorCounts'a yazilmadi.");
  assert.equal(context.state.tables.buildings[0].floorCounts.normal, "2", "Normal kat adedi row.floorCounts'a yazilmadi.");
  assert.equal(context.state.tables.buildings[0].floorCountText, "Zemin + 2 Normal Kat", "Toplam Kat Adedi row'a yazilmadi.");
  // Not: context.state.tables.buildings[0].floors VM-realm'de olusturulan
  // bir dizi — .map()'in ONA ait sonucu da VM-realm Array'i olabiliyor;
  // dis-realm bir dizi literaliyle assert.deepEqual bu yuzden YANILTICI
  // sekilde basarisiz olabilir (bu oturumda daha once de rastlanan bir
  // durum). join(",") karsilastirmasi realm'den bagimsiz calisir.
  assert.equal(
    context.state.tables.buildings[0].floors.map((floorRow) => floorRow.floor).join(","),
    "Zemin,1. Normal,2. Normal",
    "'Hesapla' kat sayimindan (1 Zemin + 2 Normal) dogru kat SATIRLARI uretmedi (Ana Taşınmaz Kat Satırları ile AYNI mantık bekleniyordu)."
  );
  assert.equal(context.state.tables.buildings[0].floors.length, 3, "'Hesapla' sonrasi kat satiri sayisi (3) beklenenden farkli.");
  assert.equal(context.renderSectionCalls, 1, "'Hesapla' yapisal (floors) degisiklik urettigi icin renderSection() cagirmali.");

  // Kullanici metni ELLE duzeltirse (ör. ek bir aciklama), sonraki "Hesapla"
  // tiklanana kadar bu deger KORUNMALI (autosave() cagrilir, ama grid'den
  // yeniden UZERINE YAZILMAZ).
  totalInput.value = "Zemin + 2 Normal Kat (çatı katı hariç)";
  totalInput.fire("input");
  assert.equal(context.state.tables.buildings[0].floorCountText, "Zemin + 2 Normal Kat (çatı katı hariç)", "Elle duzenlenen Toplam Kat Adedi metni satira yazilmadi.");
  assert(context.autosaveCalls > 1, "Toplam Kat Adedi elle duzenlemesi autosave() tetiklemedi.");
}

// --- 10) Kat Bazlı Alanlar paneli: bos durumda mesaj (MANUEL "Kat ekle" ----
//        YOK artik — satirlar SADECE Kat Dağılımı "Hesapla" ile olusur).
{
  const rows = [{ name: "Ana Bina", floors: [] }];
  const { panel } = runEditorScenario(rows);
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const floorPanel = content.children.find((n) => (n.className || "").includes("building-structure-floor-panel"));
  assert(floorPanel, "Kat Bazlı Alanlar paneli bulunamadi.");
  const emptyNote = floorPanel.children.find((n) => (n.className || "").includes("empty-table-note"));
  assert(emptyNote, "Bos kat listesinde bilgilendirme mesaji yok.");
  assert.match(emptyNote.textContent, /Kat Dağılımını Hesapla/, "Bos durum mesaji artik 'Kat Dağılımını Hesapla' akisina yonlendirmeli.");
  const addFloorButton = floorPanel.children.find((n) => n.tagName === "BUTTON");
  assert.equal(addFloorButton, undefined, "'Kat Bazlı Alanlar' panelinde artik MANUEL 'Kat ekle' butonu OLMAMALI (satirlar Kat Dağılımı'ndan turer).");
}

// --- 11) Kat Dağılımı'ndan uretilen kat satirlari: Kat adi SALT-OKUNUR, ---
//        Yasal/Mevcut Alan duzenlenebilir, Toplam Yasal/Mevcut Alan otomatik
//        hesaplanir, İç Hacimler 10 ayri select ile (Bağımsız Bölüm ile AYNI
//        desen) coklu secilir — "harmanlanmis" istegin tam karsiligi.
{
  const rows = [{
    name: "Fabrika Binası",
    floors: [
      { floor: "Zemin", legalArea: "1000", currentArea: "1050", interiors: "Salon, Depo" },
      { floor: "1. Normal", legalArea: "500", currentArea: "600", interiors: "" },
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
  assert.equal(head.className, "unit-floor-card-head building-structure-floor-head", "Kat karti basligi kendi (dar) grid sinifini kullanmiyor.");
  assert.equal(head.children.length, 3, "Kat karti basliginda tam olarak 3 alan (Kat/Yasal Alan/Mevcut Alan) olmali — silme butonu YOK artik.");

  const floorNameField = head.children[0];
  const floorNameDisplay = floorNameField.children[1];
  assert.equal(floorNameDisplay.tagName, "SPAN", "Kat adi artik duzenlenebilir SELECT degil, salt-okunur bir span olmali.");
  assert.equal(floorNameDisplay.textContent, "Zemin", "Kat adi dogru gosterilmedi.");
  assert(floorNameDisplay.className.includes("is-readonly"), "Kat adi span'i salt-okunur gorunumde olmali.");

  const legalInput = head.children[1].children[1];
  const currentInput = head.children[2].children[1];
  assert.equal(legalInput.value, "1000", "Yasal Alan on-doldurulmadi.");
  assert.equal(currentInput.value, "1050", "Mevcut Alan on-doldurulmadi.");
  legalInput.value = "1100";
  legalInput.fire("input");
  assert.equal(context.state.tables.buildings[0].floors[0].legalArea, "1100", "Yasal Alan duzenlemesi satira yazilmadi.");

  const interiorRow = firstCard.children.find((n) => (n.className || "").includes("unit-floor-card-interior-row"));
  const picker = interiorRow.children[0];
  assert(picker.className.includes("unit-floor-interior-picker"), "İç Hacimler picker'i bulunamadi.");
  const selects = picker.children[1].children;
  assert.equal(selects.length, 10, "İç Hacimler TAM OLARAK 10 ayri select icermeli (kullanici talebi).");
  assert.equal(selects[0].value, "Salon", "Onceden secili ilk İç Hacim ('Salon') on-doldurulmadi.");
  assert.equal(selects[1].value, "Depo", "Onceden secili ikinci İç Hacim ('Depo') on-doldurulmadi.");
  assert.equal(selects[2].value, "", "Kullanilmayan select bos ('Seçiniz') olmali.");

  // Bir select degistirilince TUM secili degerler virgulle birlestirilip
  // floorRow.interiors'a yazilir (Bağımsız Bölüm'un unitFloor picker'i
  // ile AYNI birlestirme mantigi).
  selects[2].value = "Mutfak";
  selects[2].fire("input");
  assert.equal(context.state.tables.buildings[0].floors[0].interiors, "Salon, Depo, Mutfak", "İç Hacimler secimi virgullu metne dogru birlestirilmedi.");
}

// --- 12) "Bu Yapıyı Sil": onay reddedilirse hicbir sey degismez; onaylanirsa
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

  context.confirmActionShouldConfirm = false;
  deleteButton.fire("click");
  assert.equal(context.state.tables.buildings.length, 2, "Onay reddedilmesine ragmen yapi silindi.");
  assert.equal(context.lastConfirmActionMessage, "Bu yapıyı ve tüm kat bilgilerini silmek istediğinize emin misiniz?", "Onay penceresi dogru mesajla acilmadi.");

  context.confirmActionShouldConfirm = true;
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

// --- 12b) REGRESYON (2026-09-19, kullanici ekran goruntusuyle bildirdi):
//          "Bu tusa basiyorum ancak silme islemi gerceklesmiyor. Hic bir
//          sey olmuyor." Kok neden: normalizeStructureDocumentTables()
//          HER debounced autosave'de `tables.buildings = tables.buildings.map(...)`
//          ile diziyi YENI bir sarmalayiciyla degistiriyor (satir objeleri
//          ayni kalsa da). Render ile tiklama arasinda BU bir kez bile
//          olsa, ESKI kod (`rows[index]` closure) hayalet bir diziyi
//          splice'liyordu — ekranda hicbir sey degismiyordu. Bu senaryo
//          TAM O DURUMU simule eder: render SONRASI, state.tables.buildings
//          (ayni satir objeleriyle) YENI bir dizi sarmalayicisina degistirilir,
//          SONRA silme tuşuna basilir — duzeltme YENI diziyi (id'ye gore
//          bulup) degistirmeli.
{
  // createBuildingStructuresEditor() kendisi normalizeBuildingStructureRow'u
  // toplu cagirmiyor (bunu gercek app.js'te normalizeStructureDocumentTables()
  // yapiyor, bu test dosyasinin kapsami DISINDA) — bu yuzden id'ler burada
  // ELLE atanir (gercek uygulamada ensurePersistentRecordId ile ayni sekilde
  // olusurlar).
  const rowA = { id: "building-test-a", name: "Ana Bina" };
  const rowB = { id: "building-test-b", name: "Depo" };
  const rows = [rowA, rowB];
  const { panel, context } = runEditorScenario(rows);
  const [normalizedA, normalizedB] = context.state.tables.buildings;
  assert(normalizedA.id && normalizedB.id, "Test on-kosulu: satirlara id atanmadi.");

  const tabBar = panel.children.find((n) => (n.className || "").includes("building-structure-tab-bar"));
  const content = panel.children.find((n) => (n.className || "").includes("building-structure-tab-content"));
  const deleteWrap = content.children.find((n) => (n.className || "").includes("building-structure-delete-wrap"));
  const deleteButton = deleteWrap.children[0];

  // normalizeStructureDocumentTables()'in HER autosave'de yaptigi gibi,
  // AYNI satir objeleriyle YENI bir dizi sarmalayicisi olustur ve
  // state.tables.buildings'i BUNUNLA degistir (render anindaki `rows`
  // referansindan artik BAGIMSIZ).
  context.state.tables.buildings = context.state.tables.buildings.map((row) => row);
  const liveArrayAfterNormalize = context.state.tables.buildings;

  context.confirmActionShouldConfirm = true;
  deleteButton.fire("click"); // aktif sekme hala ilk yapi ("Ana Bina"), silinmesi beklenen o

  assert.equal(
    context.state.tables.buildings.length,
    1,
    "Render sonrasi dizi yeniden olusturulunca (normalize simulasyonu) silme calismiyor (kullanicinin bildirdigi hata)."
  );
  assert.equal(
    liveArrayAfterNormalize,
    context.state.tables.buildings,
    "Duzeltme normalize-sonrasi GUNCEL diziyi mutasyona ugratmali (ayni referans); eski kod render anindaki hayalet diziyi degistirip bu referansi HIC etkilemezdi."
  );
  assert.equal(context.state.tables.buildings[0].name, "Depo", "Yanlis yapi silindi; aktif sekmedeki 'Ana Bina' silinmeliydi.");
}

console.log("createBuildingStructuresEditor() (Yapı Ekle, tab mantığı) davranış testleri tamam.");

// --- 13) renderSection() kaynak-duzeyinde "building" bolumune -------------
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

// --- 14) "buildings" tablosu TITLE_UNIT_SCOPED_TABLE_KEYS_BASE'e eklendi mi
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

// --- 13) REGRESYON (2026-09-19, kullanıcı talebi): "yapı bölümünden kat
// adedi / dağılımı bölümünü çıkar ve bu bölüme yapı durumu bölümünü
// taşı" — "Parseldeki Yapılar" merkezi tablosu artık "Kat Adedi /
// Dağılımı" (salt-okunur özet metni — asıl düzenleme zaten Bina
// Özellikleri'ndeki Kat Dağılımı panelinde yapılıyor, ORAYA DOKUNULMADI)
// yerine "Yapı Durumu" (BUILDING_STRUCTURE_STATUS_OPTIONS) sütununu
// gösteriyor.
{
  const rowA = { id: "building-test-a", name: "Fabrika", status: "Aktif" };
  const { context } = runEditorScenario([rowA]);
  const panel = context.createParcelBuildingsRegistryEditor();
  const table = findAllStubs(panel, "TABLE")[0];
  assert(table, "'Parseldeki Yapılar' tablosu bulunamadı.");
  assert.match(table.innerHTML, /<th>Yapı Durumu<\/th>/, "'Yapı Durumu' sütun başlığı tabloda yok.");
  assert.doesNotMatch(table.innerHTML, /Kat Adedi \/ Dağılımı/, "'Kat Adedi \/ Dağılımı' sütunu HÂLÂ tabloda (kaldırılmalıydı).");

  const tbody = table.children.find((n) => n.tagName === "TBODY");
  const dataRow = tbody.children[0];
  const statusSelect = dataRow.children[4].children[0]; // 0:Yapı Adı, 1:Kullanım, 2:Yapı Tarzı, 3:Yapı Sınıfı, 4:[Yapı Durumu]
  assert.equal(dataRow.children.length, 6, `Satırda 4 alan + Yapı Durumu + silme sütunu = 6 hücre beklenir, bulunan: ${dataRow.children.length}`);
  const statusOptionValues = statusSelect.children.map((opt) => opt.value);
  assert(statusOptionValues.length > 1, "Yapı Durumu <select>'inde BUILDING_STRUCTURE_STATUS_OPTIONS seçenekleri yok.");
  statusSelect.value = statusOptionValues[1];
  statusSelect.fire("change");
  assert.equal(context.state.tables.buildings[0].status, statusOptionValues[1], "Yapı Durumu seçimi row.status'e yazılmadı.");

  console.log("createParcelBuildingsRegistryEditor(): 'Kat Adedi / Dağılımı' kaldırıldı, 'Yapı Durumu' eklendi testi tamam.");
}

// --- 14) createBuildingStructureTabContent(): merkezi kayıt modunda
// "Yapı Durumu" ARTIK TEKRAR gösterilmemeli (tabloya taşındı); merkezi
// OLMAYAN modda (blok gruplaması aktifken) DEĞİŞMEDEN kalmalı.
{
  const realBody = sliceFn("function createBuildingStructureTabContent(");
  assert.match(
    realBody,
    /if \(!centralRegistryMode\) grid\.append\(createBuildingStructureSelectField\(row, "status", "Yapı Durumu", BUILDING_STRUCTURE_STATUS_OPTIONS\)\);/,
    "'Yapı Durumu' alanı artık yalnızca merkezi-OLMAYAN modda eklenmeli (kaynak-düzeyi)."
  );
  console.log("createBuildingStructureTabContent(): 'Yapı Durumu' yalnızca merkezi-OLMAYAN modda ekleniyor (kaynak-düzeyi) testi tamam.");
}

console.log("Yapilar (Bina Ozellikleri 'Yapı Ekle', tab mantığı) testleri basarili.");
