"use strict";

// Kullanıcı talebi (2026-08-27): "TÜM ÇİFT TARAFLI tabloların en üstünde
// ortak değerleri belirt örnek il ilçe mahalle gibi en üstte belirtilsin."
//
// finalizeTitleUnitsSummaryTableData() TÜM 8 "çift taraflı" özet
// tablosunun (Tapu/Adres/İmar/Arsa/Değerleme/Belgeler/Bağımsız Bölüm/
// Proje Uygunluk) PAYLAŞTIĞI ORTAK son adım haline geldi (bkz. her
// tablonun kendi test dosyasındaki dolaylı kapsam) — bu dosya fonksiyonun
// KENDİSİNİ, 8 builder'dan BAĞIMSIZ, izole bir sandbox'ta test eder.
//
// Takip talebi (2026-08-27): "boş olanlarıda göster mevkii giriş gibi" —
// bir "genel" scalar sütun (ne alwaysKeepFieldKeys ne hoistExemptFieldKeys)
// TÜM taşınmazlarda BOŞ olduğunda artık SESSİZCE KALDIRILMIYOR, "-"
// değeriyle commonFields'e taşınıyor (boş bir değer de "aynı" sayılıyor).
//
// AYNI GÜN İÇİNDE dört tur daha geri bildirim yaşandı (0.0.585: "owner"
// sütunları da hoisting'e girsin; 0.0.586: hoistExempt sütunlar hem
// üstte hem altta gözüksün; 0.0.587: bu davranış TÜM sütunlara evrensel
// olsun) — ama SON testte kullanıcı NET bir şekilde geri adım attı:
// "düzgün çalışmıyor sadece il ilçe mahalle mevkii pafta, ada parsel
// ortak olsun. diğerleri ortak olmasın eskiye dön." Bu yüzden 0.0.585/
// 586/587'nin TÜM genişletmeleri GERİ ALINDI — fonksiyon ARTIK BİREBİR
// 0.0.584'teki (owner hoisting'e girmeden önceki) hâline döndü.
//
// Kapsam:
//  1) Temel hoisting: TÜM satırlarda BİREBİR aynı (boş DAHİL) "scalar"
//     sütun commonFields'e taşınır, headers/rows/columnMeta'dan kalkar.
//  2) TÜM satırlarda BOŞ olan genel-scalar sütun artık KALDIRILMAZ, "-"
//     değeriyle commonFields'e taşınır (2026-08-27 takip talebi).
//  3) "seq"/"owner"/"computed"/"readonly" kind'lar HİÇBİR ZAMAN hoisting'e
//     girmez (yalnızca "scalar") — "owner" (Malik(ler)/Hisse Payı/vb.)
//     BİLEREK BURADA: 0.0.585'in bu istisnayı kaldırma denemesi GERİ
//     ALINDI, "owner" ASLA ortak olmaz.
//  4) Tek satırlı (1 taşınmaz) girdide hoisting uygulanmaz (karşılaştırma
//     anlamsız).
//  5) alwaysKeepFieldKeys: dolu+aynıysa hoisting'e HÂLÂ tabidir; boş+aynı
//     ise (zaten boş-kaldırmadan muaf) normal (boş) sütun olarak KALIR,
//     "-" olarak commonFields'e TAŞINMAZ (Adres'in "aynı ada/parselde bu
//     alanlar boş bile olsa sütun olarak gözükmeli" istisnasıyla tutarlı).
//  6) hoistExemptFieldKeys: YALNIZCA hoisting'den muaf tutar, boş-kaldırmayı
//     ENGELLEMEZ.
//  7) commonFields'in gösterilen `.text`/değeri gruba giren İLK satırın
//     ham değeridir; `.fieldKey` doğru taşınır.

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

