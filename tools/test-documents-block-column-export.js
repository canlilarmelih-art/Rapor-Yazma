// "İncelenen Belgeler" Excel export'una Blok sütunu (2026-09-03).
// Kullanıcı talebi: "belgeler ve projeler bölümünde incelenen belgeler
// bölümü excele tablo olarak aktarılıyor. çoklu çalışmalarda tabloya
// blok bölümü ekleyelim eğer aynı tarih ve sayılı belge var ise en sol
// sütunda blok sütunu A ve B Blok gibi yazsın. farklılık var ise satır
// olarak ayırsın."
//
// KÖK NEDEN: "İncelenen Belgeler" tablosunun Excel export'u
// (report-tables-xlsx.js, rawGridCellGridFor) yalnızca AKTİF taşınmazın/
// bloğun kendi ham ızgarasını (state.tables.documents) okuyordu — "documents"
// BİLEREK blok-özgü bir tablo (bkz. isDocumentsBlockGroupingActive/
// computeDocumentsBlockGroups yorumları), yani çoklu bloklu raporlarda
// diğer blokların belgeleri Excel'e HİÇ yansımıyordu.
//
// DÜZELTME: app.js'teki YENİ buildDocumentsRowsWithBlockColumn()
// computeDocumentsBlockGroups() (mevcut, blok tab çubuğunun KENDİSİNİN
// kullandığı AYNI gruplama) ile TÜM blokları dolaşır; aynı Tarih+No'ya
// sahip belgeleri TEK satırda birleştirip Blok sütununda ("A ve B Blok")
// gösterir, farklıysa (ya da Tarih+No İKİSİ DE boşsa) ayrı satırda bırakır.
// report-tables-xlsx.js'teki rawGridCellGridFor() bu sonucu "documents"
// anahtarı için "Blok" sütunuyla en sola ekler; tek-bloklu/tekil
// raporlarda (null dönünce) ESKİ davranışa (aktif taşınmazın ham ızgarası)
// DEĞİŞMEDEN düşer.
//
// Kapsanan senaryolar:
//  1) Tekil taşınmaz: null döner (davranış değişmedi).
//  2) 2+ taşınmaz ama HEPSİ AYNI blokta: null döner (karşılaştırılacak
//     blok farkı yok).
//  3) 2 FARKLI blok (A/B), bir belge HER İKİSİNDE de aynı Tarih+No ile
//     var (birleşir, "A ve B Blok"), birer belge yalnızca kendi bloğunda
//     var (ayrı satır, kendi blok etiketiyle), kronolojik sıralama korunur.
//  4) 3 FARKLI blok (A/B/C), TEK belge hepsinde ortak -> "A, B ve C Blok".
//  5) Tarih VE No İKİSİ DE boş olan belgeler asla birleştirilmez (güvenli
//     varsayılan) — her biri kendi bloğuyla ayrı kalır.
//  6) formatDocumentsBlockColumnValue()/stripTrailingBlokSuffixForDocumentsColumn()
//     birim testleri (çıplak ad + yedek "N. Blok" biçimi).
//  7) report-tables-xlsx.js kaynak seviyesinde doğru kablolanmış mı
//     (documents anahtarına özel dal + "Blok" başlığı en solda).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.js");
const appSource = fs.readFileSync(appPath, "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
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

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  "buildAllTitleUnitsForSummaryTable",
  "computeTitleUnitsShareSameBlock",
  "isDocumentsScopedByBlock",
  "computeDocumentsBlockGroups",
  "computeDocumentsBlockLabel",
  "stripTrailingBlokSuffixForDocumentsColumn",
  "formatDocumentsBlockColumnValue",
  "joinAddressGroupTexts",
  "parseReviewedDocumentDate",
  "buildDocumentsRowsWithBlockColumn",
];

