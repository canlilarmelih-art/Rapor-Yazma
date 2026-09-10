// Kullanıcı bildirimi (2026-09-10): "emsaller bölümünde haritadan konum
// seçiyorum örnek 4. emsal sütununda seçip kaydettikten sonra ilk sütuna
// çekiyor ekranı bu ui açısından iyi bir deneyim değil" — emsal matrisi
// (comparables-matrix-shell) yatay kaydırılabilir bir tablo; harita
// modalının "Kaydet" callback'i tam bir renderSection() çağırıyordu, bu da
// TÜM bölümü sıfırdan kurup matrisin (ve sayfanın) kaydırma konumunu
// sıfırlıyordu — kullanıcı 4. emsal sütununda olsa bile ekran 1. sütuna
// geri dönüyordu.
//
// Düzeltme: harita modalının onSave callback'i artık renderSection()
// ÇAĞIRMIYOR; bunun yerine diğer emsal alanı input/change dinleyicileriyle
// (createComparableMatrixCell içindeki mevcut desen) AYNI yerinde-güncelleme
// yaklaşımını kullanan yeni updateComparableLocationCellsInPlace(rowIndex,
// row) fonksiyonunu çağırıyor — yalnızca ilgili satırın Enlem/Boylam
// hücrelerini, hesaplanan hücreleri ve konum krokisini günceller; matris
// ve sayfa kaydırma konumu DOM hiç yeniden kurulmadığı için bozulmaz.
//
// Bu test kapsamı:
//  1) createComparableMatrixCell'in "c7" (harita düğmesi) bloğunda artık
//     renderSection() ÇAĞRILMADIĞI, updateComparableLocationCellsInPlace'in
//     çağrıldığı (kaynak metin üzerinden, dar kapsamlı) doğrulanır — diğer
//     alanların (c23/c32) kendi renderSection() çağrıları YANLIŞLIKLA
//     bu kontrole takılmaz, çünkü kapsam yalnızca "c7" bloğuyla sınırlıdır.
//  2) updateComparableLocationCellsInPlace() çalıştırılıp: doğru satırın
//     Enlem/Boylam kontrollerini güncellediği, BAŞKA satırlara dokunmadığı,
//     hesaplanan hücre yenileme + kroki yenileme fonksiyonlarını doğru
//     argümanlarla çağırdığı, ve KENDİSİNİN renderSection() çağırmadığı
//     (stub'lanmamış bir renderSection referansı olsaydı ReferenceError
//     fırlatırdı) doğrulanır.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

// Belirli bir başlangıç metninden sonraki İLK "{"'den başlayıp eşleşen
// "}"'ye kadar olan bloğu (brace-depth farkında) döndürür — dosyada tek
// bir yerde geçen, tekrarlanmayan bir başlangıç dizesi verilmelidir.
function extractBraceBlock(startMarker) {
  const markerIndex = appSource.indexOf(startMarker);
  assert(markerIndex >= 0, `Başlangıç işareti bulunamadı: ${startMarker}`);
  const secondOccurrence = appSource.indexOf(startMarker, markerIndex + 1);
  assert(secondOccurrence === -1, `Başlangıç işareti birden fazla yerde geçiyor, kapsam belirsiz: ${startMarker}`);
  let index = appSource.indexOf("{", markerIndex);
  let depth = 0;
  const start = index;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start, index + 1);
    }
  }
  throw new Error(`Blok kapanmadı: ${startMarker}`);
}

// --- 1) Kaynak metin: "c7" (harita düğmesi) bloğu artık renderSection() --
// ÇAĞIRMIYOR, updateComparableLocationCellsInPlace(rowIndex, row) çağırıyor.
{
  const c7Block = extractBraceBlock('if (field.key === "c7") {');
  assert.ok(
    c7Block.includes("updateComparableLocationCellsInPlace(rowIndex, row)"),
    "\"c7\" (harita) bloğu updateComparableLocationCellsInPlace(rowIndex, row) çağırmalı."
  );
  assert.ok(
    !c7Block.includes("renderSection()"),
    "\"c7\" (harita) bloğu artık renderSection() ÇAĞIRMAMALI (tam render matris kaydırma konumunu sıfırlıyordu)."
  );
  console.log("Kaynak metin: harita kaydetme artik renderSection() cagirmiyor testi tamam.");
}

