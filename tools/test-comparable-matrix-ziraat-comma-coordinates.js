"use strict";

// Kullanıcı talebi (2026-09-15): "Emsaller bölümünde sadece ziraat bankası
// template çıktısında emsal koordinatlarını 40.252565 yerine 40,252656
// şeklinde export edebilir miyiz." Ziraat sisteminin konu taşınmaz
// koordinatları için ZATEN virgüllü ondalık istediği bilinen bir kısıt
// (bkz. template-engine.js ENLEMV2/BOYLAMV2, "Ziraat sistemi koordinatların
// ondalık ayıracını virgül ister") — aynı ihtiyaç Emsal Karşılaştırma
// Matrisi'ndeki Enlem/Boylam (c18/c19) sütunları için de var.
//
// Düzeltme: buildComparableMatrixWordTableHtml(options) artık isteğe bağlı
// bir `commaDecimalCoordinates` bayrağı alıyor — YALNIZCA c18/c19
// sütunlarının noktasını virgüle çevirir, diğer tüm sütunlar/bankalar
// ETKİLENMEZ. Yeni EMSAL_MATRISIV2 katalog girdisi bu bayrakla çağırıyor;
// templates/ziraat.html ve templates/ziraat-arsa-arazi.html
// {{EMSAL_MATRISI}} yerine {{EMSAL_MATRISIV2}} kullanacak şekilde
// güncellendi, DİĞER TÜM banka şablonları {{EMSAL_MATRISI}} (noktalı)
// kullanmaya devam ediyor.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP_DIR = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(APP_DIR, "app.js"), "utf8");

// --- 1) GERÇEK kod: buildComparableMatrixWordTableHtml içindeki, her emsal
// hücresinin değerini üreten satır-içi arrow fonksiyonunun GÖVDESİ, gerçek
// app.js kaynağından çıkarılıp izole bir fonksiyona sarılır (bkz. proje
// belleği: vm.runInContext const/let paylaşım kısıtı — TEK çağrıda kurulur).
const START_MARKER = "...rows.map((row, rowIndex) => {";
const startIndex = appSource.indexOf(START_MARKER);
assert(startIndex >= 0, "Emsal matrisi hücre-değeri arrow fonksiyonu bulunamadı.");
const bodyStart = startIndex + START_MARKER.length;
// Süslü-ayraç derinliği sayılarak arrow fonksiyonunun KENDİ kapanış
// ayracı bulunur (sabit bir metin marker'ına DEĞİL) — bu sayede hem
// düzeltme SONRASI (iç içe bir "if" bloğu içeren) hem düzeltme ÖNCESİ
// (o bloğu içermeyen) kaynak üzerinde de GÜVENİLİR çalışır; stash
// regresyon kanıtı bu ikinciye dayanır.
let depth = 1;
let cursor = bodyStart;
for (; cursor < appSource.length; cursor += 1) {
  const char = appSource[cursor];
  if (char === "{") depth += 1;
  else if (char === "}") { depth -= 1; if (depth === 0) break; }
}
assert(depth === 0, "Arrow fonksiyonunun kapanış süslü ayracı bulunamadı.");
const closeBraceIndex = cursor;
const cellBody = appSource.slice(bodyStart, closeBraceIndex);

function computeCellValue({ field, row, rowIndex = 0, commaDecimalCoordinates = false }) {
  const context = {
    field,
    row,
    rowIndex,
    commaDecimalCoordinates,
    formatComparableWorkplaceFloorsSummary: () => "",
    formatComparablePhoneForOutput: (value) => value,
    isHalkbankSelectedForReport: () => false,
    buildHalkbankShortComparableText: () => "",
    calculateComparableFieldValue: () => "",
    formatOutputFieldValue: (value) => value,
  };
  vm.createContext(context);
  return vm.runInContext(`(function computeCellValue() {${cellBody}})()`, context);
}

// --- 1a) KULLANICI ÖRNEĞİ: commaDecimalCoordinates=true iken Enlem (c18)
// noktalı değeri virgüllüye çevrilmeli.
{
  const value = computeCellValue({
    field: { key: "c18", label: "Enlem", readOnly: true },
    row: { c18: "40.252565" },
    commaDecimalCoordinates: true,
  });
  assert.equal(value, "40,252565", `Enlem (c18) virgüllü olmalı, bulunan: ${value}`);
  console.log("KULLANICI ORNEGI: commaDecimalCoordinates=true -> Enlem (c18) virgullu testi tamam.");
}

// --- 1b) Boylam (c19) için de aynı davranış.
{
  const value = computeCellValue({
    field: { key: "c19", label: "Boylam", readOnly: true },
    row: { c19: "29.123456" },
    commaDecimalCoordinates: true,
  });
  assert.equal(value, "29,123456", `Boylam (c19) virgüllü olmalı, bulunan: ${value}`);
  console.log("Boylam (c19) virgullu testi tamam.");
}

