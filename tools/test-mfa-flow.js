"use strict";

/*
  Kullanici talebi: "eposta ile devam edelim ancak her girişte kod istemesin
  bunu bir standarda bağlayalım" — standart "güvenilir cihaz" pratiği
  (Google/GitHub/Microsoft ile ayni): kod dogrulandiktan sonra o cihaz 30 gun
  boyunca tekrar sorulmaz. RESEND_API_KEY ortam degiskeni AYARLANMAMISSA MFA
  tamamen devre disi kalir (kullanici Resend kurulumunu tamamlamadan yapilan
  deploy'lar mevcut girisi BOZMAMALI) — bu testin 1. bolumu tam olarak bunu
  dogrular.

  Bu test uc katmani izole dogrular:
  1) isMfaConfigured() — RESEND_API_KEY yoksa false, varsa true (modul
     process.env'i yukleme ANINDA okudugu icin require.cache temizlenip
     yeniden yuklenerek iki durum da test edilir).
  2) generateMfaCode() — her zaman 6 haneli, basindaki sifirlar dahil.
  3) markDeviceTrusted / isRequestFromTrustedDevice — cihaz guvenilir
     isaretlendikten sonra AYNI uid+cerez ile dogru cozuluyor; YANLIS uid
     veya cerez yoksa reddediliyor.
  4) setTrustCookie — HttpOnly + SameSite=Lax her zaman; Secure sadece
     gercek (localhost olmayan) host'ta (bkz. test-static-auth-gate.js'deki
     ayni kural, oturum cerezi icin zaten dogrulanmisti).
*/

const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serverPath = path.join(root, "server.js");

function requireServerWithEnv(resendApiKey) {
  delete require.cache[require.resolve(serverPath)];
  const previous = process.env.RESEND_API_KEY;
  if (resendApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = resendApiKey;
  const mod = require(serverPath);
  if (previous === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previous;
  return mod;
}

// --- 1) isMfaConfigured — RESEND_API_KEY yoksa devre disi ----------------
{
  const withoutKey = requireServerWithEnv(undefined);
  assert.equal(withoutKey.isMfaConfigured(), false, "RESEND_API_KEY yokken MFA devre disi olmali (mevcut girisi bozmamali).");

  const withEmptyKey = requireServerWithEnv("   ");
  assert.equal(withEmptyKey.isMfaConfigured(), false, "Sadece bosluktan olusan RESEND_API_KEY de devre disi sayilmali.");

  const withKey = requireServerWithEnv("re_test_1234567890");
  assert.equal(withKey.isMfaConfigured(), true, "RESEND_API_KEY ayarliyken MFA aktif olmali.");
}

// Kalan testler icin MFA aktif modulu kullan.
const server = requireServerWithEnv("re_test_1234567890");

// --- 2) generateMfaCode — her zaman 6 haneli -----------------------------
{
  for (let i = 0; i < 50; i += 1) {
    const code = server.generateMfaCode();
    assert.match(code, /^\d{6}$/, `Kod her zaman 6 haneli (basinda sifir dahil) olmali: "${code}"`);
  }
}

// --- 3) markDeviceTrusted / isRequestFromTrustedDevice — yasam dongusu ---
{
  return (async () => {
    const { id, expiresAt } = server.markDeviceTrusted("uid-mfa-1");
    assert.ok(id.length >= 32, "Cihaz kimligi yeterince uzun (tahmin edilemez) olmali.");
    assert.ok(expiresAt > Date.now() + 29 * 24 * 60 * 60 * 1000, "Guven suresi ~30 gun olmali (standart).");

    const trustedRequest = { headers: { cookie: `rapor_2fa_trust=${id}`, host: "localhost" } };
    const isTrusted = await server.isRequestFromTrustedDevice(trustedRequest, "uid-mfa-1");
    assert.equal(isTrusted, true, "Dogru uid + gecerli cerezle cihaz guvenilir sayilmali.");

    const wrongUidTrusted = await server.isRequestFromTrustedDevice(trustedRequest, "uid-mfa-DIFFERENT");
    assert.equal(wrongUidTrusted, false, "Ayni cerez BASKA bir uid icin guvenilir SAYILMAMALI (hesaplar arasi sizinti olmamali).");

    const noCookieRequest = { headers: { host: "localhost" } };
    const noCookieTrusted = await server.isRequestFromTrustedDevice(noCookieRequest, "uid-mfa-1");
    assert.equal(noCookieTrusted, false, "Cerez yoksa cihaz guvenilir sayilmamali (ilk kez gelen cihaz kod girmeli).");

    const forgedRequest = { headers: { cookie: "rapor_2fa_trust=0000000000000000000000000000000000000000000000000000000000000000", host: "localhost" } };
    const forgedTrusted = await server.isRequestFromTrustedDevice(forgedRequest, "uid-mfa-1");
    assert.equal(forgedTrusted, false, "Var olmayan/sahte bir cihaz kimligi guvenilir sayilmamali.");

    // --- 4) setTrustCookie — HttpOnly + SameSite=Lax + kosullu Secure ----
    let setHeaderCalls = [];
    const fakeResponse = { appendHeader: (key, value) => setHeaderCalls.push([key, value]) };
    server.setTrustCookie({ headers: { host: "experify.com.tr" } }, fakeResponse, id, expiresAt);
    const [, prodCookie] = setHeaderCalls[setHeaderCalls.length - 1];
    assert.match(prodCookie, /rapor_2fa_trust=/, "Cerez adi rapor_2fa_trust olmali.");
    assert.match(prodCookie, /HttpOnly/, "Guvenilir cihaz cerezi HttpOnly olmali.");
    assert.match(prodCookie, /SameSite=Lax/, "Guvenilir cihaz cerezi SameSite=Lax olmali.");
    assert.match(prodCookie, /Secure/, "Gercek (https) host'ta Secure bayragi olmali.");

    setHeaderCalls = [];
    server.setTrustCookie({ headers: { host: "localhost" } }, fakeResponse, id, expiresAt);
    const [, localCookie] = setHeaderCalls[setHeaderCalls.length - 1];
    assert.doesNotMatch(localCookie, /Secure/, "localhost'ta Secure bayragi OLMAMALI (yerel test edilebilsin diye).");

    console.log("Eposta MFA (guvenilir cihaz standardi) testi tamam.");
  })();
}