// --- 2) updateComparableLocationCellsInPlace(): yerinde güncelleme --------
{
  const fnSource = extractFunction("updateComparableLocationCellsInPlace");

  function makeControl(rowIndex, fieldKey, initialValue = "") {
    return { dataset: { comparableRow: String(rowIndex), comparableField: fieldKey }, value: initialValue };
  }

  const targetRowIndex = 3; // "4. emsal" sütunu (0 tabanlı index 3)
  const c18Target = makeControl(targetRowIndex, "c18", "");
  const c19Target = makeControl(targetRowIndex, "c19", "");
  // Başka bir satırın (1. emsal) kontrolleri — YANLIŞLIKLA güncellenmemeli.
  const c18Decoy = makeControl(0, "c18", "eski-deger");
  const c19Decoy = makeControl(0, "c19", "eski-deger");
  const controls = [c18Target, c19Target, c18Decoy, c19Decoy];

  const matrixShellStub = { __tag: "matrix-shell" };
  const sketchWrapperStub = { __tag: "sketch-wrapper" };

  const documentMock = {
    querySelectorAll(selector) {
      const rowMatch = selector.match(/data-comparable-row="([^"]+)"/);
      const fieldMatch = selector.match(/data-comparable-field="([^"]+)"/);
      assert.ok(rowMatch && fieldMatch, `Beklenmeyen seçici: ${selector}`);
      return controls.filter(
        (control) => control.dataset.comparableRow === rowMatch[1] && control.dataset.comparableField === fieldMatch[1]
      );
    },
    querySelector(selector) {
      if (selector === ".comparables-matrix-shell") return matrixShellStub;
      if (selector === ".comparable-location-sketch") return sketchWrapperStub;
      return null;
    },
  };

  const calls = { refresh: [], visibility: [], sketch: [] };

  const sandboxSource = `
    function refreshComparableComputedCells(row, rowIndex) { calls.refresh.push({ row, rowIndex }); }
    function updateComparableReasonRowsVisibility(scope) { calls.visibility.push(scope); }
    function renderComparableLocationSketchMap(wrapper) { calls.sketch.push(wrapper); }
    ${fnSource}
    return { updateComparableLocationCellsInPlace };
  `;
  // eslint-disable-next-line no-new-func
  const fns = new Function("document", "calls", sandboxSource)(documentMock, calls);

  const row = { c18: "40.123456", c19: "29.654321", c20: "120 m kuzeyinde" };
  fns.updateComparableLocationCellsInPlace(targetRowIndex, row);

  assert.equal(c18Target.value, "40.123456", "Hedef satırın Enlem kontrolü güncellenmeli.");
  assert.equal(c19Target.value, "29.654321", "Hedef satırın Boylam kontrolü güncellenmeli.");
  assert.equal(c18Decoy.value, "eski-deger", "Başka bir satırın Enlem kontrolüne DOKUNULMAMALI.");
  assert.equal(c19Decoy.value, "eski-deger", "Başka bir satırın Boylam kontrolüne DOKUNULMAMALI.");

  assert.equal(calls.refresh.length, 1, "refreshComparableComputedCells tam olarak bir kez çağrılmalı.");
  assert.equal(calls.refresh[0].rowIndex, targetRowIndex, "refreshComparableComputedCells doğru rowIndex ile çağrılmalı.");
  assert.equal(calls.refresh[0].row, row, "refreshComparableComputedCells doğru row nesnesiyle çağrılmalı.");

  assert.equal(calls.visibility.length, 1, "updateComparableReasonRowsVisibility tam olarak bir kez çağrılmalı.");
  assert.equal(calls.visibility[0], matrixShellStub, "updateComparableReasonRowsVisibility doğru shell ile çağrılmalı.");

  assert.equal(calls.sketch.length, 1, "renderComparableLocationSketchMap tam olarak bir kez çağrılmalı (kroki güncellensin).");
  assert.equal(calls.sketch[0], sketchWrapperStub, "renderComparableLocationSketchMap doğru wrapper ile çağrılmalı.");

  console.log("updateComparableLocationCellsInPlace: yerinde guncelleme testi tamam.");
}

// --- 3) Kroki bulunamazsa (panel ekranda yoksa) sessizce atlanmalı --------
{
  const fnSource = extractFunction("updateComparableLocationCellsInPlace");
  const controls = [];
  const matrixShellStub = { __tag: "matrix-shell" };
  const documentMock = {
    querySelectorAll: () => controls,
    querySelector(selector) {
      if (selector === ".comparables-matrix-shell") return matrixShellStub;
      return null; // kroki paneli yok (ör. farklı bir bölüm görüntüleniyor)
    },
  };
  const calls = { refresh: [], visibility: [], sketch: [] };
  const sandboxSource = `
    function refreshComparableComputedCells(row, rowIndex) { calls.refresh.push({ row, rowIndex }); }
    function updateComparableReasonRowsVisibility(scope) { calls.visibility.push(scope); }
    function renderComparableLocationSketchMap(wrapper) { calls.sketch.push(wrapper); }
    ${fnSource}
    return { updateComparableLocationCellsInPlace };
  `;
  // eslint-disable-next-line no-new-func
  const fns = new Function("document", "calls", sandboxSource)(documentMock, calls);
  assert.doesNotThrow(() => fns.updateComparableLocationCellsInPlace(0, { c18: "1", c19: "2" }));
  assert.equal(calls.sketch.length, 0, "Kroki paneli yokken renderComparableLocationSketchMap ÇAĞRILMAMALI.");
  console.log("Kroki paneli yokken sessizce atlanir testi tamam.");
}

console.log("Emsal harita konumu kaydetme: kaydirma-konumu-koruyan yerinde guncelleme testleri basarili.");
