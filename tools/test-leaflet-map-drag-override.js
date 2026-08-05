"use strict";

/*
  Kullanici talebi: "adres ve konum haritası ve emsal haritasında serbest
  gezinemiyorum. bunun sebebi ne?" — kok neden: 0.0.168'de dokunmatik
  cihazlarda haritanin tek parmak sayfa kaydirmayi "yutmasini" engellemek
  icin getLeafletInteractionOptions() dragging:false donuyordu (isCoarsePointerDevice()
  true ise). Bu koruma HALA gecerli (kalan diger haritalar icin), ama
  kullanici once "yalnizca bu iki haritada ac" secip Adres/Konum haritasi
  (renderLeafletKmlMap) ve Emsal Konum Krokisi haritasi
  (renderComparableLocationSketchMap) icin acikca dragging:true'ya
  zorlayan bir forceDraggable secenegi eklendi; SONRA "serbest gezinme
  emsallerde konum secme harita kisminda da olmali" deyip
  renderComparableLocationMap (emsal nokta secme overlay'i) icin de AYNI
  forceDraggable acildi — artik UC haritanin UCU de serbest surukleniyor.
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

// --- 1) getLeafletInteractionOptions — forceDraggable ve eski davranis ---
{
  // Not: vm.Context icinde uretilen nesneler farkli bir realm'e ait
  // oldugundan assert.deepEqual cross-realm prototip farki yuzunden
  // yanlis pozitif "esit degil" verir — JSON ile normalize edilir.
  function run(coarse, options) {
    const context = { window: { matchMedia: coarse ? () => ({ matches: true }) : () => ({ matches: false }) } };
    vm.createContext(context);
    vm.runInContext(sliceFn("function isCoarsePointerDevice("), context);
    vm.runInContext(sliceFn("function getLeafletInteractionOptions("), context);
    return JSON.parse(JSON.stringify(context.getLeafletInteractionOptions(options)));
  }

  // Eski davranis (regresyon korumasi): kaba/dokunmatik isaretci + arguman
  // yokken hala dragging:false donmeli (diger haritalarin mobil korumasi).
  assert.deepEqual(run(true, undefined), { dragging: false, tap: false, touchZoom: true, scrollWheelZoom: false });
  assert.deepEqual(run(false, undefined), {});

  // Yeni davranis: forceDraggable:true iken kaba isaretci olsa BILE
  // dragging:true donmeli, diger kisitlamalar (tap/touchZoom/scrollWheelZoom)
  // korunmali.
  const forced = run(true, { forceDraggable: true });
  assert.equal(forced.dragging, true, "forceDraggable:true iken dragging:true olmali.");
  assert.equal(forced.tap, false, "tap:false korunmali.");
  assert.equal(forced.touchZoom, true, "touchZoom:true korunmali.");
  assert.equal(forced.scrollWheelZoom, false, "scrollWheelZoom:false korunmali.");

  // Kaba isaretci olmayan (masaustu) cihazda forceDraggable zaten fark
  // etmez ama yine de dragging:true donmesi tutarli olmali.
  assert.deepEqual(run(false, { forceDraggable: true }), { dragging: true });

  console.log("getLeafletInteractionOptions forceDraggable testi tamam.");
}

// --- 2) Kaynak-duzeyinde kablolama: UC harita da forceDraggable
// kullanmali (Adres/Konum, Emsal Konum Krokisi, Emsal nokta secme
// overlay'i). -------------------------------------------------------------
{
  const kmlMapFnBody = sliceFn("function renderLeafletKmlMap(");
  assert(
    /leafletMap = leaflet\.map\(panel, getLeafletInteractionOptions\(\{ forceDraggable: true \}\)\)/.test(kmlMapFnBody),
    "renderLeafletKmlMap artik forceDraggable:true kullanmiyor."
  );

  const sketchMapFnBody = sliceFn("function renderComparableLocationSketchMap(");
  assert(
    /leaflet\.map\(panel, getLeafletInteractionOptions\(\{ forceDraggable: true \}\)\)/.test(sketchMapFnBody),
    "renderComparableLocationSketchMap artik forceDraggable:true kullanmiyor."
  );
  // Kullanici talebi (2026-08-05): "mouse tekerleği ile zoom in ve zoom
  // out yapamıyorum" — bu haritada eskiden scrollWheelZoom:false SABİT
  // olarak zorlaniyordu (masaustunde bile), fare tekerlegi ile yakinlastirma
  // engelleniyordu. Artik hic gecmiyor, Leaflet varsayilanini (true) kullaniyor.
  assert(!sketchMapFnBody.includes("scrollWheelZoom"), "renderComparableLocationSketchMap hala scrollWheelZoom'u sabitliyor olabilir (fare tekerlegi yakinlastirma calismaz).");

  const pickerMapFnBody = sliceFn("function renderComparableLocationMap(");
  assert(
    /leaflet\.map\(panel, getLeafletInteractionOptions\(\{ forceDraggable: true \}\)\)/.test(pickerMapFnBody),
    "renderComparableLocationMap (emsal nokta secme overlay'i) artik forceDraggable:true kullanmiyor."
  );

  console.log("Harita surukleme override kablolamasi (uc haritanin ucu de) testi tamam.");
}

console.log("Leaflet harita surukleme override testi tamam.");
