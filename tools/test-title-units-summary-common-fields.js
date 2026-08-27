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
// Aynı gün İÇİNDE dört geri bildirim turu yaşandı, sonuncusu MİMARİYİ
// KÖKTEN DEĞİŞTİRDİ — eskisi (turlar 1-3) YERİNE ARTIK GEÇERLİ OLAN NİHAİ
// TASARIM budur:
//  Tur 1: "boş olanlarıda göster mevkii giriş gibi" — tümü boş olan genel
//         scalar sütun "-" ile commonFields'e taşınıyor (sütun KALKIYOR —
//         bu davranış SON turda da KORUNDU, bkz. aşağıda (b)).
//  Tur 2: "ana gayrimenkul malik hisse payı bunlar ortak ... üstte
//         yazmalı" — "owner" kind'ı da (Malik(ler)/Hisse Payı/vb.)
//         "scalar" ile AYNI "sil ve taşı" (hoisting) kuralına girdi.
//  Tur 3: "bağımsız bölümle ilgili sütunlar hem üstte hem altta gözüksün"
//         — YALNIZCA hoistExemptFieldKeys için AYRI bir "kalır + kopyalanır"
//         (duplicateToCommonFieldKeys) seçeneği eklendi.
//  Tur 4 (BU TASARIM): "diğer 7 tabloya da uygula ancak alt tabloda ortak
//         olan değerler gözükmüyor" — kullanıcı ASLINDA DOLU+aynı olan
//         sütunların (yalnızca bağımsız-bölüm kimlik sütunlarının DEĞİL,
//         Ana Taşınmaz Niteliği/Malik/İl/İlçe/vb. DAHİL) "kalır +
//         kopyalanır" davranışına tabi olmasını istedi. `duplicateToCommonFieldKeys`
//         seçeneği KALDIRILDI (artık GEREKSİZ — bu davranış DOLU+aynı her
//         sütun için otomatik/evrensel).
//
// NİHAİ KURAL — İKİ AYRI durum, KASITLI olarak FARKLI:
//  (a) TÜM taşınmazlarda birebir AYNI VE DOLU bir "scalar"/"owner" sütun
//      ARTIK HİÇBİR ZAMAN tablodan kalkmıyor — KALIR VE AYRICA
//      commonFields'e bir KOPYASI eklenir.
//  (b) TÜM taşınmazlarda birebir AYNI VE BOŞ olan bir "genel scalar" sütun
//      (0.0.584'ün "boş olanları da göster" kuralı) — gösterilecek GERÇEK
//      bir değer OLMADIĞINDAN, ORİJİNAL 0.0.584 tasarımı KORUNUYOR: sütun
//      tablodan KALKAR, "-" olarak commonFields'e TAŞINIR (tek başına
//      "kalır + kopyalanır" DEĞİL, "sil ve taşı" — bilinçli farklılık).
//
// Kapsam:
//  1) Temel "kalır + kopyalanır" — (a): TÜM satırlarda birebir aynı VE
//     DOLU "scalar"/"owner" sütun tablodan KALKMAZ, AYRICA commonFields'e
//     kopyalanır.
//  2) "sil ve taşı" — (b): TÜM satırlarda BOŞ olan genel-scalar sütun
//     tablodan KALKAR, "-" değeriyle commonFields'e TAŞINIR.
//  3) "seq"/"computed"/"readonly" hiçbir zaman commonFields'e kopyalanmaz/
//     taşınmaz (ama zaten "aynı değer" yüzünden kalkmazlar).
//  4) Tek satırlı (1 taşınmaz) girdide kopyalama uygulanmaz (karşılaştırma
//     anlamsız).
//  5) alwaysKeepFieldKeys: boşsa sütun HER ZAMAN kalır (zaten geçerliydi);
//     boş+aynı iken commonFields'e "-" KOPYALANMAZ (anlamsız tekrar);
//     dolu+aynıyken normal şekilde (a)'ya girer.
//  6) hoistExemptFieldKeys: YALNIZCA "hiçbir taşınmazda veri yok" durumunda
//     sütunun TAMAMEN KALKMASINI sağlar (0.0.451 orijinal kuralı) — genel
//     scalar sütunların (b) davranışına GİRMEZ; dolu+aynıyken bu
//     istisnadan ETKİLENMEZ, normal şekilde (a)'ya girer.
//  7) commonFields'in gösterilen `.value`'su gruba giren İLK satırın ham
//     değeridir; `.fieldKey` doğru taşınır (owner sütunlarında ownerColumn'a
//     düşülür).

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

