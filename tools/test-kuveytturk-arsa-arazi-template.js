"use strict";

// Kuveyt Türk arsa/arazi banka şablonu (0.0.42x, 2026-08-13): kullanıcı
// INVEX portalının arsa/arazi ekranlarını 3 ekran görüntüsüyle gönderdi ve
// "konut raporlarına göre değişiklik olan kısımları" içeren yeni bir şablon
// istedi. Bu test, templates/ziraat-arsa-arazi.html emsalindeki iki-registry
// (TEMPLATE_REGISTRY + PRIVATE_REPORT_TEMPLATES) senkronunu ve otomatik
// varyant seçim mekanizmasının (defaultTemplateKeyForBank/
// resolveTemplateKeyForExport) yeni "kuveytturk-arsa-arazi" anahtarı için de
// doğru çalıştığını doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
const serverSource = fs.readFileSync(path.join(appDir, "server.js"), "utf8");
const templatePath = path.join(appDir, "templates", "kuveytturk-arsa-arazi.html");
const templateSource = fs.readFileSync(templatePath, "utf8");

// --- 1) TEMPLATE_REGISTRY girdisi doğru şekilde tanımlı mı? -----------------
const registryStart = engineSource.indexOf("const TEMPLATE_REGISTRY = [");
const registryEnd = engineSource.indexOf("\n  ];", registryStart);
assert(registryStart >= 0 && registryEnd > registryStart, "TEMPLATE_REGISTRY bulunamadi.");
const registrySlice = engineSource.slice(registryStart, registryEnd);

const kuveytEntryMatch = registrySlice.match(/\{\s*key:\s*"kuveytturk-arsa-arazi"[^}]*\}/);
assert(kuveytEntryMatch, "TEMPLATE_REGISTRY icinde kuveytturk-arsa-arazi girdisi bulunamadi.");
const kuveytEntryText = kuveytEntryMatch[0];
assert.match(kuveytEntryText, /file:\s*"templates\/kuveytturk-arsa-arazi\.html"/, "Dosya yolu yanlis.");
assert.match(kuveytEntryText, /variant:\s*"arsa-arazi"/, "variant: \"arsa-arazi\" isaretlenmemis.");
assert.match(kuveytEntryText, /hiddenFromList:\s*true/, "hiddenFromList: true olmali (acilir listede ayri gorunmemeli).");
assert.match(kuveytEntryText, /bank:\s*"Kuveyt Türk Katılım Bankası A\.Ş\."/, "Banka adi konut varyantiyla birebir eslesmiyor.");

const konutEntryMatch = registrySlice.match(/\{\s*key:\s*"kuveytturk"[^}]*\}/);
assert(konutEntryMatch, "TEMPLATE_REGISTRY icinde konut kuveytturk girdisi bulunamadi.");
assert.match(konutEntryMatch[0], /bank:\s*"Kuveyt Türk Katılım Bankası A\.Ş\."/, "Konut varyanti banka adi degismis (arsa-arazi eslesmesi kirilir).");

console.log("TEMPLATE_REGISTRY kuveytturk-arsa-arazi girdisi testi tamam.");

// --- 2) server.js PRIVATE_REPORT_TEMPLATES ile senkron mu? -----------------
assert.match(
  serverSource,
  /"kuveytturk-arsa-arazi":\s*"kuveytturk-arsa-arazi\.html"/,
  "server.js PRIVATE_REPORT_TEMPLATES icinde kuveytturk-arsa-arazi eslemesi yok."
);
assert(fs.existsSync(templatePath), "templates/kuveytturk-arsa-arazi.html diskte yok.");

console.log("server.js PRIVATE_REPORT_TEMPLATES senkron testi tamam.");

// --- 3) Otomatik varyant secimi: defaultTemplateKeyForBank / -----------------
//        resolveTemplateKeyForExport gercek kaynaktan calistirilir.
function sliceFn(source, marker) {
  const s = source.indexOf(marker);
  assert(s >= 0, `Bulunamadi: ${marker}`);
  const e = source.indexOf("\n  }", s) + 4;
  return source.slice(s, e);
}