const sandboxSource = `
  let state = {};
  // dateTrToIso (GERÇEK fonksiyon normalizeEkbDate'e bağımlı, bu testin
  // kapsamı DIŞINDA) — parseReviewedDocumentDate zaten ISO ("YYYY-MM-DD")
  // girdileri kendi regex yedeğiyle tanıyor, bu yüzden davranış-koruyan
  // basit bir SAHTE yeterli (diğer test dosyalarındaki AYNI konvansiyon).
  function dateTrToIso() { return ""; }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildDocumentsRowsWithBlockColumn,
    formatDocumentsBlockColumnValue,
    stripTrailingBlokSuffixForDocumentsColumn,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: { documents: overrides.__documents || [] } };
}

// --- 1) Tekil taşınmaz: null döner (davranış değişmedi) -------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", titleBlockName: "A", ownershipType: "Kat Mülkiyeti" },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "1994-07-15", c3: "653/09", c4: "" }] },
    titleUnits: [],
  });
  const result = fns.buildDocumentsRowsWithBlockColumn();
  assert.equal(result, null, "Tekil taşınmazda null dönmeli (eski, tek taşınmazlı davranışa düşülmeli).");
  console.log("Tekil taşınmaz (davranış değişmedi) testi tamam.");
}

// --- 2) 2+ taşınmaz ama HEPSİ AYNI blokta: null döner ----------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", titleBlockName: "A", ownershipType: "Kat Mülkiyeti" },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "1994-07-15", c3: "653/09", c4: "" }] },
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", titleBlockName: "A" })],
  });
  const result = fns.buildDocumentsRowsWithBlockColumn();
  assert.equal(result, null, "Tüm taşınmazlar AYNI blokta ise null dönmeli (karşılaştırılacak blok farkı yok).");
  console.log("Çoklu taşınmaz ama AYNI blok (null) testi tamam.");
}

// --- 3) 2 FARKLI blok: ortak belge birleşir, kendine özgü belgeler ayrılır -
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5", titleBlockName: "A", ownershipType: "Kat Mülkiyeti",
    },
    tables: {
      documents: [
        { c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "1994-07-15", c3: "653/09", c4: "Tam" }, // A ve B ortak
        { c0: "Tadilat Ruhsatı", c1: "Belediye", c2: "2020-01-05", c3: "697/19", c4: "" }, // yalnız A
      ],
    },
    titleUnits: [
      unit({
        blockNo: "100", parcelNo: "5", titleBlockName: "B",
        __documents: [
          { c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "1994-07-15", c3: "653/09", c4: "Tam" }, // A ve B ortak
          { c0: "İskan Ruhsatı", c1: "Belediye", c2: "2010-03-10", c3: "111/22", c4: "" }, // yalnız B
        ],
      }),
    ],
  });
  const result = fns.buildDocumentsRowsWithBlockColumn();
  assert.ok(Array.isArray(result), "2 farklı blokta dizi dönmeli.");
  assert.equal(result.length, 3, `3 satır beklenir (1 birleşik + 2 ayrı). Bulunan: ${result.length}`);
  // Kronolojik sıra: 1994-07-15 (ortak), 2010-03-10 (yalnız B), 2020-01-05 (yalnız A)
  assert.equal(result[0].row.c3, "653/09", "İlk satır en eski tarihli (1994) ortak belge olmalı.");
  assert.equal(result[0].blockText, "A ve B Blok", `Ortak belgenin Blok sütunu "A ve B Blok" olmalı. Bulunan: ${result[0].blockText}`);
  assert.equal(result[1].row.c3, "111/22", "İkinci satır 2010 tarihli yalnız-B belgesi olmalı.");
  assert.equal(result[1].blockText, "B Blok", `Yalnız B'ye özgü belgenin Blok sütunu "B Blok" olmalı. Bulunan: ${result[1].blockText}`);
  assert.equal(result[2].row.c3, "697/19", "Üçüncü satır 2020 tarihli yalnız-A belgesi olmalı.");
  assert.equal(result[2].blockText, "A Blok", `Yalnız A'ya özgü belgenin Blok sütunu "A Blok" olmalı. Bulunan: ${result[2].blockText}`);
  console.log("2 farklı blok: ortak belge birleşir + kendine özgü belgeler ayrılır + kronolojik sıra testi tamam.");
}

