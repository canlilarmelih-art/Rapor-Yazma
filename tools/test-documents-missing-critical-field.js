"use strict";

/*
  Kullanici talebi: "Mimari Proje Var Mı?" kutusu işaretliyken (varsayılan
  değer: işaretli) İncelenen Belgeler tablosuna hiç belge girilmemişse bu,
  "Eksik kritik alan" listesinde belirtilmeli. Kutu işaretli değilse veya
  en az bir belge satırı (Belge Türü dolu) girilmişse bu uyarı görünmemeli.

  Aynı oturumda, "Belge ekle" butonunun tek başına küçük/soluk olması ve
  tablo boşken sayfa genelinde fark edilmemesi şikayeti üzerine createTable()
  içinde belgeler tablosu boşken kesikli çerçeveli, ortalanmış bir "boş
  durum" kutusu (documents-table-empty-state) gösterilmeye başlandı; bu test
  o UI değişikliğini değil, arkasındaki eksik-alan mantığını (yeni
  hasAnyReviewedDocumentEntered() ve getMissingRequiredFields() eklentisini)
  izole doğrular.

  getMissingRequiredFields() gercek app.js kaynagindan izole calistirilir;
  bu testin kapsami disindaki alt sistemler (bolum listesi, tamamlanma
  kritik alan haritasi, emsal sayimi, arazi banka sablonu kontrolu) no-op/
  bos donen stub'larla degistirilir — yalnizca yeni "İncelenen Belgeler"
  eksik-alan kontrolu test edilir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

const foldSrc = sliceFn("function foldTurkish(");
const normalizeYesNoChoiceSrc = sliceFn("function normalizeYesNoChoice(");
const hasCompletionValueSrc = sliceFn("function hasCompletionValue(");
const hasAnyReviewedDocumentEnteredSrc = sliceFn("function hasAnyReviewedDocumentEntered(");

const getMissingRequiredFieldsStart = appSource.indexOf("function getMissingRequiredFields(");
const getMissingRequiredFieldsEnd = appSource.indexOf("\n}", getMissingRequiredFieldsStart) + 2;
assert(getMissingRequiredFieldsStart >= 0, "getMissingRequiredFields fonksiyonu bulunamadi.");
const getMissingRequiredFieldsSrc = appSource.slice(getMissingRequiredFieldsStart, getMissingRequiredFieldsEnd);

function runScenario({ documents = [], hasArchitecturalProject = "Evet" }) {
  const context = {
    state: {
      fields: { hasArchitecturalProject },
      tables: { documents },
      sourceValues: {},
    },
    // Bu testin kapsami disindaki alt sistemler no-op/bos stub'lanir.
    getVisibleSections: () => [],
    completionCriticalFields: {},
    isLandPropertyForBankTemplate: () => false,
    hasReviewedOccupancyPermitDocument: () => false,
    // 13.07.2001 öncesi ruhsat kanun kapsam dışı testi ayrı bir dosyada
    // (test-building-inspection-law-exemption.js); burada sabit false.
    isBuildingInspectionLawExempt: () => false,
    getComparableRows: () => [],
    isComparableRowEmpty: () => true,
    // hasAnyReviewedDocumentEntered'in tek bagimliligi normalizeReviewedDocumentRow;
    // bu testin odagi normalizasyon degil "en az bir Belge Turu dolu satir var mi"
    // oldugundan basit bir stub ile row.c0 -> type esler (gercek fonksiyonun
    // yaptigi title-case/kurum temizligi bu testin kapsami disinda).
    normalizeReviewedDocumentRow: (row) => ({ type: String(row?.c0 || "") }),
  };
  vm.createContext(context);
  vm.runInContext(foldSrc, context);
  vm.runInContext(normalizeYesNoChoiceSrc, context);
  vm.runInContext(hasCompletionValueSrc, context);
  vm.runInContext(hasAnyReviewedDocumentEnteredSrc, context);
  vm.runInContext(getMissingRequiredFieldsSrc, context);
  return context.getMissingRequiredFields();
}

const DOCUMENTS_MISSING_ENTRY = "Belgeler ve Proje: İncelenen Belgeler (en az 1 belge girilmeli)";

// 1) Mimari Proje Var Mı? işaretli (varsayılan) + hiç belge yok -> eksik olmalı.
{
  const missing = runScenario({ documents: [], hasArchitecturalProject: "Evet" });
  assert.ok(missing.includes(DOCUMENTS_MISSING_ENTRY), `Belge girilmemişken eksik alan listesinde olmalı: ${JSON.stringify(missing)}`);
}

// 2) Aynı durum, alan hiç ayarlanmamış (varsayılan "Evet" davranışı) -> yine eksik olmalı.
{
  const missing = runScenario({ documents: [], hasArchitecturalProject: "" });
  assert.ok(missing.includes(DOCUMENTS_MISSING_ENTRY), `Alan boşken varsayılan "Evet" davranışı uygulanmalı: ${JSON.stringify(missing)}`);
}

// 3) Mimari Proje Var Mı? işaretli DEĞİL -> belge girilmemiş olsa da eksik listede olmamalı.
{
  const missing = runScenario({ documents: [], hasArchitecturalProject: "Hayır" });
  assert.ok(!missing.includes(DOCUMENTS_MISSING_ENTRY), `İşaret kaldırılmışsa uyarı gösterilmemeli: ${JSON.stringify(missing)}`);
}

// 4) Mimari Proje Var Mı? işaretli + en az bir belge satırı (Belge Türü dolu) girilmiş -> eksik olmamalı.
{
  const missing = runScenario({
    documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "X Belediyesi", c2: "2010-01-01", c3: "1/1" }],
    hasArchitecturalProject: "Evet",
  });
  assert.ok(!missing.includes(DOCUMENTS_MISSING_ENTRY), `Belge girilmişse uyarı kalkmalı: ${JSON.stringify(missing)}`);
}

// 5) Satır eklenmiş ama Belge Türü BOŞ bırakılmış -> yine "belge girilmemiş" sayılmalı.
{
  const missing = runScenario({
    documents: [{ c0: "", c1: "", c2: "", c3: "" }],
    hasArchitecturalProject: "Evet",
  });
  assert.ok(missing.includes(DOCUMENTS_MISSING_ENTRY), `Boş satır gerçek belge sayılmamalı: ${JSON.stringify(missing)}`);
}

console.log("Mimari Proje + belge girilmemiş eksik kritik alan testi tamam.");
