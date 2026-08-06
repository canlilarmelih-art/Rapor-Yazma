"use strict";

/*
  Kullanici raporu: "ilk gerçek kullanıcımız sisteme kayıt oldu. ancak eposta
  doğrulama kodu spam a düştü bunu düzeltebilir miyiz?" — Resend panelinde
  experify.com.tr domaininin DKIM/SPF/DMARC kayitlarinin hepsi "Verified"
  cikti (kimlik dogrulama sorunu degil). Kalan bilinen deliverability
  etkeni: e-posta yalnizca HTML govdeli gonderiliyordu, duz-metin (text/plain)
  alternatifi yoktu — bazi spam filtreleri (ozellikle kurumsal/Outlook)
  bunu ceza puani olarak sayar.

  Bu test:
  1) stripEmailHtmlToText() — HTML etiketlerini/varliklarini temizleyip
     okunabilir duz metin urettigini dogrular (script/style disarida
     birakilir, <br>/<p> satir sonu uretir, &nbsp;/&amp;/&lt;/&gt;/&quot;
     cozulur, fazla bosluk/satir sikistirilir).
  2) sendEmailViaResend() artik Resend API'ye gonderdigi payload'a bir
     "text" alani ekliyor (opsiyonel 4. parametre verilmezse HTML'den
     otomatik turetiyor) — gercek bir HTTP cagrisi yapmadan, https.request'i
     gecici olarak sahteleyerek (monkey-patch) payload'i yakalayip dogrular.
*/

const assert = require("node:assert/strict");
const path = require("node:path");
const https = require("node:https");
const { EventEmitter } = require("node:events");

const root = path.resolve(__dirname, "..");

// sendEmailViaResend testi icin RESEND_API_KEY set edilmis olmali (aksi
// halde bazi cagri yollari farkli davranabilir) — burada sadece payload
// yapisini test ettigimizden sahte bir deger yeterli.
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test-key-not-real";

const server = require(path.join(root, "server.js"));

// --- 1) stripEmailHtmlToText ---------------------------------------------
{
  const html = `<!doctype html><html><head><style>body{color:red}</style></head><body>
    <p>Merhaba <b>Dünya</b>&nbsp;test</p>
    <p>İkinci satır &amp; üçüncü &lt;kısım&gt;</p>
    <script>alert('x')</script>
  </body></html>`;
  const text = server.stripEmailHtmlToText(html);
  assert.ok(text.includes("Merhaba Dünya test"), "Duz metinde ana icerik eksik.");
  assert.ok(text.includes("İkinci satır & üçüncü <kısım>"), "HTML varlik cozumlemesi (entity decode) hatali.");
  assert.ok(!/<\/?(p|b|html|body|head)\b/i.test(text), "Etiket kalintisi olmamali.");
  assert.ok(!/alert\(/.test(text), "<script> icerigi duz metne sizmamali.");
  assert.ok(!/color:red/.test(text), "<style> icerigi duz metne sizmamali.");
  console.log("stripEmailHtmlToText testi tamam.");
}

// --- 2) sendEmailViaResend artik "text" alani gonderiyor ------------------
{
  async function captureResendPayload(runSend) {
    const originalRequest = https.request;
    let capturedPayload = null;
    https.request = (options, callback) => {
      const fakeResponse = new EventEmitter();
      fakeResponse.setEncoding = () => {};
      const fakeRequest = new EventEmitter();
      fakeRequest.write = (chunk) => {
        capturedPayload = JSON.parse(chunk);
      };
      fakeRequest.end = () => {
        // Basarili (2xx) bir Resend yaniti simule et.
        fakeResponse.statusCode = 200;
        callback(fakeResponse);
        process.nextTick(() => {
          fakeResponse.emit("data", "{}");
          fakeResponse.emit("end");
        });
      };
      fakeRequest.destroy = () => {};
      return fakeRequest;
    };
    try {
      await runSend();
    } finally {
      https.request = originalRequest;
    }
    return capturedPayload;
  }

  return (async () => {
    // 2a) text parametresi verilmeden — otomatik turetilmeli.
    const payloadAuto = await captureResendPayload(() =>
      server.sendEmailViaResend("test@example.com", "Test Konu", "<p>Merhaba <b>Dünya</b></p>")
    );
    assert.ok(payloadAuto, "Payload yakalanamadi.");
    assert.equal(typeof payloadAuto.text, "string", "Otomatik 'text' alani eklenmemis.");
    assert.ok(payloadAuto.text.length > 0, "Otomatik turetilen 'text' bos olmamali.");
    assert.ok(payloadAuto.text.includes("Merhaba Dünya"), "Otomatik turetilen 'text' HTML icerigini yansitmiyor.");
    assert.ok(payloadAuto.html.includes("<b>Dünya</b>"), "'html' alani hala HTML olarak kalmali (text ile degistirilmemis).");

    // 2b) text parametresi acikca verilirse OTOMATIK turetme yerine o
    // kullanilmali (caller kendi ozel metnini vermek isteyebilir).
    const payloadExplicit = await captureResendPayload(() =>
      server.sendEmailViaResend("test@example.com", "Test Konu", "<p>Merhaba</p>", "Ozel duz metin.")
    );
    assert.equal(payloadExplicit.text, "Ozel duz metin.", "Acikca verilen 'text' parametresi kullanilmadi.");

    console.log("sendEmailViaResend 'text' (duz-metin alternatifi) testi tamam.");
  })();
}
