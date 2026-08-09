// Çoklu TAKBİS Faz 2 — tab-anahtarlama motoru testi (2026-08-09, bkz.
// docs/coklu-takbis-import-plan.md "Faz 2: state.titleUnits[] veri modeli").
// switchActiveTitleUnit/addTitleUnitTab/removeActiveTitleUnitTab BİLİNÇLİ
// OLARAK render()/saveState()/isCurrentUserAdmin() ÇAĞIRMAZLAR (yalnızca
// state mutasyonu) — bu sayede DOM/localStorage olmadan sandbox'ta test
// edilebilirler. createTitleUnitTabBar() (gerçek DOM üretimi) buradan
// KAPSAM DIŞI — admin girişi gerektirdiği için canlıda görsel test
// yapılamıyor (standart proje kısıtlaması), yalnızca node --check +
// npm run verify + kod incelemesiyle doğrulandı (bkz. handoff.md).
//
// Kapsanan senaryolar:
//  1) Tek taşınmaz (titleUnits boş): getTitleUnitCount()===1, switch no-op.
//  2) Yeni taşınmaz ekleme: state.fields'taki Tapu/Takyidat alanları
//     KORUNUR (yeni tab boş açılır, birincil DEĞİŞMEZ), paylaşımlı alanlar
//     (ör. city) HİÇ ETKİLENMEZ.
//  3) İleri-geri geçiş (0 -> 1 -> 0): veri KAYBOLMAZ, her iki taşınmazın
//     kendi alanları doğru yerde kalır (kritik round-trip testi).
//  4) Malikler tablosu (state.tables.title) taşınmaza göre doğru ayrılır.
//  5) Ek taşınmaz silme: aktif taşınmaz birincile döner, dizi küçülür,
//     birincil SİLİNEMEZ.
//  6) Paylaşımlı alanlar (address bölümü, "unit"/"valuation" bölümü
//     alanları) HİÇBİR taşınmaz geçişinde DEĞİŞMEZ (kapsam dışı olduğunun
//     kanıtı).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "createEmptyTitleUnit",
  "computeTitleUnitTabLabel",
  "getTitleUnitScopedFieldKeys",
  "snapshotTitleUnitScopedData",
  "applyTitleUnitScopedData",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTabModels",
  "switchActiveTitleUnit",
  "addTitleUnitTab",
  "removeActiveTitleUnitTab",
];

// Gerçek uygulamadaki "title"/"encumbrance" sekmelerinin alan anahtarlarını
// TAM olarak birebir kopyalamak yerine (kırılgan olurdu — sections dizisi
// değişince test sessizce eskir), doğrudan appSource'tan
// TITLE_UNIT_SCOPED_SECTION_IDS sabitinin GERÇEKTEN "title"/"encumbrance"
// olduğunu doğruluyoruz; fixture `sections`, testin kendi kontrollü alan
// kümesini temsil eder (fonksiyonlar section.id'ye göre fields okur, hangi
// ANAHTARLARIN var olduğu testin kendi sorumluluğunda).
{
  assert.match(
    appSource,
    /const TITLE_UNIT_SCOPED_SECTION_IDS = \["title", "encumbrance"\];/,
    "TITLE_UNIT_SCOPED_SECTION_IDS kapsamı beklenmedik şekilde değişmiş (title/encumbrance dışına genişlemiş veya daralmış) — bu test fixture'ı da güncellenmeli."
  );
}

