"use strict";

// Kullanıcı bildirimi (2026-09-14, ekran görüntüsü — "Banka şablonuyla
// kaydet (.zip)" tıklandığında): "normal kullanıcı böyle bir hata alıyor
// bunu çöz." Hata: "Paket hazırlanamadı: Bu işlem için ikinci doğrulama
// gerekir." (mfa_required).
//
// Kök neden: `getOperationalApiAccessFailure()`'ın varsayılan MFA gate'i
// (`mfaRequired = isMfaConfigured()`) ve login gate'i (`handleSessionApi`'nin
// `/api/session` dalı, `isMfaConfigured()`) RESEND_API_KEY'in salt
// VARLIĞINA bakıyordu — 0.0.681'de eklenen `MFA_REQUIRED` AÇIK POLİTİKA
// anahtarına (`isMfaRequired()`) DEĞİL. RESEND_API_KEY üretimde BAŞKA bir
// amaçla (yeni kullanıcı bildirim e-postası, 0.0.305) zaten yapılandırılı
// olduğundan, 0.0.681'de "MFA_REQUIRED varsayılan false — bu değişiklik
// mevcut erişimi ANİDEN KESMEZ" diye BİLİNÇLİ belgelenen davranış HİÇ
// gerçekleşmiyordu: MFA, GitHub repository variable'ı hiç `true`
// yapılmadan TÜM normal kullanıcılar için sessizce (istemeden) zorunlu
// hale gelmişti — bu depoda `MFA_REQUIRED` repository variable'ı hiç
// ayarlanmamış (varsayılan `false`), yani ÜRETİMDE HİÇBİR kullanıcının
// bununla karşılaşmaması GEREKİYORDU.
//
// Düzeltme: her iki gate de artık `isMfaRequired()` kullanıyor. Bu dosya
// SADECE `getOperationalApiAccessFailure()`'ın VARSAYILAN (override'sız)
// davranışını test eder — `tools/test-operational-api-access-gate.js`
// zaten HER ZAMAN `{ mfaRequired: true }` override'ı GEÇEREK gate'in
// KENDİ mantığını (approval/session/mfa/suspended sıralaması) test ediyor,
// bu regresyonu YAKALAMAZ (override default'u hiç kullanmıyor).
// `handleSessionApi` dışa aktarılmadığından (yalnızca dahili kullanım),
// login gate'in düzeltmesi kaynak-düzeyinde (grep) doğrulanır.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "server-data");
const stateFiles = ["sessions.json", "trusted-devices.json", "pending-users.json", "approved-users.json", "privileged-users.json"];

function backupAndClear() {
  const backups = new Map();
  fs.mkdirSync(dataDir, { recursive: true });
  stateFiles.forEach((name) => {
    const file = path.join(dataDir, name);
    backups.set(name, fs.existsSync(file) ? fs.readFileSync(file) : null);
    fs.rmSync(file, { force: true });
  });
  return backups;
}

function restore(backups) {
  stateFiles.forEach((name) => {
    const file = path.join(dataDir, name);
    fs.rmSync(file, { force: true });
    const data = backups.get(name);
    if (data) fs.writeFileSync(file, data);
  });
}