const sandboxSource = `
  ${extractFunction("finalizeTitleUnitsSummaryTableData")}
  return { finalizeTitleUnitsSummaryTableData };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) Temel hoisting: SADECE bir sutun ayni ------------------------------
{
  const headers = ["Sıra No", "İl", "İlçe"];
  const rows = [
    [1, "Bursa", "Nilüfer"],
    [2, "Bursa", "Osmangazi"],
  ];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "city" }, { kind: "scalar", fieldKey: "district" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "İlçe"], "\"İl\" (aynı) kalkmalı, \"İlçe\" (farklı) kalmalı.");
  assert.deepEqual(result.rows, [[1, "Nilüfer"], [2, "Osmangazi"]], "rows da aynı sütunu kaybetmeli.");
  assert.deepEqual(result.columnMeta, [{ kind: "seq" }, { kind: "scalar", fieldKey: "district" }], "columnMeta da hizali kalmali.");
  assert.deepEqual(result.commonFields, [{ label: "İl", value: "Bursa", fieldKey: "city" }], "commonFields dogru label/value/fieldKey tasimali.");
  console.log("Temel hoisting (ayni+dolu scalar sutun commonFields'e tasinir) testi tamam.");
}

// --- 2) Bos-sutun kaldirma hoisting'den BAGIMSIZ calisir ------------------
{
  const headers = ["Sıra No", "İl", "Giriş"];
  const rows = [
    [1, "Bursa", ""],
    [2, "İzmir", "-"],
  ];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "city" }, { kind: "scalar", fieldKey: "entrance" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "İl"], "TUM satirlarda BOS olan 'Giris' sutun olarak KALKMALI (commonFields'e tasinmis olmali).");
  assert.deepEqual(result.commonFields, [{ label: "Giriş", value: "-", fieldKey: "entrance" }], "TUM satirlarda BOS olan genel-scalar sutun artik KALDIRILMAZ, \"-\" degeriyle commonFields'e TASINIR (2026-08-27: \"bos olanlarida goster\").");
  console.log("Bos genel-scalar sutun artik kaldirilmiyor, \"-\" ile commonFields'e tasiniyor testi tamam.");
}

// --- 2b) TUM satirlarda BOS olan sutun, dolu-farkli sutunla BIRLIKTE -------
// (2b'nin ayni-boslugu tek basina test etmesine ek olarak, gercek
// coklu-sutun senaryosunu da dogrula).
{
  const headers = ["Sıra No", "Mevkii", "Blok"];
  const rows = [
    [1, "", "A"],
    [2, "-", "B"],
  ];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "locationName" }, { kind: "scalar", fieldKey: "blockName" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "Blok"], "Bos 'Mevkii' kalkmali, farkli-dolu 'Blok' kalmali.");
  assert.deepEqual(result.commonFields, [{ label: "Mevkii", value: "-", fieldKey: "locationName" }], "Bos 'Mevkii' \"-\" ile commonFields'e tasinmali.");
  console.log("Bos sutun + farkli-dolu sutun birlikte (yalniz bos olan commonFields'e tasinir) testi tamam.");
}

// --- 3) "seq"/"owner"/"computed"/"readonly" hicbir zaman hoisting'e girmez -
{
  const headers = ["Sıra No", "Malik(ler)", "Hissesine Düşen Arsa Payı", "İnş. Sev."];
  const rows = [
    [1, "Ahmet", "%50", "90"],
    [2, "Ahmet", "%50", "90"],
  ];
  const columnMeta = [
    { kind: "seq" },
    { kind: "owner", ownerColumn: "c0" },
    { kind: "computed" },
    { kind: "readonly", fieldKey: "constructionLevel" },
  ];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, headers, "seq/owner/computed/readonly TUM satirlarda ayni olsa BILE hicbiri hoisting'e girmemeli.");
  assert.deepEqual(result.commonFields, [], "commonFields BOS olmali (hicbir scalar sutun yok).");
  console.log("seq/owner/computed/readonly hoisting-muafiyeti testi tamam.");
}

// --- 4) Tek satirli (1 tasinmaz) girdide hoisting UYGULANMAZ ---------------
{
  const headers = ["Sıra No", "İl"];
  const rows = [[1, "Bursa"]];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "city" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "İl"], "Tek satirda karsilastirma anlamsiz - hoisting uygulanmamali.");
  assert.deepEqual(result.commonFields, [], "Tek satirda commonFields BOS olmali.");
  console.log("Tek-satirli girdide hoisting no-op testi tamam.");
}

// --- 5) alwaysKeepFieldKeys: YALNIZCA bos-kaldirmadan muaf, hoisting'i ------
// ENGELLEMEZ (Adres Ozeti'nin ADDRESS_UNITS_TABLE_ALWAYS_VISIBLE_WHEN_SAME_ADA_PARSEL_KEYS
// emsali).
{
  const headers = ["Sıra No", "UAVT", "İl"];
  const rowsEmpty = [[1, "", "Bursa"], [2, "-", "Bursa"]];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "uavt" }, { kind: "scalar", fieldKey: "city" }];
  const alwaysKeepFieldKeys = new Set(["uavt"]);

  // 5a) UAVT bos olsa bile alwaysKeepFieldKeys sayesinde KALIR.
  const resultEmpty = fns.finalizeTitleUnitsSummaryTableData(headers, rowsEmpty, columnMeta, { alwaysKeepFieldKeys });
  assert.ok(resultEmpty.headers.includes("UAVT"), "alwaysKeepFieldKeys: bos olsa bile UAVT KALMALI.");

  // 5b) UAVT DOLU ve TUM satirlarda AYNI ise, alwaysKeepFieldKeys onu
  // hoisting'den KORUMAZ - yine commonFields'e tasinir.
  const rowsSame = [[1, "123", "Bursa"], [2, "123", "İzmir"]];
  const resultSame = fns.finalizeTitleUnitsSummaryTableData(headers, rowsSame, columnMeta, { alwaysKeepFieldKeys });
  assert.ok(!resultSame.headers.includes("UAVT"), "alwaysKeepFieldKeys hoisting'den MUAF TUTMAZ - dolu+ayni UAVT yine commonFields'e tasinmali.");
  assert.ok(resultSame.commonFields.some((f) => f.label === "UAVT"), "UAVT commonFields'te olmali.");
  console.log("alwaysKeepFieldKeys (yalnizca bos-kaldirmadan muaf) testi tamam.");
}

// --- 6) hoistExemptFieldKeys: YALNIZCA hoisting'den muaf, bos-kaldirmayi ---
// ENGELLEMEZ (Tapu'nun "Ana Taşınmaz Niteliği" emsali).
{
  const headers = ["Sıra No", "Ana Taşınmaz Niteliği"];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "mainPropertyQuality" }];
  const hoistExemptFieldKeys = new Set(["mainPropertyQuality"]);

  // 6a) TUM satirlarda AYNI ve DOLU ise, hoistExemptFieldKeys sayesinde
  // hoisting'e GIRMEZ, normal sutun olarak KALIR.
  const rowsSame = [[1, "Arsa"], [2, "Arsa"]];
  const resultSame = fns.finalizeTitleUnitsSummaryTableData(headers, rowsSame, columnMeta, { hoistExemptFieldKeys });
  assert.ok(resultSame.headers.includes("Ana Taşınmaz Niteliği"), "hoistExemptFieldKeys: ayni-metin sutun KALMALI, commonFields'e TASINMAMALI.");
  assert.deepEqual(resultSame.commonFields, [], "commonFields BOS olmali.");

  // 6b) TUM satirlarda BOS ise, hoistExemptFieldKeys onu bos-kaldirmadan
  // KORUMAZ - yine kaldirilir (bu istisna alwaysKeepFieldKeys DEGIL).
  const rowsEmpty = [[1, "-"], [2, ""]];
  const resultEmpty = fns.finalizeTitleUnitsSummaryTableData(headers, rowsEmpty, columnMeta, { hoistExemptFieldKeys });
  assert.ok(!resultEmpty.headers.includes("Ana Taşınmaz Niteliği"), "hoistExemptFieldKeys bos-kaldirmadan MUAF TUTMAZ - tumu bos ise yine kaldirilmali.");
  console.log("hoistExemptFieldKeys (yalnizca hoisting'den muaf) testi tamam.");
}

console.log("finalizeTitleUnitsSummaryTableData() (commonFields hoisting) testleri basarili.");