const context = {
  TEMPLATE_REGISTRY: [
    { key: "kuveytturk", file: "templates/kuveytturk.html", bank: "Kuveyt Türk Katılım Bankası A.Ş." },
    { key: "kuveytturk-arsa-arazi", file: "templates/kuveytturk-arsa-arazi.html", bank: "Kuveyt Türk Katılım Bankası A.Ş.", variant: "arsa-arazi", hiddenFromList: true },
    { key: "ziraat", file: "templates/ziraat.html", bank: "T.C. Ziraat Bankası A.Ş." },
    { key: "ziraat-arsa-arazi", file: "templates/ziraat-arsa-arazi.html", bank: "T.C. Ziraat Bankası A.Ş.", variant: "arsa-arazi", hiddenFromList: true },
    { key: "halkbank", file: "templates/halkbank.html", bank: "Türkiye Halk Bankası A.Ş." },
  ],
};
vm.createContext(context);
vm.runInContext(sliceFn(engineSource, "function defaultTemplateKeyForBank("), context);
vm.runInContext(sliceFn(engineSource, "function resolveTemplateKeyForExport("), context);

assert.equal(
  context.defaultTemplateKeyForBank("Kuveyt Türk Katılım Bankası A.Ş.", true),
  "kuveytturk-arsa-arazi",
  "Arsa/Arazi mulkiyetinde Kuveyt Turk icin arsa-arazi varyanti secilmedi."
);
assert.equal(
  context.defaultTemplateKeyForBank("Kuveyt Türk Katılım Bankası A.Ş.", false),
  "kuveytturk",
  "Konut mulkiyetinde Kuveyt Turk icin konut varyanti secilmedi."
);
assert.equal(
  context.resolveTemplateKeyForExport("kuveytturk", true),
  "kuveytturk-arsa-arazi",
  "resolveTemplateKeyForExport('kuveytturk', true) arsa-arazi anahtarina yonlendirmedi."
);
assert.equal(
  context.resolveTemplateKeyForExport("kuveytturk", false),
  "kuveytturk",
  "resolveTemplateKeyForExport('kuveytturk', false) konut anahtarini bozdu."
);
assert.equal(
  context.resolveTemplateKeyForExport("kuveytturk-arsa-arazi", false),
  "kuveytturk",
  "Kullanici arsa-arazi anahtarini secip mulkiyeti sonradan konuta cevirirse konut varyantina donmeli."
);
// Banka-bagimsiz sablonlar (bank alani bos/yok) etkilenmemeli.
assert.equal(
  context.resolveTemplateKeyForExport("halkbank", true),
  "halkbank",
  "Tek varyantli banka sablonu (Halkbank) yanlislikla degistirildi."
);

console.log("Otomatik arsa-arazi varyant secimi (defaultTemplateKeyForBank/resolveTemplateKeyForExport) testi tamam.");

// --- 4) Yeni sablonun arazi-ozgu placeholder'lari icerdigini dogrula --------
[
  "ARSA BİLGİLERİ",
  "{{LAND_SHAPE}}",
  "{{LAND_ROAD_FRONTAGE}}",
  "{{LAND_CLASSIFICATION}}",
  "{{LAND_AGRICULTURAL_PRODUCT}}",
  "{{LAND_USAGE_SHAPE_TEXT}}",
  "{{LAND_USAGE_PURPOSE_TEXT}}",
  "{{LAND_DEVELOPMENT_OBSTACLE_TEXT}}",
  "{{LAND_INFRASTRUCTURE_TOPOGRAPHY_TEXT}}",
  "{{LAND_FRONTAGE_DEPTH_TEXT}}",
  "{{LAND_BOUNDARY_STATUS_TEXT}}",
  "{{ACTUAL_USE_PURPOSE}}",
  "TİCARİ FİYAT ENDEKSİ ÖZELLİKLERİ",
  "{{GABIM_TRANSPORTATION}}",
  "{{GABIM_ROAD_FRONTAGE}}",
  "{{GABIM_LAND_SLOPE}}",
  "{{GABIM_ARABLE_SOIL}}",
  "{{GABIM_AGRICULTURE_TYPE}}",
  "{{GABIM_MAJOR_INVESTMENT}}",
  "{{GABIM_BRANDED_HOUSING}}",
  "{{GABIM_DEVELOPMENT_SPEED}}",
  "{{GABIM_COMMERCIAL_SPEED}}",
  "{{GABIM_INDUSTRIALIZATION_SPEED}}",
  "{{GABIM_TOURISM_POTENTIAL}}",
  "{{GABIM_PREFERRED_USE}}",
  "{{ALTYAPI}}",
].forEach((needle) => {
  assert(templateSource.includes(needle), `kuveytturk-arsa-arazi.html icinde beklenen icerik yok: ${needle}`);
});
// Bina/bagimsiz bolume ozgu (arazide karsiligi olmayan) bolumler kaldirilmis
// olmali — yalnizca aciklayici HTML yorumunda gecmesi (neden kaldirildigini
// belgelemek icin) sorun degil, bu yuzden baslik/etiket HALINDE aranir.
["<div class=\"kt-sec\">GAYRİMENKULÜN TEKNİK ÖZELLİKLERİ</div>", "{{UNİT_VİEW_STATUS}}", "{{FACADES}}", "{{ELEVATOR}}", "{{CARPARK}}", "<div class=\"kt-sec\">ENERJİ KİMLİK BİLGİSİ</div>"].forEach((needle) => {
  assert(!templateSource.includes(needle), `kuveytturk-arsa-arazi.html hala bina-ozgu icerik barindiriyor: ${needle}`);
});