// --- 1) Temel "kalır + kopyalanır": SADECE bir sütun aynı ------------------
{
  const headers = ["Sıra No", "İl", "İlçe"];
  const rows = [
    [1, "Bursa", "Nilüfer"],
    [2, "Bursa", "Osmangazi"],
  ];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "city" }, { kind: "scalar", fieldKey: "district" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, headers, "\"İl\" (aynı) DAHİL hiçbir sütun tablodan KALKMAMALI.");
  assert.deepEqual(result.rows, rows, "rows AYNEN KORUNMALI (hiçbir sütun silinmedi).");
  assert.deepEqual(result.columnMeta, columnMeta, "columnMeta AYNEN KORUNMALI.");
  assert.deepEqual(result.commonFields, [{ label: "İl", value: "Bursa", fieldKey: "city" }], "Yalnızca aynı olan \"İl\" commonFields'e KOPYALANMALI, farklı \"İlçe\" eklenmemeli.");
  console.log("Temel \"kalır + kopyalanır\" (ayni+dolu scalar sutun sutun olarak kalir + commonFields'e kopyalanir) testi tamam.");
}

// --- 2) TÜM satırlarda BOŞ olan genel-scalar sütun "SİL VE TAŞI" (b) -------
// davranışını KORUR (dolu+aynı olan (a) davranışından BİLİNÇLİ FARKLI).
{
  const headers = ["Sıra No", "İl", "Giriş"];
  const rows = [
    [1, "Bursa", ""],
    [2, "İzmir", "-"],
  ];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "city" }, { kind: "scalar", fieldKey: "entrance" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "İl"], "TÜM satırlarda BOŞ olan \"Giriş\" (genel-scalar) sütun olarak KALKMALI (commonFields'e taşınmış olmalı).");
  assert.deepEqual(result.commonFields, [{ label: "Giriş", value: "-", fieldKey: "entrance" }], "TÜM satırlarda BOŞ olan genel-scalar sütun \"-\" değeriyle commonFields'e TAŞINIR (sütun KALKARAK).");
  console.log("Bos genel-scalar sutun sutun olarak kalkip \"-\" ile commonFields'e tasinir (sil ve tasi) testi tamam.");
}

// --- 2b) TUM satirlarda BOS olan sutun, dolu-farkli sutunla BIRLIKTE -------
{
  const headers = ["Sıra No", "Mevkii", "Blok"];
  const rows = [
    [1, "", "A"],
    [2, "-", "B"],
  ];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "locationName" }, { kind: "scalar", fieldKey: "blockName" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "Blok"], "Bos 'Mevkii' kalkmali, farkli-dolu 'Blok' kalmali.");
  assert.deepEqual(result.commonFields, [{ label: "Mevkii", value: "-", fieldKey: "locationName" }], "Yalniz bos 'Mevkii' \"-\" ile commonFields'e tasinmali, farkli 'Blok' eklenmemeli.");
  console.log("Bos sutun + farkli-dolu sutun birlikte (bos olan kalkar, farkli-dolu kalir) testi tamam.");
}

// --- 3) "seq"/"computed"/"readonly" hicbir zaman commonFields'e kopyalanmaz
{
  const headers = ["Sıra No", "Hissesine Düşen Arsa Payı", "İnş. Sev."];
  const rows = [
    [1, "%50", "90"],
    [2, "%50", "90"],
  ];
  const columnMeta = [
    { kind: "seq" },
    { kind: "computed" },
    { kind: "readonly", fieldKey: "constructionLevel" },
  ];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, headers, "seq/computed/readonly TUM satirlarda ayni olsa BILE hicbiri tablodan kalkmamali (zaten hicbir sutun kalkmiyor).");
  assert.deepEqual(result.commonFields, [], "commonFields BOS olmali (seq/computed/readonly hicbiri kopyalanmaz).");
  console.log("seq/computed/readonly commonFields'e kopyalanmama testi tamam.");
}

