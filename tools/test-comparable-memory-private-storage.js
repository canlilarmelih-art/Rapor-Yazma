"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const server = require(path.join(root, "server.js"));
const clientSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const firstUser = "comparable-memory-owner-a";
const secondUser = "comparable-memory-owner-b";

async function main() {
  assert.match(clientSource, /const comparableMemoryDisplayDiameterMeters = 5000;/, "Geçmiş emsal görünüm çapı 5 km olmalı.");
  assert.match(clientSource, /distance <= comparableMemoryDisplayDiameterMeters \/ 2/, "5 km çap, 2,5 km yarıçapla uygulanmalı.");
  assert.match(clientSource, /isComparableMemoryWithinDisplayRadius\(subjectPoint, lat, lng\)/, "Geçmiş emsal işaretçileri konu taşınmaza göre yarıçap filtresinden geçmeli.");

  const firstFile = server.userComparableMemoryFile(firstUser);
  const secondFile = server.userComparableMemoryFile(secondUser);
  assert.notEqual(firstFile, secondFile, "Her kullanıcının emsal hafızası ayrı bir dosyada tutulmalı.");

  const valid = server.sanitizeComparableMemoryRow({
    c4: "daire",
    c14: "5.000.000",
    c18: "40.225335",
    c19: "28.841321",
    c17: "Kontrol karakteri\u0000 silinmeli",
    ignored: "asla yazılmamalı",
  });
  assert.equal(valid.c18, "40.225335");
  assert.equal(valid.c19, "28.841321");
  assert.equal(valid.c17.includes("\u0000"), false, "Kontrol karakterleri kalıcı kayda girmemeli.");
  assert.equal(Object.hasOwn(valid, "ignored"), false, "Tanımsız alanlar kalıcı kayda girmemeli.");
  assert.equal(server.sanitizeComparableMemoryRow({ c18: "0", c19: "0" }), null, "Türkiye dışı/geçersiz koordinat kaydedilmemeli.");

  try {
    fs.mkdirSync(path.dirname(firstFile), { recursive: true });
    fs.writeFileSync(firstFile, JSON.stringify([{ id: "only-owner-a", savedAt: new Date().toISOString(), comparable: valid }]), "utf8");
    assert.equal((await server.readUserComparableMemory(firstUser)).length, 1, "Sahip kendi kaydını okuyabilmeli.");
    assert.equal((await server.readUserComparableMemory(secondUser)).length, 0, "Başka kullanıcının kaydı bu kullanıcıya görünmemeli.");
  } finally {
    fs.rmSync(firstFile, { force: true });
    fs.rmSync(secondFile, { force: true });
  }
  console.log("Emsal hafızası özel saklama testi tamam.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
