"use strict";

/*
  Kullanici talebi (2026-09-07): "kullanici adi ve soyadini ve calistigi
  firmanin ticari adini placeholderlar bolumune ekle" — login.html kayit
  formunun ZATEN topladigi (server.js'in approved-users.json'da SAKLADIGI,
  GET /api/account-profile ile dondurdugu) fullName/company profili artik
  banka sablonu placeholder'lari ({{KULLANICI_AD_SOYAD}}/{{KULLANICI_FIRMA}})
  ve "Placeholder" referans ekrani ("Kullanici Bilgileri" kategorisi)
  uzerinden erisilebilir.

  Bu test UCTAN UCA dogrular:
  1) app.js'teki setCurrentUserProfile/buildCurrentUserFullNameText/
     buildCurrentUserCompanyText saf fonksiyonlarinin (gercek kaynaktan,
     vm sandbox'ta) trim+bos deger davranisi.
  2) window.RaporAccessControl.setUserProfile/getUserFullName/getUserCompany
     kablolamasinin (app.js kaynaginda regex ile) dogru fonksiyonlara
     bagli oldugu.
  3) template-engine.js'teki {{KULLANICI_AD_SOYAD}}/{{KULLANICI_FIRMA}}
     token'larinin safeCall("buildCurrentUserFullNameText"/"buildCurrentUserCompanyText")
     uzerinden CANLI (global) uretilen degerleri kullandigi.
  4) collectGeneratedTextPlaceholders() katalogunda "Kullanici Bilgileri"
     kategorisiyle iki yeni satirin (current_user_full_name/current_user_company)
     var oldugu.
  5) cloud-sync.js'in her oturum acilisinda (handleAuthState) VE hesap
     bilgileri kaydedildikten hemen sonra (profileSaveButton) GET
     /api/account-profile'i sorgulayip window.RaporAccessControl.setUserProfile'i
     cagirdigi, cikis yapildiginda profili bosalttigi.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
const cloudSyncSource = fs.readFileSync(path.join(appDir, "cloud", "cloud-sync.js"), "utf8");

function sliceAppFn(marker) {
  const start = appSource.indexOf(marker);
  assert(start >= 0, `app.js icinde bulunamadi: ${marker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

// --- 1) Saf profil fonksiyonlarini GERCEK app.js kaynagindan vm sandbox'ta calistir --
{
  const src = [
    'let currentUserFullName = "";',
    'let currentUserCompany = "";',
    sliceAppFn("function setCurrentUserProfile("),
    sliceAppFn("function buildCurrentUserFullNameText("),
    sliceAppFn("function buildCurrentUserCompanyText("),
  ].join("\n");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx);

  assert.equal(ctx.buildCurrentUserFullNameText(), "", "Baslangicta ad soyad bos olmali.");
  assert.equal(ctx.buildCurrentUserCompanyText(), "", "Baslangicta firma adi bos olmali.");

  ctx.setCurrentUserProfile("  Ahmet Yılmaz  ", "  ABC Değerleme A.Ş.  ");
  assert.equal(ctx.buildCurrentUserFullNameText(), "Ahmet Yılmaz", "Ad soyad trim edilmemis.");
  assert.equal(ctx.buildCurrentUserCompanyText(), "ABC Değerleme A.Ş.", "Firma adi trim edilmemis.");

  // Cikis yapildiginda (veya profil sorgusu basarisiz oldugunda) bosalmali.
  ctx.setCurrentUserProfile(null, undefined);
  assert.equal(ctx.buildCurrentUserFullNameText(), "", "null/undefined ad soyad bosalmiyor.");
  assert.equal(ctx.buildCurrentUserCompanyText(), "", "null/undefined firma adi bosalmiyor.");

  console.log("setCurrentUserProfile/buildCurrentUserFullNameText/buildCurrentUserCompanyText testi tamam.");
}

// --- 2) window.RaporAccessControl kablolamasi (kaynak regex ile) -------
{
  assert.match(
    appSource,
    /window\.RaporAccessControl\s*=\s*\{[\s\S]*?setUserProfile:\s*setCurrentUserProfile,/,
    "window.RaporAccessControl.setUserProfile setCurrentUserProfile'e baglanmamis.",
  );
  assert.match(
    appSource,
    /window\.RaporAccessControl\s*=\s*\{[\s\S]*?getUserFullName:\s*\(\)\s*=>\s*currentUserFullName,/,
    "window.RaporAccessControl.getUserFullName currentUserFullName'i okumuyor.",
  );
  assert.match(
    appSource,
    /window\.RaporAccessControl\s*=\s*\{[\s\S]*?getUserCompany:\s*\(\)\s*=>\s*currentUserCompany,/,
    "window.RaporAccessControl.getUserCompany currentUserCompany'i okumuyor.",
  );
  console.log("window.RaporAccessControl.setUserProfile/getUserFullName/getUserCompany kablolamasi testi tamam.");
}

// --- 3) collectGeneratedTextPlaceholders() katalogunda yeni girdiler ---
{
  const genStart = appSource.indexOf("function collectGeneratedTextPlaceholders()");
  const genEnd = appSource.indexOf("\nfunction collectTablePlaceholders", genStart);
  assert(genStart > -1 && genEnd > genStart, "collectGeneratedTextPlaceholders bulunamadi.");
  const genSlice = appSource.slice(genStart, genEnd);

  assert.match(
    genSlice,
    /category:\s*"Kullanıcı Bilgileri",\s*\n\s*key:\s*"current_user_full_name",\s*\n\s*title:\s*"Kullanıcı Ad Soyad",\s*\n\s*value:\s*buildCurrentUserFullNameText\(\),/,
    "current_user_full_name katalog satiri beklenen sekilde bulunamadi.",
  );
  assert.match(
    genSlice,
    /category:\s*"Kullanıcı Bilgileri",\s*\n\s*key:\s*"current_user_company",\s*\n\s*title:\s*"Kullanıcının Çalıştığı Firma \(Ticari Ad\)",\s*\n\s*value:\s*buildCurrentUserCompanyText\(\),/,
    "current_user_company katalog satiri beklenen sekilde bulunamadi.",
  );
  console.log("collectGeneratedTextPlaceholders() 'Kullanici Bilgileri' katalog girdileri testi tamam.");
}

// --- 4) template-engine.js: {{KULLANICI_AD_SOYAD}}/{{KULLANICI_FIRMA}} --
{
  assert.match(
    engineSource,
    /KULLANICI_AD_SOYAD:\s*\{\s*t:\s*\(\)\s*=>\s*safeCall\("buildCurrentUserFullNameText"\)\s*\},/,
    "KULLANICI_AD_SOYAD safeCall(\"buildCurrentUserFullNameText\") kullanmiyor.",
  );
  assert.match(
    engineSource,
    /KULLANICI_FIRMA:\s*\{\s*t:\s*\(\)\s*=>\s*safeCall\("buildCurrentUserCompanyText"\)\s*\},/,
    "KULLANICI_FIRMA safeCall(\"buildCurrentUserCompanyText\") kullanmiyor.",
  );

  const sandboxWindow = {};
  process.env.NODE_ENV = "test";
  const stubState = { fields: {}, tables: {} };
  const stubSections = [{ id: "test", fields: [] }];
  function stubEscapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  const loader = new Function(
    "window", "state", "sections", "collectGeneratedTextPlaceholders",
    "escapeHtml", "formatWordParagraphs", "dateIsoToTr", "parseValuationNumber", "formatSchemeNumber",
    engineSource
  );
  loader(
    sandboxWindow,
    stubState,
    stubSections,
    () => [],
    stubEscapeHtml,
    (text, paragraphClass) => {
      const classAttr = paragraphClass ? ` class="${stubEscapeHtml(paragraphClass)}"` : "";
      return `<p${classAttr}>${stubEscapeHtml(text)}</p>`;
    },
    (iso) => String(iso || ""),
    (value) => Number.parseFloat(String(value).replace(/\./g, "").replace(",", ".")),
    (value) => new Intl.NumberFormat("tr-TR").format(value)
  );
  const engine = sandboxWindow.RaporTemplates;
  assert.ok(engine, "window.RaporTemplates olusmadi.");

  globalThis.buildCurrentUserFullNameText = () => "Ahmet Yılmaz";
  globalThis.buildCurrentUserCompanyText = () => "ABC Değerleme A.Ş.";
  try {
    // KULLANICI_AD_SOYAD/KULLANICI_FIRMA "t:" (uretilen metin bloğu)
    // ailesinde oldugundan resolveToken/fillTemplate ciktisi diger tum
    // "t:" alanlari (ör. ZIRAAT_KONUM_CEVRESEL) gibi bir <p> paragrafina
    // sarilir (formatWordParagraphs) — asil deger ".includes" ile
    // dogrulanir, tam esitlik ile degil.
    const nameResolved = engine.resolveToken("KULLANICI_AD_SOYAD");
    assert.ok(nameResolved.ok, "{{KULLANICI_AD_SOYAD}} cozulemedi.");
    assert.ok(
      nameResolved.html.includes("Ahmet Yılmaz"),
      `KULLANICI_AD_SOYAD yanlis: ${nameResolved.html}`,
    );

    const companyResolved = engine.resolveToken("KULLANICI_FIRMA");
    assert.ok(companyResolved.ok, "{{KULLANICI_FIRMA}} cozulemedi.");
    assert.ok(
      companyResolved.html.includes("ABC Değerleme A.Ş."),
      `KULLANICI_FIRMA yanlis: ${companyResolved.html}`,
    );

    const joined = engine.fillTemplate("{{KULLANICI_AD_SOYAD}} - {{KULLANICI_FIRMA}}").html;
    assert.ok(
      joined.includes("Ahmet Yılmaz") && joined.includes("ABC Değerleme A.Ş."),
      `Sablon icinde birlikte kullanim beklenen metni uretmedi: ${joined}`,
    );
  } finally {
    delete globalThis.buildCurrentUserFullNameText;
    delete globalThis.buildCurrentUserCompanyText;
  }
  console.log("{{KULLANICI_AD_SOYAD}}/{{KULLANICI_FIRMA}} token cozumleme testi tamam.");
}

// --- 5) cloud-sync.js: applyUserProfileFromServer kablolamasi ----------
{
  assert.match(
    cloudSyncSource,
    /async function applyUserProfileFromServer\(\)\s*\{[\s\S]*?accountApi\("\/api\/account-profile"\)[\s\S]*?window\.RaporAccessControl\?\.setUserProfile\?\.\(profile\.fullName \|\| "", profile\.company \|\| ""\);/,
    "applyUserProfileFromServer /api/account-profile'i sorgulayip setUserProfile'i cagirmiyor.",
  );
  assert.match(
    cloudSyncSource,
    /applySensitiveRoleFromServer\(\);\s*\n\s*applyUserProfileFromServer\(\);/,
    "handleAuthState() applySensitiveRoleFromServer'in YANINDA applyUserProfileFromServer'i cagirmiyor.",
  );
  assert.match(
    cloudSyncSource,
    /window\.RaporAccessControl\?\.setCanViewSensitive\?\.\(false\);\s*\n\s*window\.RaporAccessControl\?\.setUserProfile\?\.\("", ""\);/,
    "Cikis yapildiginda (logout) profil window.RaporAccessControl uzerinden bosaltilmiyor.",
  );
  assert.match(
    cloudSyncSource,
    /await accountApi\("\/api\/account-profile", \{[\s\S]*?method:\s*"PUT"[\s\S]*?\}\);[\s\S]{0,300}?applyUserProfileFromServer\(\);/,
    "Hesap bilgileri kaydedildikten hemen sonra placeholder cache'i tazelenmiyor (applyUserProfileFromServer cagrilmiyor).",
  );
  console.log("cloud-sync.js applyUserProfileFromServer kablolamasi (giris/cikis/kaydet) testi tamam.");
}

console.log("Kullanici profili (ad soyad/firma) placeholder testi tamam.");