// --- 3b) "owner" sutunu "scalar" ile AYNI sekilde "kalir + kopyalanir" ----
{
  const headers = ["Sıra No", "Malik(ler)", "Hisse Payı"];
  // 3b-i) TUM satirlarda AYNI ve DOLU -> sutun KALIR + commonFields'e kopyalanir.
  const rowsSame = [
    [1, "Ahmet Yılmaz", "1/1"],
    [2, "Ahmet Yılmaz", "1/1"],
  ];
  const columnMeta = [
    { kind: "seq" },
    { kind: "owner", ownerColumn: "c0" },
    { kind: "owner", ownerColumn: "c1" },
  ];
  const resultSame = fns.finalizeTitleUnitsSummaryTableData(headers, rowsSame, columnMeta);
  assert.deepEqual(resultSame.headers, headers, "\"Malik(ler)\"/\"Hisse Payı\" (owner, ayni+dolu) DAHIL hicbir sutun tablodan KALKMAMALI.");
  assert.deepEqual(
    resultSame.commonFields,
    [
      { label: "Malik(ler)", value: "Ahmet Yılmaz", fieldKey: "c0" },
      { label: "Hisse Payı", value: "1/1", fieldKey: "c1" },
    ],
    "\"Malik(ler)\"/\"Hisse Payı\" AYRICA commonFields'e (fieldKey yerine ownerColumn ile) kopyalanmali."
  );

  // 3b-ii) Malik FARKLI, Hisse Payı AYNI -> yalnizca Hisse Payı kopyalanir
  // (her owner sutunu BAGIMSIZ degerlendirilir).
  const rowsMixed = [
    [1, "Ahmet Yılmaz", "1/1"],
    [2, "Ayşe Yılmaz", "1/1"],
  ];
  const resultMixed = fns.finalizeTitleUnitsSummaryTableData(headers, rowsMixed, columnMeta);
  assert.deepEqual(resultMixed.headers, headers, "Farkli olan \"Malik(ler)\" DAHIL hicbir sutun tablodan KALKMAMALI.");
  assert.deepEqual(resultMixed.commonFields, [{ label: "Hisse Payı", value: "1/1", fieldKey: "c1" }], "Yalniz ayni olan \"Hisse Payı\" commonFields'e kopyalanmali.");
  console.log("\"owner\" sutunu \"scalar\" gibi \"kalir + kopyalanir\" (bagimsiz sutun bazinda) testi tamam.");
}

// --- 4) Tek satirli (1 tasinmaz) girdide kopyalama UYGULANMAZ --------------
{
  const headers = ["Sıra No", "İl"];
  const rows = [[1, "Bursa"]];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "city" }];
  const result = fns.finalizeTitleUnitsSummaryTableData(headers, rows, columnMeta);
  assert.deepEqual(result.headers, ["Sıra No", "İl"], "Tek satirda karsilastirma anlamsiz - kopyalama uygulanmamali.");
  assert.deepEqual(result.commonFields, [], "Tek satirda commonFields BOS olmali.");
  console.log("Tek-satirli girdide kopyalama no-op testi tamam.");
}

