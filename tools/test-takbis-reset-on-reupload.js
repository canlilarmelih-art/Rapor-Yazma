// TAKBİS yeniden yükleme: eski verinin TAMAMEN silinmesi (2026-08-15).
// Kullanıcı bildirimi: "takbis yüklendikten sonra yeni bir takbis
// yüklendiğinde eski takbisteki veriler kalıyor. üstüne ekliyor. tamamını
// silmeli yeni takbis yükleyince" — kök neden: resetTakbisTitleDerivedFields()
// yalnızca kullanıcının ELLE DEĞİŞTİRMEDİĞİ alanları temizliyordu
// (currentValue === state.sourceValues.takbis.applied[key] kontrolü),
// "manuel düzeltmeyi koru" niyetiyle eklenmişti — ama bu, önceki TAKBİS'ten
// kalan (kullanıcı elle dokunmuş GİBİ görünen) bazı alanların yeni TAKBİS
// sonrası da TABLODA KALMASINA yol açıyordu. Düzeltme: TÜM türetilmiş
// alanlar artık KOŞULSUZ temizleniyor (resetKmlDerivedFields() ile AYNI
// desen).
//
// Bu test kapsamı:
//  1) "Elle değiştirilmemiş" alan: reset sonrası boş.
//  2) "Elle değiştirilmiş GİBİ görünen" (currentValue !== applied) alan:
//     ÖNCEKİ davranışta KORUNURDU, YENİ davranışta da temizlenir (asıl
//     regresyon testi — bu senaryo başarısız olursa eski hataya dönülmüş
//     demektir).
//  3) Malikler (state.tables.title) ve Takyidat (state.tables.encumbrance)
//     tabloları da sıfırlanır.
//  4) encumbranceReportTables (Beyanlar/Şerhler/İpotekler) alt tabloları
//     boş diziye döner.
//  5) state.sourceValues.takbis / state.sourceConflicts.takbis sıfırlanır.

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

// app.js CRLF satır sonlarıyla saklanıyor — "[" / "]" derinliğine göre
// sabitin GERÇEK sonunu bulan yöntem (bkz. diğer test dosyalarındaki AYNI
// teknik, ör. test-title-units-summary-table.js).
function extractConst(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, index + 1)};`;
    }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = ["resetTakbisTitleDerivedFields"];
const constNames = ["encumbranceReportTables"];

const sandboxSource = `
  let state = {};
  let sections = [
    { id: "title", table: { rows: 3 } },
    { id: "encumbrance", table: { rows: 5 } },
  ];
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    resetTakbisTitleDerivedFields,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) "Elle değiştirilmemiş" alanlar reset sonrası boş -------------------
{
  fns.setState({
    fields: { titleQuality: "Daire", blockNo: "709", parcelNo: "2", titlePropertyId: "123456" },
    tables: { title: [{ c0: "Ahmet Yılmaz" }], encumbrance: [{ c0: "İpotek" }], encumbranceDeclarations: [{ c0: "Beyan 1" }] },
    sourceValues: { takbis: { applied: { titleQuality: "Daire", blockNo: "709", parcelNo: "2", titlePropertyId: "123456" } } },
    sourceConflicts: { takbis: {} },
  });
  fns.resetTakbisTitleDerivedFields();
  const after = fns.getState();
  assert.equal(after.fields.titleQuality, "", "Elle degistirilmemis titleQuality reset sonrasi bos olmali.");
  assert.equal(after.fields.blockNo, "", "Elle degistirilmemis blockNo reset sonrasi bos olmali.");
  console.log("Elle degistirilmemis alanlarin reset sonrasi bos olma testi tamam.");
}

