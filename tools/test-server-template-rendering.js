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

console.log("Sunucu tarafli banka sablonu cozumleme testi tamam.");