// --- 5) alwaysKeepFieldKeys: boş+aynıyken "-" KOPYALANMAZ (anlamsız tekrar) -
// (Adres Ozeti'nin ADDRESS_UNITS_TABLE_ALWAYS_VISIBLE_WHEN_SAME_ADA_PARSEL_KEYS emsali).
{
  const headers = ["Sıra No", "UAVT", "İl"];
  const rowsEmpty = [[1, "", "Bursa"], [2, "-", "Bursa"]];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "uavt" }, { kind: "scalar", fieldKey: "city" }];
  const alwaysKeepFieldKeys = new Set(["uavt"]);

  // 5a) UAVT bos -> sutun KALIR (zaten her zaman kalir), ama commonFields'e
  // "-" KOPYALANMAZ (alwaysKeepFieldKeys'in boş+aynı istisnası).
  const resultEmpty = fns.finalizeTitleUnitsSummaryTableData(headers, rowsEmpty, columnMeta, { alwaysKeepFieldKeys });
  assert.ok(resultEmpty.headers.includes("UAVT"), "alwaysKeepFieldKeys: bos olsa bile UAVT sutun olarak KALMALI.");
  assert.ok(!resultEmpty.commonFields.some((f) => f.fieldKey === "uavt"), "Bos+ayni UAVT commonFields'e \"-\" ile KOPYALANMAMALI (alwaysKeepFieldKeys'in ozel istisnasi).");

  // 5b) UAVT DOLU ve TUM satirlarda AYNI ise, sutun KALIR + commonFields'e KOPYALANIR.
  const rowsSame = [[1, "123", "Bursa"], [2, "123", "İzmir"]];
  const resultSame = fns.finalizeTitleUnitsSummaryTableData(headers, rowsSame, columnMeta, { alwaysKeepFieldKeys });
  assert.ok(resultSame.headers.includes("UAVT"), "Dolu+ayni UAVT de sutun olarak KALMALI (hicbir sutun aynı deger yuzunden kalkmiyor).");
  assert.ok(resultSame.commonFields.some((f) => f.label === "UAVT" && f.value === "123"), "Dolu+ayni UAVT AYRICA commonFields'e KOPYALANMALI.");
  console.log("alwaysKeepFieldKeys (bos+ayniyken \"-\" kopyalanmaz, dolu+ayniyken kopyalanir) testi tamam.");
}

// --- 6) hoistExemptFieldKeys: YALNIZCA "hicbir tasinmazda veri yok" -------
// durumunda sutunun TAMAMEN KALKMASINI saglar (0.0.451 orijinal kurali) —
// dolu+ayniyken normal sekilde KALIR + commonFields'e KOPYALANIR (Tapu'nun
// Blok/Kat/Bagimsiz Bolum No/Ana Tasinmaz Niteligi emsali).
{
  const headers = ["Sıra No", "Ana Taşınmaz Niteliği"];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "mainPropertyQuality" }];
  const hoistExemptFieldKeys = new Set(["mainPropertyQuality"]);

  // 6a) TUM satirlarda AYNI ve DOLU ise, sutun KALIR + commonFields'e KOPYALANIR
  // (hoistExemptFieldKeys "aynı değer" kuralını ARTIK ETKİLEMEZ).
  const rowsSame = [[1, "Arsa"], [2, "Arsa"]];
  const resultSame = fns.finalizeTitleUnitsSummaryTableData(headers, rowsSame, columnMeta, { hoistExemptFieldKeys });
  assert.ok(resultSame.headers.includes("Ana Taşınmaz Niteliği"), "hoistExemptFieldKeys: ayni-metin sutun HER ZAMAN KALIR.");
  assert.deepEqual(resultSame.commonFields, [{ label: "Ana Taşınmaz Niteliği", value: "Arsa", fieldKey: "mainPropertyQuality" }], "Dolu+ayni sutun AYRICA commonFields'e KOPYALANMALI.");

  // 6b) TUM satirlarda BOS ise, hoistExemptFieldKeys sutunun TAMAMEN
  // KALKMASINI saglar (0.0.451 orijinal kurali, "boş olanları da göster"
  // genel-scalar davranışına GİRMEZ).
  const rowsEmpty = [[1, "-"], [2, ""]];
  const resultEmpty = fns.finalizeTitleUnitsSummaryTableData(headers, rowsEmpty, columnMeta, { hoistExemptFieldKeys });
  assert.ok(!resultEmpty.headers.includes("Ana Taşınmaz Niteliği"), "hoistExemptFieldKeys: TUMU BOS ise sutun TAMAMEN KALKMALI.");
  assert.deepEqual(resultEmpty.commonFields, [], "Kalkan sutun icin commonFields'e de hicbir sey eklenmemeli.");
  console.log("hoistExemptFieldKeys (yalnizca \"hicbir veri yok\" durumunda tamamen kalkma) testi tamam.");
}

console.log("finalizeTitleUnitsSummaryTableData() (commonFields hoisting) testleri basarili.");
