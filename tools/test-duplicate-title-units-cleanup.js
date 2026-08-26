"use strict";

// Yinelenen Taşınmaz Temizliği (2026-08-26) — kullanıcı bildirimi: "liste
// birden buna dönüştü böyle bir hata aldım" (43 taşınmaz sekmesi, TAKBİS
// içe aktarma sonrası). Kök neden (ayrı bir soruşturma konusu — bu dosya
// KÖK NEDENİ değil, KURTARMA ARACINI test eder): TAKBİS içe aktarmanın
// KENDİ yinelenen-önleme kontrolü (getTakbisDuplicateKey, Taşınmaz Kimlik
// No + Rapor Tarihi) bu iki alan güvenilir okunamadığında SESSİZCE devre
// dışı kalıyor (boş anahtar kontrolü atlanıyor) — çok sayfalı bir PDF'in
// her sayfası/bölümü AYRI bir taşınmaz sekmesi olarak eklenebiliyor.
//
// Bu dosya, kullanıcının ZATEN OLUŞMUŞ yinelenen taşınmazları TEK tıkla
// temizleyebileceği KURTARMA aracını test eder:
//  1) getTitleUnitDuplicateKey(): Ada+Parsel+BB No birleşimi, üçünden
//     biri eksikse boş (güvenlik ağı — asla yanlışlıkla eşleştirme
//     yapmamalı).
//  2) findDuplicateTitleUnitGroups(): 2+ üyeli (gerçek yinelenen)
//     gruplar; keepIndex HER ZAMAN grubun EN KÜÇÜK index'i; tekil
//     (yinelenmeyen) taşınmazlar dönen listede YER ALMAZ.
//  3) removeDuplicateTitleUnitTabs(): BÜYÜKTEN KÜÇÜĞE silme sırası (index
//     kayması olmadan doğru hedefleri siler); index 0 (birincil) ASLA
//     silinmez; kalan taşınmazların verisi BOZULMAZ.
//  4) Kullanıcının GERÇEK senaryosuna yakın bir uçtan uca regresyon: 3
//     GERÇEK bağımsız bölüm, her biri birkaç kez yinelenmiş (TAKBİS çok
//     sayfalı içe aktarma benzetimi) -> temizlik sonrası TAM 3 taşınmaz
//     kalmalı, her biri KENDİ doğru verisiyle.

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

