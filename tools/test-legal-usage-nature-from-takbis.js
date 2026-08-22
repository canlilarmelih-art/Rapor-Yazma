// TAKBIS "Bagimsiz Bolum Niteligi" (titleQuality) -> "Yasal Kullanim
// Niteligi" (legalUsageNature) otomatik onerisi (2026-08-22).
//
// Kullanici: "dosya ve rapor bolumunde dikey ve yatay kat irtifaki
// tasinmazlarin takbis yuklendiginde ofis mi konut mu isyeri mi otomatik
// bagimsiz bolum niteliginde anlayabilir mi program" -> AskUserQuestion
// ile netleştirme: (1) yalnizca Dikey/Yatay Kat Irtifaki, (2) yalnizca
// legalUsageNature BOSSA doldur (elle secimin ustune YAZMA).
//
// Bu test kapsami:
//  1) mapTitleQualityToLegalUsageNature(): anahtar-kelime esleme dogrulugu
//     (Konut/Isyeri/Ofis/Ticari Bina/Sanayi Tesisi + esrisiz/belirsiz ->
//     "" + oncelik sirasi, ör. "OFIS" iceren bir metin "Isyeri"ye
//     dusmemeli).
//  2) suggestLegalUsageNatureFromTakbisTitleQuality(): Kat Irtifaki disinda
//     no-op, legalUsageNature doluyken no-op (ELLE SECIMI EZMEZ), Kat
//     Irtifaki + bos + eslesen titleQuality'de dogru deger yazilir.

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
  "foldTurkish",
  "normalizeOwnershipTypeForSectionVisibility",
  "isCondominiumEasementOwnershipType",
  "mapTitleQualityToLegalUsageNature",
  "suggestLegalUsageNatureFromTakbisTitleQuality",
  "applyLegalUsageNatureSuggestionToUnitFields",
  "suggestLegalUsageNatureForAllTitleUnits",
];

