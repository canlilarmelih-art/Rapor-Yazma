"use strict";

// Kullanıcı talebi (2026-09-15): "emsaller bölümünde kullanıcı tarafından
// girilen emsaller otomatik kaydedilsin sonradan kullanılmak üzere.
// emsalleri hafızaya kaydet butonunu kaldır."
//
// Eski akış: kullanıcı koordinatlı TÜM emsalleri manuel "EMSALLERİ
// HAFIZAYA KAYDET" (data-comparable-memory-save) düğmesine tıklayarak
// tek tek POST /api/comparable-memory ile kaydediyordu — unutulursa
// hiç kaydedilmiyordu.
//
// Yeni akış: c18/c19 (Enlem/Boylam) zaten SADECE openComparableLocationModal
// ("Haritadan seç" -> "Kaydet") üzerinden set edilebiliyor (comparableFields'ta
// readOnly) — bu TEK giriş noktasında konum GERÇEKTEN değiştiyse (modal
// sadece açılıp kapatılması DEĞİL) yeni autoSaveComparableToMemory(row)
// otomatik çağrılır. Manuel düğme TAMAMEN kaldırıldı.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadı: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitiş bulunamadı: ${startMarker}`);
  return appSource.slice(start, end);
}

// --- 1) Manuel "EMSALLERİ HAFIZAYA KAYDET" düğmesi TAMAMEN kaldırıldı ----
{
  assert(
    !appSource.includes("data-comparable-memory-save"),
    "data-comparable-memory-save düğmesi (ve kablolaması) hâlâ mevcut — kaldırılmalıydı."
  );
  assert(
    !appSource.includes(">EMSALLERİ HAFIZAYA KAYDET<"),
    "'EMSALLERİ HAFIZAYA KAYDET' düğme metni hâlâ üretilen arayüz kodunda mevcut."
  );
  console.log("Manuel 'EMSALLERİ HAFIZAYA KAYDET' düğmesi kaldırıldı testi tamam.");
}

// --- 2) 'GEÇMİŞ EMSALLER' (görüntüleme) düğmesi KORUNDU — yalnızca KAYDETME
// eylemi kaldırıldı, kaydedilmiş emsalleri GÖRME/KULLANMA akışı DOKUNULMADI.
{
  assert(appSource.includes("data-comparable-memory-toggle"), "GEÇMİŞ EMSALLER düğmesi (görüntüleme) yanlışlıkla kaldırılmış.");
  assert(appSource.includes(">GEÇMİŞ EMSALLER<"), "'GEÇMİŞ EMSALLER' metni bulunamadı.");
  assert(appSource.includes("data-comparable-memory-archived"), "'6 aydan eskiyi göster' arşiv kontrolü yanlışlıkla kaldırılmış.");
  console.log("GEÇMİŞ EMSALLER goruntuleme akisi korundu testi tamam.");
}

// --- 3) GERÇEK autoSaveComparableToMemory() — geçerli koordinatlı satırda
// POST /api/comparable-memory'yi doğru gövdeyle çağırır, memory paneli
// görünürse yeniler; koordinat yoksa fetch'e HİÇ dokunmaz.
const autoSaveSrc = sliceFn("async function autoSaveComparableToMemory(row) {");
function runAutoSave(row, { visible = false, includeArchived = false } = {}) {
  const calls = { fetch: [], refresh: 0 };
  const context = {
    state: { sourceValues: { comparableMemory: { visible, includeArchived } } },
    console,
    fetchRaporApi: async (url, init) => {
      calls.fetch.push({ url, init });
      return { ok: true, json: async () => ({ ok: true }) };
    },
    refreshComparableMemory: async (includeArchivedArg) => {
      calls.refresh += 1;
      calls.refreshArg = includeArchivedArg;
    },
  };
  vm.createContext(context);
  return vm.runInContext(`${autoSaveSrc}\nautoSaveComparableToMemory(${JSON.stringify(row)})`, context).then(() => calls);
}

