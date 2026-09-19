"use strict";

/*
  Regresyon: normalizeReportStateFields() her autosave döngüsünde (~450ms)
  state.tables içindeki TÜM dizileri satır/hücre bazında normalize ediyordu.
  unitFloors satırları (floor/legalArea/interiors/note gibi ADLANDIRILMIŞ
  anahtarlar, c0/c1... değil) için eşleşen bir section.id bulunamadığından
  normalizeReportTableValue varsayılan "başlık büyütme" dalına düşüyor ve
  "İç Hacimler" seçici kutusundaki "WC" değerini "Wc"ye çeviriyordu — bu da
  <option value="WC">  ile eşleşmediği için sekme değiştirilip geri
  dönüldüğünde seçimin boş görünmesine yol açıyordu (kullanıcı bildirimi).

  Bu test normalizeReportStateFields() fonksiyonunu GERÇEK app.js kaynağından
  izole çalıştırır; normalizeReportFieldValue/normalizeReportTableValue stub'lanır
  (hangi tabloya dokunulduğunu görmek için) — böylece unitFloors atlanırsa
  fonksiyonun asla çağrılmadığı doğrulanır.

  EK REGRESYON (2026-09-19, kullanıcı bildirimi): "yapı sınıfı bölümü
  kendini resetliyor ... yeni bir yapı eklenince." AYNI kök neden:
  state.tables.buildings/buildingParts/documentScopes de c0/c1 değil
  ADLANDIRILMIŞ anahtarlar (name/buildingClass/usage/status/buildingId/
  buildingPartId...) kullanır ve bunlara karşılık gelen bir section.id
  YOKTUR — "1/A" gibi bir Yapı Sınıfı kodu her autosave'de "1/a"ya
  çevrilip <option value="1/A"> ile eşleşmeyince bir sonraki render'da
  seçim sıfırlanmış görünüyordu. DAHA CİDDİSİ: documentScopes.buildingId/
  buildingPartId TAM EŞLEŞME (===) ile karşılaştırılan kimlik dizeleridir
  — başlık büyütmeyle bozulursa belge↔yapı bağlantıları GÖRÜNMEDEN
  kopabilirdi. Senaryo 3-5 bu üç tabloyu da kapsar.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function normalizeReportStateFields");
const end = appSource.indexOf("function findReportFieldDefinition", start);
assert(start >= 0 && end > start, "normalizeReportStateFields fonksiyonu bulunamadi.");

function runWithState(targetState) {
  const touchedTables = [];
  const context = {
    sections: [
      { id: "title", table: { columns: ["Malik", "Hisse"] } },
      { id: "documents", table: { columns: ["Belge türü", "İncelenen kurum"] } },
    ],
    normalizeReportFieldValue: (key, value) => value,
    normalizeReportTableValue: (section, column, value) => {
      touchedTables.push(section?.id || "(section yok)");
      // Gerçek varsayılan davranışı taklit eder: eşleşen sütun/section yoksa
      // metni "Title Case" yapar — tam olarak WC -> Wc regresyonunu üreten dal.
      return value.replace(/\S+/g, (word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1).toLocaleLowerCase("tr-TR"));
    },
  };
  vm.createContext(context);
  vm.runInContext(appSource.slice(start, end), context);
  context.normalizeReportStateFields(targetState);
  return { targetState, touchedTables };
}

// --- 1) unitFloors satırındaki "interiors" (WC) dokunulmadan kalmali --------
const stateWithUnitFloors = {
  fields: {},
  tables: {
    unitFloors: [
      { floor: "1. Normal", legalArea: "56", interiors: "Salon, WC, Mutfak", note: "" },
    ],
  },
};
const { targetState: afterUnitFloors, touchedTables } = runWithState(stateWithUnitFloors);
assert.equal(
  afterUnitFloors.tables.unitFloors[0].interiors,
  "Salon, WC, Mutfak",
  `unitFloors.interiors degismis olmamali (WC -> Wc regresyonu geri geldi): ${JSON.stringify(afterUnitFloors.tables.unitFloors[0].interiors)}`
);
assert(
  !touchedTables.includes("(section yok)"),
  "normalizeReportTableValue, section'i olmayan (unitFloors gibi) bir tabloya hala uygulaniyor."
);

// --- 2) documents gibi c0/c1... anahtarli GERÇEK genel tablolar hala normalize edilmeli
const stateWithDocuments = {
  fields: {},
  tables: {
    documents: [{ c0: "yeni yapı ruhsatı", c1: "yıldırım belediyesi" }],
  },
};
const { targetState: afterDocuments } = runWithState(stateWithDocuments);
assert.notEqual(
  afterDocuments.tables.documents[0].c0,
  "yeni yapı ruhsatı",
  "documents tablosu (c0/c1... anahtarli, section'i olan) artik hic normalize edilmiyor — istenmeyen genis kapsamli regresyon."
);

// --- 3) buildings satırındaki "buildingClass" (ör. "1/A") dokunulmadan
// kalmalı — kullanıcının GERÇEK bildirdiği örnek (76/72 m² senaryosunun
// bina-sınıflandırma karşılığı).
{
  const stateWithBuildings = {
    fields: {},
    tables: {
      buildings: [
        { id: "Building-8926ac545184", name: "Fabrika Binası", buildingClass: "1/A", usage: "Üretim" },
      ],
    },
  };
  const { targetState: afterBuildings, touchedTables: touchedBuildings } = runWithState(stateWithBuildings);
  assert.equal(
    afterBuildings.tables.buildings[0].buildingClass,
    "1/A",
    `buildings.buildingClass degismis olmamali ("1/A" -> "1/a" regresyonu geri geldi): ${JSON.stringify(afterBuildings.tables.buildings[0].buildingClass)}`
  );
  assert(
    !touchedBuildings.includes("(section yok)"),
    "normalizeReportTableValue, section'i olmayan (buildings gibi) bir tabloya hala uygulaniyor."
  );
  console.log("buildings normalizasyon atlama (Yapı Sınıfı reset) testi tamam.");
}

// --- 4) buildingParts satırındaki "usage"/"status" da dokunulmadan kalmalı
// (buildings ile AYNI kusur sınıfı, aynı adlandırılmış-anahtar şeması).
{
  const stateWithBuildingParts = {
    fields: {},
    tables: {
      buildingParts: [
        { id: "Part-1", buildingId: "Building-8926ac545184", name: "1. Üretim Holü", usage: "Üretim", status: "Aktif" },
      ],
    },
  };
  const { targetState: afterParts, touchedTables: touchedParts } = runWithState(stateWithBuildingParts);
  assert.equal(afterParts.tables.buildingParts[0].usage, "Üretim", "buildingParts.usage degismis olmamali.");
  assert.equal(afterParts.tables.buildingParts[0].status, "Aktif", "buildingParts.status degismis olmamali.");
  assert(!touchedParts.includes("(section yok)"), "normalizeReportTableValue, section'i olmayan (buildingParts gibi) bir tabloya hala uygulaniyor.");
  console.log("buildingParts normalizasyon atlama testi tamam.");
}

// --- 5) documentScopes.buildingId/buildingPartId (TAM EŞLEŞME ile
// karşılaştırılan kimlik dizeleri) başlık büyütmeyle BOZULMAMALI — aksi
// halde belge↔yapı bağlantıları görünmeden kopar.
{
  const stateWithScopes = {
    fields: {},
    tables: {
      documentScopes: [
        { id: "Scope-1", documentId: "Doc-1", buildingId: "Building-8926ac545184", buildingPartId: "", targetType: "building" },
      ],
    },
  };
  const { targetState: afterScopes, touchedTables: touchedScopes } = runWithState(stateWithScopes);
  assert.equal(
    afterScopes.tables.documentScopes[0].buildingId,
    "Building-8926ac545184",
    `documentScopes.buildingId degismis olmamali (kimlik esleme kopar): ${JSON.stringify(afterScopes.tables.documentScopes[0].buildingId)}`
  );
  assert.equal(afterScopes.tables.documentScopes[0].targetType, "building", "documentScopes.targetType (dahili enum) degismis olmamali.");
  assert(!touchedScopes.includes("(section yok)"), "normalizeReportTableValue, section'i olmayan (documentScopes gibi) bir tabloya hala uygulaniyor.");
  console.log("documentScopes normalizasyon atlama (kimlik korumasi) testi tamam.");
}

console.log("unitFloors normalizasyon atlama testi tamam.");