const sandboxSource = `
  let state = {};
  const document = { querySelector: () => null };
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    mapTitleQualityToLegalUsageNature,
    suggestLegalUsageNatureFromTakbisTitleQuality,
    suggestLegalUsageNatureForAllTitleUnits,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) mapTitleQualityToLegalUsageNature(): anahtar-kelime esleme -------
{
  assert.equal(fns.mapTitleQualityToLegalUsageNature("MESKEN (DAİRE)"), "Konut", "MESKEN -> Konut.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Villa"), "Konut", "Villa -> Konut.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("İŞYERİ"), "İşyeri", "İŞYERİ -> İşyeri.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Dükkan"), "İşyeri", "Dükkan -> İşyeri.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Ofis"), "Ofis", "Ofis -> Ofis.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Büro"), "Ofis", "Büro -> Ofis.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("İş Merkezi"), "Ticari Bina", "İş Merkezi -> Ticari Bina.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("AVM"), "Ticari Bina", "AVM -> Ticari Bina.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Fabrika"), "Sanayi Tesisi", "Fabrika -> Sanayi Tesisi.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Depo"), "Sanayi Tesisi", "Depo -> Sanayi Tesisi.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature(""), "", "Boş girdide boş dönmeli.");
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Bilinmeyen Bir Nitelik XYZ"), "", "Eşleşmeyen metinde ZORLA bir seçenek DAYATILMAMALI, boş dönmeli.");
  // Öncelik sırası: "OFİS" içeren bir metin yanlışlıkla "İşyeri"ye düşmemeli.
  assert.equal(fns.mapTitleQualityToLegalUsageNature("Ofis ve İşyeri"), "Ofis", "OFİS/İŞYERİ birlikte geçince ÖNCELİKLİ (daha spesifik) eşleşme Ofis olmalı.");
  console.log("mapTitleQualityToLegalUsageNature anahtar-kelime esleme testi tamam.");
}

// --- 2) suggestLegalUsageNatureFromTakbisTitleQuality(): kapsam + -------
// "yalnizca bossa doldur" davranisi.
{
  // (a) Kat Irtifaki DEGIL -> no-op (Musttakil Bina).
  const stateMustakil = { fields: { ownershipType: "Müstakil Bina", titleQuality: "MESKEN" } };
  fns.setState(stateMustakil);
  fns.suggestLegalUsageNatureFromTakbisTitleQuality();
  assert.equal(fns.getState().fields.legalUsageNature, undefined, "REGRESYON: Müstakil Bina'da (Kat İrtifakı DEĞİL) öneri ÇALIŞMAMALI.");

  // (b) Yatay Kat Irtifaki + bos legalUsageNature + eslesen titleQuality -> doldurulur.
  const stateYatay = { fields: { ownershipType: "Yatay Kat İrtifakı", titleQuality: "İŞYERİ" } };
  fns.setState(stateYatay);
  fns.suggestLegalUsageNatureFromTakbisTitleQuality();
  assert.equal(fns.getState().fields.legalUsageNature, "İşyeri", "Yatay Kat İrtifakı + boş alan + eşleşen titleQuality -> doldurulmalı.");

  // (c) Dikey Kat Irtifaki + ZATEN ELLE SECILMIS legalUsageNature -> EZILMEMELI.
  const stateDikey = { fields: { ownershipType: "Dikey Kat İrtifakı", titleQuality: "MESKEN", legalUsageNature: "Ofis" } };
  fns.setState(stateDikey);
  fns.suggestLegalUsageNatureFromTakbisTitleQuality();
  assert.equal(fns.getState().fields.legalUsageNature, "Ofis", "DÜZELTME: elle seçilmiş legalUsageNature (Ofis) TAKBİS önerisiyle (Konut) EZİLMEMELİ.");

  // (d) Kat Irtifaki + bos + ESLESMEYEN titleQuality -> bos kalmali (zorla doldurulmamali).
  const stateNoMatch = { fields: { ownershipType: "Yatay Kat İrtifakı", titleQuality: "Bilinmeyen Nitelik" } };
  fns.setState(stateNoMatch);
  fns.suggestLegalUsageNatureFromTakbisTitleQuality();
  assert.equal(fns.getState().fields.legalUsageNature, undefined, "Eşleşmeyen titleQuality'de legalUsageNature ZORLA DOLDURULMAMALI.");

  console.log("suggestLegalUsageNatureFromTakbisTitleQuality kapsam + manuel-secim-korumasi testi tamam.");
}

// --- 3) suggestLegalUsageNatureForAllTitleUnits(): TOPLU/coklu TAKBIS ----
// senaryosu (2026-08-22 kullanici bildirimi) -- Mulkiyet KENDISI Kat
// Irtifaki'na degistiginde SADECE aktif tasinmaz degil, RAPORDAKI TUM
// tasinmazlar (her biri KENDI titleQuality'sine gore) doldurulmali.
{
  // (a) Aktif taşınmaz PRIMARY (index 0): primaryTitleUnitShadow YOK,
  // yalnizca titleUnits[] dolaşılır.
  const statePrimaryActive = {
    activeTitleUnitIndex: 0,
    fields: { ownershipType: "Dikey Kat İrtifakı", titleQuality: "MESKEN" },
    titleUnits: [
      { fields: { titleQuality: "İŞYERİ" } }, // index 0 -> tasinmaz #2 (boş legalUsageNature)
      { fields: { titleQuality: "OFİS", legalUsageNature: "Ofis" } }, // elle seçilmiş, EZİLMEMELİ
      { fields: { titleQuality: "Bilinmeyen Nitelik" } }, // eşleşmez, boş kalmalı
    ],
  };
  fns.setState(statePrimaryActive);
  fns.suggestLegalUsageNatureForAllTitleUnits();
  const s1 = fns.getState();
  assert.equal(s1.fields.legalUsageNature, "Konut", "Aktif (primary) taşınmaz kendi titleQuality'sine göre doldurulmalı.");
  assert.equal(s1.titleUnits[0].fields.legalUsageNature, "İşyeri", "TÜM taşınmazlar (aktif olmayanlar dahil) kendi titleQuality'siyle doldurulmalı.");
  assert.equal(s1.titleUnits[1].fields.legalUsageNature, "Ofis", "Elle seçilmiş legalUsageNature (Ofis) EZİLMEMELİ, kendi titleQuality'sinin önerisiyle (Konut) DEĞİŞMEMELİ.");
  assert.equal(s1.titleUnits[2].fields.legalUsageNature, undefined, "Eşleşmeyen titleQuality'de zorla doldurulmamalı.");

  // (b) Aktif taşınmaz PRIMARY DEĞİL (index 2 -> titleUnits[1]):
  // primaryTitleUnitShadow (index 0'ın gölgesi) da dolaşılmalı.
  const stateShadowActive = {
    activeTitleUnitIndex: 2,
    fields: { ownershipType: "Yatay Kat İrtifakı", titleQuality: "DÜKKAN" },
    primaryTitleUnitShadow: { fields: { titleQuality: "MESKEN" } },
    titleUnits: [
      { fields: { titleQuality: "BÜRO" } }, // index 0 -> tasinmaz #2 (aktif değil)
      { fields: { titleQuality: "FABRİKA" } }, // index 1 -> tasinmaz #3 (AKTİF, state.fields üzerinden zaten işlendi)
    ],
  };
  fns.setState(stateShadowActive);
  fns.suggestLegalUsageNatureForAllTitleUnits();
  const s2 = fns.getState();
  assert.equal(s2.fields.legalUsageNature, "İşyeri", "Aktif taşınmaz (Dükkan) kendi titleQuality'siyle doldurulmalı.");
  assert.equal(s2.primaryTitleUnitShadow.fields.legalUsageNature, "Konut", "Primary'nin gölgesi (aktif değilken) de doldurulmalı.");
  assert.equal(s2.titleUnits[0].fields.legalUsageNature, "Ofis", "Diğer taşınmazlar (aktif olmayan) kendi titleQuality'siyle doldurulmalı.");
  assert.equal(s2.titleUnits[1].fields.legalUsageNature, undefined, "Aktif taşınmazın kendisi (titleUnits[1], index+1===activeTitleUnitIndex) BİR KEZ, state.fields üzerinden işlenir - titleUnits[1].fields ayrıca dokunulmamalı (o sadece aktifken kullanılmayan bir kopya).");

  // (c) Kat İrtifakı DEĞİL -> tüm liste no-op.
  const stateMustakil = {
    activeTitleUnitIndex: 0,
    fields: { ownershipType: "Müstakil Bina", titleQuality: "MESKEN" },
    titleUnits: [{ fields: { titleQuality: "İŞYERİ" } }],
  };
  fns.setState(stateMustakil);
  fns.suggestLegalUsageNatureForAllTitleUnits();
  const s3 = fns.getState();
  assert.equal(s3.fields.legalUsageNature, undefined, "REGRESYON: Müstakil Bina'da hiçbir taşınmaza öneri uygulanmamalı.");
  assert.equal(s3.titleUnits[0].fields.legalUsageNature, undefined, "REGRESYON: Müstakil Bina'da diğer taşınmazlara da öneri uygulanmamalı.");

  console.log("suggestLegalUsageNatureForAllTitleUnits toplu/coklu TAKBIS senaryosu testi tamam.");
}

console.log("TAKBIS -> Yasal Kullanim Niteligi otomatik oneri testleri basarili.");