const sandboxSource = `
let sections = [
  { id: "title", fields: [{ key: "blockNo" }, { key: "parcelNo" }, { key: "titleBlockName" }, { key: "unitNo" }, { key: "titleQuality" }] },
  { id: "encumbrance", fields: [{ key: "takbisSummary" }, { key: "takbisDate" }] },
  { id: "address", fields: [{ key: "city" }] },
  { id: "unit", fields: [{ key: "legalArea" }] },
];
let state = null;
const TITLE_UNIT_SCOPED_SECTION_IDS = ["title", "encumbrance"];
const TITLE_UNIT_SCOPED_TABLE_KEYS = ["title", "encumbrance", "encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages"];
${functionNames.map(extractFunction).join("\n")}
return {
  fns: { ${functionNames.join(", ")} },
  getState: () => state,
  setState: (s) => { state = s; },
};
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

function freshState(overrides = {}) {
  return {
    fields: { city: "İstanbul", blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "3", titleQuality: "MESKEN", takbisSummary: "" },
    tables: { title: [{ c0: "MALİK BİR" }] },
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) Tek taşınmaz: count===1, switch no-op --------------------------
{
  sandbox.setState(freshState());
  assert.equal(sandbox.fns.getTitleUnitCount(), 1, "titleUnits boşken toplam 1 (yalnızca birincil) olmalı.");
  const changed = sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(changed, false, "Zaten aktif olan index'e geçiş no-op (false) dönmeli.");
  const changed2 = sandbox.fns.switchActiveTitleUnit(5);
  assert.equal(changed2, false, "Aralık dışı index'e geçiş no-op (false) dönmeli, hata fırlatmamalı.");
  console.log("Tek tasinmaz (count=1, no-op switch) testi tamam.");
}

// --- 2) Yeni taşınmaz ekleme: birincil değişmez, yeni tab boş -----------
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  assert.equal(newIndex, 1, "İlk ek taşınmaz index 1 olmalı (0 birincil).");
  assert.equal(sandbox.getState().titleUnits.length, 1, "titleUnits'e 1 eleman eklenmeli.");

  const switched = sandbox.fns.switchActiveTitleUnit(newIndex);
  assert.equal(switched, true, "Geçiş başarılı olmalı.");
  const afterSwitch = sandbox.getState();
  assert.equal(afterSwitch.activeTitleUnitIndex, 1, "activeTitleUnitIndex güncellenmeli.");
  assert.equal(afterSwitch.fields.blockNo, undefined, "Yeni (boş) taşınmaza geçince Ada alanı BOŞ olmalı.");
  assert.equal(afterSwitch.fields.city, "İstanbul", "Paylaşımlı alan (city) taşınmaz geçişinden ETKİLENMEMELİ.");
  assert.ok(afterSwitch.primaryTitleUnitShadow, "Birincilin verisi primaryTitleUnitShadow'a park edilmeli.");
  assert.equal(afterSwitch.primaryTitleUnitShadow.fields.blockNo, "709", "Park edilen birincil verisi (Ada) doğru olmalı.");
  console.log("Yeni tasinmaz ekleme (birincil korunur, paylasimli alan etkilenmez) testi tamam.");
}

// --- 3) İleri-geri geçiş: veri kaybolmaz (kritik round-trip) ------------
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);

  // İkinci taşınmaza kendi verisini gir.
  const afterAdd = sandbox.getState();
  afterAdd.fields.blockNo = "845";
  afterAdd.fields.parcelNo = "7";
  afterAdd.fields.titleBlockName = "B";
  afterAdd.fields.unitNo = "12";

  // Birincile geri dön.
  const backToPrimary = sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(backToPrimary, true, "Birincile geçiş başarılı olmalı.");
  const primaryState = sandbox.getState();
  assert.equal(primaryState.fields.blockNo, "709", "Birincilin Ada'sı (709) EKSİKSİZ geri gelmeli.");
  assert.equal(primaryState.fields.titleBlockName, "A", "Birincilin Blok'u (A) EKSİKSİZ geri gelmeli.");
  assert.equal(primaryState.primaryTitleUnitShadow, null, "Birincile dönünce shadow temizlenmeli.");
  assert.equal(primaryState.titleUnits[0].fields.blockNo, "845", "İkinci taşınmazın girilen verisi (845) kendi yuvasına doğru kaydedilmeli.");

  // Tekrar ikinci taşınmaza geç, verisi hâlâ orada mı?
  sandbox.fns.switchActiveTitleUnit(1);
  const secondAgain = sandbox.getState();
  assert.equal(secondAgain.fields.blockNo, "845", "İkinci taşınmaza tekrar geçince girilen veri (845) KAYBOLMAMALI.");
  assert.equal(secondAgain.fields.unitNo, "12", "İkinci taşınmazın BB No'su (12) korunmalı.");
  console.log("Ileri-geri gecis (veri kaybolmuyor, round-trip) testi tamam.");
}

// --- 4) Malikler tablosu (state.tables.title) taşınmaza göre ayrılır ----
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  assert.equal(afterAdd.tables.title, undefined, "Yeni taşınmazın malikler tablosu BOŞ (undefined, createTable kendi varsayılanını üretsin) olmalı.");
  afterAdd.tables.title = [{ c0: "MALİK İKİ" }];

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryState = sandbox.getState();
  assert.deepEqual(primaryState.tables.title, [{ c0: "MALİK BİR" }], "Birincilin malikler tablosu (MALİK BİR) korunmalı.");

  sandbox.fns.switchActiveTitleUnit(1);
  const secondAgain = sandbox.getState();
  assert.deepEqual(secondAgain.tables.title, [{ c0: "MALİK İKİ" }], "İkinci taşınmazın malikler tablosu (MALİK İKİ) korunmalı.");
  console.log("Malikler tablosu (state.tables.title) tasinmaza gore ayrilma testi tamam.");
}

// --- 5) Ek taşınmaz silme: birincile döner, dizi küçülür, birincil silinemez ---
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);

  const removedFromPrimary = sandbox.fns.removeActiveTitleUnitTab.call(null);
  // removeActiveTitleUnitTab çağrılırken activeTitleUnitIndex hâlâ 1 (ikinci taşınmaz).
  assert.equal(removedFromPrimary, true, "Aktif (birincil olmayan) taşınmaz silinebilmeli.");
  const afterRemove = sandbox.getState();
  assert.equal(afterRemove.activeTitleUnitIndex, 0, "Silme sonrası aktif tab birincile dönmeli.");
  assert.equal(afterRemove.titleUnits.length, 0, "titleUnits dizisi küçülmeli.");
  assert.equal(afterRemove.fields.blockNo, "709", "Birincilin verisi silme sonrası bozulmamalı.");

  const removedPrimary = sandbox.fns.removeActiveTitleUnitTab();
  assert.equal(removedPrimary, false, "Birincil taşınmaz SİLİNEMEMELİ (false dönmeli, hata fırlatmamalı).");
  console.log("Ek tasinmaz silme (birincile doner, birincil silinemez) testi tamam.");
}

// --- 6) Paylaşımlı/kapsam-dışı alanlar hiçbir geçişte değişmez ----------
{
  const state = freshState({ fields: { city: "Ankara", blockNo: "1", parcelNo: "1", legalArea: "120" } });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  assert.equal(afterAdd.fields.city, "Ankara", "\"address\" sekmesi alanı (city) taşınmaz geçişinden etkilenmemeli.");
  assert.equal(afterAdd.fields.legalArea, "120", "\"unit\" sekmesi alanı (legalArea) KAPSAM DIŞI olduğu için taşınmaz geçişinden etkilenmemeli (Faz 2 bilinçli sınırlama).");
  console.log("Paylasimli/kapsam-disi alanlarin etkilenmemesi testi tamam.");
}

console.log("Coklu TAKBIS Faz 2 tab-anahtarlama motoru testleri basarili.");
