"use strict";

/*
  Kullanici talebi: "bu risk çok önemli... bu kopyalanamamalı" — app.js (ve
  index.html, styles.css, cloud/cloud-sync.js gibi diger kaynak dosyalar)
  daha once giris yapilmadan HERKESE kosulsuz statik dosya olarak servis
  ediliyordu; sayfadaki #authGateOverlay yalnizca GORSEL bir kapiydi, kodun
  tarayiciya inmesini engellemiyordu.

  Cozum: login.html ile Firebase'e giris yapildiktan sonra sunucu, dogrulanmis
  kimligi HttpOnly bir oturum cerezine (rapor_session) baglar; bu cerez
  olmadan login.html VE birkac genel varlik (Firebase SDK, ikonlar, manifest)
  DISINDA hicbir statik dosya sunulmaz (bkz. server.js handleStatic).

  Bu test server.js'in gercek export edilen fonksiyonlarini izole calistirir:
  1) isPublicStaticFile — hangi yollarin cerezsiz erisilebilir oldugunu
     dogrular (login.html/vendor/firebase/manifest/icons EVET, app.js/
     index.html/styles.css/cloud-sync.js/saha-pro.html HAYIR).
  2) createSession / getSessionFromRequest / destroySession — cerez
     olusturma, gecerli cerezle kimlik cozme, silinen/sahte cerezin
     reddedilmesi.
  3) setSessionCookie / clearSessionCookie — Set-Cookie basliginin HttpOnly +
     SameSite=Lax icerdigini, gercek (localhost olmayan) host'ta Secure
     eklendigini, localhost'ta eklenmedigini (yerel test edilebilsin diye)
     dogrular.
*/

const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const server = require(path.join(root, "server.js"));

// --- 1) isPublicStaticFile — kaynak kodu koruma allowlist'i --------------
{
  const publicPaths = [
    "login.html",
    "manifest.json",
    "icons/icon-192.png",
    "icons/experify-mark-navy.svg",
    "vendor/firebase/firebase-app-compat.js",
    "vendor/firebase/firebase-auth-compat.js",
    "cloud/firebase-config.js",
  ];
  publicPaths.forEach((relativePath) => {
    assert.ok(
      server.isPublicStaticFile(relativePath),
      `"${relativePath}" oturumsuz erisilebilir (public) olmali.`,
    );
  });

  const protectedPaths = [
    "index.html",
    "app.js",
    "styles.css",
    "saha-pro.html",
    "admin-users.html",
    "cloud/cloud-sync.js",
    "cloud/report-library.js",
    "src/comparables/comparable-market-analysis.js",
    "vendor/leaflet/leaflet.css",
    "templates/isbank.html",
  ];
  protectedPaths.forEach((relativePath) => {
    assert.ok(
      !server.isPublicStaticFile(relativePath),
      `"${relativePath}" oturum ZORUNLU (korumali) olmali — kaynak kodu icerir.`,
    );
  });
}

// --- 2) Oturum yasam dongusu: olustur -> dogrula -> yanlis/silinmis reddet
{
  const { id, expiresAt } = server.createSession("uid-test-1", "test@example.com");
  assert.equal(typeof id, "string");
  assert.ok(id.length >= 32, `Oturum kimligi yeterince uzun (tahmin edilemez) olmali: ${id.length}`);
  assert.ok(expiresAt > Date.now(), "Son kullanma tarihi gelecekte olmali.");

  const validRequest = { headers: { cookie: `rapor_session=${id}`, host: "localhost" } };
  return (async () => {
    const resolved = await server.getSessionFromRequest(validRequest);
    assert.equal(resolved?.uid, "uid-test-1", "Gecerli cerezle uid dogru cozulmeli.");
    assert.equal(resolved?.email, "test@example.com");

    const forgedRequest = { headers: { cookie: "rapor_session=0000000000000000000000000000000000000000000000000000000000000000", host: "localhost" } };
    const forgedResult = await server.getSessionFromRequest(forgedRequest);
    assert.equal(forgedResult, null, "Var olmayan/sahte bir oturum kimligi kabul edilmemeli.");

    const noCookieRequest = { headers: { host: "localhost" } };
    const noCookieResult = await server.getSessionFromRequest(noCookieRequest);
    assert.equal(noCookieResult, null, "Cerez hic yoksa oturum bulunmamali.");

    server.destroySession(id);
    const afterDestroy = await server.getSessionFromRequest(validRequest);
    assert.equal(afterDestroy, null, "Cikis (destroySession) sonrasi ayni cerez artik gecersiz olmali.");

    // --- 3) Cookie header bicimi: HttpOnly + SameSite zorunlu, Secure
    //        yalnizca gercek (localhost olmayan) host'ta ---------------------
    {
      const { id: id2, expiresAt: expiresAt2 } = server.createSession("uid-test-2", null);
      let setHeaderCalls = [];
      const fakeResponse = { appendHeader: (key, value) => setHeaderCalls.push([key, value]) };
      server.setSessionCookie({ headers: { host: "experify.com.tr" } }, fakeResponse, id2, expiresAt2);
      const [, prodCookie] = setHeaderCalls[setHeaderCalls.length - 1];
      assert.match(prodCookie, /HttpOnly/, "Cerez HttpOnly olmali (XSS ile calinamasin).");
      assert.match(prodCookie, /SameSite=Lax/, "Cerez SameSite=Lax olmali (CSRF sertlestirmesi).");
      assert.match(prodCookie, /Secure/, "Gercek (https) host'ta Secure bayragi olmali.");

      setHeaderCalls = [];
      server.setSessionCookie({ headers: { host: "localhost" } }, fakeResponse, id2, expiresAt2);
      const [, localCookie] = setHeaderCalls[setHeaderCalls.length - 1];
      assert.doesNotMatch(
        localCookie,
        /Secure/,
        "localhost'ta Secure bayragi OLMAMALI (http'de yerel giris testi imkansiz olmasin).",
      );

      setHeaderCalls = [];
      server.clearSessionCookie({ headers: { host: "experify.com.tr" } }, fakeResponse);
      const [, clearedCookie] = setHeaderCalls[setHeaderCalls.length - 1];
      assert.match(clearedCookie, /Max-Age=0/, "Cikis cerezi hemen suresi dolmus (Max-Age=0) olmali.");

      server.destroySession(id2);
    }

    console.log("Statik dosya oturum kapisi (kaynak kodu koruma) testi tamam.");
  })();
}
