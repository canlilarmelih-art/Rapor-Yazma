"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const server = require("../server.js");

const appDir = path.join(__dirname, "..");
const templateText = fs.readFileSync(path.join(appDir, "templates", "ziraat.html"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
const tokens = server.collectTemplateTokens(templateText);

assert.ok(tokens.length > 20, "Sunucu tarafinda banka sablonu placeholder listesi okunamadi.");
assert.ok(tokens.includes("BLOCK_NO"), "BLOCK_NO placeholder'i sunucu sablon listesinde bulunamadi.");
assert.equal(server.privateTemplatePathForKey("ziraat"), path.join(appDir, "templates", "ziraat.html"));
assert.equal(server.privateTemplatePathForKey("bilinmeyen"), "", "Bilinmeyen sablon anahtari kabul edilmemeli.");

const rendered = server.renderPrivateTemplate("<!-- gizli -->{{CITY}} / {{EMPTY}} / {{MISSING}}", {
  CITY: "Bursa",
  EMPTY: "",
});
assert.equal(rendered, "Bursa /  / {{MISSING}}", "Sunucu sablon cozumlemesi alanlari veya eksik token'i bozdu.");
const derived = server.calculateServerDerivedValuation({ legalValue: "2.900.000", currentValue: "3.120.000" });
assert.equal(derived.legalUrgentSaleValue, "2.600.000 TL", "Yasal acil satis degeri sunucu kuraliyla uretilmedi.");
assert.equal(derived.currentUrgentSaleValue, "2.800.000 TL", "Mevcut acil satis degeri sunucu kuraliyla uretilmedi.");
const overridden = { LEGAL_URGENT_SALE_VALUE: "yanlis", CURRENT_URGENT_SALE_VALUE: "yanlis" };
server.applyServerDerivedValuationTokens(overridden, { legalValue: "2.900.000", currentValue: "3.120.000" });
assert.equal(overridden.LEGAL_URGENT_SALE_VALUE, "2.600.000 TL", "Sunucu turetilmis yasal degeri token'a zorlamadi.");
assert.equal(overridden.CURRENT_URGENT_SALE_VALUE, "2.800.000 TL", "Sunucu turetilmis mevcut degeri token'a zorlamadi.");
const protectedValues = {
  BINA_OTURUMU_VE_GIRIS_ACIKLAMASI: "istemci metni",
  PROJECT_SUITABILITY_DESCRIPTION: "istemci metni",
};
const protectedResolution = server.applyServerProtectedPlaceholderTokens(protectedValues, {
  buildingFootprintReference: "Bina Girişi",
  buildingEntranceLevel: "Zemin Kat",
  buildingEntranceDirection: "Kuzey",
  projectSuitabilityStatus: "mimari olarak uygun değildir.",
  projectConformity: "Balkona katılım vardır.",
  projectSuitabilitySimpleRepair: "Evet",
});
assert.match(protectedValues.BINA_OTURUMU_VE_GIRIS_ACIKLAMASI, /vaziyet planında belirtilen bina girişi/i, "Bina girişi metni sunucuda yeniden uretilmedi.");
assert.match(protectedValues.PROJECT_SUITABILITY_DESCRIPTION, /mimari olarak projesine uygun değildir/i, "Proje uygunluk metni sunucuda yeniden uretilmedi.");
assert.match(protectedValues.PROJECT_SUITABILITY_DESCRIPTION, /Basit bir tadilat ile düzeltilebilir/i, "Basit tadilat kurali sunucuda uygulanmadi.");
assert.deepEqual(protectedResolution.protectedTokens.sort(), ["BINA_OTURUMU_VE_GIRIS_ACIKLAMASI", "PROJECT_SUITABILITY_DESCRIPTION"], "Korunan placeholder listesi eksik.");
assert.equal(
  server.buildServerProjectSuitabilityDescription({
    projectSuitabilityStatus: "projeye uygunluk tespit edilmemiştir.",
    projectConformity: "Sadece kullanıcının açıklaması.",
  }),
  "Sadece kullanıcının açıklaması.",
  "Uygunluk tespit edilememişse yalnızca kullanıcı açıklaması kullanılmalı.",
);
assert.equal(typeof server.handleReportTemplateTokensApi, "function", "Sablon token API'si disa aktarilmamis.");
assert.equal(typeof server.handleReportTemplateRenderApi, "function", "Sunucu sablon render API'si disa aktarilmamis.");
assert.ok(
  engineSource.includes("async function fetchProtectedTemplateApi") &&
    engineSource.includes("Authorization", engineSource.indexOf("async function fetchProtectedTemplateApi")),
  "Sablon motoru sunucu API'sine Firebase yetkilendirmesiyle baglanmiyor.",
);
assert.ok(engineSource.includes("protectedPlaceholderInput: buildServerProtectedPlaceholderInput()"), "Korumalı placeholder ham alanları yalnızca çıktı isteğinde sunucuya gönderilmiyor.");
[
  "fillTemplate,",
  "resolveTemplateTokenValues,",
  "resolveToken,",
  "foldTokenName,",
  "_knownAliases:",
].forEach((publicDebugMember) => {
  assert.equal(
    engineSource.includes(`window.RaporTemplates = {\n    ${publicDebugMember}`),
    false,
    `Placeholder cozumleme/debug yuzeyi istemci API'sine acik olmamali: ${publicDebugMember}`,
  );
});

// Kullanıcı bildirimi (2026-08-03): "emlakkatilim" istemci TEMPLATE_REGISTRY'sine
// eklendi ama sunucunun AYRI PRIVATE_REPORT_TEMPLATES listesine eklenmediği
// için "Banka Şablonuyla Kaydet" tıklandığında "Sablon bulunamadi" hatası
// verdi — iki liste birbirinden habersiz, elle senkron tutuluyor. Bu test her
// istemci şablon anahtarının sunucuda da GERÇEK bir dosyaya karşılık geldiğini
// doğrulayarak bu sınıftaki hatanın tekrarını engeller.
const registryStart = engineSource.indexOf("const TEMPLATE_REGISTRY = [");
const registryEnd = engineSource.indexOf("\n  ];", registryStart);
assert(registryStart >= 0 && registryEnd > registryStart, "TEMPLATE_REGISTRY bulunamadi.");
const registrySlice = engineSource.slice(registryStart, registryEnd);
const clientTemplateKeys = [...registrySlice.matchAll(/key:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
assert(clientTemplateKeys.length >= 10, `Istemci sablon anahtari sayisi beklenenden az: ${clientTemplateKeys.length}`);
clientTemplateKeys.forEach((key) => {
  const filePath = server.privateTemplatePathForKey(key);
  assert(filePath, `"${key}" istemci TEMPLATE_REGISTRY'de var ama sunucunun PRIVATE_REPORT_TEMPLATES listesinde yok (server.js).`);
  assert(fs.existsSync(filePath), `"${key}" icin sunucu sablon yolu diskte yok: ${filePath}`);
});

// --- Cumle-varyanti senkronu: sunucu ile istemci AYNI varyanti secmeli ----
// Kullanici bildirimi/onceki oturum notu: buildProjectSuitabilityStatusSentence()
// istemcide (app.js) cumle varyantlarina bagli, ama korumali placeholder
// (PROJECT_SUITABILITY_DESCRIPTION/BINA_OTURUMU_VE_GIRIS_ACIKLAMASI) export
// sirasinda SUNUCUDA (server.js) YENIDEN URETILIYOR — ikisi ayni algoritma/
// veriyi kullanmazsa export edilen banka sablonu ekrandaki onizlemeden FARKLI
// metin gosterir. Bu blok, gercek istemci kaynagindan (vm ile izole)
// buildProjectSuitabilityStatusSentence()'i CALISTIRIR ve cok sayida
// reportId/durum kombinasyonu icin sunucunun buildServerProjectSuitabilityDescription()
// ile BIREBIR AYNI metni urettigini dogrular.
{
  const vmModule = require("node:vm");
  const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
  const foldSrc = (() => {
    const s = appSource.indexOf("function foldTurkish(");
    const e = appSource.indexOf("\n}", s) + 2;
    return appSource.slice(s, e);
  })();

  function sliceFn2(marker) {
    const s = appSource.indexOf(marker);
    assert(s >= 0, `Bulunamadi: ${marker}`);
    const e = appSource.indexOf("\n}", s) + 2;
    return appSource.slice(s, e);
  }

  const hashSrc = sliceFn2("function hashVariantSeedText(");
  const getVariantSelectionSeedIdSrc = sliceFn2("function getVariantSelectionSeedId(");
  const getAutoVariantIndexSrc = sliceFn2("function getAutoVariantIndex(");
  const selectVariantSrc = sliceFn2("function selectVariant(");
  const variantsStart = appSource.indexOf("const projectSuitabilityStatusVariants");
  const variantsEnd = appSource.indexOf("function buildProjectSuitabilityBuildingReferenceSentence", variantsStart);
  assert(variantsStart >= 0 && variantsEnd > variantsStart, "Proje uygunluk varyant blogu bulunamadi.");
  const variantsAndFnSrc = appSource.slice(variantsStart, variantsEnd);

  function runClient(reportId, status, note, repair) {
    const context = {
      state: { reportId, fields: {} },
      foldTurkish: undefined, // asagida gercek kaynaktan yuklenecek
      normalizeReportDescriptionText: (value) => String(value || "").replace(/\s+/g, " ").trim(),
      normalizeYesNoChoice: (value) => {
        const folded = String(value || "").trim().toLocaleUpperCase("tr-TR")
          .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
          .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C");
        if (/^(EVET|VAR|YES|TRUE|1)$/.test(folded)) return "Evet";
        if (/^(HAYIR|YOK|NO|FALSE|0)$/.test(folded)) return "Hayır";
        return "";
      },
      stripProjectSuitabilityRepairSentence: (value) => String(value || "").trim(),
      shouldShowProjectSuitabilityRepair: (value) => {
        const key = String(value || "").trim().toLocaleUpperCase("tr-TR").replaceAll(".", "")
          .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
          .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C");
        return [
          "MIMARI OLARAK UYGUN DEGILDIR",
          "KULLANIM ALANI OLARAK UYGUN DEGILDIR",
          "KULLANIM ALANI VE MIMARI OLARAK UYGUN DEGILDIR",
        ].includes(key);
      },
      projectSuitabilityStatusKey: (value) => String(value || "").trim().toLocaleUpperCase("tr-TR").replaceAll(".", "")
        .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
        .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C"),
      registerVariantGroup: () => {},
    };
    vmModule.runInNewContext(foldSrc, context);
    vmModule.runInNewContext(hashSrc, context);
    vmModule.runInNewContext(getVariantSelectionSeedIdSrc, context);
    vmModule.runInNewContext(getAutoVariantIndexSrc, context);
    vmModule.runInNewContext(selectVariantSrc, context);
    vmModule.runInNewContext(variantsAndFnSrc, context);
    return context.buildProjectSuitabilityStatusSentence(status, note, repair, "");
  }

  const scenarios = [
    { reportId: "RE-2026-000001", status: "uygundur.", note: "", repair: "" },
    { reportId: "RE-2026-000002", status: "blok bazında konum olarak uygun değildir.", note: "Not.", repair: "" },
    { reportId: "RE-2026-000123", status: "mimari olarak uygun değildir.", note: "Balkona katılım vardır.", repair: "Evet" },
    { reportId: "RE-2026-999999", status: "kullanım alanı olarak uygun değildir.", note: "", repair: "Hayır" },
    { reportId: "RE-2027-000042", status: "kullanım alanı ve mimari olarak uygun değildir.", note: "Notlar.", repair: "Evet" },
    { reportId: "RE-2026-777777", status: "trampa", note: "", repair: "" },
    { reportId: "RE-2026-000001", status: "", note: "", repair: "" }, // bos -> UYGUNDUR
  ];
  scenarios.forEach(({ reportId, status, note, repair }) => {
    const clientText = runClient(reportId, status, note, repair);
    const serverText = server.buildServerProjectSuitabilityDescription({
      projectSuitabilityStatus: status,
      projectConformity: note,
      projectSuitabilitySimpleRepair: repair,
      variantSeed: reportId,
    });
    assert.equal(
      serverText,
      clientText,
      `Sunucu ve istemci varyant secimi uyusmuyor (reportId=${reportId}, status="${status}"): sunucu="${serverText}" istemci="${clientText}"`
    );
  });

  // variantSeed bos ise (rapor henuz kaydedilmemis) sunucu HER ZAMAN index 0
  // (orijinal metin) uretmeli — istemcinin oturum-ici rastgele variantSeed'i
  // sunucuya hic gonderilmedigi icin bu guvenli/deterministik varsayilandir.
  const noSeedText = server.buildServerProjectSuitabilityDescription({
    projectSuitabilityStatus: "mimari olarak uygun değildir.",
    projectConformity: "",
    projectSuitabilitySimpleRepair: "",
    variantSeed: "",
  });
  assert.equal(
    noSeedText,
    "Ekspertize konu bağımsız bölüm vaziyet planına göre blok bazında konum, kat, kattaki konum ve kullanım alanı olarak projesine uygun olup, mimari olarak projesine uygun değildir.",
    "variantSeed bosken sunucu orijinal (index 0) metni uretmeli."
  );

  // Admin manuel override — sunucu da override'i istemciyle AYNI sekilde
  // (otomatik hesaplamanin ONUNE gecerek) uygulamali.
  const overriddenText = server.buildServerProjectSuitabilityDescription({
    projectSuitabilityStatus: "uygundur.",
    projectConformity: "",
    projectSuitabilitySimpleRepair: "",
    variantSeed: "RE-2026-000001",
    variantOverrides: { "buildProjectSuitabilityStatusSentence:UYGUNDUR": 2 },
  });
  assert.equal(
    overriddenText,
    "Söz konusu bağımsız bölümün kat, konum, alan ve mimari özellikleri onaylı projeyle uyumludur.",
    "Admin override sunucu tarafinda uygulanmadi."
  );

  console.log("Sunucu/istemci cumle-varyanti senkronu testi tamam.");
}

console.log("Sunucu tarafli banka sablonu cozumleme testi tamam.");
