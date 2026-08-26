"use strict";

// Yinelenen Taşınmaz Temizliği (2026-08-26, DÜZELTİLDİ) — kullanıcı
// bildirimi: "liste birden buna dönüştü böyle bir hata aldım" (43
// taşınmaz sekmesi, TAKBİS içe aktarma sonrası). Kök neden (ayrı bir
// soruşturma konusu, splitMultiTakbisRowBlocks 2026-08-26 düzeltmesiyle
// giderildi — bu dosya KÖK NEDENİ değil, KURTARMA ARACINI test eder).
//
// KRİTİK DÜZELTME (aynı gün, kullanıcı bildirimi: "yinelenen taşınmaz
// diye birşey yok ıd numaralarına baktım zaten yinelenen bir taşınmaz
// yok" + "gayrimenkulün yinelendiğini taşınmaz ıd no dışında
// belirleyemezsin"): İLK sürüm Ada + Parsel + Bağımsız Bölüm No üçlüsünü
// kullanıyordu — bu, AYNI ada/parselde birden fazla blok varsa ve her
// blok kendi BB No'larını "1"den başlatıyorsa, FARKLI bloklardaki GERÇEK
// bağımsız bölümleri YANLIŞLIKLA yinelenen sayıp SİLİYORDU (GERÇEK VERİ
// KAYBI, kullanıcı tarafından doğrulandı). Artık TEK güvenilir sinyal
// kullanılıyor: **Taşınmaz Kimlik No** (titlePropertyId) — TAKBİS'in
// kendi benzersiz kimliği. Bu alan boşsa o taşınmaz ASLA eşleştirilmez.
//
// Bu dosya kapsamı:
//  1) getTitleUnitDuplicateKey(): SADECE titlePropertyId (normalize
//     edilmiş) — boşsa boş anahtar.
//  2) findDuplicateTitleUnitGroups(): 2+ üyeli (gerçek yinelenen, AYNI
//     Taşınmaz Kimlik No'yu paylaşan) gruplar; keepIndex HER ZAMAN
//     grubun EN KÜÇÜK index'i; tekil taşınmazlar dönen listede YER ALMAZ;
//     Taşınmaz Kimlik No'su boş olan taşınmazlar ASLA eşleştirilmez.
//  3) REGRESYON (kullanıcının bildirdiği GERÇEK hata): AYNI Ada/Parsel/BB
//     No'ya sahip ama FARKLI bloklardaki (dolayısıyla FARKLI Taşınmaz
//     Kimlik No'lu) GERÇEK bağımsız bölümler ARTIK yinelenen SAYILMIYOR.
//  4) removeDuplicateTitleUnitTabs(): BÜYÜKTEN KÜÇÜĞE silme sırası; index
//     0 (birincil) ASLA silinmez; kalan taşınmazların verisi BOZULMAZ.
//  5) Yinelenen yoksa no-op.

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
    fns.getTitleUnitDuplicateKey({ titlePropertyId: "96455493" }),
    fns.getTitleUnitDuplicateKey({ titlePropertyId: " 96455493 " }),
    "Bosluk farki anahtar eslesmesini bozmamali (normalizeTakbisDuplicatePart)."
  );
  assert.equal(fns.getTitleUnitDuplicateKey({}), "", "Taşınmaz Kimlik No yoksa bos anahtar donmeli - yanlislikla eslestirme YAPILMAMALI.");
  assert.equal(fns.getTitleUnitDuplicateKey({ blockNo: "100", parcelNo: "1", unitNo: "1" }), "", "Ada/Parsel/BB No DOLU olsa bile Taşınmaz Kimlik No yoksa bos anahtar donmeli (ESKİ, YANLIŞ davranış GERİ GELMEMELİ).");
  console.log("getTitleUnitDuplicateKey() testi tamam.");
}

// --- 2) findDuplicateTitleUnitGroups() ---------------------------------------
{
  const state = freshState(
    { titlePropertyId: "96455493" }, // index 0 - YINELENEN (index 2 ile ayni Taşınmaz Kimlik No)
    [
      { fields: { titlePropertyId: "96455500" } }, // index 1 - TEKIL
      { fields: { titlePropertyId: "96455493" } }, // index 2 - index 0 ile YINELENEN
      { fields: {} }, // index 3 - Taşınmaz Kimlik No bos, yok sayilmali
    ],
  );
  fns.setState(state);
  const groups = fns.findDuplicateTitleUnitGroups();
  assert.equal(groups.length, 1, `Yalnizca 1 gercek yinelenen grup (index 0 ve 2) donmeli, bulunan: ${groups.length}`);
  assert.equal(groups[0].keepIndex, 0, "keepIndex grubun EN KUCUK index'i (0) olmali.");
  assert.deepEqual(groups[0].removeIndexes, [2], "removeIndexes yalnizca index 2'yi icermeli.");
  console.log("findDuplicateTitleUnitGroups() testi tamam.");
}

