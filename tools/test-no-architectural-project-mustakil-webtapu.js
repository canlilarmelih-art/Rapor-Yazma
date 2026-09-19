"use strict";

/*
  Kullanıcı bildirimi (2026-09-19): "müstakil yapılarda tapuda genelde
  proje bulunmuyor o yüzden eğer proje incelenen kurum webtapu seçilmesi
  ise webtapuda incelenmemiştir bulunamamıştır gibi ibareler olmamalı."

  buildNoArchitecturalProjectDescription() ("Mimari Proje Var mı?" =
  "Hayır" iken "Proje İnceleme Açıklaması"nı üreten fonksiyon), kullanıcının
  Belgeler ve Proje bölümünde SEÇTİĞİ kurumdan (projectInstitution) TAMAMEN
  BAĞIMSIZ olarak HER ZAMAN "{ilçe} Belediyesi ve Webtapu Portalında ...
  bulunamamıştır" diyordu.

  ARA TURLAR (aynı gün, iki YANLIŞ deneme): Önce yalnızca "Webtapu seçili
  mi" kontrolüyle Webtapu'yu cümleden çıkarmayı, sonra Belediye seçili
  DEĞİLSE cümleyi TAMAMEN atlamayı denedim — ama bu, "sadece belediye
  seçili ise nasıl cümle kuruluyor" sorusuna kadar yalnız-Belediye
  senaryosunu hâlâ eski (Webtapu'yu da anan) cümleyle bırakıyordu, VE daha
  ciddisi kullanıcının SON netleştirmesiyle ("tamamen yanlış anladın")
  TÜMÜYLE YANLIŞ bir kural uyguluyordu.

  KESİN KURAL (kullanıcının son, net tarifi): "eğer webtapu ve belediye
  seçili ise webtapu ve belediye olarak cümleyi kur, başka kurum seçili
  ise yine kur, sadece [yalnız] webtapu seçili olduğunda webtapuda proje
  bulunamamıştır ya da incelenememiştir yazmayalım." Yani:
  - Webtapu + Belediye (veya Webtapu + başka bir kurum, veya yalnız
    Belediye, veya yalnız başka bir kurum) seçiliyse: cümle GERÇEKTEN
    seçilen kurum(lar)ı yansıtarak NORMAL şekilde kurulur (Webtapu dahil
    olsa bile, birden fazla kurumdan biriyse sorun yok).
  - YALNIZ Webtapu seçiliyse (başka HİÇBİR kurum yokken): cümle TAMAMEN
    atlanır ("" döner) — müstakil binada Webtapu'da proje aranıp
    bulunamaması tek başına beklenen/normal, ayrıca belirtilmeye değmez.
  - Hiçbir kurum seçilmemişse (varsayılan durum) VEYA Müstakil Bina
    DIŞINDAKİ mülkiyet türlerinde eski iki-kurumlu cümle DEĞİŞMEDEN kalır.

  Kurum(lar)ı yansıtan cümle, önceden HİÇ kullanılmayan (yalnızca bir
  yorumda adı geçen) formatProjectReviewLocationForMissing() yardımcısıyla
  kurulur — Webtapu için sade "Webtapu Portalında", Belediye için "{ilçe}
  Belediyesi İmar ve Şehircilik Müdürlüğünde", diğer kurumlar (OSB, İl Özel
  İdare, Büyükşehir, Anıtlar Kurulu) için formatProjectReviewLocation
  yedeği ("{kurum} arşivinde") — joinTurkishList ile birleştirilir.

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
  "formatProjectReviewLocation",
  "formatProjectReviewLocationForMissing",
  "joinTurkishList",
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

// --- 3) KESİN KURAL: Müstakil Bina + SADECE (yalnız) Webtapu seçili -> ---
// "bulunamamıştır" cümlesi TAMAMEN atlanmalı. -----------------------------
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
  console.log("Müstakil Bina + yalnız Webtapu seçili -> 'bulunamamıştır' cümlesi TAMAMEN kaldırıldı testi tamam.");
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
  console.log("Müstakil Bina + yalnız Webtapu + kadastro verisi -> yalnız kadastro paragrafı kaldı testi tamam.");
}

// --- 4) KESİN KURAL: Müstakil Bina + Webtapu VE Belediye ikisi de -------
// seçili -> Webtapu ARTIK BİR ŞEY DEĞİL, tek başına değil; cümle İKİSİNİ
// DE anmalı (kullanıcı: "webtapu ve belediye seçili ise webtapu ve
// belediye olarak cümleyi kur"). ------------------------------------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu, Belediye",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(result, /Webtapu/i, `Müstakil Bina + Webtapu+Belediye seçiliyken Webtapu cümlede GEÇMELİ (yalnız-Webtapu değil): ${result}`);
  assert.match(result, /Belediye/i, `Müstakil Bina + Webtapu+Belediye seçiliyken Belediye de cümlede geçmeli: ${result}`);
  assert.match(
    result,
    /^Webtapu Portalında ve Kadıköy Belediyesi İmar ve Şehircilik Müdürlüğünde yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + Webtapu+Belediye seçiliyken ikisi de GERÇEK yerleriyle anılmalı: ${result}`
  );
  console.log("Müstakil Bina + Webtapu+Belediye seçili -> ikisi de anıldı testi tamam.");
}

// --- 5) KESİN KURAL: Müstakil Bina + SADECE Belediye seçili -> Webtapu ---
// seçili OLMADIĞINDAN cümlede hiç geçmemeli, yalnız Belediye anılmalı. ----
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Belediye",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.doesNotMatch(result, /Webtapu/i, `Müstakil Bina + yalnız Belediye seçiliyken Webtapu geçmemeli: ${result}`);
  assert.match(
    result,
    /^Kadıköy Belediyesi İmar ve Şehircilik Müdürlüğünde yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + yalnız Belediye seçiliyken yalnız Belediye anılmalı: ${result}`
  );
  console.log("Müstakil Bina + yalnız Belediye seçili -> yalnız Belediye anıldı testi tamam.");
}

// --- 6) KESİN KURAL: Müstakil Bina + Belediye/Webtapu DIŞI başka bir -----
// kurum (ör. OSB Bölge Müdürlüğü) SEÇİLİ -> "başka kurum seçili ise yine
// kur" — cümle bu kurumu yansıtarak normal şekilde kurulmalı (ATLANMAMALI). -
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "OSB Bölge Müdürlüğü",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(
    result,
    /^OSB Bölge Müdürlüğü arşivinde yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + Belediye/Webtapu dışı bir kurum seçiliyken cümle o kurumu yansıtarak kurulmalı, ATLANMAMALI: ${result}`
  );
  console.log("Müstakil Bina + Belediye/Webtapu dışı kurum seçili -> cümle o kurumla kuruldu testi tamam.");
}

// --- 7) Kadastro paragrafı, tüm YENİ senaryolarda da eskisi gibi ---------
// eklenmeye devam ediyor (ikinci paragraf, kurum cümlesinden BAĞIMSIZ). --
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Belediye",
    projectRegisteredInCadastre: "Evet",
    cadastralRegisteredBaseArea: "120",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(result, /pafta üzerine işli taban alanının 120 m² olduğu bilgisi alınmıştır\./, `Kadastro paragrafı yalnız-Belediye senaryosunda da eklenmeye devam etmeli: ${result}`);
  console.log("Kadastro paragrafı, yalnız-Belediye senaryosunda da korunuyor testi tamam.");
}

console.log("Müstakil Bina + Webtapu 'mimari proje bulunamamıştır' düzeltmesi testleri başarılı.");
