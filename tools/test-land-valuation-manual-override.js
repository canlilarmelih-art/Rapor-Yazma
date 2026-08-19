const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const manualOverrideSource = sourceBetween("function hasUserDefinedLandMarketValue", "function refreshValuationComputedFields");
const setAutoSource = sourceBetween("function setAutoValuationField", "function calculateBuildingValuationValue");
const landDefaultsSource = sourceBetween("function syncLandOwnershipValuationDefaults", "function syncBuildingValueDefaults");

function runLandSync({ tarla, legalValue, currentValue, previousAuto, nextValue, userDefined = false }) {
  const context = {
    state: {
      fields: {
        landArea: "100",
        legalValue,
        currentValue,
        legalValueComparableAuto: previousAuto,
        currentValueComparableAuto: previousAuto,
        legalValueUserDefined: userDefined ? "1" : "",
        currentValueUserDefined: userDefined ? "1" : "",
      },
    },
    isLandOwnershipType: () => true,
    isTarlaOwnershipType: () => tarla,
    parseValuationNumber: (value) => Number(String(value).replaceAll(".", "").replace(",", ".")),
    formatValuationArea: (value) => String(value),
    formatValuationMoney: (value) => String(value),
    getComparableCalculatedEmsalValuationMetrics: () => ({ marketValue: nextValue }),
    getComparableValuationRows: () => [{ landComparable: true }],
    calculateComparableValuationAverages: () => ({ adjustedUnitValue: nextValue / 100 }),
    roundComparableValuationValue: (value) => value,
    comparableValuationRoundStep: 50000,
  };
  vm.runInNewContext(`${manualOverrideSource}\n${setAutoSource}\n${landDefaultsSource}\nsyncLandOwnershipValuationDefaults();`, context);
  return context.state.fields;
}

[false, true].forEach((tarla) => {
  const preserved = runLandSync({
    tarla,
    legalValue: "900000",
    currentValue: "900000",
    previousAuto: "800000",
    nextValue: 1000000,
  });
  assert.equal(preserved.legalValue, "900000");
  assert.equal(preserved.currentValue, "900000");
  assert.equal(preserved.legalValueComparableAuto, "1000000");
  assert.equal(preserved.currentValueComparableAuto, "1000000");

  const refreshed = runLandSync({
    tarla,
    legalValue: "800000",
    currentValue: "800000",
    previousAuto: "800000",
    nextValue: 1000000,
  });
  assert.equal(refreshed.legalValue, "1000000");
  assert.equal(refreshed.currentValue, "1000000");

  const locked = runLandSync({
    tarla,
    legalValue: "900000",
    currentValue: "900000",
    previousAuto: "900000",
    nextValue: 1000000,
    userDefined: true,
  });
  assert.equal(locked.legalValue, "900000");
  assert.equal(locked.currentValue, "900000");
  assert.equal(locked.legalValueComparableAuto, "1000000");
  assert.equal(locked.currentValueComparableAuto, "1000000");
});

console.log("land valuation manual override tests passed");

