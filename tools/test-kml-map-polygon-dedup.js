// KML harita poligonlarinin ayni ada/parselde TEKILLESTIRILMESI (2026-08-22).
// Kullanici, ekran goruntusuyle: "harita neden bu sekilde parsel sinirlari
// icini mavi dolgu yapti" -> "ayni ada parsel coklu taleplerde ust uste
// bindirmeye gerek yok." KOK NEDEN: Coklu Talep'te birden fazla tasinmaz
// (ayni Kat Irtifaki binasinda farkli bagimsiz bolumler gibi) FIZIKSEL
// olarak AYNI parselde oldugunda, her tasinmazin kendi KML kaydi (ayni/cok
// benzer koordinatlarla) haritada AYRI AYRI ciziliyordu - yari saydam
// dolgular ust uste yigilip GEREKSIZ YERE koyulasiyordu. getDistinctKmlParcelRecordsForMap()
// getKmlMapSubjectEntries()'in "ayni parselse TEK etiket" mantigiyla AYNI
// anahtari (blockNo|parcelNo, normalizeKmlParcelMatchPart) kullanarak
// poligon cizimini TEKIL parsele indirger.

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

const functionNames = ["normalizeKmlParcelMatchPart", "getKmlRecordParcelFields", "getDistinctKmlParcelRecordsForMap"];
const sandboxSource = `
${functionNames.map(extractFunction).join("\n")}
return { getDistinctKmlParcelRecordsForMap };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function record(index, blockNo, parcelNo) {
  return { index, parsed: { fields: { blockNo, parcelNo } }, fields: {} };
}

// --- 1) Ayni ada/parselde 3 tasinmaz (ayni Kat Irtifaki binasi) -> TEK ----
// (ilk karsilasilan) poligon temsilci olarak dondurulmeli.
{
  const records = [record(0, "100", "5"), record(1, "100", "5"), record(2, "100", "5")];
  const distinct = fns.getDistinctKmlParcelRecordsForMap(records);
  assert.equal(distinct.length, 1, "Ayni ada/parselde 3 kayit TEK poligona indirgenmeli.");
  assert.equal(distinct[0].index, 0, "Temsilci olarak ILK karsilasilan kayit (index 0) tutulmali.");
  console.log("Ayni ada/parselde coklu kayit tekillestirme testi tamam.");
}

// --- 2) Farkli ada/parsellerde kayitlar -> hepsi AYRI ayri kalmali -------
{
  const records = [record(0, "100", "5"), record(1, "200", "8")];
  const distinct = fns.getDistinctKmlParcelRecordsForMap(records);
  assert.equal(distinct.length, 2, "Farkli ada/parsellerdeki kayitlarin HICBIRI birlestirilmemeli.");
  assert.deepEqual(distinct.map((r) => r.index), [0, 1], "Sira korunmali.");
  console.log("Farkli ada/parsellerde tekillestirmeme (regresyon) testi tamam.");
}

// --- 3) Karma senaryo: 2 kayit ayni parselde + 1 kayit farkli parselde ---
{
  const records = [record(0, "100", "5"), record(1, "200", "8"), record(2, "100", "5")];
  const distinct = fns.getDistinctKmlParcelRecordsForMap(records);
  assert.equal(distinct.length, 2, "2 benzersiz ada/parsel -> 2 poligon.");
  assert.deepEqual(distinct.map((r) => r.index), [0, 1], "Her benzersiz parselin ILK karsilasilan kaydi (0 ve 1) tutulmali, index 2 (100/5'in tekrari) elenmeli.");
  console.log("Karma senaryo (kismi paylasim) testi tamam.");
}

// --- 4) Bos/tekil girdi guvenlik agi --------------------------------------
{
  assert.deepEqual(fns.getDistinctKmlParcelRecordsForMap([]), [], "Bos dizi girdisinde bos dizi donmeli.");
  const single = [record(0, "100", "5")];
  assert.deepEqual(fns.getDistinctKmlParcelRecordsForMap(single), single, "Tekil kayitta oldugu gibi donmeli.");
  console.log("Bos/tekil girdi guvenlik agi testi tamam.");
}

// --- 5) Ada/parsel bosken (KML'de blockNo/parcelNo yoksa) buyuk/kucuk -----
// harf ve bosluk farklariyla ESLESTIRME (normalizeKmlParcelMatchPart ile
// TUTARLI - " 100 " ile "100" AYNI parsel sayilmali).
{
  const records = [record(0, " 100 ", "Kat İrtifakı 5"), record(1, "100", "KAT İRTİFAKI 5")];
  const distinct = fns.getDistinctKmlParcelRecordsForMap(records);
  assert.equal(distinct.length, 1, "Bosluk/buyuk-kucuk harf farki AYNI parsel olarak eslesmeli (normalizeKmlParcelMatchPart ile tutarli).");
  console.log("Normalize edilmis ada/parsel esleme testi tamam.");
}

console.log("KML harita poligon tekillestirme testleri basarili.");
