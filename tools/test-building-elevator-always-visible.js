"use strict";

/*
  Kullanici bildirimi (2026-09-17): "diğer rapor türlerinde asansör bölümü
  niye gözükmüyor. eski hali ile gözükmeli." createBuildingTechnicalOptionsPanel()
  (Ana Taşınmaz Teknik Bilgileri) "Asansör" alanini SADECE dikey mülkiyette
  (!isHorizontalOwnership) gösteriyordu — ama buildConsolidatedMainPropertyAmenityParagraph/
  buildConsolidatedMainPropertyElevatorSentence (Yatay Kat İrtifakı'nin
  blok-bazli anlatim akisi, app.js ~16227-16260) zaten HER blogun KENDI
  `elevator` alanini okuyup birlestiriyordu — veri modeli yatay mülkiyette
  de bu alani BEKLIYORDU, formda girme imkani eksikti. Duzeltme: Asansör
  artik mülkiyet turunden BAGIMSIZ HER ZAMAN gösteriliyor; !isHorizontalOwnership
  blogundaki DIGER 7 alan (Dis Cephe Kaplama/Merdiven/Ic Duvarlar/Giris
  Kapisi-Kat Seviyesi-Yonu — TEK bina kavramina ozgu) DEGISMEDI.

  Bu test createBuildingTechnicalOptionsPanel()'in TAM calistirilmasi
  yerine (cok sayida bagimli fonksiyon/state gerektirdiginden, bu
  test suitindeki benzer agir-bagimlilikli fonksiyonlarda izlenen desenle)
  kaynak-duzeyinde dogrular: Asansör cagrisi !isHorizontalOwnership bloğunun
  DISINDA (once), diger 7 alan ise HALA o blogun ICINDE.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunctionBody(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const panelSrc = extractFunctionBody("function createBuildingTechnicalOptionsPanel(");

// --- 1) Asansör cagrisi mevcut, ve "if (!isHorizontalOwnership)" satirindan
//        ONCE geciyor (yani KOSULSUZ, HER mülkiyet turunde calisan diziye
//        ekleniyor).
{
  const elevatorIndex = panelSrc.indexOf('createBuildingSelectField("Asansör", "elevator"');
  const ifGateIndex = panelSrc.indexOf("if (!isHorizontalOwnership) {");
  assert(elevatorIndex >= 0, "'Asansör' alani createBuildingTechnicalOptionsPanel() icinde bulunamadi.");
  assert(ifGateIndex >= 0, "'!isHorizontalOwnership' gate'i bulunamadi.");
  assert(
    elevatorIndex < ifGateIndex,
    "'Asansör' alani hala '!isHorizontalOwnership' gate'inin ICINDE — Yatay Kat İrtifakı'nda GİZLİ kalmaya devam ediyor (REGRESYON)."
  );
}
console.log("Asansör alani mülkiyet turunden bagimsiz (kosulsuz) render ediliyor testi tamam.");

// --- 2) REGRESYON: digerleri (Dis Cephe Kaplama vb. 7 alan) HALA
//        !isHorizontalOwnership bloğunun ICINDE — bu tur SADECE Asansör'u
//        kapsam disina cikardi, geri kalanini DEGISTIRMEDI.
{
  const ifGateIndex = panelSrc.indexOf("if (!isHorizontalOwnership) {");
  const afterGate = panelSrc.slice(ifGateIndex);
  [
    ["exteriorCladding", "Dış Cephe Kaplama"],
    ["stairLanding", "Apartman Merdiven Ve Sahanlık"],
    ["interiorWalls", "Apartman İç Duvarlar"],
    ["buildingEntranceDoor", "Bina Giriş Kapısı"],
    ["buildingFootprintReference", "Bina Oturumu Referansı"],
    ["buildingEntranceLevel", "Bina Giriş Kat Seviyesi"],
    ["buildingEntranceDirection", "Bina Giriş Yönü"],
  ].forEach(([key, label]) => {
    assert(
      afterGate.includes(`"${label}", "${key}"`),
      `REGRESYON: '${label}' (${key}) alani artik !isHorizontalOwnership blogunun icinde degil — Yatay Kat İrtifakı'nda yanlislikla GORUNUR olmus olabilir.`
    );
  });
  // Bu 7 alan, Asansör cagrisindan SONRA (disarida) DEGIL, gate'in
  // icinde kalmali — yani panelSrc'nin en-disaridaki "elevator" ile
  // eslesen SATIR SAYISI hala TEK olmali (yalnizca kosulsuz Asansör).
  const elevatorMatches = panelSrc.match(/"elevator"/g) || [];
  assert.equal(elevatorMatches.length, 1, "'elevator' anahtari birden fazla kez geciyor (beklenmeyen ikinci bir Asansör alani eklenmis olabilir).");
}
console.log("Diger yatay-mülkiyet-disi 7 alan REGRESYONU (hala gate icinde) testi tamam.");

console.log("Ana Taşınmaz Teknik Bilgileri: Asansör her mülkiyet türünde görünür testleri başarılı.");