// --- "Otomatik hesaplamaya dön" düğmesi (0.0.42x, 2026-08-13) -------------
// Kullanıcı bildirimi: "Emsaller'de Arsa Emsali değerlerini değiştirdim
// ama Yasal/Mevcut Durum Değeri otomatik yazılmadı — var olan taslak
// olabilir mi?" — yukarıdaki "locked" senaryosu bunu zaten kanıtlıyor
// (userDefined:true iken legalValue/currentValue KİLİTLİ kalıyor, yalnızca
// ...ComparableAuto gölge alanı güncelleniyor). Önceden bu kilidi açmanın
// HİÇBİR yolu yoktu; clearLandValuationManualOverride() + arayüzdeki
// "Otomatik hesaplamaya dön" düğmesi bunu çözer. Burada iki şey doğrulanır:
// (1) fonksiyon GERÇEKTEN iki bayrağı da temizliyor VE
//     refreshValuationComputedFields()'i çağırıyor (kaynak-düzeyi),
// (2) bayraklar temizlendikten SONRA syncLandOwnershipValuationDefaults()
//     artık kilitli DEĞİL, yeni emsal değerini yazıyor (davranışsal,
//     yukarıdaki runLandSync ile aynı sandbox'ı yeniden kullanır).
{
  const resetFnSource = sourceBetween("function clearLandValuationManualOverride", "function createLandValuationResetToAutoButton");
  assert.match(resetFnSource, /state\.fields\[`\$\{key\}UserDefined`\] = "";/, "clearLandValuationManualOverride artik UserDefined bayragini temizlemiyor.");
  assert.match(resetFnSource, /state\.fields\[`\$\{key\}ComparableAutoManual`\] = "";/, "clearLandValuationManualOverride artik ComparableAutoManual bayragini temizlemiyor.");
  assert.match(resetFnSource, /refreshValuationComputedFields\(\);/, "clearLandValuationManualOverride otomatik hesaplamayi yeniden tetiklemiyor.");

  // Dropdown/arayuz kablolamasi: createValuationMarketTable, arsa/arazi
  // mulkiyette VE deger kilitliyken duzeltme dugmesini gercekten ekliyor mu?
  const marketTableSource = sourceBetween("function createValuationMarketTable", "function createValuationUrgentSaleTable");
  assert.match(
    marketTableSource,
    /if \(landOwnership && hasUserDefinedLandMarketValue\(row\.totalKey\)\) \{\s*labelCell\.append\(createLandValuationResetToAutoButton\(row\.totalKey\)\);/,
    "createValuationMarketTable, kilitli arsa/arazi degerleri icin sifirlama dugmesini eklemiyor."
  );

  // Davranissal: kilit acildiktan SONRA otomatik hesaplama gercekten calisir mi?
  const stillLocked = runLandSync({
    tarla: true,
    legalValue: "900000",
    currentValue: "900000",
    previousAuto: "900000",
    nextValue: 1200000,
    userDefined: true,
  });
  assert.equal(stillLocked.legalValue, "900000", "On-kosul: kilit senaryosu hala kilitli degil.");

  // clearLandValuationManualOverride'in yaptigi TAM ISLEMI (bayrak temizleme)
  // simule edip ayni sync fonksiyonunu tekrar calistiriyoruz.
  const unlockedContext = runLandSync({
    tarla: true,
    legalValue: "900000",
    currentValue: "900000",
    previousAuto: "900000",
    nextValue: 1200000,
    userDefined: false, // <-- clearLandValuationManualOverride'in temizledigi bayragin karsiligi
  });
  assert.equal(unlockedContext.legalValue, "1200000", "Bayraklar temizlendikten sonra otomatik hesaplama yeni emsal degerini yazmadi.");
  assert.equal(unlockedContext.currentValue, "1200000", "Bayraklar temizlendikten sonra otomatik hesaplama yeni emsal degerini yazmadi (currentValue).");

  console.log("Otomatik hesaplamaya don (clearLandValuationManualOverride) testi tamam.");
}

// --- "Değerleme'ye girip çıkınca Arsa/Tarla'da Yasal/Mevcut Durum Değeri
// siliniyor" (0.0.48x, 2026-08-20) --------------------------------------
// Kullanıcı bildirimi: "2 adet tarladan oluşan çoklu raporda Değerleme
// bölümünde değerleri giriyorum yasal ve mevcut olmak üzere ancak başka
// bir bölüme geçip geri döndüğümde değerler siliniyor." Kök neden:
// clearLandOwnershipDependentData() createValuationEditor()'da HER
// render'da koşulsuz çağrılıyor VE legalValue/currentValue/...Area/...Unit
// (createValuationMarketTable'ın Arsa/Tarla'da GERÇEKTEN kullandığı Piyasa
// Değeri alanları) yanlışlıkla "bina-özgü" temizlik listesindeydi. Burada
// hem gerçek fonksiyon kaynağından çıkarılıp (1) legalValue/currentValue ve
// alan/birim eşleniklerinin ARTIK korunduğu, (2) hâlâ gösterilmeyen
// Kira (legalRent/currentRent) ve bina-özgü alanların (ör. carpark) yine de
// temizlendiği, (3) art arda birden çok çağrının (sekmeler arası gidiş-geliş
// simülasyonu) veri kaybına yol AÇMADIĞI doğrulanır.
{
  const clearFnSource = sourceBetween("function clearLandOwnershipDependentData", "function getCurrentAccessRole");
  const isLandOwnershipTypeSource = sourceBetween("function isLandOwnershipType", "// Kullanıcı talebi (2026-08-19)");
  const normalizeSource = sourceBetween("function normalizeOwnershipTypeForSectionVisibility", "function isLandOwnershipType");
  const foldTurkishSource = sourceBetween("function foldTurkish", "function parseAddressCodeText");

  function runClearTwice(ownershipType) {
    const context = {
      state: {
        fields: {
          ownershipType,
          legalValueArea: "5000",
          currentValueArea: "5000",
          legalValue: "900000",
          currentValue: "950000",
          legalValueUnit: "180",
          currentValueUnit: "190",
          legalRentArea: "5000",
          currentRentArea: "5000",
          legalRent: "1000",
          currentRent: "1100",
          legalRentUnit: "0.2",
          currentRentUnit: "0.22",
          carpark: "Var",
          elevator: "Var",
        },
        tables: { buildingFloors: [{ x: 1 }], unitFloors: [{ x: 1 }] },
      },
    };
    vm.runInNewContext(
      `${foldTurkishSource}\n${normalizeSource}\n${isLandOwnershipTypeSource}\n${clearFnSource}\nclearLandOwnershipDependentData(state.fields.ownershipType);\nclearLandOwnershipDependentData(state.fields.ownershipType);`,
      context
    );
    return context.state.fields;
  }

  const afterTwoRenders = runClearTwice("Tarla");
  assert.equal(afterTwoRenders.legalValueArea, "5000", "Yasal Durum Değeri - Alan art arda render'da silinmemeli.");
  assert.equal(afterTwoRenders.currentValueArea, "5000", "Mevcut Durum Değeri - Alan art arda render'da silinmemeli.");
  assert.equal(afterTwoRenders.legalValue, "900000", "Yasal Durum Değeri art arda render'da silinmemeli (kullanıcı bildirimi).");
  assert.equal(afterTwoRenders.currentValue, "950000", "Mevcut Durum Değeri art arda render'da silinmemeli (kullanıcı bildirimi).");
  assert.equal(afterTwoRenders.legalValueUnit, "180", "M2 Birim Değeri (Yasal) art arda render'da silinmemeli.");
  assert.equal(afterTwoRenders.currentValueUnit, "190", "M2 Birim Değeri (Mevcut) art arda render'da silinmemeli.");

  // Kira alanları Arsa/Tarla'da hiç gösterilmiyor (createValuationMarketTable
  // filtresi) — temizlenmeye devam etmeleri zararsız, davranış değişmedi.
  assert.equal(afterTwoRenders.legalRent, "", "Kira (Yasal) Arsa/Tarla'da hâlâ temizlenmeli (gösterilmiyor).");
  assert.equal(afterTwoRenders.currentRent, "", "Kira (Mevcut) Arsa/Tarla'da hâlâ temizlenmeli (gösterilmiyor).");

  // Bina-özgü alanlar Arsa/Tarla'da hâlâ temizlenmeli (davranış değişmedi).
  assert.equal(afterTwoRenders.carpark, "", "Otopark (bina-özgü) Arsa/Tarla'da hâlâ temizlenmeli.");
  assert.equal(afterTwoRenders.elevator, "", "Asansör (bina-özgü) Arsa/Tarla'da hâlâ temizlenmeli.");

  // Arsa mülkiyetinde de aynı koruma geçerli.
  const arsaResult = runClearTwice("Arsa");
  assert.equal(arsaResult.legalValue, "900000", "Yasal Durum Değeri Arsa'da da korunmalı.");
  assert.equal(arsaResult.currentValue, "950000", "Mevcut Durum Değeri Arsa'da da korunmalı.");

  // Bina/Kat İrtifakı mülkiyetinde fonksiyon zaten en baştan çıkıyor
  // (isLandOwnershipType false) — hiçbir alan silinmemeli, regresyon yok.
  const nonLandResult = runClearTwice("Dikey Kat İrtifakı");
  assert.equal(nonLandResult.legalValue, "900000", "Kat İrtifakı'nda değerler zaten silinmemeliydi.");
  assert.equal(nonLandResult.carpark, "Var", "Kat İrtifakı'nda bina alanları da silinmemeliydi.");

  console.log("Arsa/Tarla Değerleme render tekrarında veri kaybı regresyon testi tamam.");
}
