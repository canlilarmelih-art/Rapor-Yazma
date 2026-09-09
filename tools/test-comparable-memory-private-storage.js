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
  assert.match(clientSource, /const defaultSelectionKeys = new Set\(\["c23", "c32", "c25", "c26", "c28"\]\)/, "EMSAL GETİR, varsayılan seçili alanları dolu emsal olarak saymamalı.");
  assert.match(clientSource, /comparableFields\s*\.filter\(\(field\) => !field\.computed/, "EMSAL GETİR, yalnız gerçek emsal şeması alanlarını değerlendirmeli.");
  assert.match(clientSource, /function buildComparableMemoryCardHtml\(entry\)/, "Geçmiş emsal için kart oluşturulmalı.");
  for (const fieldKey of ["c4", "c5", "c6", "c13", "c11", "c15", "calcAdjustedUnitValue"]) {
    assert.match(clientSource, new RegExp(`getComparableMemoryCardValue\\(row, "${fieldKey}"\\)`), `Emsal kartı ${fieldKey} alanını göstermeli.`);
  }
  assert.match(clientSource, /getComparableMemoryTransferLocation\(getComparableSavedPoint\(row\)\)/, "Emsal kartı Konumu bu raporun KML sınırına göre göstermeli.");
  assert.match(clientSource, /function getComparableMemoryParcelValue\(row = \{\}\)/, "Konu taşınmaz emsal kartı Ada/Parsel bilgisi gösterebilmeli.");
  assert.match(clientSource, /\["Ada \/ Parsel", getComparableMemoryParcelValue\(row\)\]/, "Emsal kartında Ada/Parsel satırı bulunmalı.");
  assert.match(clientSource, /data-comparable-memory-target/, "Emsal kartında hedef sütun butonları bulunmalı.");
  assert.match(clientSource, /function applyComparableMemoryEntryToColumn\(entry, targetIndex\)/, "Geçmiş emsal seçilen sütuna aktarılmalı.");
  assert.match(clientSource, /function isComparableSubjectStatus\(row = \{\}\)/, "Konu taşınmaz emsal durumu ayrı tanınmalı.");
  assert.match(clientSource, /fillColor: subjectComparable \? "#dc2626" : "#14b8a6"/, "Konu taşınmaz noktası kırmızı gösterilmeli.");
  assert.match(clientSource, /function isPointInsideKmlBoundary\(point, coordinates = \[\]\)/, "Geçmiş emsal KML sınırı içinde mi kontrol edilmeli.");
  assert.match(clientSource, /function getComparableMemoryTransferLocation\(point\)/, "Geçmiş emsal konumu KML sınırına göre aktarılmalı.");
  assert.match(clientSource, /function getDefaultComparableViewMode\(\)/, "Emsal görünümünün kullanım niteliğine göre varsayılanı bulunmalı.");
  assert.match(clientSource, /\["ARSA", "ARAZI"\]\.includes\(currentUsageNature\) \? "land" : "residential"/, "Arsa/Arazi dışındaki mevcut kullanımda görünüm Konut/Yapı Emsalleri olmalı.");
  assert.match(clientSource, /function isComparableMemoryNatureCompatibleWithCurrentUsage\(row = \{\}\)/, "Geçmiş emsal harita filtresi mevcut kullanım niteliğini dikkate almalı.");
  assert.match(clientSource, /if \(currentUsageNature === "KONUT"\) return \["konut", "mustakil bina"\]\.includes\(comparableNature\)/, "Konut taşınmazda yalnız konut türevleri gösterilmeli.");
  assert.match(clientSource, /if \(!isComparableMemoryNatureCompatibleWithCurrentUsage\(entry\?\.comparable \|\| \{\}\)\) return;/, "Uyumsuz geçmiş emsal harita işaretçisi gösterilmemeli.");
  assert.match(clientSource, /if \(!isComparableMemoryPointInsideKml\(point\)\) return "Aynı bölge";/, "KML dışındaki geçmiş emsal aynı bölge olarak aktarılmalı.");
  assert.match(clientSource, /c7: getComparableMemoryTransferLocation\(point\)/, "Geçmiş emsal konumu aktarımda yeniden belirlenmeli.");
  assert.match(clientSource, /c20: point \? buildComparableLocationText\(point\[0\], point\[1\]\) : ""/, "Geçmiş emsal taşınmaza göre konum metnini yeni raporun koordinatlarıyla yeniden hesaplamalı.");
  for (const key of ["c8", "c9", "c21", "c22"]) {
    assert.match(clientSource, new RegExp(`${key}: ""`), `Geçmiş emsal aktarımında ${key} şerefiye alanı Seçiniz olmalı.`);
  }
  assert.match(clientSource, /const comparableMemoryPremiumKeys = new Set\(\["c8", "c9", "c21", "c22"\]\)/, "Şerefiye alanları aktarım listesinden açıkça çıkarılmalı.");
  assert.match(clientSource, /Object\.entries\(comparable\)\.filter\(\(\[key\]\) => !comparableMemoryPremiumKeys\.has\(key\)\)/, "Geçmiş emsal aktarımı şerefiye alanlarını taşımamalı.");

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
