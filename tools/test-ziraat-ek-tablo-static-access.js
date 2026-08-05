"use strict";

/*
  Kullanici talebi: "Ziraat bankasında ek tablo zip paketi içinde olmalıydı.
  ancak şu an yok. sadece hesaplama tablolarının bulunduğu excel var."

  Kok neden: 3741c66 ("feat: render bank templates through protected server
  API", 2026-08-03) commit'i, gercekten hassas (kopyalanabilir metin/tasarim
  iceren) banka rapor sablonlarini (templates/*.html, templates/emlakkatilim.docx)
  korumak icin server.js -> handleStatic() icine "templates/" altindaki HER
  seyi kosulsuz 404'leyen bir blok ekledi. Ancak src/exports/ziraat-ek-tablo-xlsx.js
  templates/ziraat-ek-tablo.xlsx dosyasini DOGRUDAN fetch() ile cekiyor (bu
  mekanizma 3741c66'dan ONCE, ayri commit'lerde kurulmustu) — bu sablon HTML/
  DOCX gibi hassas degil, tamamen istemci tarafinda doldurulan bos bir
  bicimlendirme kabugu. Blok, bu meru fetch'i de kapsayip 404 dondurunce
  RaporXlsxFill.fillTemplate() 404 metnini xlsx gibi parse etmeye calisip
  hata firlatiyor, exportZiraatEkTabloWithBankTemplateIfNeeded() bunu
  try/catch'te yutup ziraatFailed=true set ediyor ve "Ek Tablo" ZIP'ten
  sessizce dusuyordu.

  Bu test GERCEK bir HTTP sunucusu (server.js'in kendi http.Server ornegi,
  ephemeral portta) uzerinden, otantike OLMADAN (kimlik dogrulama kasitli
  disarida birakildi — asagida aciklanir):
  1) templates/ziraat-ek-tablo.xlsx artik 404 "Sablonlar dogrudan indirilemez"
     ile ENGELLENMIYOR (normal oturum-auth akisina dusuyor: session yoksa 401
     "Giriş gerekli." — ki bu, dosyanin blok tarafindan degil, standart auth
     katmani tarafindan ele alindigini kanitlar).
  2) templates/isbank.html VE templates/emlakkatilim.docx (hassas sablonlar)
     HALA "Sablonlar dogrudan indirilemez." 404'u ile engelleniyor (regresyon
     korumasi — .xlsx istisnasi digerlerini gevsetmemis).
*/

const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serverModule = require(path.join(root, "server.js"));

assert.equal(typeof serverModule.handleStatic, "function", "server.js artik handleStatic'i export etmeli.");
assert.ok(serverModule.server, "server.js artik http.Server ornegini export etmeli.");

function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port, path: urlPath }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

(async () => {
  const httpServer = serverModule.server;
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const port = httpServer.address().port;

  try {
    // --- 1) templates/ziraat-ek-tablo.xlsx artik "Sablonlar dogrudan
    // indirilemez." 404'una takilmiyor (auth-gate 401'ine dusuyor, blok
    // 404'una degil). ---------------------------------------------------
    {
      const res = await get(port, "/templates/ziraat-ek-tablo.xlsx");
      assert.notEqual(
        res.body,
        "Sablonlar dogrudan indirilemez.",
        "templates/ziraat-ek-tablo.xlsx hala genel 'templates/' blokuna takiliyor — Ek Tablo ZIP'e giremez."
      );
      // Oturumsuz istekte normal davranis: 401 (Giris gerekli) ya da (public
      // sayilirsa) 200 olabilir; onemli olan blok-spesifik 404 GOVDESI degil.
      assert.ok(
        res.statusCode === 401 || res.statusCode === 200,
        `Beklenmeyen durum kodu: ${res.statusCode} (govde: ${res.body.slice(0, 120)})`
      );
    }

    // --- 2) Hassas sablonlar (HTML/DOCX) hala korunuyor — istisna cok
    // genis acilmamis. --------------------------------------------------
    {
      const resHtml = await get(port, "/templates/isbank.html");
      assert.equal(resHtml.statusCode, 404);
      assert.equal(resHtml.body, "Sablonlar dogrudan indirilemez.");

      const resDocx = await get(port, "/templates/emlakkatilim.docx");
      assert.equal(resDocx.statusCode, 404);
      assert.equal(resDocx.body, "Sablonlar dogrudan indirilemez.");
    }

    console.log("Ziraat Ek Tablo statik erisim (templates/*.xlsx istisnasi) testi tamam.");
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
