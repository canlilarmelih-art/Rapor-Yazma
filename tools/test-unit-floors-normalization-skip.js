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

console.log("unitFloors normalizasyon atlama testi tamam.");