// Kullanici geri bildirimi (2026-08-13): 6 alt-alan basta ayri "kt-subsec"
// basligi + alt paragraf olarak eklenmisti, gercek export'ta bos/kopuk
// gorundu — kullanici digerleri gibi "Etiket: Kutu" tablo satiri istedi.
// Artik tumu AYNI <table class="kt-form"> icinde <tr><td class="l">...
// <td class="v">{{TOKEN}}</td></tr> seklinde olmali; ayri "kt-subsec"
// basligi KALMAMALI.
[
  "Halihazırdaki Kullanım Şekli", "Halihazırdaki Kullanım Amacı",
  "Yapılaşmaya Engel Teşkil Edebilecek Unsurlar", "Parselin Alt Yapısı ve Topografik Durumu",
  "Parselin Cephe ve Derinlik Bilgileri", "Parselin Sınırlarının Durumu",
].forEach((label) => {
  assert(
    !templateSource.includes(`<div class="kt-subsec">${label}</div>`),
    `"${label}" hala ayri bir kt-subsec basligi olarak duruyor — tablo satirina cevrilmemis.`
  );
});
[
  ['Halihazırdaki Kullanım Şekli:', "{{LAND_USAGE_SHAPE_TEXT}}"],
  ['Halihazırdaki Kullanım Amacı:', "{{LAND_USAGE_PURPOSE_TEXT}}"],
  ['Yapılaşmaya Engel Teşkil Edebilecek Unsurlar:', "{{LAND_DEVELOPMENT_OBSTACLE_TEXT}}"],
  ['Parselin Alt Yapısı ve Topografik Durumu:', "{{LAND_INFRASTRUCTURE_TOPOGRAPHY_TEXT}}"],
  ['Parselin Cephe ve Derinlik Bilgileri:', "{{LAND_FRONTAGE_DEPTH_TEXT}}"],
  ['Parselin Sınırlarının Durumu:', "{{LAND_BOUNDARY_STATUS_TEXT}}"],
].forEach(([label, token]) => {
  assert(
    templateSource.includes(`<tr><td class="l">${label}</td><td class="v">${token}</td></tr>`),
    `"${label}" / ${token} artik diger satirlarla ayni "Etiket: Kutu" tablo satiri biciminde degil.`
  );
});

console.log("kuveytturk-arsa-arazi.html arazi-ozgu placeholder icerigi testi tamam.");
console.log("ARSA BİLGİLERİ 6 alt-alani tablo-satiri (Etiket: Kutu) bicimi testi tamam.");

// --- 4b) 6 token'in export-taze fallback'i: LEGACY_ALIASES'te field() -----
//         (kayitli/elle duzenlenmis deger) once, bos ise safeCall(build...)
//         (mevcut alan durumundan canli hesaplama) sonra denenmeli — boylece
//         bu ozellik EKLENMEDEN ONCE doldurulmus var olan taslaklarda da
//         export'ta bos kalmaz (kullanici bildirimi: "template bu sekilde
//         cikti ... karsilarinda cumle seklinde yazmali").
[
  ["LANDUSAGESHAPETEXT", "landUsageShapeText", "buildLandUsageShapeSentence"],
  ["LANDUSAGEPURPOSETEXT", "landUsagePurposeText", "buildLandUsagePurposeSentence"],
  ["LANDDEVELOPMENTOBSTACLETEXT", "landDevelopmentObstacleText", "buildLandDevelopmentObstacleSentence"],
  ["LANDINFRASTRUCTURETOPOGRAPHYTEXT", "landInfrastructureTopographyText", "buildLandInfrastructureTopographySentence"],
  ["LANDFRONTAGEDEPTHTEXT", "landFrontageDepthText", "buildLandFrontageDepthSentence"],
  ["LANDBOUNDARYSTATUSTEXT", "landBoundaryStatusText", "buildLandBoundaryStatusSentence"],
].forEach(([aliasKey, fieldKey, builderFnName]) => {
  const re = new RegExp(
    `${aliasKey}:\\s*\\{\\s*fn:\\s*\\(\\)\\s*=>\\s*field\\("${fieldKey}"\\)\\s*\\|\\|\\s*safeCall\\("${builderFnName}"\\)\\s*\\}`
  );
  assert(re.test(engineSource), `LEGACY_ALIASES icinde ${aliasKey} icin field()||safeCall() geri-dususu bulunamadi.`);
});

