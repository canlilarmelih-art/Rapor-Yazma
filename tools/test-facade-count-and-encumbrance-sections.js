"use strict";

/*
  Kullanici talebi 1: "Gayrimenkulün Cepheli Olduğu Yönler bölümünde kaç
  cephe seçildi ise cephe sayısı olarak placeholder oluştur." — CEPHESAYISI
  placeholder'i state.fields.facades'te ("Kuzey, Güney" gibi virgülle
  ayrilmis, checkbox'lardan gelen) kac ayri yon secildiyse onu sayi olarak
  doner.

  Kullanici talebi 2: "takyidatlar bölümünde beyanlar bölümü rehinler
  bölümü şerhler bölümü hak ve mükellefiyetler bölümü olarak her bir
  bölüme placeholder oluştur." — BEYANLARBOLUMU / HAKVEMUKELLEFIYETLERBOLUMU /
  REHINLERBOLUMU / SERHLERBOLUMU placeholder'lari, mevcut
  buildEncumbranceSummaryVariants() icindeki dort bolumun AYNI kaynak
  fonksiyonlarini (getFilledEncumbranceRows/isEncumbranceRightOrLiabilityRow/
  buildEncumbranceSectionParagraph/format*Row) kullanarak her birini AYRI
  dondurur. Derin bagimlilik zinciri (tablo satirlari + bicimlendirme)
  yuzunden tam izolasyon asiri karmasik oldugundan bu dort fonksiyon icin
  yapisal varlik + dogru safeCall kablolamasi dogrulanir (Halkbank Ruhsat
  testindeki "derin bagimlilik" desenin ayni).

  Kullanici talebi 3: "Yapı kullanma izin belgesi var mı placeholder
  ekleyelim. incelenen belgelerde yapı kullanma izin belgesi eklendi ise
  Var eklenmedi ise Yok" — YAPIKULLANMAIZINBELGESIVARMI, mevcut ISKANVARMI
  ile AYNI kaynagi (gabimOccupancyPermitText) kullanan bir alias.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

// --- 1) getFacadeCountText — izole VM ------------------------------------
{
  const src = [
    sliceFn("function getFacadeCountText("),
    sliceFn("function getMultiCheckboxValues("),
    sliceFn("function parseStoredMultiCheckboxOptions("),
    sliceFn("function normalizeMultiCheckboxValues("),
  ].join("\n");

  function run(facadesValue) {
    const context = { state: { fields: { facades: facadesValue } } };
    vm.createContext(context);
    vm.runInContext(src, context);
    return context.getFacadeCountText();
  }

  assert.equal(run(""), "", "Hic cephe secilmemisken bos donmeli.");
  assert.equal(run("Kuzey"), "1", "Tek cephe secilince '1' donmeli.");
  assert.equal(run("Kuzey, Güney"), "2", "Iki cephe secilince '2' donmeli.");
  assert.equal(run("Kuzey, Güney, Doğu, Batı"), "4", "Dort cephe secilince '4' donmeli.");
  assert.equal(run("Kuzey, Kuzey"), "1", "Tekrarlanan ayni cephe bir kez sayilmali (dedup).");

  console.log("Cephe sayisi placeholder (CEPHESAYISI) testi tamam.");
}

// --- 2) Takyidat bolum fonksiyonlari — varlik + safeCall kablolamasi -----
{
  [
    "getEncumbranceDeclarationsSectionText",
    "getEncumbranceEasementsSectionText",
    "getEncumbranceMortgagesSectionText",
    "getEncumbranceAnnotationsSectionText",
  ].forEach((fnName) => {
    assert(
      new RegExp(`function ${fnName}\\(`).test(appSource),
      `app.js icinde ${fnName} fonksiyonu bulunamadi (silinmis/yeniden adlandirilmis olabilir).`
    );
  });

  [
    ["BEYANLARBOLUMU", "getEncumbranceDeclarationsSectionText"],
    ["HAKVEMUKELLEFIYETLERBOLUMU", "getEncumbranceEasementsSectionText"],
    ["REHINLERBOLUMU", "getEncumbranceMortgagesSectionText"],
    ["SERHLERBOLUMU", "getEncumbranceAnnotationsSectionText"],
  ].forEach(([placeholder, fnName]) => {
    assert(
      engineSource.includes(`${placeholder}: { t: () => safeCall("${fnName}")`),
      `template-engine.js: ${placeholder} placeholder'i ${fnName} fonksiyonunu safeCall ile cagirmiyor.`
    );
  });

  console.log("Takyidat bolum placeholder'lari (Beyanlar/Hak ve Mukellefiyetler/Rehinler/Serhler) kablolama testi tamam.");
}

// --- 2b) Kullanici talebi (2026-08-04): "beyanlar bölümü gibi başlık
// olması [degil] direkt ilk kayıttan başlasın" — bu 4 fonksiyon ARTIK
// buildEncumbranceSectionParagraph'in ekledigi "Bölümü Adı:\n" basligini
// KULLANMAMALI, dogrudan joinEncumbranceRows/buildCondensedAnnotationSummary
// ile satirlari birlestirmeli (derin bagimlilik zinciri yuzunden tam
// calisma-zamani izolasyonu yerine kaynak duzeyinde dogrulama) -----------
{
  function extractFnBody(fnName) {
    const start = appSource.indexOf(`function ${fnName}(`);
    assert(start >= 0, `${fnName} bulunamadi.`);
    const end = appSource.indexOf("\n}", start) + 2;
    return appSource.slice(start, end);
  }

  [
    ["getEncumbranceDeclarationsSectionText", "Beyanlar Bölümü"],
    ["getEncumbranceEasementsSectionText", "Hak ve Mükellefiyetler Bölümü"],
    ["getEncumbranceMortgagesSectionText", "Rehinler Bölümü"],
    ["getEncumbranceAnnotationsSectionText", "Şerhler Bölümü"],
  ].forEach(([fnName, staleTitle]) => {
    const body = extractFnBody(fnName);
    assert(
      !body.includes("buildEncumbranceSectionParagraph("),
      `${fnName} hala buildEncumbranceSectionParagraph kullaniyor — "${staleTitle}:" basligi geri gelmis olabilir.`
    );
    assert(
      !body.includes(`${staleTitle}:`),
      `${fnName} icinde hala "${staleTitle}:" baslik dizesi var.`
    );
  });

  console.log("Takyidat bolum metinleri artik 'Bölümü:' basligi eklemiyor (dogrudan ilk kayittan basliyor) testi tamam.");
}

// --- 3) Yapı Kullanma İzin Belgesi Var mı alias'i -------------------------
{
  assert(
    /function gabimOccupancyPermitText\(\)\s*\{\s*return hasReviewedOccupancyPermitDocument\(\)\s*\?\s*"Var"\s*:\s*"Yok";/.test(appSource),
    "gabimOccupancyPermitText() beklenen Var/Yok mantigiyla bulunamadi."
  );
  assert(
    engineSource.includes('YAPIKULLANMAIZINBELGESIVARMI: { fn: () => safeCall("gabimOccupancyPermitText") }'),
    "YAPIKULLANMAIZINBELGESIVARMI placeholder'i gabimOccupancyPermitText'e baglanmamis."
  );
  assert(
    engineSource.includes('ISKANVARMI: { fn: () => safeCall("gabimOccupancyPermitText") }'),
    "ISKANVARMI placeholder'i (mevcut, alias'in kaynagi) bulunamadi."
  );
  console.log("Yapi Kullanma Izin Belgesi Var mi (YAPIKULLANMAIZINBELGESIVARMI) alias testi tamam.");
}
