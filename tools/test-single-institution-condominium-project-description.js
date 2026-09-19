"use strict";

/*
  Kullanıcı bildirimi (2026-09-19, "normal Dikey Kat İrtifaklı raporda
  Webtapu seçili değilse Proje İncelenen Kurum cümlesi nasıl geliyor"):
  buildSingleInstitutionCondominiumProjectDescription() (Kat İrtifakı
  mülkiyetinde, "Proje İncelenen Kurum" alanında TEK bir kurum seçiliyken
  çalışan fonksiyon), yalnız Belediye seçiliyken kendiliğinden HİÇ
  kontrol edilmemiş Webtapu'yu da anıp "Webtapu Portalında ve {ilçe} Tapu
  Müdürlüğünde ... mimari proje bulunamamıştır" diye EKLİYORDU (simetrik
  olarak yalnız Webtapu seçiliyken de Belediye için aynı sorun vardı).
  Kullanıcı bunu ("bulunamamıştır ne alaka bu incelenen kurumlar" diye
  sorduktan sonra) netleştirdi: "sadece seçileni anlat, diğerini hiç
  anma."

  Düzeltme: her iki dal da artık YALNIZCA gerçekten seçilen kurumdaki
  incelemeyi ("incelenmiştir") anlatıyor; seçilmeyen kurum hakkında
  hiçbir iddia (ne "bulunamamıştır" ne "incelenememiştir") eklenmiyor.
  TAKBİS-yok dalı (tapu kaydı hiç alınamadığı için tapu projesinin
  incelenememesi) BAĞIMSIZ, GERÇEK bir tespit olduğundan DEĞİŞMEDİ.

  NOT: Bu turdan ÖNCE, aynı gün, YANLIŞLIKLA buildNoArchitecturalProjectDescription()
  (Mimari Proje Var mı = Hayır durumu) dört kez değiştirilip sonra GERİ
  ALINDI — o fonksiyon çalışırken "Proje İncelenen Kurum" alanı zaten
  isArchitecturalProjectDependentField() ile EKRANDAN GİZLİ olduğundan
  (kullanıcı o kurumu hiç seçemiyor), o fonksiyona dokunmak baştan yanlış
  bir hedefti. Asıl sorun HER ZAMAN bu dosyadaki fonksiyondaydı.

  Bu test buildSingleInstitutionCondominiumProjectDescription()'ı GERÇEK
  app.js kaynağından (yardımcı fonksiyonlarıyla birlikte) izole çalıştırır.
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
  "getProjectReviewDistrictText",
  "formatProjectReviewLocation",
  "buildSingleInstitutionCondominiumProjectDescription",
];

function buildContext(fields) {
  const context = {
    state: { fields },
    normalizeReportTitleText: (value) => String(value || "").trim(),
  };
  const source = functionNames.map(extractFunction).join("\n");
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

// --- 1) YALNIZ Belediye seçili (Webtapu seçili DEĞİL) -> cümle SADECE ---
// Belediye'deki incelemeyi anlatmalı, Webtapu HİÇ geçmemeli. -------------
{
  const context = buildContext({ titleDistrict: "Kadıköy" });
  const result = context.buildSingleInstitutionCondominiumProjectDescription("Belediye", "12.04.2005 tarih ve 2005/125 sayılı mimari proje", "");
  assert.doesNotMatch(result, /Webtapu/i, `Yalnız Belediye seçiliyken Webtapu HİÇ geçmemeli: ${result}`);
  assert.doesNotMatch(result, /bulunamamıştır/, `Yalnız Belediye seçiliyken "bulunamamıştır" iddiası hiç eklenmemeli: ${result}`);
  assert.equal(
    result,
    "Kadıköy Belediyesi İmar ve Şehircilik Müdürlüğünde ekspertize konu taşınmaza ait 12.04.2005 tarih ve 2005/125 sayılı mimari proje incelenmiştir.",
    `Yalnız Belediye seçiliyken cümle sadece incelenen kurumu anlatmalı: ${result}`
  );
  console.log("Yalnız Belediye seçili -> Webtapu artık hiç anılmıyor testi tamam.");
}

// --- 2) YALNIZ Webtapu seçili (Belediye seçili DEĞİL) -> simetrik olarak -
// cümle SADECE Webtapu'daki incelemeyi anlatmalı, Belediye HİÇ geçmemeli. -
{
  const context = buildContext({ titleDistrict: "Kadıköy" });
  const result = context.buildSingleInstitutionCondominiumProjectDescription("Webtapu", "12.04.2005 tarih ve 2005/125 sayılı mimari proje", "");
  assert.doesNotMatch(result, /Belediye/i, `Yalnız Webtapu seçiliyken Belediye HİÇ geçmemeli: ${result}`);
  assert.doesNotMatch(result, /bulunamamıştır/, `Yalnız Webtapu seçiliyken "bulunamamıştır" iddiası hiç eklenmemeli: ${result}`);
  assert.equal(
    result,
    "Webtapu Portalında ekspertize konu taşınmaza ait 12.04.2005 tarih ve 2005/125 sayılı mimari proje incelenmiştir.",
    `Yalnız Webtapu seçiliyken cümle sadece incelenen kurumu anlatmalı: ${result}`
  );
  console.log("Yalnız Webtapu seçili -> Belediye artık hiç anılmıyor testi tamam.");
}

// --- 3) REGRESYON KİLİDİ: TAKBİS kaydı hiç alınamadıysa (Belediye tek ----
// seçiliyken) tapu projesinin "incelenememiştir" denmesi GERÇEK, bağımsız
// bir tespit olduğundan DEĞİŞMEMELİ. --------------------------------------
{
  const context = buildContext({ titleDistrict: "Kadıköy", takbisMethod: "Tapu Kaydı Alınmamıştır." });
  const result = context.buildSingleInstitutionCondominiumProjectDescription("Belediye", "12.04.2005 tarih ve 2005/125 sayılı mimari proje", "");
  assert.equal(
    result,
    "Kadıköy Belediyesi İmar ve Şehircilik Müdürlüğünde ekspertize konu taşınmaza ait 12.04.2005 tarih ve 2005/125 sayılı mimari proje incelenmiştir. TAKBİS belgesi alınmadığından taşınmaza ait tapu projesi incelenememiştir.",
    `TAKBİS-yok dalı DEĞİŞMEMELİ (regresyon): ${result}`
  );
  console.log("Regresyon: TAKBİS kaydı yokken tapu projesi incelenememiştir cümlesi DEĞİŞMEDİ testi tamam.");
}

// --- 4) dateLead parametresi hâlâ öne ekleniyor (regresyon). -------------
{
  const context = buildContext({ titleDistrict: "Kadıköy" });
  const result = context.buildSingleInstitutionCondominiumProjectDescription("Belediye", "12.04.2005 tarih ve 2005/125 sayılı mimari proje", "12.04.2026 tarihinde ");
  assert.match(result, /^12\.04\.2026 tarihinde Kadıköy Belediyesi/, `dateLead cümlenin başına eklenmeye devam etmeli: ${result}`);
  console.log("dateLead öneki korunuyor testi tamam.");
}

// --- 5) Belediye/Webtapu DIŞI bir kurum (ör. OSB) seçiliyse fonksiyon ----
// hâlâ "" döner (regresyon) — çağıran taraf (buildProjectReviewDescription)
// bu durumda KENDİ genel "incelenmiştir" cümlesini kurar. -----------------
{
  const context = buildContext({ titleDistrict: "Kadıköy" });
  const result = context.buildSingleInstitutionCondominiumProjectDescription("OSB Bölge Müdürlüğü", "12.04.2005 tarih ve 2005/125 sayılı mimari proje", "");
  assert.equal(result, "", `Belediye/Webtapu dışı bir kurumda fonksiyon "" dönmeye devam etmeli (regresyon): ${JSON.stringify(result)}`);
  console.log("Regresyon: Belediye/Webtapu dışı kurumda fonksiyon boş döndü testi tamam.");
}

console.log("buildSingleInstitutionCondominiumProjectDescription() 'seçilmeyen kurumu anma' düzeltmesi testleri başarılı.");