function freshServerWithEnv(resendApiKey, mfaRequired) {
  const serverPath = path.join(root, "server.js");
  delete require.cache[require.resolve(serverPath)];
  const previousKey = process.env.RESEND_API_KEY;
  const previousRequired = process.env.MFA_REQUIRED;
  if (resendApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = resendApiKey;
  if (mfaRequired === undefined) delete process.env.MFA_REQUIRED;
  else process.env.MFA_REQUIRED = mfaRequired;
  const mod = require(serverPath);
  if (previousKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previousKey;
  if (previousRequired === undefined) delete process.env.MFA_REQUIRED;
  else process.env.MFA_REQUIRED = previousRequired;
  return mod;
}

async function setupApprovedSessionUser(server, uid, email) {
  await server.registerPendingUser(uid, email);
  await server.approveUser(uid);
  const session = server.createSession(uid, email);
  return { headers: { host: "localhost", cookie: `rapor_session=${session.id}` } };
}

async function main() {
  // --- 1) RESEND_API_KEY AYARLI ama MFA_REQUIRED AYARLANMAMIŞ (varsayılan,
  // bu depodaki GERÇEK üretim durumu) -> VARSAYILAN gate MFA İSTEMEMELİ.
  // (KULLANICI SENARYOSU BİREBİR: RESEND_API_KEY var — 0.0.305 e-posta
  // bildirimi için — MFA_REQUIRED hiç ayarlanmamış.)
  {
    const backups = backupAndClear();
    try {
      const server = freshServerWithEnv("re_test_1234567890", undefined);
      assert.equal(server.isMfaConfigured(), true, "RESEND_API_KEY ayarlıyken isMfaConfigured() true olmalı (capability).");
      assert.equal(server.isMfaRequired(), false, "MFA_REQUIRED ayarlanmamışken isMfaRequired() false olmalı (policy varsayılanı).");

      const uid = "uid-mfa-default-policy";
      const email = "mfa-default-policy@example.com";
      const request = await setupApprovedSessionUser(server, uid, email);
      const user = { uid, email };

      // Güvenilir cihaz çerezi YOK — eski (buggy) davranışta bu 'mfa_required'
      // dönerdi. Override VERİLMİYOR (varsayılan davranış test ediliyor).
      const failure = await server.getOperationalApiAccessFailure(request, user);
      assert.equal(failure, null, "MFA_REQUIRED=false (varsayılan) iken normal onaylı+oturumlu kullanıcı güvenilir cihaz OLMADAN da erişebilmeli — 'mfa_required' ile ENGELLENMEMELİ.");
      console.log("RESEND_API_KEY var + MFA_REQUIRED yok (uretim varsayilani) -> varsayilan gate MFA istemiyor testi tamam.");
    } finally {
      restore(backups);
    }
  }

  // --- 2) MFA_REQUIRED=true (açık politika) -> VARSAYILAN gate GERÇEKTEN --
  // MFA istemeli (regresyon: isMfaRequired() yanlışlıkla her zaman false
  // dönmediğini/gate'in policy'yi hâlâ dinlediğini doğrular).
  {
    const backups = backupAndClear();
    try {
      const server = freshServerWithEnv("re_test_1234567890", "true");
      assert.equal(server.isMfaRequired(), true, "MFA_REQUIRED=true iken isMfaRequired() true olmalı.");

      const uid = "uid-mfa-explicit-policy";
      const email = "mfa-explicit-policy@example.com";
      const request = await setupApprovedSessionUser(server, uid, email);
      const user = { uid, email };

      const failure = await server.getOperationalApiAccessFailure(request, user);
      assert.equal(failure?.code, "mfa_required", "MFA_REQUIRED=true iken (açık politika) güvenilir cihaz olmadan varsayılan gate 'mfa_required' döndürmeli.");

      const trusted = server.markDeviceTrusted(uid, email);
      request.headers.cookie += `; rapor_2fa_trust=${trusted.id}`;
      assert.equal(await server.getOperationalApiAccessFailure(request, user), null, "Güvenilir cihaz sonrası erişim izin verilmeli.");
      console.log("MFA_REQUIRED=true (acik politika) -> varsayilan gate GERCEKTEN MFA istiyor testi tamam.");
    } finally {
      restore(backups);
    }
  }

  // --- 3) Kaynak-düzeyi regresyon kilidi: login gate (handleSessionApi'nin --
  // /api/session dalı) de isMfaRequired() kullanıyor, isMfaConfigured()
  // DEĞİL (handleSessionApi dışa aktarılmadığından doğrudan çağrılamıyor).
  {
    const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
    const sessionBranchMatch = /if \(url === "\/api\/session"\) \{\s*\n\s*if \((isMfaRequired\(\)|isMfaConfigured\(\))/.exec(serverSource);
    assert(sessionBranchMatch, "'/api/session' dalının MFA kontrolü bulunamadı.");
    assert.equal(
      sessionBranchMatch[1],
      "isMfaRequired()",
      `Login gate artık isMfaRequired() kullanmalı (açık politika), isMfaConfigured() (salt e-posta yeteneği) DEĞİL — bulunan: ${sessionBranchMatch[1]}`
    );
    console.log("Login gate (handleSessionApi /api/session) kaynak-duzeyi isMfaRequired() kablolama testi tamam.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
