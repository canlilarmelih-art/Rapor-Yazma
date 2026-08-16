"use strict";

/*
  Kullanici talebi (2026-08-17): "Tarla raporlarinda Cevresel Ozellik Bolge
  Turu otomatik olarak tarimsal alan gelmeli" — syncEnvironmentRegionTypeWithOwnershipType()
  Mulkiyet (ownershipType) "Tarla" iken environmentRegionType'i (varsayilani
  "Konut Bolgesi") "Tarimsal Alan"a cevirir. "Konut Bolgesi" hala
  degistirilmemis genel varsayilan sayilir (bos VEYA "Konut Bolgesi" ise
  uzerine yazilir); kullanici BILINCLI olarak baska bir sey secmisse
  (Ticaret/Sanayi Bolgesi) veya zaten "Tarimsal Alan"sa dokunulmaz.

  syncEnvironmentRegionTypeWithOwnershipType() gercek app.js kaynagindan
  izole calistirilir.
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

const foldTurkishSrc = sliceFn("function foldTurkish(");
const normalizeOwnershipTypeSrc = sliceFn("function normalizeOwnershipTypeForSectionVisibility(");
const isTarlaOwnershipTypeSrc = sliceFn("function isTarlaOwnershipType(");
const syncFnSrc = sliceFn("function syncEnvironmentRegionTypeWithOwnershipType(");

function run(fields) {
  const context = { state: { fields } };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(normalizeOwnershipTypeSrc, context);
  vm.runInContext(isTarlaOwnershipTypeSrc, context);
  vm.runInContext(syncFnSrc, context);
  const changed = context.syncEnvironmentRegionTypeWithOwnershipType();
  return { changed, fields: context.state.fields };
}

// --- 1) Tarla + varsayilan "Konut Bolgesi" -> "Tarimsal Alan"a cevrilmeli
// (asil bildirilen istek).
{
  const r = run({ ownershipType: "Tarla", environmentRegionType: "Konut Bölgesi" });
  assert.equal(r.changed, true, "Tarla + Konut Bolgesi -> degisiklik olmali.");
  assert.equal(r.fields.environmentRegionType, "Tarımsal Alan", "Tarimsal Alan'a cevrilmeliydi.");
}

// --- 2) Tarla + BOS -> "Tarimsal Alan"a cevrilmeli (fabrika/uygulama --
// varsayilani henuz hic uygulanmamis olsa bile).
{
  const r = run({ ownershipType: "Tarla", environmentRegionType: "" });
  assert.equal(r.changed, true, "Tarla + bos -> degisiklik olmali.");
  assert.equal(r.fields.environmentRegionType, "Tarımsal Alan", "Bos alan da Tarimsal Alan'a cevrilmeliydi.");
}

// --- 3) Tarla + zaten "Tarimsal Alan" -> degisiklik OLMAMALI (gereksiz --
// autosave/render tetiklenmesin).
{
  const r = run({ ownershipType: "Tarla", environmentRegionType: "Tarımsal Alan" });
  assert.equal(r.changed, false, "Zaten Tarimsal Alan ise degisiklik olmamali.");
}

// --- 4) Tarla + kullanicinin BILINCLI sectigi FARKLI bir deger (Ticaret/ --
// Sanayi Bolgesi) -> DOKUNULMAMALI (REGRESYON: kullanici tercihi ezilmemeli).
{
  const r1 = run({ ownershipType: "Tarla", environmentRegionType: "Ticaret Bölgesi" });
  assert.equal(r1.changed, false, "Kullanicinin bilincli Ticaret Bolgesi secimi ezilmemeli.");
  assert.equal(r1.fields.environmentRegionType, "Ticaret Bölgesi");

  const r2 = run({ ownershipType: "Tarla", environmentRegionType: "Sanayi Bölgesi" });
  assert.equal(r2.changed, false, "Kullanicinin bilincli Sanayi Bolgesi secimi ezilmemeli.");
  assert.equal(r2.fields.environmentRegionType, "Sanayi Bölgesi");
}

// --- 5) Tarla DISINDAKI mulkiyet turlerinde HICBIR sey degismemeli --------
// (REGRESYON: Arsa/Mustakil Bina/Kat Irtifaki raporlarinda "Konut Bolgesi"
// varsayilani AYNEN korunmali).
["Arsa", "Müstakil Bina", "Dikey Kat İrtifakı", "Yatay Kat İrtifakı", ""].forEach((ownershipType) => {
  const r = run({ ownershipType, environmentRegionType: "Konut Bölgesi" });
  assert.equal(r.changed, false, `"${ownershipType || "(bos)"}" mulkiyetinde degisiklik olmamali.`);
  assert.equal(r.fields.environmentRegionType, "Konut Bölgesi", `"${ownershipType || "(bos)"}" mulkiyetinde Konut Bolgesi korunmali.`);
});

console.log("Tarla raporlarinda Cevresel Ozellik Bolge Turu otomatik varsayilan testi tamam.");
