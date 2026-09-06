// "Değerleme" (valuation), çoklu raporlarda AKTİF taşınmazın Değerleme
// Özeti tablosundaki (Taşınmazlar Değerleme Özeti) satırı BAYAT kalıyordu
// (2026-09-07, kendi-inceleme: "evet şimdi çoklu raporlarda değerleme
// bölümüne geçelim. önce kendin düzenle").
//
// Kök neden: renderSection()'ın "valuation" gate'i şu sırayla çalışır:
//   1) computeValuationFieldsForAllTitleUnits() — TÜM taşınmazların
//      hesaplanan Değerleme alanlarını tazeler, AMA aktif taşınmazı
//      "zaten güncel" varsayımıyla BİLEREK atlıyordu.
//   2) createValuationUnitsSummaryTablePreview() — özet tabloyu (aktif
//      taşınmaz DAHİL) BU ANDAKİ state.fields'tan inşa eder.
//   3) createValuationEditor() — aktif taşınmazın KENDİ
//      refreshValuationComputedFields() çağrısı ANCAK BURADA yapılır.
// Yani aktif taşınmazın satırı (2), aktif taşınmazın gerçek tazelemesi
// (3) OLMADAN ÖNCE inşa ediliyordu — kullanıcı Yapı Sınıfı/Alan/Emsal
// gibi hesaplamaya giren bir alanı değiştirip AYNI ekranda hem editörü
// (taze) hem özet tabloyu (bir önceki render'dan kalma BAYAT değer)
// gördüğünde ikisi TUTARSIZ görünüyordu. Diğer TÜM taşınmazlar (döngüde
// zaten tazelenmiş) bu sorunu YAŞAMIYORDU — yalnızca aktif taşınmaza özgü.
//
// Düzeltme: computeValuationFieldsForAllTitleUnits() artık aktif taşınmazı
// ATLAMAK yerine, o taşınmaz için DOĞRUDAN (switchActiveTitleUnit çağırmadan
// — zaten no-op olurdu) refreshValuationComputedFields()'i çalıştırır; özet
// tablo inşa edilmeden ÖNCE aktif taşınmaz da diğerleriyle AYNI anda taze
// olur.
//
// Bu test, computeValuationFieldsForAllTitleUnits()'in KENDİSİNİ
// (gerçek app.js kaynağından) sahte (spy) getTitleUnitCount/
// switchActiveTitleUnit/refreshValuationComputedFields ile izole ederek
// doğrular — gerçek refreshValuationComputedFields()'in devasa bağımlılık
// zincirine (syncComparableValuationMarketValues/vb.) hiç girmeden, YALNIZCA
// "hangi index'ler için, hangi sırada, kaç kez tazeleme çağrıldı" davranışını
// kanıtlar.

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

const functionNames = ["computeValuationFieldsForAllTitleUnits"];

