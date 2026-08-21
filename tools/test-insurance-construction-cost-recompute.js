// Kullanıcı bildirimi (2026-08-21): "sigortaya esas değer tabloda otomatik
// hesaplanmıyor". KÖK NEDEN: refreshValuationComputedFields() (Değerleme
// özet tablosunun TÜM taşınmazlar için hesaplama zinciri, computeValuationFieldsForAllTitleUnits()
// tarafından her taşınmaz için sırayla çağrılır) `state.fields.insuranceUnitCost`'u
// OKUYORDU (insuranceValue = Alan × Birim Maliyet) ama HİÇ YAZMIYORDU —
// legalBuildingUnitCost'un aksine (syncBuildingValueDefaults() ile ZATEN
// zincirin İÇİNDE), insuranceUnitCost SADECE refreshInsuranceConstructionCostFromCurrentFields()
// tarafından, SADECE genel form hub'ının "buildingClass" alanı GERÇEKTEN
// elle değiştirildiğinde tetikleniyordu.
//
// Bu test kapsamı:
//  1) refreshInsuranceConstructionCostFromCurrentFields() argümansız
//     (changedKey="") çağrıldığında (refreshValuationComputedFields()'in
//     ÇAĞIRACAĞI şekilde) insuranceUnitCost/insuranceConstructionClass/
//     insuranceConstructionCostExplanation'ı GERÇEK buildingClass'tan
//     doğru hesaplar.
//  2) Arsa/Tarla mülkiyetinde (insuranceUnitCost anlamsız) alanları
//     boşaltır (regresyon, mevcut davranış).
//  3) suppressValuationSideEffects=true iken state.fields YİNE DE
//     güncellenir AMA DOM senkronu (querySelector çağrı sayacı ile
//     doğrudan doğrulanır) HİÇ ÇALIŞMAZ — guard'ın state hesaplamasından
//     SONRA, yalnızca DOM senkronunun önünde olduğunun kanıtı.
//  4) refreshValuationComputedFields()'in KAYNAK DÜZEYİNDE
//     refreshInsuranceConstructionCostFromCurrentFields()'i çağırdığı
//     doğrulanır (kablolama regresyonu).

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

function extractArrayConst(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, index + 1)};`;
    }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "normalizeOwnershipTypeForSectionVisibility",
  "isLandOwnershipType",
  "getInsuranceConstructionCostRow",
  "formatInsuranceUnitCost",
  "refreshInsuranceConstructionCostFromCurrentFields",
];

const sandboxSource = `
  let state = { fields: {}, tables: {} };
  let suppressValuationSideEffects = false;
  // Senaryo 1/2 (suppress=false) DOM senkron dalina ulasir - sandbox'ta
  // gercek DOM yok, cagri SAYAN bir sahte kullanilir (senaryo 3, suppress=true
  // iken bu sahtenin HIC cagrilmadigini dogrudan dogrular - guard'in DOGRU
  // yerde oldugunun kanit).
  let querySelectorCallCount = 0;
  const document = { querySelector: () => { querySelectorCallCount += 1; return null; } };
  ${extractArrayConst("insuranceConstructionCostRows")}
  // buildInsuranceConstructionCostExplanation() gercek govdesi variant-secim
  // altyapisina (registerVariantGroup/selectVariant) bagimli - bu testin
  // odagi DEGIL, basit bir SAHTE ile degistirilir (computeValuationFieldsForAllTitleUnits()
  // testindeki refreshValuationComputedFields sahtesiyle AYNI ilke).
  function foldTurkish(value) { return String(value || "").toLocaleUpperCase("tr"); }
  function buildInsuranceConstructionCostExplanation() { return "ACIKLAMA-SAHTE"; }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    setSuppress: (v) => { suppressValuationSideEffects = v; },
    getQuerySelectorCallCount: () => querySelectorCallCount,
    resetQuerySelectorCallCount: () => { querySelectorCallCount = 0; },
    refreshInsuranceConstructionCostFromCurrentFields,
    getInsuranceConstructionCostRow,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) Argumansiz cagri (zincirin cagiracagi sekilde) buildingClass'tan --