// --- 3) KRİTİK REGRESYON: AYNI Ada/Parsel/BB No'ya sahip ama FARKLI ---------
// (farklı Taşınmaz Kimlik No'lu) GERÇEK bağımsız bölümler ARTIK yinelenen --
// SAYILMIYOR (kullanıcının bildirdiği GERÇEK veri kaybı senaryosu) ---------
{
  const state = freshState(
    // A Blok'un "1" No'lu bağımsız bölümü.
    { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", unitNo: "1", titlePropertyId: "111111", ownerName: "GERCEK-A1" },
    [
      // B Blok'un KENDİ "1" No'lu bağımsız bölümü — AYNI ada/parsel/BB No,
      // ama FARKLI blok VE FARKLI Taşınmaz Kimlik No -> GERÇEKTEN farklı,
      // birbirinden bağımsız bir bağımsız bölüm, YİNELENEN DEĞİL.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", unitNo: "1", titlePropertyId: "222222", ownerName: "GERCEK-B1" } },
      // C Blok'un KENDİ "1" No'lu bağımsız bölümü — aynı mantık.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "C Blok", unitNo: "1", titlePropertyId: "333333", ownerName: "GERCEK-C1" } },
    ],
  );
  fns.setState(state);
  const groups = fns.findDuplicateTitleUnitGroups();
  assert.equal(groups.length, 0, `AYNI Ada/Parsel/BB No'yu paylaşan ama FARKLI Taşınmaz Kimlik No'lu (dolayısıyla GERÇEKTEN farklı) bağımsız bölümler yinelenen SAYILMAMALI, bulunan grup sayisi: ${groups.length}`);
  console.log("KRITIK REGRESYON: farkli bloklardaki ayni BB No'lu GERCEK bagimsiz bolumler yinelenen SAYILMIYOR testi tamam.");
}

// --- 4) removeDuplicateTitleUnitTabs(): dogru hedefleri siler, digerlerini --
// BOZMAZ, index 0 ASLA silinmez -------------------------------------------
{
  // 3 GERCEK bagimsiz bolum (farkli Taşınmaz Kimlik No), her biri 2-3 kez
  // YINELENMIS - kullanicinin gercek senaryosunun kucultulmus hali (43
  // yerine 3 gercek + 4 yinelenen = 7).
  const state = freshState(
    { titlePropertyId: "111111", ownerName: "GERCEK-1" }, // index 0 (birincil, ASLA silinmemeli)
    [
      { fields: { titlePropertyId: "222222", ownerName: "GERCEK-2" } }, // index 1
      { fields: { titlePropertyId: "111111", ownerName: "YINELENEN-1a" } }, // index 2 - index 0'in kopyasi
      { fields: { titlePropertyId: "333333", ownerName: "GERCEK-3" } }, // index 3
      { fields: { titlePropertyId: "222222", ownerName: "YINELENEN-2a" } }, // index 4 - index 1'in kopyasi
      { fields: { titlePropertyId: "111111", ownerName: "YINELENEN-1b" } }, // index 5 - index 0'in 2. kopyasi
      { fields: { titlePropertyId: "333333", ownerName: "YINELENEN-3a" } }, // index 6 - index 3'un kopyasi
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

// --- 5) Yinelenen YOKSA -> bos dizi, hicbir sey silinmez --------------------
{
  const state = freshState(
    { titlePropertyId: "111111" },
    [{ fields: { titlePropertyId: "222222" } }],
  );
  fns.setState(state);
  const groups = fns.findDuplicateTitleUnitGroups();
  assert.equal(groups.length, 0, "Yinelenen yoksa bos dizi donmeli.");
  const removedCount = fns.removeDuplicateTitleUnitTabs(groups);
  assert.equal(removedCount, 0, "Silinecek bir sey yoksa 0 donmeli.");
  assert.equal(fns.getTitleUnitCount(), 2, "Yinelenen yokken taşınmaz sayisi DEGISMEMELI.");
  console.log("Yinelenen yok -> no-op guvenlik agi testi tamam.");
}

// --- 6) Kaynak-düzeyi kablolama: createTitleUnitTabBar + CSS + etiket ------
// artik "Taşınmaz Kimlik No" diyor, "Ada/Parsel/BB No" DEGIL ----------------
{
  assert.ok(
    appSource.includes("const duplicatesControl = createRemoveDuplicateTitleUnitsControl();") && appSource.includes("if (duplicatesControl) actions.append(duplicatesControl);"),
    "createTitleUnitTabBar() artik createRemoveDuplicateTitleUnitsControl()'u actions satirina eklemiyor."
  );
  const controlSrc = extractFunction("createRemoveDuplicateTitleUnitsControl");
  assert.match(controlSrc, /if \(!groups\.length\) return null;/, "Yinelenen yoksa buton HIC render edilmemeli (null donmeli).");
  assert.match(controlSrc, /window\.confirm\(/, "Silme islemi ONCESI kullaniciya onay penceresi gosterilmeli (geri alinamaz bir eylem).");
  assert.ok(controlSrc.includes("Taşınmaz Kimlik No"), "Buton metni/onay penceresi artik 'Tasinmaz Kimlik No'yu referans almali (ESKİ 'Ada/Parsel/BB No' metni KALMAMALI).");
  assert.ok(!controlSrc.includes("Ada/Parsel/Bağımsız Bölüm No"), "ESKİ (yanlis) 'Ada/Parsel/Bagimsiz Bolum No' ifadesi ARTIK gorunmemeli.");
  const cssSource = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
  assert.ok(cssSource.includes(".title-unit-remove-duplicates-button"), "styles.css'te '.title-unit-remove-duplicates-button' stili tanimli olmali.");
  console.log("Kaynak-duzeyi kablolama (tab bar butonu + CSS + Tasinmaz Kimlik No etiketi) testi tamam.");
}

console.log("Yinelenen Tasinmaz Temizligi testleri basarili.");