console.log("LAND_*_TEXT token'lari icin export-taze fallback (field()||safeCall()) kablolamasi testi tamam.");

// --- 5) LAND_* token'larinin gercekten field-fold ile cozulecegi field --------
//        anahtarlari app.js'te hala mevcut mu (isim degisirse sessizce
//        bosa duser).
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const kuveytturkKonutTemplate = fs.readFileSync(path.join(appDir, "templates", "kuveytturk.html"), "utf8");
[
  "{{LEGAL_BUILDING_VALUE_AREA}}",
  "{{LEGAL_BUILDING_AREA_DISTRIBUTION}}",
  "{{CURRENT_BUILDING_VALUE_AREA}}",
  "{{CURRENT_BUILDING_AREA_DISTRIBUTION}}",
].forEach((token) => {
  assert(kuveytturkKonutTemplate.includes(token), `kuveytturk.html icinde kat/alan token'i eksik: ${token}`);
});
assert.match(engineSource, /LEGALBUILDINGAREADISTRIBUTION:\s*\{\s*fn:/, "Yasal kat alan dağılımı alias'ı eksik.");
assert.match(engineSource, /CURRENTBUILDINGAREADISTRIBUTION:\s*\{\s*fn:/, "Mevcut kat alan dağılımı alias'ı eksik.");
[
  "landShape", "landRoadFrontage", "landClassification", "landAgriculturalProduct",
  "landUsageShapeText", "landUsagePurposeText", "landDevelopmentObstacleText",
  "landInfrastructureTopographyText", "landFrontageDepthText", "landBoundaryStatusText",
].forEach((key) => {
  assert(
    new RegExp(`key:\\s*"${key}"`).test(appSource),
    `app.js icinde "${key}" alan anahtari bulunamadi (LAND_* placeholder'lari bosa dusebilir).`
  );
});
// 6 yeni alan, kullanicinin "otomatik uret" tercihiyle (2026-08-13) KENDI
// AYRI tetikleme setinden (landDescriptionAutoRefreshFields'ten BAGIMSIZ,
// landNote'un mevcut davranisini bozmamak icin) otomatik uretiliyor olmali.
const detailAutoRefreshStart = appSource.indexOf("const landDetailTextAutoRefreshFields = new Set([");
const detailAutoRefreshEnd = appSource.indexOf("]);", detailAutoRefreshStart);
assert(detailAutoRefreshStart >= 0 && detailAutoRefreshEnd > detailAutoRefreshStart, "landDetailTextAutoRefreshFields bulunamadi.");
const detailAutoRefreshSlice = appSource.slice(detailAutoRefreshStart, detailAutoRefreshEnd);
["landTopography", "landRoadFrontage", "landBoundaryElement", "landClassification", "landAgriculturalProduct", "infrastructureLevel"].forEach((key) => {
  assert(detailAutoRefreshSlice.includes(`"${key}"`), `"${key}" landDetailTextAutoRefreshFields icinde yok — ilgili alan degisince yeni metinler yenilenmez.`);
});
// refreshLandDescriptionFromCurrentFields (landNote'u besleyen mevcut
// fonksiyon) yeni fonksiyonu KENDI govdesinin icinde, erken-cikis
// kontrolunden ONCE cagirmali — aksi halde landDescriptionAutoRefreshFields
// setinde OLMAYAN bir alan (ör. infrastructureLevel) degistiginde 6 yeni
// alan hic yenilenmez.
{
  const refreshFnSrc = extractFnBody(appSource, "refreshLandDescriptionFromCurrentFields");
  assert(refreshFnSrc, "refreshLandDescriptionFromCurrentFields bulunamadi.");
  const callIndex = refreshFnSrc.indexOf("refreshLandDetailTextFieldsFromCurrentFields(changedKey);");
  const gateIndex = refreshFnSrc.indexOf("if (changedKey && !landDescriptionAutoRefreshFields.has(changedKey)) return;");
  assert(callIndex >= 0, "refreshLandDescriptionFromCurrentFields artik refreshLandDetailTextFieldsFromCurrentFields'i cagirmiyor.");
  assert(gateIndex >= 0, "erken-cikis kontrolu bulunamadi (kaynak degismis olabilir).");
  assert(callIndex < gateIndex, "yeni fonksiyon erken-cikistan SONRA cagriliyor — landDescriptionAutoRefreshFields disindaki tetikleyiciler (infrastructureLevel gibi) calismaz.");
}

function extractFnBody(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return source.slice(start, i);
}

console.log("LAND_* placeholder field-anahtari ve otomatik-uretim kablolamasi testi tamam.");

// --- 6) 6 yeni cumle-uretim fonksiyonu GERCEK KAYNAKTAN calistirilip -------
//        anlamli metin urettigi dogrulanir (sadece "var/yok" degil, ic
//        icerik). Bagimlilik agaci genis oldugu icin (buildLandAgricultural
//        ProductSentence -> shouldHideLandAgricultureControls -> ... vb.)
//        elle tek tek listelemek yerine KAPANIS (transitive closure) ile
//        toplanir: bir fonksiyonun govdesinde gecen ve app.js'te tanimli
//        her isim otomatik olarak da yuklenir.
{
  const vmModule = require("node:vm");

  function extractFunctionSource(name) {
    const marker = `function ${name}(`;
    const start = appSource.indexOf(marker);
    if (start < 0) return null;
    const braceStart = appSource.indexOf("{", start);
    let depth = 0;
    let i = braceStart;
    for (; i < appSource.length; i++) {
      if (appSource[i] === "{") depth++;
      else if (appSource[i] === "}") {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    return appSource.slice(start, i);
  }

  function collectClosure(rootNames) {
    const collected = new Map();
    const queue = [...rootNames];
    while (queue.length) {
      const name = queue.shift();
      if (collected.has(name)) continue;
      const src = extractFunctionSource(name);
      if (!src) continue;
      collected.set(name, src);
      const calls = new Set([...src.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)].map((m) => m[1]));
      calls.forEach((c) => { if (c !== name && !collected.has(c)) queue.push(c); });
    }
    return collected;
  }

  const closure = collectClosure([
    "buildLandUsageShapeSentence",
    "buildLandUsagePurposeSentence",
    "buildLandDevelopmentObstacleSentence",
    "buildLandInfrastructureTopographySentence",
    "buildLandFrontageDepthSentence",
    "buildLandBoundaryStatusSentence",
    "refreshLandDetailTextFieldsFromCurrentFields",
  ]);
  assert(closure.size >= 6, `Kapanis beklenenden kucuk (${closure.size}) — kaynak taramasi calismamis olabilir.`);

  function makeContext() {
    const context = {
      state: { fields: {} },
      document: { querySelector: () => null },
      markFieldSourceState: () => {},
      MinimumAgriculturalParcelSizes: [
        { city: "Bursa", district: "Nilüfer", suluM2: 20000, kuruM2: 40000, dikiliM2: 5000 },
      ],
      console,
    };
    vmModule.createContext(context);
    // refreshLandDetailTextFieldsFromCurrentFields disaridaki
    // landDetailTextAutoRefreshFields Set'ine bagli — fonksiyon-govdesi
    // taramasi bunu yakalamaz (const bildirimi), o yuzden ayrica yuklenir.
    vmModule.runInContext(
      appSource.slice(detailAutoRefreshStart, detailAutoRefreshEnd + "]);".length),
      context
    );
    closure.forEach((src) => { try { vmModule.runInContext(src, context); } catch { /* bagimli olmayan yardimci atlanir */ } });
    return context;
  }

  // Senaryo A: kuru tarim arazisi, yol cephesi yok, cok egimli, sinir unsuru
  // yok, siniflandirma dolu, altyapi dolu, minimum parsel altinda.
  {
    const ctx = makeContext();
    ctx.state.fields = {
      ownershipType: "Tarla",
      landAgricultureType: "Kuru Tarım",
      landAgriculturalProduct: "Hayır",
      landRoadFrontage: "Hayır",
      landTopography: "Çok eğimli",
      landBoundaryElement: "Hayır",
      landClassification: "Mutlak Tarım Arazisi",
      infrastructureLevel: "Yeterli",
      landArea: "1000",
      titleCity: "Bursa",
      titleDistrict: "Nilüfer",
    };
    const usageShape = ctx.buildLandUsageShapeSentence();
    assert.match(usageShape, /zirai ürün bulunmamak/, "Kullanim Sekli cumlesi (urun yok) uretilmedi.");
    assert.match(usageShape, /kuru tarım arazisi/, "Kullanim Sekli cumlesinde kuru tarim niteligi yok.");
    assert.match(ctx.buildLandUsagePurposeSentence(), /Mutlak Tarım Arazisi/, "Kullanim Amaci cumlesinde siniflandirma yok.");
    const obstacle = ctx.buildLandDevelopmentObstacleSentence();
    assert.match(obstacle, /cephesinin bulunmaması/, "Engel cumlesinde yol cephesi yoklugu yok.");
    assert.match(obstacle, /çok eğimli/, "Engel cumlesinde egim uyarisi yok.");
    assert.match(obstacle, /karşılamamaktadır/, "Engel cumlesinde minimum parsel uyarisi yok (1000 m2 < 40000 m2 olmali).");
    const infra = ctx.buildLandInfrastructureTopographySentence();
    assert.match(infra, /çok eğimli zemin/, "Alt yapi/topografya cumlesinde topografya yok.");
    assert.match(infra, /altyapı seviyesi yeterli/, "Alt yapi/topografya cumlesinde altyapi seviyesi yok.");
    assert.equal(ctx.buildLandFrontageDepthSentence(), "Konu parselin kadastro yoluna veya imar yoluna cephesi bulunmamaktadır.", "Cephe/derinlik cumlesi yol-cephesi-yok metniyle eslesmiyor.");
    assert.equal(ctx.buildLandBoundaryStatusSentence(), "Parsel sınırlarını arazide belirgin şekilde gösteren çit, duvar, tel örgü vb. herhangi bir unsur bulunmamaktadır.", "Sinir durumu cumlesi sinir-unsuru-yok metniyle eslesmiyor.");
  }

  // Senaryo B: veri neredeyse tamamen bos (Arsa - tarim disi) -> tum
  // cumleler "" donmeli (uydurma varsayilan metin OLMAMALI).
  {
    const ctx = makeContext();
    ctx.state.fields = { ownershipType: "Arsa" };
    assert.equal(ctx.buildLandUsageShapeSentence(), "", "Bos veride Kullanim Sekli cumlesi bos donmedi.");
    assert.equal(ctx.buildLandUsagePurposeSentence(), "", "Bos veride Kullanim Amaci cumlesi bos donmedi.");
    assert.equal(ctx.buildLandDevelopmentObstacleSentence(), "", "Bos veride Engel cumlesi bos donmedi (uydurma olmamali).");
    assert.equal(ctx.buildLandInfrastructureTopographySentence(), "", "Bos veride Alt yapi/topografya cumlesi bos donmedi.");
    assert.equal(ctx.buildLandFrontageDepthSentence(), "", "Bos veride Cephe/derinlik cumlesi bos donmedi.");
    assert.equal(ctx.buildLandBoundaryStatusSentence(), "", "Bos veride Sinir durumu cumlesi bos donmedi.");
  }

  // Senaryo C: refreshLandDetailTextFieldsFromCurrentFields gate kontrolu —
  // set icinde OLMAYAN bir changedKey ile cagrilirsa hicbir alani yazmamali.
  {
    const ctx = makeContext();
    ctx.state.fields = {
      ownershipType: "Tarla",
      landBoundaryElement: "Hayır",
    };
    ctx.refreshLandDetailTextFieldsFromCurrentFields("someUnrelatedField");
    assert.equal(ctx.state.fields.landBoundaryStatusText, undefined, "Set disi bir changedKey ile refresh yine de yazdi (gate calismiyor).");
    ctx.refreshLandDetailTextFieldsFromCurrentFields("landBoundaryElement");
    assert.equal(ctx.state.fields.landBoundaryStatusText, "Parsel sınırlarını arazide belirgin şekilde gösteren çit, duvar, tel örgü vb. herhangi bir unsur bulunmamaktadır.", "Set icindeki changedKey ile refresh dogru alani yazmadi.");
  }

  console.log("Otomatik-uretim (buildLand*Sentence + refreshLandDetailTextFieldsFromCurrentFields) gercek-kaynak testi tamam.");
}

console.log("Kuveyt Turk arsa/arazi sablonu testleri basarili.");