// --- 2) REGRESYON: "elle değiştirilmiş GİBİ görünen" alan da KOŞULSUZ ------
// temizlenmeli (currentValue !== applied — ÖNCEKİ davranışta bu alan
// KORUNURDU, kullanıcı bildirimindeki ASIL hata BUYDU).
{
  fns.setState({
    fields: { titleQuality: "Dükkan", blockNo: "999" }, // applied'daki DEĞERDEN FARKLI
    tables: {},
    sourceValues: { takbis: { applied: { titleQuality: "Daire", blockNo: "709" } } }, // eski TAKBİS'in uyguladığı değer
    sourceConflicts: { takbis: { titleQuality: { currentValue: "Dükkan", suggestedValue: "Daire" } } },
  });
  fns.resetTakbisTitleDerivedFields();
  const after = fns.getState();
  assert.equal(after.fields.titleQuality, "", "\"Elle degistirilmis GIBI gorunen\" alan da artik KOSULSUZ temizlenmeli (kullanici bildirimindeki hata: \"eski takbisteki veriler kaliyor\").");
  assert.equal(after.fields.blockNo, "", "\"Elle degistirilmis GIBI gorunen\" blockNo da KOSULSUZ temizlenmeli.");
  console.log("REGRESYON: elle degistirilmis GIBI gorunen alanin da kosulsuz temizlenmesi testi tamam.");
}

// --- 3) Malikler + Takyidat tabloları sıfırlanır ---------------------------
{
  fns.setState({
    fields: {},
    tables: { title: [{ c0: "Eski Malik 1" }, { c0: "Eski Malik 2" }], encumbrance: [{ c0: "Eski Ipotek" }] },
    sourceValues: { takbis: { applied: {} } },
    sourceConflicts: { takbis: {} },
  });
  fns.resetTakbisTitleDerivedFields();
  const after = fns.getState();
  assert.equal(after.tables.title.length, 3, "Malikler tablosu varsayilan satir sayisina (3) sifirlanmali.");
  after.tables.title.forEach((row, i) => {
    assert.deepEqual(row, {}, `Malikler tablosu satir ${i} BOS olmali (eski malik verisi KALMAMALI).`);
  });
  assert.equal(after.tables.encumbrance.length, 5, "Takyidat tablosu varsayilan satir sayisina (5) sifirlanmali.");
  after.tables.encumbrance.forEach((row, i) => {
    assert.deepEqual(row, {}, `Takyidat tablosu satir ${i} BOS olmali (eski ipotek verisi KALMAMALI).`);
  });
  console.log("Malikler + Takyidat tablolarinin sifirlanma testi tamam.");
}

// --- 4) encumbranceReportTables (Beyanlar/Şerhler/İpotekler) boş dizi ------
{
  fns.setState({
    fields: {},
    tables: {
      encumbranceDeclarations: [{ c0: "Eski Beyan" }],
      encumbranceAnnotations: [{ c0: "Eski Serh" }],
      encumbranceMortgages: [{ c0: "Eski Ipotek Lehdari" }],
    },
    sourceValues: { takbis: { applied: {} } },
    sourceConflicts: { takbis: {} },
  });
  fns.resetTakbisTitleDerivedFields();
  const after = fns.getState();
  ["encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages"].forEach((key) => {
    assert.deepEqual(after.tables[key], [], `"${key}" alt tablosu BOS DIZIYE sifirlanmali (eski veri KALMAMALI).`);
  });
  console.log("encumbranceReportTables (Beyanlar/Serhler/Ipotekler) sifirlanma testi tamam.");
}

// --- 5) state.sourceValues.takbis / state.sourceConflicts.takbis sıfırlanır -
{
  fns.setState({
    fields: {},
    tables: {},
    sourceValues: { takbis: { fileName: "eski-takbis.pdf", applied: { titleQuality: "Daire" }, owners: [{ name: "Eski Malik" }] } },
    sourceConflicts: { takbis: { titleQuality: { currentValue: "x", suggestedValue: "y" } } },
  });
  fns.resetTakbisTitleDerivedFields();
  const after = fns.getState();
  assert.deepEqual(after.sourceValues.takbis, {}, "state.sourceValues.takbis (eski dosya adi/ayristirilmis veri DAHIL) tamamen sifirlanmali.");
  assert.deepEqual(after.sourceConflicts.takbis, {}, "state.sourceConflicts.takbis sifirlanmali.");
  console.log("sourceValues.takbis / sourceConflicts.takbis sifirlanma testi tamam.");
}

console.log("TAKBIS yeniden yukleme (eski veri tamamen silinir) testleri basarili.");
