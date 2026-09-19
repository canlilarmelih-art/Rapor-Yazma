"use strict";

/*
  Kullanıcı bildirimi (2026-09-19): "müstakil yapılarda tapuda genelde
  proje bulunmuyor o yüzden eğer proje incelenen kurum webtapu seçilmesi
  ise webtapuda incelenmemiştir bulunamamıştır gibi ibareler olmamalı."

  buildNoArchitecturalProjectDescription() ("Mimari Proje Var mı?" =
  "Hayır" iken "Proje İnceleme Açıklaması"nı üreten fonksiyon), kullanıcının
  Belgeler ve Proje bölümünde SEÇTİĞİ kurumdan (projectInstitution) TAMAMEN
  BAĞIMSIZ olarak HER ZAMAN "{ilçe} Belediyesi ve Webtapu Portalında ...
  bulunamamıştır" diyordu. Müstakil Bina (genelde ruhsatsız/kayıt dışı)
  yapılarda Webtapu'da proje "aranıp bulunamaması" beklenen/normal bir
  durumdur, rapor metninde bunu bir "eksiklik" gibi vurgulamak yanıltıcı —
  kullanıcı bunun KALDIRILMASINI istedi.

  Düzeltme: Müstakil Bina'da VE kullanıcı projectInstitution'ı GERÇEKTEN
  Webtapu'yu İÇERECEK şekilde seçtiyse Webtapu bu cümleden çıkarılır
  (Belediye de seçiliyse yalnız Belediye anılır — orası GERÇEKTEN kontrol
  edilmiş bir kaynak). Hiçbir kurum seçilmemişse (varsayılan durum) eski
  iki-kurumlu cümle DEĞİŞMEDEN kalır. Müstakil Bina DIŞINDAKİ (ör. Dikey
  Kat İrtifakı) mülkiyet türlerinde davranış TAMAMEN DEĞİŞMEDEN kalır
  (regresyon kilidi, bkz. Senaryo 1).

  TAKİP BİLDİRİMİ 1 (2026-09-19, aynı gün): "webtapu seçilmesi ise
  bulunamamıştır demene gerek yok müstakil binalarda webtapuda proje
  olmuyor zaten" — Webtapu'yu cümleden çıkarıp yerine kurumsuz genel bir
  "bulunamamıştır" cümlesi bırakmak YETERSİZDİ; yalnız Webtapu seçiliyken
  "bulunamamıştır" demenin KENDİSİ gereksiz. Düzeltme: Belediye seçili
  DEĞİLSE (yalnız Webtapu) bu cümle TAMAMEN atlanır (bkz. Senaryo 3/3b).

  TAKİP SORUSU 2 (2026-09-19, aynı gün): "sadece belediye seçili ise nasıl
  cümle kuruluyor?" — Bu soru, ilk iki düzeltmenin gate'inin ("Webtapu
  seçili mi?") EKSİĞİNİ ortaya çıkardı: yalnız Belediye seçiliyken gate
  hiç tetiklenmiyor, cümle YİNE "Belediyesi ve Webtapu Portalında" diyerek
  Webtapu'yu SEÇİLMEMİŞ olsa bile anıyordu. Kök kural artık "Webtapu
  seçili mi" DEĞİL, "Müstakil Bina'da HERHANGİ bir kurum seçilmiş mi" —
  seçim varsa cümle SADECE gerçekten seçilen kurumu (Belediye) yansıtır,
  Webtapu (seçili olsun ya da olmasın) HİÇ anılmaz (bkz. Senaryo 5/5b).

  Bu test buildNoArchitecturalProjectDescription()'ı GERÇEK app.js
  kaynağından (yardımcı fonksiyonlarıyla birlikte) izole çalıştırır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") { parenDepth -= 1; if (parenDepth === 0) break; }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") { depth -= 1; if (depth === 0) return appSource.slice(start + 1, index + 1); }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "foldTurkish",
  "normalizeOwnershipTypeForSectionVisibility",
  "isMustakilBinaOwnershipType",
  "isLandProjectReview",
  "getSelectedProjectInstitutions",
  "projectInstitutionIncludes",
  "isOsbInstitutionValue",
  "getProjectReviewDistrictText",
  "buildNoArchitecturalProjectDescription",
];

function buildContext(fields) {
  const context = {
    state: { fields },
    normalizeReportTitleText: (value) => String(value || "").trim(),
    normalizeReportDescriptionText: (value) => String(value || "").replace(/\n{3,}/g, "\n\n").trim(),
    normalizeYesNoChoice: (value) => {
      const text = String(value || "").trim();
      if (text === "Evet" || text === "Hayır") return text;
      return "";
    },
    parseReportNumber: (value) => {
      const num = Number(String(value || "").replace(",", "."));
      return Number.isFinite(num) ? num : Number.NaN;
    },
    formatSquareMeterArea: (value) => `${value} m²`,
  };
  const source = functionNames.map(extractFunction).join("\n");
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

// --- 1) REGRESYON KİLİDİ: Müstakil Bina OLMAYAN mülkiyette (Dikey Kat
// İrtifakı) davranış DEĞİŞMEMELİ — Webtapu seçili olsa BİLE eski iki-
// kurumlu cümle aynen görünmeli. -----------------------------------------
{
  const context = buildContext({
    ownershipType: "Dikey Kat İrtifakı",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(
    result,
    /Kadıköy Belediyesi ve Webtapu Portalında yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina DIŞINDAKİ mülkiyette eski iki-kurumlu cümle DEĞİŞMEMELİ (regresyon): ${result}`
  );
  console.log("Regresyon: Müstakil Bina DIŞINDAKİ mülkiyette Webtapu ifadesi DEĞİŞMEDİ testi tamam.");
}

// --- 2) REGRESYON KİLİDİ: Müstakil Bina'da HİÇBİR kurum seçilmemişse ----
// (varsayılan durum) eski iki-kurumlu cümle DEĞİŞMEMELİ. -----------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(
    result,
    /Kadıköy Belediyesi ve Webtapu Portalında yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina'da kurum SEÇİLMEMİŞKEN eski iki-kurumlu cümle DEĞİŞMEMELİ (regresyon): ${result}`
  );
  console.log("Regresyon: Müstakil Bina + kurum seçilmemiş -> eski cümle DEĞİŞMEDİ testi tamam.");
}

// --- 3) YENİ DAVRANIŞ (takip bildirimi, 2026-09-19: "webtapu seçilmesi
// ise bulunamamıştır demene gerek yok müstakil binalarda webtapuda proje
// olmuyor zaten"): Müstakil Bina + SADECE Webtapu seçili -> "bulunamamıştır"
// cümlesinin KENDİSİ tamamen düşmeli (yalnız kurum adı değil). -----------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.equal(
    result,
    "",
    `Müstakil Bina + yalnız Webtapu seçiliyken (kadastro verisi de yokken) "bulunamamıştır" cümlesi hiç üretilmemeli: ${JSON.stringify(result)}`
  );
  console.log("YENİ: Müstakil Bina + yalnız Webtapu seçili -> 'bulunamamıştır' cümlesi TAMAMEN kaldırıldı testi tamam.");
}

// --- 3b) Aynı senaryoda (yalnız Webtapu) kadastro bilgisi GİRİLMİŞSE o ---
// paragraf, "bulunamamıştır" cümlesi olmadan TEK BAŞINA görünmeye devam
// etmeli (kadastro bilgisi Webtapu'dan bağımsız, ayrı bir veri kaynağı). -
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
    projectRegisteredInCadastre: "Hayır",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.doesNotMatch(result, /Webtapu/i, `Kadastro paragrafı olsa bile Webtapu HİÇ geçmemeli: ${result}`);
  assert.doesNotMatch(result, /bulunamamıştır/, `"bulunamamıştır" cümlesi bu senaryoda hiç geçmemeli: ${result}`);
  assert.match(
    result,
    /^Kadıköy Kadastro Müdürlüğünden alınan sözlü bilgiye göre parsel üzerinde yer alan yapının kadastral paftasına işli olmadığı bilgisi alınmıştır\.$/,
    `Kadastro paragrafı tek başına (baştaki cümle olmadan) görünmeli: ${result}`
  );
  console.log("YENİ: Müstakil Bina + yalnız Webtapu + kadastro verisi -> yalnız kadastro paragrafı kaldı testi tamam.");
}

// --- 4) YENİ DAVRANIŞ: Müstakil Bina + Webtapu VE Belediye ikisi de -----
// seçili -> yalnız Belediye anılmalı, Webtapu kaldırılmalı. ---------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu, Belediye",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.doesNotMatch(result, /Webtapu/i, `Müstakil Bina + Webtapu+Belediye seçiliyken cümlede Webtapu HİÇ geçmemeli: ${result}`);
  assert.match(
    result,
    /^Kadıköy Belediyesinde yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + Webtapu+Belediye seçiliyken yalnız Belediye anılmalı: ${result}`
  );
  console.log("YENİ: Müstakil Bina + Webtapu+Belediye seçili -> yalnız Belediye anıldı testi tamam.");
}

// --- 5) TAKİP SORUSU (2026-09-19, kullanıcı: "sadece belediye seçili ise
// nasıl cümle kuruluyor"): Müstakil Bina + SADECE Belediye seçili -> ------
// GERÇEKTEN kontrol edilen tek kurum Belediye olduğundan Webtapu artık HİÇ
// anılmamalı ("Belediyesi ve Webtapu Portalında" ilk düzeltmenin EKSİĞİYDİ
// — gate yalnızca "Webtapu seçili mi" diye bakıyordu, Belediye-tek
// senaryosunu hiç kapsamıyordu). --------------------------------------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Belediye",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.doesNotMatch(result, /Webtapu/i, `Müstakil Bina + yalnız Belediye seçiliyken Webtapu artık HİÇ geçmemeli: ${result}`);
  assert.match(
    result,
    /^Kadıköy Belediyesinde yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + yalnız Belediye seçiliyken yalnız Belediye anılmalı: ${result}`
  );
  console.log("YENİ: Müstakil Bina + yalnız Belediye seçili -> Webtapu artık anılmıyor testi tamam.");
}

// --- 5b) Müstakil Bina + Belediye DIŞI başka bir kurum (ör. OSB Bölge -----
// Müdürlüğü) SEÇİLİ -> Belediye de kontrol edilmediğinden cümle TAMAMEN
// atlanmalı (Webtapu/Belediye'yi olmayan bir gerçekliği anlatmaktansa hiç
// anmamak tercih edilir). ---------------------------------------------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "OSB Bölge Müdürlüğü",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.equal(
    result,
    "",
    `Müstakil Bina + Belediye/Webtapu DIŞI bir kurum seçiliyken cümle hiç üretilmemeli: ${JSON.stringify(result)}`
  );
  console.log("YENİ: Müstakil Bina + Belediye/Webtapu dışı kurum seçili -> cümle üretilmedi testi tamam.");
}

// --- 6) Kadastro paragrafı, YENİ davranışta da eskisi gibi eklenmeye -----
// devam ediyor (ikinci paragraf, kurum cümlesinden BAĞIMSIZ). ------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
    projectRegisteredInCadastre: "Evet",
    cadastralRegisteredBaseArea: "120",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(result, /pafta üzerine işli taban alanının 120 m² olduğu bilgisi alınmıştır\./, `Kadastro paragrafı Webtapu-hariç senaryoda da eklenmeye devam etmeli: ${result}`);
  console.log("Kadastro paragrafı, Webtapu kaldırılan senaryoda da korunuyor testi tamam.");
}

console.log("Müstakil Bina + Webtapu 'mimari proje bulunamamıştır' düzeltmesi testleri başarılı.");
