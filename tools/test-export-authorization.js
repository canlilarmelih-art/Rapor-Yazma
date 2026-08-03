"use strict";

const assert = require("node:assert/strict");
const server = require("../server.js");

(async () => {
  const firstKey = await server.getExportSigningKey();
  const secondKey = await server.getExportSigningKey();
  assert.match(firstKey, /^[a-f0-9]{96}$/i, "Dışa aktarma imza anahtarı beklenen kriptografik uzunlukta değil.");
  assert.equal(firstKey, secondKey, "Dışa aktarma imza anahtarı süreç içinde sabit kalmalı.");
  assert.equal(typeof server.handleExportAuthorizationApi, "function", "Sunucu tarafı dışa aktarma yetkilendirme ucu dışa aktarılmamış.");
  console.log("Resmi çıktı yetkilendirme güvenlik testi tamam.");
})().catch((error) => {
  console.error("Resmi çıktı yetkilendirme güvenlik testi BAŞARISIZ:", error);
  process.exit(1);
});
