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
assert.equal(typeof server.handleReportTemplateTokensApi, "function", "Sablon token API'si disa aktarilmamis.");
assert.equal(typeof server.handleReportTemplateRenderApi, "function", "Sunucu sablon render API'si disa aktarilmamis.");
assert.ok(
  engineSource.includes("async function fetchProtectedTemplateApi") &&
    engineSource.includes("Authorization", engineSource.indexOf("async function fetchProtectedTemplateApi")),
  "Sablon motoru sunucu API'sine Firebase yetkilendirmesiyle baglanmiyor.",
);

console.log("Sunucu tarafli banka sablonu cozumleme testi tamam.");
