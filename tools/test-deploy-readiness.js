"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
const deploySource = fs.readFileSync(path.join(root, ".github", "workflows", "deploy.yml"), "utf8");
const manifest = fs.readFileSync(path.join(root, "deploy", "rsync-include.txt"), "utf8");
const manifestRules = manifest.split(/\r?\n/).filter((line) => line && !line.startsWith("#")).join("\n");

assert.match(serverSource, /function getReadinessStatus\(\)/, "Readiness durum üreticisi bulunmalı.");
assert.match(serverSource, /url === "\/api\/readiness"/, "Readiness ucu oturumsuz yerel kontrol için yönlendirilmeli.");
assert.match(serverSource, /readiness\.ok \? 200 : 503/, "Uyumsuz çalışma zamanı readiness başarısız sayılmalı.");
assert.match(manifest, /^\/server\.js$/m, "Sunucu manifestte olmalı.");
assert.match(manifest, /^\/templates\/\*\*\*$/m, "Rapor şablonları manifestte olmalı.");
assert.doesNotMatch(manifestRules, /server-data|backups|node_modules|docs|tools/, "İç veri/doküman/test klasörleri yayın manifestine girmemeli.");
assert.match(deploySource, /--include-from='deploy\/rsync-include\.txt'/, "Dağıtım izinli manifestten dosya seçmeli.");
assert.match(deploySource, /curl -[fsS]+ http:\/\/127\.0\.0\.1:5174\/api\/readiness/, "Dağıtım ana sayfa yerine readiness ucunu doğrulamalı.");

console.log("deploy manifest and readiness checks passed");
