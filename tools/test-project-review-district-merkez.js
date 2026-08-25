// Kullanıcı bildirimi (2026-08-25): "büyükşehirler dışında yer alan
// illerde illerin merkez belediyesi oluyor. Örnek: İl Düzce İlçe Merkez
// Burada aslında Bilgi alınan kurum ya da inceleme yapılan kurum Düzce
// Belediyesi olması gerekirken Merkez Belediyesi olarak oluşturuluyor.
// ... eğer ilçe merkez ise (İl) Belediyesi olarak belirtelim." —
// getProjectReviewDistrictText() (Belediye/Tapu Müdürlüğü/Kadastro
// Müdürlüğü gibi TÜM kurum-adlandırma metinlerinin TEK kaynağı) artık
// ilçe "Merkez" ise il adını döndürüyor. Bu test o TEK kaynak
// fonksiyonu GERÇEK haliyle (normalizeReportTitleText/toTitleCaseTr
// zincirinin AĞIR bağımlılıkları yerine hafif bir STUB ile — bu testin
// odağı "Merkez" tespiti ve il-adı ikamesi, başlık büyük/küçük harf
// biçimlendirmesi DEĞİL) test eder.

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
    if (appSource[cursor] === "(") parenDepth += 1;
    if (appSource[cursor] === ")") {
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
let state = null;
// normalizeReportTitleText()'in GERÇEK zinciri (toTitleCaseTr/
// preserveReportSpecialWords/normalizeReportWhitespace) bu testin
// odağı DEĞİL — hafif bir trim STUB'u yeterli (girdi değerleri zaten
// "Merkez"/"Düzce" gibi sade metinler, başlık biçimlendirmesi sonucu
// etkilemez).
function normalizeReportTitleText(value) { return String(value || "").trim(); }
${extractFunction("foldTurkish")}
${extractFunction("getProjectReviewDistrictText")}
return { getProjectReviewDistrictText, setState: (s) => { state = s; } };
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

// --- 1) İlçe "Merkez" ise İL adı dönmeli (büyükşehir olmayan il) --------
{
  sandbox.setState({ fields: { city: "Düzce", district: "Merkez" } });
  assert.equal(
    sandbox.getProjectReviewDistrictText(),
    "Düzce",
    "İlçe 'Merkez' ise kurum-adlandırma metni için İL adı dönmeli (ör. 'Düzce Belediyesi', 'Merkez Belediyesi' DEĞİL)."
  );
  console.log("Merkez ilce -> il adi ikamesi testi tamam.");
}

// --- 2) Buyuk/kucuk harf ve Turkce karakter farkindan bagimsiz --------
{
  sandbox.setState({ fields: { city: "Kastamonu", district: "merkez" } });
  assert.equal(sandbox.getProjectReviewDistrictText(), "Kastamonu", "Kucuk harfli 'merkez' de ayni sekilde algilanmali.");
  console.log("Merkez tespiti buyuk/kucuk harften bagimsiz testi tamam.");
}

// --- 3) titleDistrict/titleCity, district/city'den ONCELIKLI ------------
// (getProjectReviewDistrictText'in mevcut oncelik sirasi: titleDistrict ||
// district, titleCity || city - bu davranis DEGISTIRILMEDI, korunuyor.)
{
  sandbox.setState({ fields: { city: "Adres İli", titleCity: "Düzce", district: "Adres İlçesi", titleDistrict: "Merkez" } });
  assert.equal(
    sandbox.getProjectReviewDistrictText(),
    "Düzce",
    "titleDistrict 'Merkez' ise titleCity (Tapu ili) kullanilmali, adres ili degil."
  );
  console.log("titleDistrict/titleCity oncelik sirasi korunuyor testi tamam.");
}

// --- 4) Farkli (Merkez OLMAYAN) ilce - REGRESYON, degismemeli -----------
{
  sandbox.setState({ fields: { city: "Bursa", district: "Nilüfer" } });
  assert.equal(sandbox.getProjectReviewDistrictText(), "Nilüfer", "Merkez OLMAYAN ilcelerde davranis DEGISMEMELI.");
  console.log("Merkez olmayan ilce regresyon testi tamam.");
}

// --- 5) Ilce bos, sehir de bos - guvenlik agi ----------------------------
{
  sandbox.setState({ fields: { city: "", district: "" } });
  assert.equal(sandbox.getProjectReviewDistrictText(), "", "Ilce ve il bosken cokme olmadan bos donmeli.");
  console.log("Bos ilce/il guvenlik agi testi tamam.");
}

// --- 6) Ilce "Merkez" ama il de bos - Merkez'e geri dusmeli (guvenlik ---
// agi, sehir bilgisi olmadan kurum adi tamamen kaybolmasin) --------------
{
  sandbox.setState({ fields: { city: "", district: "Merkez" } });
  assert.equal(sandbox.getProjectReviewDistrictText(), "Merkez", "Il bilgisi yoksa 'Merkez' aynen donmeli (bos donup kurum adini tamamen kaybetmemeli).");
  console.log("Il bilgisi eksikken Merkez'e geri dusme guvenlik agi testi tamam.");
}

console.log("getProjectReviewDistrictText (Merkez -> il adi) testleri basarili.");