const sandboxSource = `
  let state = {};
  ${extractFunction("normalizeTakbisDuplicatePart")}
  function getTitleUnitCount() { return 1 + (Array.isArray(state.titleUnits) ? state.titleUnits.length : 0); }
  function getTitleUnitFieldsForLabel(index) {
    if (index === state.activeTitleUnitIndex) return state.fields;
    if (index === 0) return state.primaryTitleUnitShadow?.fields || {};
    return state.titleUnits?.[index - 1]?.fields || {};
  }
  // switchActiveTitleUnit()'in GERÇEK (kapsamlı alan-senkronu) hali
  // tools/test-title-unit-switch.js'te ZATEN ayrıntılıca test ediliyor
  // (proje konvansiyonu: ağır/başka yerde test edilmiş bağımlılıklar
  // basit, davranış-koruyan bir sahte ile değiştirilir) — burada YALNIZCA
  // "çıkan taşınmazın verisini kendi yuvasına check-in et, giren taşınmazın
  // verisini state.fields'a yükle" ÖZÜ (bu testin odağı olan
  // removeDuplicateTitleUnitTabs'ın doğru hedefleri silip DİĞER
  // taşınmazların verisini BOZMADIĞINI doğrulamak için yeterli/sadık).
  function switchActiveTitleUnit(newIndex) {
    if (!Number.isInteger(newIndex) || newIndex < 0 || newIndex >= getTitleUnitCount()) return false;
    if (newIndex === state.activeTitleUnitIndex) return true;
    if (state.activeTitleUnitIndex === 0) {
      state.primaryTitleUnitShadow = { fields: { ...state.fields } };
    } else {
      state.titleUnits[state.activeTitleUnitIndex - 1] = { fields: { ...state.fields } };
    }
    const incoming = newIndex === 0 ? (state.primaryTitleUnitShadow?.fields || {}) : (state.titleUnits[newIndex - 1]?.fields || {});
    state.fields = { ...incoming };
    state.activeTitleUnitIndex = newIndex;
    return true;
  }
  ${extractFunction("removeActiveTitleUnitTab")}
  ${extractFunction("getTitleUnitDuplicateKey")}
  ${extractFunction("findDuplicateTitleUnitGroups")}
  ${extractFunction("removeDuplicateTitleUnitTabs")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getTitleUnitCount,
    getTitleUnitFieldsForLabel,
    getTitleUnitDuplicateKey,
    findDuplicateTitleUnitGroups,
    removeDuplicateTitleUnitTabs,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function freshState(fields, titleUnits = []) {
  return { fields, titleUnits, activeTitleUnitIndex: 0, primaryTitleUnitShadow: null };
}

// --- 1) getTitleUnitDuplicateKey() ------------------------------------------
{
  assert.equal(
    fns.getTitleUnitDuplicateKey({ blockNo: "100", parcelNo: "5", unitNo: "3" }),
    fns.getTitleUnitDuplicateKey({ blockNo: " 100 ", parcelNo: "5", unitNo: "3" }),
    "Bosluk farki anahtar eslesmesini bozmamali (normalizeTakbisDuplicatePart)."
  );
  assert.equal(fns.getTitleUnitDuplicateKey({ blockNo: "100", parcelNo: "5" }), "", "BB No eksikse (guvenlik agi) bos anahtar donmeli - yanlislikla eslestirme YAPILMAMALI.");
  assert.equal(fns.getTitleUnitDuplicateKey({ parcelNo: "5", unitNo: "3" }), "", "Ada eksikse bos anahtar donmeli.");
  assert.equal(fns.getTitleUnitDuplicateKey({}), "", "Tum alanlar eksikse bos anahtar donmeli.");
  console.log("getTitleUnitDuplicateKey() testi tamam.");
}

// --- 2) findDuplicateTitleUnitGroups() ---------------------------------------
{
  const state = freshState(
    { blockNo: "100", parcelNo: "1", unitNo: "2" }, // index 0 - YINELENEN (index 2 ile ayni)
    [
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "5" } }, // index 1 - TEKIL (baska hicbir tasinmazla eslesmiyor)
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "2" } }, // index 2 - index 0 ile YINELENEN
      { fields: {} }, // index 3 - anahtar bos, yok sayilmali
    ],
  );
  fns.setState(state);
  const groups = fns.findDuplicateTitleUnitGroups();
  assert.equal(groups.length, 1, `Yalnizca 1 gercek yinelenen grup (index 0 ve 2) donmeli, bulunan: ${groups.length}`);
  assert.equal(groups[0].keepIndex, 0, "keepIndex grubun EN KUCUK index'i (0) olmali.");
  assert.deepEqual(groups[0].removeIndexes, [2], "removeIndexes yalnizca index 2'yi icermeli.");
  console.log("findDuplicateTitleUnitGroups() testi tamam.");
}

// --- 3) removeDuplicateTitleUnitTabs(): dogru hedefleri siler, digerlerini --
// BOZMAZ, index 0 ASLA silinmez -------------------------------------------
{
  // 3 GERCEK bagimsiz bolum (BB No 1/2/3), her biri 2-3 kez YINELENMIS -
  // kullanicinin gercek senaryosunun kucultulmus hali (43 yerine 3 gercek + 5 yinelenen = 8).
  const state = freshState(
    { blockNo: "100", parcelNo: "1", unitNo: "1", ownerName: "GERCEK-1" }, // index 0 (birincil, ASLA silinmemeli)
    [
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "2", ownerName: "GERCEK-2" } }, // index 1
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "1", ownerName: "YINELENEN-1a" } }, // index 2 - index 0'in kopyasi
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "3", ownerName: "GERCEK-3" } }, // index 3
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "2", ownerName: "YINELENEN-2a" } }, // index 4 - index 1'in kopyasi
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "1", ownerName: "YINELENEN-1b" } }, // index 5 - index 0'in 2. kopyasi
      { fields: { blockNo: "100", parcelNo: "1", unitNo: "3", ownerName: "YINELENEN-3a" } }, // index 6 - index 3'un kopyasi
    ],
  );
  fns.setState(state);
  const groups = fns.findDuplicateTitleUnitGroups();
  assert.equal(groups.length, 3, `3 GERCEK bagimsiz bolumun her biri kendi yinelenen grubunu olusturmali, bulunan: ${groups.length}`);
  const totalRemovable = groups.reduce((sum, g) => sum + g.removeIndexes.length, 0);
  assert.equal(totalRemovable, 4, `Toplam 4 yinelenen kopya (2+1+1) kaldirilmali, bulunan: ${totalRemovable}`);

  const removedCount = fns.removeDuplicateTitleUnitTabs(groups);
  assert.equal(removedCount, 4, "removeDuplicateTitleUnitTabs() 4 taniyi kaldirdigini bildirmeli.");
  assert.equal(fns.getTitleUnitCount(), 3, `Temizlik sonrasi TAM 3 (gercek) tasinmaz kalmali, bulunan: ${fns.getTitleUnitCount()}`);

  // Kalan 3 tasinmazin HER BIRI kendi DOGRU (yinelenmemis/ilk) verisini
  // korumus olmali - "GERCEK-N" isimli olanlar, "YINELENEN-*" DEGIL.
  const remainingOwnerNames = Array.from({ length: fns.getTitleUnitCount() }, (_, i) => fns.getTitleUnitFieldsForLabel(i).ownerName).sort();
  assert.deepEqual(remainingOwnerNames, ["GERCEK-1", "GERCEK-2", "GERCEK-3"], `Kalan tasinmazlarin verisi BOZULMAMALI/karismamis olmali, bulunan: ${JSON.stringify(remainingOwnerNames)}`);

  // index 0 (birincil) HICBIR ZAMAN silinmemis olmali (removeActiveTitleUnitTab'in
  // kendi guvenlik agi + keepIndex kurali) - state.fields hala "GERCEK-1" tasiyan
  // tasinmazi (ya da onun yerini alan baska bir GERCEK tasinmazi) temsil etmeli,
  // hicbir zaman TAMAMEN bos/undefined olmamali.
  assert.ok(fns.getTitleUnitFieldsForLabel(0).ownerName?.startsWith("GERCEK"), "index 0 HER ZAMAN gercek (yinelenmemis) bir tasinmazi temsil etmeli.");

  console.log("removeDuplicateTitleUnitTabs() kullanicinin GERCEK senaryosuna yakin uctan uca regresyon testi tamam.");
}

// --- 4) Yinelenen YOKSA -> bos dizi, hicbir sey silinmez --------------------
{
  const state = freshState(
    { blockNo: "100", parcelNo: "1", unitNo: "1" },
    [{ fields: { blockNo: "100", parcelNo: "1", unitNo: "2" } }],
  );
  fns.setState(state);
  const groups = fns.findDuplicateTitleUnitGroups();
  assert.equal(groups.length, 0, "Yinelenen yoksa bos dizi donmeli.");
  const removedCount = fns.removeDuplicateTitleUnitTabs(groups);
  assert.equal(removedCount, 0, "Silinecek bir sey yoksa 0 donmeli.");
  assert.equal(fns.getTitleUnitCount(), 2, "Yinelenen yokken taşınmaz sayisi DEGISMEMELI.");
  console.log("Yinelenen yok -> no-op guvenlik agi testi tamam.");
}

// --- 5) Kaynak-düzeyi kablolama: createTitleUnitTabBar + CSS ----------------
{
  assert.ok(
    appSource.includes("const duplicatesControl = createRemoveDuplicateTitleUnitsControl();") && appSource.includes("if (duplicatesControl) actions.append(duplicatesControl);"),
    "createTitleUnitTabBar() artik createRemoveDuplicateTitleUnitsControl()'u actions satirina eklemiyor."
  );
  const controlSrc = extractFunction("createRemoveDuplicateTitleUnitsControl");
  assert.match(controlSrc, /if \(!groups\.length\) return null;/, "Yinelenen yoksa buton HIC render edilmemeli (null donmeli).");
  assert.match(controlSrc, /window\.confirm\(/, "Silme islemi ONCESI kullaniciya onay penceresi gosterilmeli (geri alinamaz bir eylem).");
  const cssSource = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
  assert.ok(cssSource.includes(".title-unit-remove-duplicates-button"), "styles.css'te '.title-unit-remove-duplicates-button' stili tanimli olmali.");
  console.log("Kaynak-duzeyi kablolama (tab bar butonu + CSS) testi tamam.");
}

console.log("Yinelenen Tasinmaz Temizligi testleri basarili.");
