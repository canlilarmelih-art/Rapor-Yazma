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