// dogru hesaplar.
{
  fns.setState({ fields: { ownershipType: "Müstakil Bina", buildingClass: "3/B" }, tables: {} });
  fns.refreshInsuranceConstructionCostFromCurrentFields();
  const state = fns.getState();
  assert.equal(state.fields.insuranceConstructionClass, "3/B", "insuranceConstructionClass buildingClass'tan dogru alinmali.");
  assert.equal(state.fields.insuranceUnitCost, "21.050,00 TL/m²", "insuranceUnitCost gercek insuranceConstructionCostRows tablosundan dogru hesaplanmali.");
  assert.equal(state.fields.insuranceConstructionCostExplanation, "ACIKLAMA-SAHTE");
  assert.ok(fns.getQuerySelectorCallCount() > 0, "suppress=false iken DOM senkronu (querySelector) CALISMALI.");
  fns.resetQuerySelectorCallCount();
  console.log("Argumansiz cagride insuranceUnitCost dogru hesaplaniyor testi tamam.");
}

// --- 2) Arsa/Tarla mulkiyetinde alanlar bosaltilir (regresyon) ------------
{
  fns.setState({ fields: { ownershipType: "Arsa", buildingClass: "3/B", insuranceUnitCost: "ESKI-DEGER" }, tables: {} });
  fns.refreshInsuranceConstructionCostFromCurrentFields();
  const state = fns.getState();
  assert.equal(state.fields.insuranceUnitCost, "", "Arsa mulkiyetinde insuranceUnitCost bosalmali.");
  assert.equal(state.fields.insuranceConstructionClass, "");
  console.log("Arsa/Tarla mulkiyetinde bosaltma regresyon testi tamam.");
}

// --- 3) suppressValuationSideEffects=true iken state YINE DE guncellenir -
// (DOM senkronu -querySelector- ATLANIR - guard'in DOGRU yerde oldugunun
// DOGRUDAN kaniti, sadece dolayli/crash-tabanli degil).
{
  fns.resetQuerySelectorCallCount();
  fns.setState({ fields: { ownershipType: "Müstakil Bina", buildingClass: "3/A" }, tables: {} });
  fns.setSuppress(true);
  fns.refreshInsuranceConstructionCostFromCurrentFields();
  const state = fns.getState();
  assert.equal(state.fields.insuranceConstructionClass, "3/A", "suppressValuationSideEffects=true iken de state.fields GUNCELLENMELI (computeValuationFieldsForAllTitleUnits()'in sessiz dongusu icin gerekli).");
  assert.ok(state.fields.insuranceUnitCost, "suppressValuationSideEffects=true iken insuranceUnitCost BOS KALMAMALI.");
  assert.equal(fns.getQuerySelectorCallCount(), 0, "suppress=true iken DOM senkronu (querySelector) HIC CALISMAMALI.");
  fns.setSuppress(false);
  console.log("suppressValuationSideEffects=true iken state hesaplaniyor, DOM senkronu atlaniyor testi tamam.");
}

// --- 4) refreshValuationComputedFields() kaynak-duzeyinde -----------------
// refreshInsuranceConstructionCostFromCurrentFields()'i cagiriyor mu.
{
  const fnStart = appSource.indexOf("\nfunction refreshValuationComputedFields(");
  assert(fnStart >= 0, "refreshValuationComputedFields bulunamadi.");
  const bodyEnd = appSource.indexOf("\n}\n", fnStart);
  const body = appSource.slice(fnStart, bodyEnd);
  assert.match(
    body,
    /refreshInsuranceConstructionCostFromCurrentFields\(\);/,
    "refreshValuationComputedFields() refreshInsuranceConstructionCostFromCurrentFields()'i cagirmiyor - insuranceUnitCost diger tasinmazlar icin hic yenilenmez."
  );
  // Cagri, insuranceValue hesaplanmadan ONCE olmali (aksi halde eski/bos
  // insuranceUnitCost kullanilir).
  const callIndex = body.indexOf("refreshInsuranceConstructionCostFromCurrentFields();");
  const useIndex = body.indexOf("state.fields.insuranceValue =");
  assert.ok(callIndex >= 0 && useIndex >= 0 && callIndex < useIndex, "refreshInsuranceConstructionCostFromCurrentFields() insuranceValue hesaplanmadan ONCE cagrilmali.");
  console.log("refreshValuationComputedFields kaynak-duzeyi kablolama testi tamam.");
}

console.log("Sigortaya Esas Deger otomatik hesaplama duzeltmesi testleri basarili.");
