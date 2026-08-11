"use strict";

// Kullanıcı bildirimi (2026-08-12): "Dosya ve Rapor" kısmında önce TAKBİS
// sonra İmar Durumu PDF yüklenince "Hesaplanan Emsal" hesaplanıyor, ama önce
// İmar sonra TAKBİS yüklenince hesaplanmıyor — yükleme sırasının önemi
// olmamalı.
//
// Kök neden: `applyImarFieldsToReport`, `calculatedEmsal`'i İmar PDF
// işlenirken TEK SEFERLİK hesaplıyor (`buildImarCalculatedEmsal`, o an
// `state.fields.landArea`'ya bakar). landArea (Ana taşınmaz yüzölçümü)
// TAKBİS'ten gelir — İmar TAKBİS'ten ÖNCE işlenirse landArea henüz boştur,
// hesap boş kalır ve bir daha ASLA yeniden tetiklenmezdi (`applyImarFieldsToReport`
// yalnızca kendi işlendiği anda çalışır, `applyTakbisTitleFieldsToReport`
// calculatedEmsal'i hiç bilmiyordu).
//
// Düzeltme: `applyTakbisTitleFieldsToReport`, landArea'yı set ettikten sonra
// `refreshPlanningNoteFromCurrentFields("landArea")` çağırıyor — bu,
// planningNoteAutoRefreshFields'te zaten var olan "landArea" tetikleyicisini
// kullanarak calculatedEmsal'i GÜNCEL state.fields ile yeniden hesaplıyor
// (İmar henüz hiç işlenmediyse no-op, zaten boş kalır).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// 1) Kaynak-düzeyi doğrulama: tetikleyici gerçekten kablolanmış mı?
const applyTakbisStart = appSource.indexOf("\nfunction applyTakbisTitleFieldsToReport(");
assert(applyTakbisStart >= 0, "applyTakbisTitleFieldsToReport bulunamadı.");
const applyTakbisEnd = appSource.indexOf("\nfunction syncAddressBlockFromTakbis(", applyTakbisStart);
assert(applyTakbisEnd > applyTakbisStart, "applyTakbisTitleFieldsToReport govdesi bulunamadi.");
const applyTakbisBody = appSource.slice(applyTakbisStart, applyTakbisEnd);
assert.match(
  applyTakbisBody,
  /refreshPlanningNoteFromCurrentFields\(\s*"landArea"\s*\)/,
  "applyTakbisTitleFieldsToReport artık landArea set edildikten sonra " +
    "refreshPlanningNoteFromCurrentFields(\"landArea\") çağırmalı — aksi halde " +
    "İmar TAKBİS'ten önce işlendiğinde Hesaplanan Emsal yeniden tetiklenmez.",
);
assert.match(
  appSource,
  /planningNoteAutoRefreshFields\s*=\s*new Set\(\[[\s\S]*?"landArea"[\s\S]*?\]\)/,
  "\"landArea\" planningNoteAutoRefreshFields kümesinden çıkarılmış — " +
    "refreshPlanningNoteFromCurrentFields(\"landArea\") artık no-op olur.",
);

// 2) Davranış testi: buildImarCalculatedEmsal, İmar önce işlenip landArea
// SONRADAN geldiğinde (tıpkı düzeltmenin simüle ettiği gibi) doğru sonucu
// üretiyor mu?
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

const functionNames = [
  "buildImarCalculatedEmsal",
  "composeImarCalculatedEmsal",
  "firstFilled",
  "normalizeYesNoChoice",
  "parseReportNumber",
  "formatImarSquareMeter",
  "foldTurkish",
];

const sandboxSource = `
let state = { fields: {} };
${functionNames.map(extractFunction).join("\n")}
return { buildImarCalculatedEmsal, setState: (s) => { state = s; } };
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

// İmar PDF ÖNCE işlendi: kaks var, landArea (henüz TAKBİS gelmedi) YOK.
sandbox.setState({ fields: { kaks: "1.50" } });
assert.equal(
  sandbox.buildImarCalculatedEmsal(),
  "",
  "landArea yokken Hesaplanan Emsal boş dönmeli (hata fırlatmamalı).",
);

// TAKBİS SONRA işlendi: landArea artık state.fields'ta. Düzeltme, tam bu
// anda buildImarCalculatedEmsal()'i (mevcut state.fields ile) yeniden
// çağırıyor.
sandbox.setState({ fields: { kaks: "1.50", landArea: "500" } });
assert.equal(
  sandbox.buildImarCalculatedEmsal(),
  "750 m²",
  "landArea sonradan gelince Hesaplanan Emsal (kaks × alan) doğru hesaplanmalı.",
);

// Ters sıra (TAKBİS önce, İmar sonra) zaten çalışıyordu — regresyon olmadığını
// doğrula: ikisi de tek seferde mevcutken normal hesap.
sandbox.setState({ fields: { landArea: "500", kaks: "1.50" } });
assert.equal(sandbox.buildImarCalculatedEmsal(), "750 m²", "TAKBİS-önce sırası regresyon yapmamalı.");

console.log("Hesaplanan Emsal - TAKBIS/Imar yukleme sirasi bagimsizligi testi tamam.");