// --- 4) 3 FARKLI blok, TEK ortak belge -> "A, B ve C Blok" -----------------
{
  const sharedRow = { c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "1994-07-15", c3: "653/09", c4: "Tam" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", titleBlockName: "A", ownershipType: "Kat Mülkiyeti" },
    tables: { documents: [{ ...sharedRow }] },
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", titleBlockName: "B", __documents: [{ ...sharedRow }] }),
      unit({ blockNo: "100", parcelNo: "5", titleBlockName: "C", __documents: [{ ...sharedRow }] }),
    ],
  });
  const result = fns.buildDocumentsRowsWithBlockColumn();
  assert.equal(result.length, 1, "3 blokta da BİREBİR aynı belge TEK satıra düşmeli.");
  assert.equal(result[0].blockText, "A, B ve C Blok", `3 blok birleşiminde "A, B ve C Blok" beklenir. Bulunan: ${result[0].blockText}`);
  console.log("3 farklı blok, tek ortak belge -> 'A, B ve C Blok' testi tamam.");
}

// --- 5) Tarih VE No İKİSİ DE boş olan belgeler asla birleştirilmez ---------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", titleBlockName: "A", ownershipType: "Kat Mülkiyeti" },
    tables: { documents: [{ c0: "Sözlü Beyan", c1: "Saha", c2: "", c3: "", c4: "" }] },
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "5", titleBlockName: "B", __documents: [{ c0: "Sözlü Beyan", c1: "Saha", c2: "", c3: "", c4: "" }] }),
    ],
  });
  const result = fns.buildDocumentsRowsWithBlockColumn();
  assert.equal(result.length, 2, "Tarih+No'su İKİSİ DE boş olan belgeler GÜVENLİ VARSAYILAN gereği asla birleştirilmemeli.");
  const blockTexts = result.map((entry) => entry.blockText).sort();
  assert.deepEqual(blockTexts, ["A Blok", "B Blok"], `Her ikisi de KENDİ bloğuyla ayrı kalmalı. Bulunan: ${blockTexts.join(", ")}`);
  console.log("Tarih+No ikisi de boş -> birleştirme YOK (güvenli varsayılan) testi tamam.");
}

// --- 6) formatDocumentsBlockColumnValue() / stripTrailingBlokSuffixForDocumentsColumn() birim testleri
{
  assert.equal(fns.stripTrailingBlokSuffixForDocumentsColumn("A"), "A");
  assert.equal(fns.stripTrailingBlokSuffixForDocumentsColumn("1. Blok"), "1.");
  assert.equal(fns.formatDocumentsBlockColumnValue(["A"]), "A Blok");
  assert.equal(fns.formatDocumentsBlockColumnValue(["A", "B"]), "A ve B Blok");
  assert.equal(fns.formatDocumentsBlockColumnValue(["A", "B", "C"]), "A, B ve C Blok");
  assert.equal(fns.formatDocumentsBlockColumnValue(["1. Blok"]), "1. Blok");
  assert.equal(fns.formatDocumentsBlockColumnValue(["1. Blok", "2. Blok"]), "1. ve 2. Blok");
  assert.equal(fns.formatDocumentsBlockColumnValue([]), "");
  console.log("formatDocumentsBlockColumnValue/stripTrailingBlokSuffixForDocumentsColumn birim testleri tamam.");
}

// --- 7) report-tables-xlsx.js kaynak seviyesinde doğru kablolanmış mı ------
{
  const xlsxSource = fs.readFileSync(path.join(__dirname, "..", "src", "exports", "report-tables-xlsx.js"), "utf8");
  assert.ok(
    xlsxSource.includes("window.buildDocumentsRowsWithBlockColumn"),
    "report-tables-xlsx.js app.js'teki buildDocumentsRowsWithBlockColumn()'u çağırmalı."
  );
  assert.ok(
    /def\.key === "documents"[\s\S]{0,400}\["Blok", \.\.\.def\.columns\]/.test(xlsxSource),
    "rawGridCellGridFor() 'documents' anahtarında en sola 'Blok' başlığı eklemeli."
  );
  console.log("report-tables-xlsx.js kablolama (kaynak-düzeyi) testi tamam.");
}

console.log("Tum 'Incelenen Belgeler Excel: Blok sutunu' testleri basarili.");