// --- 1c) Bayrak KAPALIYKEN (diğer TÜM bankaların varsayılan çağrısı) c18/c19
// NOKTALI kalmalı — regresyon yok.
{
  const latValue = computeCellValue({
    field: { key: "c18", label: "Enlem", readOnly: true },
    row: { c18: "40.252565" },
    commaDecimalCoordinates: false,
  });
  assert.equal(latValue, "40.252565", `commaDecimalCoordinates=false iken Enlem NOKTALI kalmalı, bulunan: ${latValue}`);
  console.log("commaDecimalCoordinates=false (varsayilan diger bankalar): Enlem noktali kaliyor testi tamam.");
}

// --- 1d) c18/c19 DIŞINDAKİ sütunlar bayrak açıkken bile ETKİLENMEMELİ (ör.
// "Emsal Durumu" gibi metin alanlarında yanlışlıkla nokta->virgül
// dönüşümü OLMAMALI).
{
  const context = {
    field: { key: "c2", label: "Emsal Durumu" },
    row: { c2: "Satılık, il. bölge" },
    rowIndex: 0,
    commaDecimalCoordinates: true,
    formatComparableWorkplaceFloorsSummary: () => "",
    formatComparablePhoneForOutput: (value) => value,
    isHalkbankSelectedForReport: () => false,
    buildHalkbankShortComparableText: () => "",
    calculateComparableFieldValue: () => "",
    formatOutputFieldValue: (value) => value,
  };
  vm.createContext(context);
  const value = vm.runInContext(`(function computeCellValue() {${cellBody}})()`, context);
  assert.equal(value, "Satılık, il. bölge", `c18/c19 dışı bir alan bayrak açıkken bile DEĞİŞMEMELİ, bulunan: ${value}`);
  console.log("c18/c19 disindaki alanlar bayrak acikken bile etkilenmiyor testi tamam.");
}

// --- 2) Kaynak-düzeyi: buildComparableMatrixWordTableHtml artık options
// parametresi alıyor ve EMSAL_MATRISIV2 katalog girdisi bu bayrakla
// çağırıyor.
{
  assert.ok(
    appSource.includes("function buildComparableMatrixWordTableHtml(options = {}) {"),
    "buildComparableMatrixWordTableHtml artık options parametresi almalı."
  );
  assert.ok(
    appSource.includes("const { commaDecimalCoordinates = false } = options;"),
    "commaDecimalCoordinates bayrağı destructure edilmiyor."
  );
  assert.ok(
    appSource.includes('key: "EMSAL_MATRISIV2"') &&
    appSource.includes("value: buildComparableMatrixWordTableHtml({ commaDecimalCoordinates: true }),"),
    "EMSAL_MATRISIV2 katalog girdisi buildComparableMatrixWordTableHtml({ commaDecimalCoordinates: true }) ile çağrılmıyor."
  );
  console.log("Kaynak-duzeyi: EMSAL_MATRISIV2 katalog kablolamasi testi tamam.");
}

// --- 3) Yalnızca Ziraat şablonları EMSAL_MATRISIV2 kullanmalı, DİĞER TÜM
// banka şablonları EMSAL_MATRISI (noktalı) kullanmaya devam etmeli — bu
// değişikliğin kapsamı GERÇEKTEN yalnızca Ziraat'e özel kalmalı.
{
  const templatesDir = path.join(APP_DIR, "templates");
  const ziraatFiles = ["ziraat.html", "ziraat-arsa-arazi.html"];
  const otherComparableFiles = fs.readdirSync(templatesDir)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !ziraatFiles.includes(file))
    .filter((file) => {
      const text = fs.readFileSync(path.join(templatesDir, file), "utf8");
      return text.includes("{{EMSAL_MATRISI}}") || text.includes("{{EMSAL_MATRISIV2}}");
    });
  assert.ok(otherComparableFiles.length > 0, "Karşılaştırma için en az bir Ziraat-dışı emsal-matrisli şablon bulunamadı.");

  ziraatFiles.forEach((file) => {
    const text = fs.readFileSync(path.join(templatesDir, file), "utf8");
    assert.ok(text.includes("{{EMSAL_MATRISIV2}}"), `${file}: {{EMSAL_MATRISIV2}} kullanmalı.`);
    assert.ok(!text.includes("{{EMSAL_MATRISI}}"), `${file}: eski {{EMSAL_MATRISI}} (noktalı) ARTIK kullanılmamalı.`);
  });
  otherComparableFiles.forEach((file) => {
    const text = fs.readFileSync(path.join(templatesDir, file), "utf8");
    assert.ok(text.includes("{{EMSAL_MATRISI}}"), `${file}: Ziraat DIŞI şablon {{EMSAL_MATRISI}} (noktalı) kullanmaya devam etmeli.`);
    assert.ok(!text.includes("{{EMSAL_MATRISIV2}}"), `${file}: Ziraat DIŞI şablon {{EMSAL_MATRISIV2}} KULLANMAMALI (kapsam yalnızca Ziraat).`);
  });
  console.log(`Sadece Ziraat sablonlari (${ziraatFiles.join(", ")}) EMSAL_MATRISIV2 kullaniyor, diger ${otherComparableFiles.length} sablon noktali EMSAL_MATRISI'nda kaliyor testi tamam.`);
}

console.log("Emsal matrisi (Ziraat virgullu koordinat) testleri basarili.");