const sandboxSource = `
  let state = {};
  let suppressValuationSideEffects = false;
  let unitsData = [];
  let switchCalls = [];
  let refreshCalls = [];

  function getTitleUnitCount() { return unitsData.length; }

  // Gerçek switchActiveTitleUnit'in "aynı index'e geçiş no-op'tur" ve
  // "aktifi değiştirmeden önce eskisini kendi yuvasına yaz, yenisini
  // state.fields'a getir" davranışının SADELEŞTİRİLMİŞ (ama davranışsal
  // olarak eşdeğer) taklidi.
  function switchActiveTitleUnit(newIndex) {
    switchCalls.push(newIndex);
    if (newIndex === state.activeTitleUnitIndex) return false;
    unitsData[state.activeTitleUnitIndex] = state.fields;
    state.activeTitleUnitIndex = newIndex;
    state.fields = unitsData[newIndex];
    return true;
  }

  // Gerçek refreshValuationComputedFields'in YERİNE geçen sahte (spy) —
  // yalnızca "şu an aktif olan taşınmaz için çağrıldı" bilgisini kaydeder
  // ve o taşınmazın alanını GÖZLEMLENEBİLİR şekilde "taze" işaretler.
  function refreshValuationComputedFields() {
    refreshCalls.push(state.activeTitleUnitIndex);
    state.fields.legalValue = "COMPUTED-" + state.activeTitleUnitIndex;
  }

  ${functionNames.map(extractFunction).join("\n")}

  return {
    setUnits: (units, activeIndex) => {
      unitsData = units;
      state = { fields: unitsData[activeIndex], activeTitleUnitIndex: activeIndex };
      switchCalls = [];
      refreshCalls = [];
    },
    getSwitchCalls: () => switchCalls,
    getRefreshCalls: () => refreshCalls,
    getUnitsData: () => unitsData,
    getState: () => state,
    computeValuationFieldsForAllTitleUnits,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) AKTİF taşınmaz (index 1/3) DAHİL, HER taşınmaz için tazeleme -----
// çağrılır — REGRESYON: eskiden yalnızca 2 kez (aktif hariç) çağrılırdı.
{
  const units = [
    { legalValue: "OLD-0" },
    { legalValue: "OLD-1" }, // aktif
    { legalValue: "OLD-2" },
  ];
  fns.setUnits(units, 1);

  fns.computeValuationFieldsForAllTitleUnits();

  const refreshCalls = fns.getRefreshCalls();
  assert.equal(refreshCalls.length, 3, "REGRESYON: aktif taşınmaz DAHİL, 3 taşınmazın ÜÇÜ İÇİN DE refreshValuationComputedFields() çağrılmalı (eskiden aktif atlanıp yalnızca 2 kez çağrılıyordu).");
  assert.deepEqual([...refreshCalls].sort(), [0, 1, 2], "Tazeleme her index (0,1,2) için tam olarak bir kez çağrılmalı.");

  const finalUnits = fns.getUnitsData();
  assert.equal(finalUnits[1].legalValue, "COMPUTED-1", "KRİTİK: aktif taşınmazın (index 1) KENDİ alanı da BAYAT ('OLD-1') değil, TAZE ('COMPUTED-1') olmalı — özet tablo bu fonksiyondan HEMEN SONRA inşa edildiğinden, aktif taşınmaz da diğerleri gibi tazelenmemiş olsaydı tabloda bir render GERİDEN görünürdü.");
  assert.equal(finalUnits[0].legalValue, "COMPUTED-0", "Aktif olmayan taşınmaz (index 0) tazelenmeli.");
  assert.equal(finalUnits[2].legalValue, "COMPUTED-2", "Aktif olmayan taşınmaz (index 2) tazelenmeli.");

  const finalState = fns.getState();
  assert.equal(finalState.activeTitleUnitIndex, 1, "Döngü sonunda orijinal aktif taşınmaza (1) geri dönülmeli.");
  assert.equal(finalState.fields.legalValue, "COMPUTED-1", "Geri dönüldükten sonra state.fields, aktif taşınmazın TAZE değerini yansıtmalı.");

  console.log("Aktif taşınmaz DAHİL her taşınmazın tazelenmesi (özet tablo bayatlık regresyonu) testi tamam.");
}

// --- 2) switchActiveTitleUnit HER index için (aktif dahil) koşulsuz -------
// çağrılır — bu ÖZELLİKLE önemli çünkü döngü aktif taşınmaza ulaşana kadar
// BAŞKA bir taşınmaza geçmiş olabilir (index 0 işlenirken aktiften
// uzaklaşılır), bu yüzden aktif taşınmazın kendi index'ine "geri dönüş"
// çağrısı GERÇEK bir geçiştir, no-op DEĞİLDİR — özel bir "aktifi atla"
// dalıyla bunu YANLIŞ taşınmaza tazeleme uygulayacak şekilde atlamak
// (ilk denenen, HATALI düzeltme) tam olarak BU testin yakaladığı hataydı.
{
  const units = [{ legalValue: "OLD-0" }, { legalValue: "OLD-1" }, { legalValue: "OLD-2" }];
  fns.setUnits(units, 1);

  fns.computeValuationFieldsForAllTitleUnits();

  const switchCalls = fns.getSwitchCalls();
  // Beklenen sıra: switch(0), switch(1) [aktife GERİ dönüş — no-op DEĞİL,
  // çünkü o anki aktif artık 0'dır], switch(2), switch(1) [finally'de
  // orijinal aktife son dönüş].
  assert.deepEqual(switchCalls, [0, 1, 2, 1], "switchActiveTitleUnit HER index için (aktif dahil) koşulsuz çağrılmalı; aktif taşınmaza dönüş döngü ORTASINDA bir no-op DEĞİLDİR (döngü o ana kadar başka bir taşınmaza geçmiştir).");

  console.log("switchActiveTitleUnit'in her index icin (aktif dahil, dogru sirada) cagrilmasi testi tamam.");
}

// --- 3) Tek taşınmazlı (count < 2) raporlarda HİÇBİR ŞEY yapılmaz --------
// (mevcut erken-çıkış davranışı KORUNMALI).
{
  const units = [{ legalValue: "OLD-0" }];
  fns.setUnits(units, 0);

  fns.computeValuationFieldsForAllTitleUnits();

  assert.equal(fns.getRefreshCalls().length, 0, "Tek taşınmazlı raporda hiç tazeleme çağrılmamalı (erken çıkış korunmalı).");
  assert.equal(fns.getUnitsData()[0].legalValue, "OLD-0", "Tek taşınmazlı raporda alan DEĞİŞMEMELİ.");

  console.log("Tek taşınmazlı raporda erken çıkış (regresyon yok) testi tamam.");
}

// --- 4) Aktif taşınmaz index 0 DIŞINDA bir değerde (ör. 2/3) de aynı ------
// şekilde çalışır — özel bir "index 0" varsayımı YOK.
{
  const units = [{ legalValue: "OLD-0" }, { legalValue: "OLD-1" }, { legalValue: "OLD-2" }];
  fns.setUnits(units, 2);

  fns.computeValuationFieldsForAllTitleUnits();

  assert.equal(fns.getUnitsData()[2].legalValue, "COMPUTED-2", "Aktif taşınmaz index 2 iken de KENDİ alanı tazelenmeli.");
  assert.deepEqual([...fns.getRefreshCalls()].sort(), [0, 1, 2], "Aktif index 2 iken de her üç taşınmaz tazelenmeli.");
  assert.equal(fns.getState().activeTitleUnitIndex, 2, "Döngü sonunda orijinal aktif taşınmaza (2) geri dönülmeli.");

  console.log("Aktif taşınmaz index 0 disinda (index 2) iken de dogru calisma testi tamam.");
}

console.log("Degerleme aktif tasinmaz ozet tablosu bayatlik regresyonu testleri basarili.");
