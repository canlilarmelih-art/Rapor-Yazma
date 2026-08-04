"use strict";

/*
  Kullanici talebi: "şimdi iç hacimlerde konut için iç hacimleri
  gruplandıracağız. 1. grup: salon, 2. Grup Odalar, 3. Grup Mutfak, 4. Grup
  Banyo (duş ve ebeveyn banyosu dahil wc hariç) 5. grup wc 6. grup balkon
  (Teras ve verandalar dahil) bunları sayısal olarak kaç adet var ise
  placeholder mantığında grupla örnek salon 1 oda 4 banyo 2 wc 1 balkon 3
  gibi."

  Mevcut getGabimUnitInteriorCounts() (SALON/ODA/BANYO/TUVALET/MUTFAK/BALKON
  placeholder'larini zaten besliyordu) iki noktada genisletildi:
  1) "veranda" balkon grubuna eklendi.
  2) Kelime sonu sinir kontrolu (\b...\b) -> (\b...\w*) yapildi ki "Ebeveyn
     Banyosu" gibi Turkce ek almis bicimler de "banyo" olarak sayilsin
     (GERIYE DONUK UYUMLU: yalnizca EK eslesme yakalar, mevcut davranisi
     BOZMAZ).
  Yeni getUnitInteriorGroupSummaryText() bu alti grubu TEK bir "Etiket
  Adet" metninde birlestirir (adedi 0 olan gruplar atlanir).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

const src = [
  sliceFn("function foldTurkish("),
  sliceFn("function getUnitFloorRows("),
  sliceFn("function formatUnitFloorInteriorSummary("),
  sliceFn("function getGabimUnitInteriorCounts("),
  sliceFn("function getUnitInteriorGroupSummaryText("),
].join("\n");

function runWithFloors(rows) {
  const context = { state: { tables: { unitFloors: rows }, fields: {} }, unitInteriorFeatureFields: [] };
  vm.createContext(context);
  vm.runInContext(src, context);
  return context;
}

// --- 1) Temel gruplama: kullanicinin ornegi -----------------------------
{
  const ctx = runWithFloors([{ floor: "Zemin Kat", interiors: "1 Salon, 4 Oda, 1 Mutfak, 2 Banyo, 1 Wc, 3 Balkon" }]);
  const counts = ctx.getGabimUnitInteriorCounts();
  assert.equal(counts.salon, "1");
  assert.equal(counts.oda, "4");
  assert.equal(counts.mutfak, "1");
  assert.equal(counts.banyo, "2");
  assert.equal(counts.tuvalet, "1");
  assert.equal(counts.balkon, "3");
  assert.equal(
    ctx.getUnitInteriorGroupSummaryText(),
    "Salon 1 Oda 4 Mutfak 1 Banyo 2 Wc 1 Balkon 3",
    "Kullanicinin ornegiyle birebir eslesen grup ozeti uretilmedi."
  );
}

// --- 2) Duş + Ebeveyn Banyosu -> Banyo grubuna dahil, Wc HARIC -----------
{
  const ctx = runWithFloors([{ floor: "1. Kat", interiors: "1 Salon, 2 Oda, 1 Duş, 1 Ebeveyn Banyosu, 1 Wc" }]);
  const counts = ctx.getGabimUnitInteriorCounts();
  assert.equal(counts.banyo, "2", `Duş + Ebeveyn Banyosu toplamda 2 banyo sayilmali, gelen: ${counts.banyo}`);
  assert.equal(counts.tuvalet, "1", "Wc, banyo grubuna KARISMAMALI, ayri sayilmali.");
  assert.equal(
    ctx.getUnitInteriorGroupSummaryText(),
    "Salon 1 Oda 2 Banyo 2 Wc 1",
    "Mutfak/Balkon olmadigi icin ozet metninde gecmemeli (0 adetli gruplar atlanir)."
  );
}

// --- 3) Teras ve Veranda -> Balkon grubuna dahil -------------------------
{
  const ctx = runWithFloors([{ floor: "Çatı Katı", interiors: "1 Teras, 1 Veranda, 1 Balkon" }]);
  const counts = ctx.getGabimUnitInteriorCounts();
  assert.equal(counts.balkon, "3", `Teras + Veranda + Balkon toplamda 3 sayilmali, gelen: ${counts.balkon}`);
}

// --- 4) Birden fazla kat satırı toplanır ----------------------------------
{
  const ctx = runWithFloors([
    { floor: "Zemin Kat", interiors: "1 Salon, 2 Oda" },
    { floor: "1. Kat", interiors: "2 Oda, 1 Banyo" },
  ]);
  const counts = ctx.getGabimUnitInteriorCounts();
  assert.equal(counts.salon, "1");
  assert.equal(counts.oda, "4", "Iki kattaki oda sayilari toplanmali.");
  assert.equal(counts.banyo, "1");
}

// --- 5) Hiç iç hacim girilmemişse boş özet -------------------------------
{
  const ctx = runWithFloors([]);
  assert.equal(ctx.getUnitInteriorGroupSummaryText(), "", "Veri yokken bos metin donmeli.");
}

// --- 6) template-engine.js kablolaması ------------------------------------
{
  const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
  assert(
    engineSource.includes('ICHACIMGRUPSAYIMI: { fn: () => safeCall("getUnitInteriorGroupSummaryText") }'),
    "ICHACIMGRUPSAYIMI placeholder'i getUnitInteriorGroupSummaryText'e baglanmamis."
  );
}

console.log("Ic hacim grup sayimi (Salon/Oda/Mutfak/Banyo/Wc/Balkon) testi tamam.");
