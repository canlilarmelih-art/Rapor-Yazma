"use strict";

// Kullanıcı bildirimi (2026-08-12, ekran görüntüsü — 3 tarlalık değerleme):
// "Sokak / Cadde" alanı boşken (tarla/arazi gibi kırsal taşınmazlarda
// yaygın) otomatik Ulaşım Tarifi cümlesi "...taşınmazın bulunduğu
// taşınmazın bulunduğu sokak güzergahına ulaşılır..." şeklinde TEKRARLI
// çıkıyordu. Kök neden: `buildTransportDirectionText`'in yedek değeri
// ("taşınmazın bulunduğu sokak") varyant 0/2'nin ZATEN kurduğu
// "taşınmazın bulunduğu ${street}" kalıbıyla çakışıyordu.

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

function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit dizi bulunamadı: ${name}`);
  const end = appSource.indexOf("\n];", start);
  assert(end > start, `Sabit dizi kapanmadı: ${name}`);
  return appSource.slice(start, end + 3);
}

const functionNames = [
  "buildTransportDirectionText",
  "cleanupStreetName",
  "cleanupPlaceName",
  "getDirectionTextFromRoad",
  "calculateBearing",
  "getSelectedMapPoint",
  "selectVariant",
];

const sandboxSource = `
let state = { fields: {} };
${extractConstArray("transportDirectionVariants")}
${functionNames.map(extractFunction).join("\n")}
return { buildTransportDirectionText, cleanupStreetName, setState: (s) => { state = s; } };
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

const road = { name: "Bursa Ankara Karayolu", distance: 2077, lat: 40.2, lng: 29.1 };

// "Sokak / Cadde" boş (tarla/arazi tipik durum) — tekrarlı ifade OLMAMALI.
sandbox.setState({ fields: { street: "" } });
{
  const text = sandbox.buildTransportDirectionText(road);
  assert.ok(
    !/taşınmazın bulunduğu\s+taşınmazın bulunduğu/i.test(text),
    `"taşınmazın bulunduğu" tekrar etmemeli. Üretilen metin: ${text}`,
  );
  assert.match(text, /taşınmazın bulunduğu sokak güzergahına ulaşılır/, "Yedek metin tek seferlik ve doğru okunmalı.");
  console.log("Bos sokak alani - tekrarli ifade regresyon testi tamam.");
}

// Gerçek bir sokak adı varken davranış DEĞİŞMEMELİ.
sandbox.setState({ fields: { street: "Atatürk Caddesi" } });
{
  const text = sandbox.buildTransportDirectionText(road);
  assert.match(text, /taşınmazın bulunduğu Atatürk Caddesi güzergahına ulaşılır/);
  assert.ok(!text.includes("taşınmazın bulunduğu taşınmazın bulunduğu"), "Gerçek sokak adında da tekrar olmamalı.");
  console.log("Dolu sokak alani - regresyon testi tamam.");
}

// cleanupStreetName'in kendi boş-değer yedek metni de tutarlı olmalı.
assert.equal(sandbox.cleanupStreetName(""), "sokak", "cleanupStreetName boş girdide bare \"sokak\" döndürmeli (kalıp-güvenli yedek).");
console.log("cleanupStreetName bos deger yedegi testi tamam.");