(async () => {
  // 3a) KULLANICI SENARYOSU: geçerli bir emsal konumu onaylandığında
  // POST /api/comparable-memory tam olarak { comparable: row } gövdesiyle
  // çağrılmalı.
  {
    const row = { c4: "daire", c18: "40.225335", c19: "28.841321" };
    const calls = await runAutoSave(row, { visible: false });
    assert.equal(calls.fetch.length, 1, "Geçerli koordinatlı emsalde TAM OLARAK bir POST çağrısı yapılmalı.");
    assert.equal(calls.fetch[0].url, "/api/comparable-memory", "Doğru API rotasına POST atılmalı.");
    assert.equal(calls.fetch[0].init.method, "POST", "İstek metodu POST olmalı.");
    assert.deepEqual(JSON.parse(calls.fetch[0].init.body), { comparable: row }, "İstek gövdesi { comparable: row } olmalı.");
    assert.equal(calls.refresh, 0, "Hafıza paneli GÖRÜNMÜYORSA yenileme çağrılmamalı.");
    console.log("KULLANICI SENARYOSU: gecerli konum otomatik POST /api/comparable-memory testi tamam.");
  }

  // 3b) Hafıza paneli (GEÇMİŞ EMSALLER) açıkken kayıt sonrası liste
  // yenilenmeli (yeni kaydedilen emsal haritada hemen görünsün).
  {
    const row = { c18: "40.1", c19: "29.1" };
    const calls = await runAutoSave(row, { visible: true, includeArchived: true });
    assert.equal(calls.refresh, 1, "Hafıza paneli görünürken kayıt sonrası TAM OLARAK bir kez yenilenmeli.");
    assert.equal(calls.refreshArg, true, "Yenileme, mevcut 'includeArchived' bayrağını korumalı.");
    console.log("Hafiza paneli acikken kayit sonrasi yenileniyor testi tamam.");
  }

  // 3c) Koordinatsız/geçersiz satırda fetch'e HİÇ dokunulmamalı (regresyon:
  // yanlışlıkla boş/eksik emsal kaydedilmemeli).
  {
    const calls = await runAutoSave({ c4: "daire" });
    assert.equal(calls.fetch.length, 0, "Enlem/Boylam yoksa hiç POST atılmamalı.");
    console.log("Koordinatsiz satirda POST atilmiyor (regresyon) testi tamam.");
  }

  // --- 4) Kaynak-düzeyi: "Haritadan seç" -> "Kaydet" akışında, konum
  // GERÇEKTEN değiştiyse autoSaveComparableToMemory çağrılıyor VE bu,
  // önceki (previousLat/previousLng) değerle karşılaştırmaya bağlı —
  // modal sadece açılıp aynı konumla kapatılırsa gereksiz kayıt OLUŞMAMALI.
  {
    const wiringSrc = sliceFn('mapButton.addEventListener("click", () => {', { toMarker: "\n    });" });
    assert(wiringSrc.includes("const previousLat = row.c18;"), "Önceki Enlem değeri saklanmıyor.");
    assert(wiringSrc.includes("const previousLng = row.c19;"), "Önceki Boylam değeri saklanmıyor.");
    assert(
      wiringSrc.includes("if (row.c18 && row.c19 && (row.c18 !== previousLat || row.c19 !== previousLng)) {"),
      "autoSaveComparableToMemory çağrısı 'konum gerçekten değişti mi' koşuluna bağlı değil."
    );
    assert(wiringSrc.includes("autoSaveComparableToMemory(row);"), "'Haritadan seç' akışı autoSaveComparableToMemory()'yi çağırmıyor.");
    console.log("Kaynak-duzeyi: 'Haritadan sec' -> otomatik kayit kablolamasi testi tamam.");
  }

  console.log("Emsal hafizasi otomatik kaydetme testleri basarili.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
