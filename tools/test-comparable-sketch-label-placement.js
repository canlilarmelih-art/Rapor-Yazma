"use strict";

/*
  Kullanici talebi (2026-08-04): "EMSAL konum krokisi anlaşılır değil.
  konu taşınmaz yazısı çok büyük haritada taşınmazın konumunu
  kaplıyor... Kml sınırlarına kesik çizgili kırmızı ok ile konu
  taşınmaz yazısı bağlansın. Emsaller mavi çizgi ile bağlanmaya devam
  etsin. ... Konu taşınmaz ve Emsal yazıları ... noktalarının hiç bir
  şekilde üstüne gelmemeli."

  Kullanici talebi (2026-08-05, ilk duzeltmenin ekran goruntusune
  tepki): "emsal 1 ve 2 üstüste binmiş ayrıca konu taşınmaz daha uzağa
  emsal yazılarının olmadığı bir kısma konumlanmalıydı." — kok neden:
  ilk versiyonda anchor-anchor (etiket-etiket) ayrimi (layoutSketchLabels)
  ile anchor-nokta (etiket-marker) ayrimi (enforceSketchLabelClearance)
  AYRI, SIRALI iki gecisti — ikinci gecis birincinin cozdugu anchor-anchor
  ayrimini bozabiliyordu (bir etigeti bir noktadan uzaklastirirken baska
  bir etiketin ustune itebiliyordu). Duzeltme: HER IKI kisit TEK bir
  yinelemeli dongude birlikte cozuluyor (layoutSketchLabels artik
  hardPoints parametresi aliyor, enforceSketchLabelClearance kaldirildi).
  Ayrica "Konu Taşınmaz" etiketinin kacis yonu artik ozellikle emsal
  kumesinin merkezinden (compCenter) UZAGA zorlaniyor, buyuk bir
  baslangic itme mesafesiyle (pushDistance).
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
  sliceFn("function layoutSketchLabels("),
  sliceFn("function drawSketchLeaderAndMarker("),
  sliceFn("function drawSketchLabelBox("),
  sliceFn("function getComparableSketchLabelOverride("),
  sliceFn("function setComparableSketchLabelOverride("),
  sliceFn("function resetComparableSketchLabelOverrides("),
  sliceFn("function drawExportComparableSketch("),
].join("\n");

function newContext(initialState) {
  const context = {
    state: initialState || { sourceValues: {} },
    autosave: () => {},
  };
  vm.createContext(context);
  vm.runInContext(src, context);
  return context;
}

function rectsOverlap(a, b) {
  return Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2;
}

function rectContainsPoint(a, p) {
  return Math.abs(a.cx - p.x) < a.w / 2 && Math.abs(a.cy - p.y) < a.h / 2;
}

// --- 1) pickKmlBoundaryAnchorPixel — en uzak koseyi secer -----------------
{
  const context = newContext();
  const topLeft = { x: 0, y: 0 };
  const zoom = 18;
  const parsed = {
    coordinates: [
      { lat: 41.01, lng: 29.00 },
      { lat: 41.01, lng: 29.01 },
      { lat: 41.00, lng: 29.01 },
      { lat: 41.00, lng: 29.00 },
    ],
  };
  const pixels = parsed.coordinates.map((p) => context.projectExportPoint(p.lat, p.lng, topLeft, zoom));
  const awayFromPoint = { x: pixels[0].x - 5, y: pixels[0].y - 5 };
  const anchor = context.pickKmlBoundaryAnchorPixel(parsed, topLeft, zoom, awayFromPoint);
  const distances = pixels.map((p) => Math.hypot(p.x - awayFromPoint.x, p.y - awayFromPoint.y));
  const expectedFarthestIndex = distances.indexOf(Math.max(...distances));
  assert.deepEqual(anchor, pixels[expectedFarthestIndex], "En uzak KML kosesi dogru secilmedi.");

  assert.equal(context.pickKmlBoundaryAnchorPixel(null, topLeft, zoom, awayFromPoint), null, "KML yoksa null donmeli.");
  assert.equal(context.pickKmlBoundaryAnchorPixel({ coordinates: [] }, topLeft, zoom, awayFromPoint), null, "Bos koordinat listesinde null donmeli.");

  console.log("pickKmlBoundaryAnchorPixel (en uzak kose secimi) testi tamam.");
}

// --- 2) layoutSketchLabels — hardPoints ile etiket-nokta cakismasi
// onleniyor VE bu, anchor-anchor ayrimini BOZMUYOR (birlikte cozuluyor) --
{
  const context = newContext();
  // Iki cok yakin marker (2026-08-05 raporundaki Emsal 1/2 senaryosu) —
  // etiketler kasten AYNI baslangic merkezine (worst-case) yerlestiriliyor.
  const m1 = { x: 300, y: 180 };
  const m2 = { x: 308, y: 182 }; // 8-9px araliginda, gercek dunyada oldugu gibi cok yakin
  const anchors = [
    { x: m1.x, y: m1.y, w: 140, h: 42, cx: m1.x, cy: m1.y },
    { x: m2.x, y: m2.y, w: 140, h: 42, cx: m2.x, cy: m2.y },
  ];
  context.layoutSketchLabels(anchors, 660, 360, []);
  assert(!rectsOverlap(anchors[0], anchors[1]), `Iki yakin markerin etiketleri hala ust uste: ${JSON.stringify(anchors)}`);
  assert(!rectContainsPoint(anchors[0], m1) && !rectContainsPoint(anchors[0], m2), "1. etiket bir markeri kapsıyor.");
  assert(!rectContainsPoint(anchors[1], m1) && !rectContainsPoint(anchors[1], m2), "2. etiket bir markeri kapsıyor.");

  console.log("layoutSketchLabels: cok yakin iki marker icin etiket-etiket VE etiket-marker cakismasi onlendi testi tamam.");
}

// --- 3) layoutSketchLabels — ekstra hardPoints (subjectPixel gibi anchor
// olmayan noktalar) da etiketlerce kapsanmamali -----------------------
{
  const context = newContext();
  const extraPoint = { x: 400, y: 200 };
  const anchors = [{ x: 400, y: 200, w: 300, h: 50, cx: 400, cy: 200 }];
  context.layoutSketchLabels(anchors, 660, 360, [extraPoint]);
  assert(!rectContainsPoint(anchors[0], extraPoint), "Ekstra hardPoint etiket tarafindan hala kapsaniyor.");

  console.log("layoutSketchLabels: ekstra hardPoints (subjectPixel) kapsanmiyor testi tamam.");
}

// --- 3b) layoutSketchLabels — kenara-kilitlenme (edge-lock) sonsuz
// dongusune girmemeli: bir etiket kanvas kenarina yasliyken tercih
// edilen eksende (Y) ilerleyemiyorsa DIGER eksene (X) gecmeli, aksi
// halde 4000 turu ilerlemeden tuketip cakismayi COZEMEDEN cikardi
// (2026-08-05: gercek raporda bu tam olarak yasanan hataydi — asagidaki
// senaryo bu spesifik kilitlenmeyi birebir yeniden uretir). ------------
{
  const context = newContext();
  // Subject etiketi kasten kanvasin EN UST kenarina (cy en kucuk deger)
  // yaslanmis baslatiliyor; ayni zamanda ondan biraz asagida/solda bir
  // "sert nokta" var — eski algoritma Y ekseninde daha az itme gerektigi
  // icin Y'yi seciyordu ama Y zaten kenara kilitliydi, X'i hic denemiyordu.
  const w = 205, h = 50;
  const subjectAnchor = { x: 100, y: 31, w, h, cx: 100, cy: 31 }; // cy = h/2+6 = kenara tam yasli
  const hardPoint = { x: 150, y: 55 }; // Y ekseninde az, X ekseninde de az fark — Y'ye kilitlenirse cozulemez
  context.layoutSketchLabels([subjectAnchor], 660, 360, [hardPoint]);
  assert(!rectContainsPoint(subjectAnchor, hardPoint), `Kenara kilitli etiket alternatif eksene gecmeden takildi: ${JSON.stringify(subjectAnchor)}`);

  console.log("layoutSketchLabels: kenara-kilitlenme (edge-lock) durumunda alternatif eksene gecis testi tamam.");
}

// --- 4) drawExportComparableSketch — uctan uca: hicbir etiket hicbir sert
// noktayi kapsamamali, konu taşınmaz kesikli kirmizi ok ile baglanmali,
// VE emsal kumesinden BELIRGIN sekilde uzakta olmali ---------------------
{
  const context = newContext();
  const ctx = makeFakeContext(660, 360);
  const zoom = 18;
  const subjectPoint = [41.005, 29.005];
  // Kullanicinin ekran goruntusundeki gibi emsaller birbirine COK yakin
  // (Emsal 1/2 neredeyse ayni noktada).
  const comparablePoints = [
    { index: 0, point: [41.0051, 29.0051] },
    { index: 1, point: [41.0052, 29.0052] },
    { index: 2, point: [41.004, 29.007] },
    { index: 3, point: [41.003, 29.003] },
  ];
  // Gercek buildSavedComparableSketchAsset ile ayni sekilde: subject
  // noktasi CANVAS MERKEZINE gelecek sekilde topLeft hesaplanir (test 4
  // oncesindeki basit topLeft={0,0} gercekci degildi — nokta canvas'in
  // COK disina dusuyordu, clamp adimi de bu yuzden yapay bir cakisma
  // yaratiyordu).
  const centerPixel = context.latLngToWorldPixel(subjectPoint[0], subjectPoint[1], zoom);
  const topLeft = { x: centerPixel.x - ctx.canvas.width / 2, y: centerPixel.y - ctx.canvas.height / 2 };
  const parsed = {
    coordinates: [
      { lat: 41.0055, lng: 29.0045 },
      { lat: 41.0055, lng: 29.0055 },
      { lat: 41.0045, lng: 29.0055 },
      { lat: 41.0045, lng: 29.0045 },
    ],
  };

  let anchorsRef = null;
  const originalLayout = context.layoutSketchLabels;
  context.layoutSketchLabels = (anchors, w, h, hardPoints) => {
    const result = originalLayout(anchors, w, h, hardPoints);
    anchorsRef = result;
    return result;
  };

  assert.doesNotThrow(() => {
    context.drawExportComparableSketch(ctx, subjectPoint, comparablePoints, topLeft, zoom, parsed);
  }, "drawExportComparableSketch hata firlatmamali.");

  assert(Array.isArray(anchorsRef) && anchorsRef.length === 5, "5 anchor (1 konu tasinmaz + 4 emsal) beklenirdi.");
  // Hicbir etiket kutusu birbirini kapsamiyor.
  for (let i = 0; i < anchorsRef.length; i += 1) {
    for (let j = i + 1; j < anchorsRef.length; j += 1) {
      assert(!rectsOverlap(anchorsRef[i], anchorsRef[j]), `Etiketler ${i} ve ${j} hala ust uste: ${JSON.stringify([anchorsRef[i], anchorsRef[j]])}`);
    }
  }

  const subjectAnchor = anchorsRef.find((a) => a.kind === "subject");
  const compAnchors = anchorsRef.filter((a) => a.kind === "comparable");
  const compCenter = {
    x: compAnchors.reduce((sum, a) => sum + a.x, 0) / compAnchors.length,
    y: compAnchors.reduce((sum, a) => sum + a.y, 0) / compAnchors.length,
  };
  const subjectDistanceFromCrowd = Math.hypot(subjectAnchor.cx - compCenter.x, subjectAnchor.cy - compCenter.y);
  assert(subjectDistanceFromCrowd > 100, `KONU TAŞINMAZ etiketi emsal kumesinden yeterince uzak degil (mesafe=${subjectDistanceFromCrowd.toFixed(1)}px).`);

  // Konu tasinmaz etiketi icin kesikli cizgi kullanilmis olmali (arrow).
  assert(
    ctx.__calls.setLineDash.some((pattern) => Array.isArray(pattern) && pattern.length === 2 && pattern[0] > 0),
    "Konu Taşınmaz etiketi icin kesikli (dashed) cizgi kullanilmamis."
  );
  assert(ctx.__calls.fillText.includes("KONU TAŞINMAZ"), "KONU TAŞINMAZ metni cizilmemis.");

  console.log("drawExportComparableSketch uctan uca (cakismasiz, konu tasinmaz uzakta) testi tamam.");
}

// --- 5) Kullanici talebi (2026-08-05): "kullanıcı emsal haritası
// üzerinden etiketleri istediği yere sürüklese ancak emsal ve konu
// taşınmaz noktaları aynı kalacak. kullanıcı düzenlemesine göre görsel
// oluşsa" — getComparableSketchLabelOverride/set/reset temel davranisi -
{
  // Not: dönen nesneler vm.Context içinde oluştuğu için assert.deepEqual
  // (cross-realm prototip farkı yüzünden) yanlış pozitif "eşit değil"
  // verir — bu yüzden alanlar tek tek (JSON ile normalize edilerek)
  // karşılaştırılıyor.
  const context = newContext({ sourceValues: {} });
  assert.equal(context.getComparableSketchLabelOverride("subject"), null, "Kayit yokken null donmeli.");

  context.setComparableSketchLabelOverride("subject", { lat: 41.01, lng: 29.02 });
  const stored = JSON.parse(JSON.stringify(context.getComparableSketchLabelOverride("subject")));
  assert.deepEqual(stored, { lat: 41.01, lng: 29.02 }, "Kaydedilen konum geri okunmadi.");

  context.setComparableSketchLabelOverride("comparable-0", { lat: 41.02, lng: 29.03 });
  assert.deepEqual(JSON.parse(JSON.stringify(context.getComparableSketchLabelOverride("comparable-0"))), { lat: 41.02, lng: 29.03 });
  assert.deepEqual(JSON.parse(JSON.stringify(context.getComparableSketchLabelOverride("subject"))), { lat: 41.01, lng: 29.02 }, "Farkli id'ler birbirini ezmemeli.");

  context.resetComparableSketchLabelOverrides();
  assert.equal(context.getComparableSketchLabelOverride("subject"), null, "Sifirlama sonrasi kayit kalmamali.");
  assert.equal(context.getComparableSketchLabelOverride("comparable-0"), null, "Sifirlama TUM id'leri temizlemeli.");

  console.log("Emsal krokisi etiket konumu kaydetme/okuma/sifirlama testi tamam.");
}

// --- 6) drawExportComparableSketch — kullanicinin elle bıraktığı etiket
// konumu (override) dışa aktarılan görselde AYNEN kullanılmalı; NOKTANIN
// KENDİSİ (leader çizgisinin başladığı yer) HER ZAMAN gerçek koordinat
// olarak kalmalı, otomatik yerleşim o etikete DOKUNMAMALI --------------
{
  const zoom = 18;
  const subjectPoint = [41.005, 29.005];
  const comparablePoints = [
    { index: 0, point: [41.0051, 29.0051] },
    { index: 1, point: [41.004, 29.007] },
  ];
  const parsed = { coordinates: [
    { lat: 41.0055, lng: 29.0045 },
    { lat: 41.0055, lng: 29.0055 },
    { lat: 41.0045, lng: 29.0055 },
    { lat: 41.0045, lng: 29.0045 },
  ]};

  const overrideLatLng = { lat: 41.0048, lng: 29.0053 }; // kullanicinin "Emsal 1" etiketini surukleyip biraktigi yer (canvas icinde)
  const context = newContext({ sourceValues: { comparableSketchLabelOverrides: { "comparable-0": overrideLatLng } } });
  const ctx = makeFakeContext(660, 360);
  const centerPixel = context.latLngToWorldPixel(subjectPoint[0], subjectPoint[1], zoom);
  const topLeft = { x: centerPixel.x - ctx.canvas.width / 2, y: centerPixel.y - ctx.canvas.height / 2 };

  let anchorsRef = null;
  const originalLayout = context.layoutSketchLabels;
  context.layoutSketchLabels = (anchors, w, h, hardPoints) => {
    const result = originalLayout(anchors, w, h, hardPoints);
    return result;
  };
  const originalDraw = context.drawSketchLeaderAndMarker;
  context.drawSketchLeaderAndMarker = (c, a) => {
    if (!anchorsRef) anchorsRef = [];
    anchorsRef.push(a);
    return originalDraw(c, a);
  };

  context.drawExportComparableSketch(ctx, subjectPoint, comparablePoints, topLeft, zoom, parsed);

  const overriddenAnchor = anchorsRef.find((a) => a.id === "comparable-0");
  assert(overriddenAnchor, "comparable-0 anchor'i bulunamadi.");
  const expectedPixel = context.projectExportPoint(overrideLatLng.lat, overrideLatLng.lng, topLeft, zoom);
  assert(Math.abs(overriddenAnchor.cx - expectedPixel.x) < 0.01, `Etiket konumu kullanicinin biraktigi yerde degil (cx=${overriddenAnchor.cx}, beklenen=${expectedPixel.x}).`);
  assert(Math.abs(overriddenAnchor.cy - expectedPixel.y) < 0.01, `Etiket konumu kullanicinin biraktigi yerde degil (cy=${overriddenAnchor.cy}, beklenen=${expectedPixel.y}).`);

  // Noktanin kendisi (a.x/a.y — leader'in basladigi yer) HALA gercek
  // koordinat (comparablePoints[0].point), override'dan ETKİLENMEMİŞ.
  const realPointPixel = context.projectExportPoint(comparablePoints[0].point[0], comparablePoints[0].point[1], topLeft, zoom);
  assert(Math.abs(overriddenAnchor.x - realPointPixel.x) < 0.01, "Nokta (marker) konumu override'dan etkilenmis olmamali.");
  assert(Math.abs(overriddenAnchor.y - realPointPixel.y) < 0.01, "Nokta (marker) konumu override'dan etkilenmis olmamali.");

  // Override'i OLMAYAN diger etiketler (subject, comparable-1) hala
  // normal otomatik yerlesimden geciyor ve hicbirini kapsamiyor.
  for (let i = 0; i < anchorsRef.length; i += 1) {
    for (let j = i + 1; j < anchorsRef.length; j += 1) {
      assert(!rectsOverlap(anchorsRef[i], anchorsRef[j]), `Override sonrasi etiketler ${i}/${j} ust uste: ${JSON.stringify([anchorsRef[i], anchorsRef[j]])}`);
    }
  }

  console.log("drawExportComparableSketch: kullanici tarafindan suruklenen etiket konumu (override) dogru kullaniliyor testi tamam.");
}

console.log("Emsal krokisi etiket yerlesimi (ust uste binme onleme) testi tamam.");
