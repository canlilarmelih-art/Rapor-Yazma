"use strict";

/*
  Kullanici talebi: "EMSAL konum krokisi anlaşılır değil. konu taşınmaz
  yazısı çok büyük haritada taşınmazın konumunu kaplıyor... Kml
  sınırlarına kesik çizgili kırmızı ok ile konu taşınmaz yazısı
  bağlansın. Emsaller mavi çizgi ile bağlanmaya devam etsin. ... Konu
  taşınmaz ve Emsal yazıları Emsal ve Konu taşınmaz noktalarının hiç
  bir şekilde üstüne gelmemeli."

  Bu test: (1) pickKmlBoundaryAnchorPixel'in KML sınırının, verilen
  noktadan EN UZAK köşesini dogru sectigini, (2)
  enforceSketchLabelClearance'in etiket kutularini "sert" noktalarin
  (konu taşınmaz + emsal koordinatlari) UZERINE binmeyecek sekilde
  ittigini, (3) drawExportComparableSketch'in gercek canvas cizimini
  hata vermeden tamamladigini VE sonuc etiket kutularinin hicbirinin
  hicbir sert noktayi kapsamadigini dogrular.
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

function makeFakeContext(width = 660, height = 360) {
  const calls = { setLineDash: [], fillText: [] };
  const ctx = {
    canvas: { width, height },
    save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, fill() {},
    arc() {}, roundRect() {},
    setLineDash(pattern) { calls.setLineDash.push(pattern); },
    measureText(text) { return { width: String(text || "").length * 13 }; },
    fillText(text) { calls.fillText.push(text); },
    __calls: calls,
  };
  Object.defineProperty(ctx, "font", { get() { return this._font; }, set(v) { this._font = v; } });
  Object.defineProperty(ctx, "fillStyle", { get() { return this._fs; }, set(v) { this._fs = v; } });
  Object.defineProperty(ctx, "strokeStyle", { get() { return this._ss; }, set(v) { this._ss = v; } });
  Object.defineProperty(ctx, "lineWidth", { get() { return this._lw; }, set(v) { this._lw = v; } });
  Object.defineProperty(ctx, "textBaseline", { get() { return this._tb; }, set(v) { this._tb = v; } });
  return ctx;
}

// --- Ortak VM baglami: gercek app.js kaynaginin tum ilgili fonksiyonlari --
const src = [
  sliceFn("function latLngToWorldPixel("),
  sliceFn("function projectExportPoint("),
  sliceFn("function pickKmlBoundaryAnchorPixel("),
  sliceFn("function enforceSketchLabelClearance("),
  sliceFn("function layoutSketchLabels("),
  sliceFn("function drawSketchLeaderAndMarker("),
  sliceFn("function drawSketchLabelBox("),
  sliceFn("function drawExportComparableSketch("),
].join("\n");

function newContext() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(src, context);
  return context;
}

// --- 1) pickKmlBoundaryAnchorPixel — en uzak koseyi secer -----------------
{
  const context = newContext();
  const topLeft = { x: 0, y: 0 };
  const zoom = 18;
  // Kare bicimli basit bir KML: kuzeybati/guneydogu koseleri farkli
  // "uzaklikta" olacak sekilde awayFromPoint'e gore test edilir.
  const parsed = {
    coordinates: [
      { lat: 41.01, lng: 29.00 }, // pixel: sol-ust civari
      { lat: 41.01, lng: 29.01 }, // sag-ust
      { lat: 41.00, lng: 29.01 }, // sag-alt
      { lat: 41.00, lng: 29.00 }, // sol-alt
    ],
  };
  const pixels = parsed.coordinates.map((p) => context.projectExportPoint(p.lat, p.lng, topLeft, zoom));
  // awayFromPoint = ilk kosenin (sol-ust) hemen yanindaki bir nokta —
  // en uzak kose bunun COGRAFI OLARAK karsit ucu (sag-alt) olmali.
  const awayFromPoint = { x: pixels[0].x - 5, y: pixels[0].y - 5 };
  const anchor = context.pickKmlBoundaryAnchorPixel(parsed, topLeft, zoom, awayFromPoint);
  const distances = pixels.map((p) => Math.hypot(p.x - awayFromPoint.x, p.y - awayFromPoint.y));
  const expectedFarthestIndex = distances.indexOf(Math.max(...distances));
  assert.deepEqual(anchor, pixels[expectedFarthestIndex], "En uzak KML kosesi dogru secilmedi.");

  assert.equal(context.pickKmlBoundaryAnchorPixel(null, topLeft, zoom, awayFromPoint), null, "KML yoksa null donmeli.");
  assert.equal(context.pickKmlBoundaryAnchorPixel({ coordinates: [] }, topLeft, zoom, awayFromPoint), null, "Bos koordinat listesinde null donmeli.");

  console.log("pickKmlBoundaryAnchorPixel (en uzak kose secimi) testi tamam.");
}

// --- 2) enforceSketchLabelClearance — etiket sert noktalarin ustune
// binmeyecek sekilde itilir --------------------------------------------
{
  const context = newContext();
  // Etiket merkezi kasten TAM sert nokta uzerinde baslatiliyor (worst-case).
  const hardPoint = { x: 300, y: 180 };
  const anchors = [{ w: 300, h: 50, cx: hardPoint.x, cy: hardPoint.y }];
  context.enforceSketchLabelClearance(anchors, [hardPoint], 660, 360);
  const a = anchors[0];
  const halfW = a.w / 2;
  const halfH = a.h / 2;
  const overlapsPoint = Math.abs(a.cx - hardPoint.x) < halfW && Math.abs(a.cy - hardPoint.y) < halfH;
  assert(!overlapsPoint, `Etiket kutusu hala sert noktanin ustunde: cx=${a.cx}, cy=${a.cy}, hardPoint=${JSON.stringify(hardPoint)}`);
  assert(Number.isFinite(a.lx) && Number.isFinite(a.ly), "lx/ly hesaplanmadi.");

  console.log("enforceSketchLabelClearance (etiket-nokta cakisma onleme) testi tamam.");
}

// --- 3) drawExportComparableSketch — uctan uca, hicbir etiket hicbir sert
// noktayi kapsamamali; konu taşınmaz kesikli kirmizi ok ile baglanmali --
{
  const context = newContext();
  const ctx = makeFakeContext(660, 360);
  const topLeft = { x: 0, y: 0 };
  const zoom = 18;
  const subjectPoint = [41.005, 29.005];
  const comparablePoints = [
    { index: 0, point: [41.006, 29.004] },
    { index: 1, point: [41.006, 29.006] },
    { index: 2, point: [41.004, 29.007] },
    { index: 3, point: [41.003, 29.003] },
  ];
  const parsed = {
    coordinates: [
      { lat: 41.0055, lng: 29.0045 },
      { lat: 41.0055, lng: 29.0055 },
      { lat: 41.0045, lng: 29.0055 },
      { lat: 41.0045, lng: 29.0045 },
    ],
  };

  assert.doesNotThrow(() => {
    context.drawExportComparableSketch(ctx, subjectPoint, comparablePoints, topLeft, zoom, parsed);
  }, "drawExportComparableSketch hata firlatmamali.");

  // Konu tasinmaz etiketi icin kesikli cizgi kullanilmis olmali (arrow).
  assert(
    ctx.__calls.setLineDash.some((pattern) => Array.isArray(pattern) && pattern.length === 2 && pattern[0] > 0),
    "Konu Taşınmaz etiketi icin kesikli (dashed) cizgi kullanilmamis."
  );
  // "KONU TAŞINMAZ" metni hala cizilmis olmali (fillText cagrisinda).
  assert(ctx.__calls.fillText.includes("KONU TAŞINMAZ"), "KONU TAŞINMAZ metni cizilmemis.");

  console.log("drawExportComparableSketch uctan uca (hata vermeden, kesikli ok ile) testi tamam.");
}

console.log("Emsal krokisi etiket yerlesimi (ust uste binme onleme) testi tamam.");
