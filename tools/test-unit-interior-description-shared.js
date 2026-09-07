"use strict";

/*
  Kullanici talebi (2026-09-07): "coklu raporlarda Bagimsiz Bolum Ic
  Hacimler Aciklamasi ortak olmali ve su an aciklamalar bolumunde yer alan
  Ic Hacimler Aciklamasi (Coklu Tasinmaz) kismi gelmeli" — AskUserQuestion
  ile netlestirildi: Aciklamalar bolumundeki eski "unitInteriorDescriptionMulti"
  alani KALDIRILDI (Onerilen secenek); metin artik DOGRUDAN "Bagimsiz
  Bolum" sekmesindeki (artik PAYLASIMLI) "Bagimsiz Bolum Ic Hacimler
  Aciklamasi" alaninda (unitInteriorDescription) gorunur/duzenlenir.

  Bu test, YENI composeCurrentUnitInteriorDescription() dagitici
  fonksiyonunu (tekil raporda composeUnitInteriorDescription(), 2+
  tasinmazli raporda buildMultiUnitInteriorDescriptionText()) ve onu
  kullanan UC cagri noktasini (updateUnitInteriorDescription/
  applyUnitDecorativeFieldChange/refreshMultiUnitInteriorDescriptionTextFromCurrentFields)
  dogrular. buildMultiUnitInteriorDescriptionText()'in KENDI ic mantigi
  (gruplama/cogullama/atif) tools/test-multi-unit-interior-description.js'te
  ZATEN kapsamli test ediliyor — burada YALNIZCA "hangi uretici hangi
  kosulda cagriliyor" dagitim mantigi test edilir (stub'lu, izole).

  Ayrica: unitInteriorDescription/unitInteriorDescriptionManual'in artik
  TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'te (paylasimli) oldugu VE
  getUnitSectionFieldKeys()'in (tasinmaza-ozgu liste) onlari ARTIK
  ICERMEDIGI dogrulanir — tools/test-title-unit-switch.js'teki senaryo 30
  (gercek switchActiveTitleUnit ile uctan uca) ile TAMAMLAYICI, kaynak-
  duzeyinde TEK-kaynak (drift'siz) bir capraz kontrol.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

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

// --- 1) composeCurrentUnitInteriorDescription(): GERÇEK kaynaktan, iki
// bağımlılığı (getTitleUnitCount/buildMultiUnitInteriorDescriptionText/
// composeUnitInteriorDescription) STUB'lanarak, dağıtım mantığı izole
// test edilir --------------------------------------------------------------
{
  function buildContext(unitCount) {
    const calls = { single: 0, multi: 0 };
    const ctx = {
      getTitleUnitCount: () => unitCount,
      buildMultiUnitInteriorDescriptionText: () => { calls.multi += 1; return "COKLU-METIN"; },
      composeUnitInteriorDescription: () => { calls.single += 1; return "TEKIL-METIN"; },
    };
    vm.createContext(ctx);
    vm.runInContext(extractFunction("composeCurrentUnitInteriorDescription"), ctx);
    return { ctx, calls };
  }

  {
    const { ctx, calls } = buildContext(1);
    const result = ctx.composeCurrentUnitInteriorDescription();
    assert.equal(result, "TEKIL-METIN", "Tekil raporda (1 taşınmaz) composeUnitInteriorDescription() sonucu dönmeli.");
    assert.equal(calls.single, 1, "Tekil raporda composeUnitInteriorDescription() tam 1 kez çağrılmalı.");
    assert.equal(calls.multi, 0, "Tekil raporda buildMultiUnitInteriorDescriptionText() HİÇ çağrılmamalı.");
  }
  {
    // Sınır: 0 taşınmaz (henüz yüklenmemiş/bozuk durum) — < 2, tekil dala düşer.
    const { ctx, calls } = buildContext(0);
    const result = ctx.composeCurrentUnitInteriorDescription();
    assert.equal(result, "TEKIL-METIN", "0 taşınmazlı sınır durumda da tekil (composeUnitInteriorDescription) dalına düşmeli.");
    assert.equal(calls.multi, 0, "0 taşınmazda buildMultiUnitInteriorDescriptionText() çağrılmamalı.");
  }
  {
    const { ctx, calls } = buildContext(2);
    const result = ctx.composeCurrentUnitInteriorDescription();
    assert.equal(result, "COKLU-METIN", "2+ taşınmazlı raporda buildMultiUnitInteriorDescriptionText() sonucu dönmeli.");
    assert.equal(calls.multi, 1, "2 taşınmazda buildMultiUnitInteriorDescriptionText() tam 1 kez çağrılmalı.");
    assert.equal(calls.single, 0, "2 taşınmazda composeUnitInteriorDescription() HİÇ çağrılmamalı.");
  }
  {
    const { ctx, calls } = buildContext(5);
    const result = ctx.composeCurrentUnitInteriorDescription();
    assert.equal(result, "COKLU-METIN", "5 taşınmazlı raporda da çoklu dalı kullanılmalı.");
    assert.equal(calls.multi, 1);
    assert.equal(calls.single, 0);
  }
  console.log("composeCurrentUnitInteriorDescription(): tekil/çoklu dağıtım mantığı (izole, stub'lu) testi tamam.");
}

// --- 2) updateUnitInteriorDescription(): composeCurrentUnitInteriorDescription()'ı
// kullanır (STUB'lanmış, hangi üreticiyi çağırdığından BAĞIMSIZ) + manuel
// geçersiz kılma bayrağına saygı duyar + force bypass eder ------------------
{
  function buildContext() {
    const domCalls = [];
    const ctx = {
      state: { fields: {} },
      composeCurrentUnitInteriorDescription: () => "YENI-URETILEN-METIN",
      document: {
        querySelector: (selector) => {
          domCalls.push(selector);
          return null; // DOM'da control yok senaryosu — hata FIRLATMAMALI.
        },
      },
    };
    vm.createContext(ctx);
    vm.runInContext(extractFunction("updateUnitInteriorDescription"), ctx);
    return { ctx, domCalls };
  }

  {
    const { ctx } = buildContext();
    ctx.state.fields.unitInteriorDescriptionManual = "";
    ctx.updateUnitInteriorDescription();
    assert.equal(ctx.state.fields.unitInteriorDescription, "YENI-URETILEN-METIN", "Manuel bayrak boşken alan yeniden üretilmeli.");
  }
  {
    const { ctx } = buildContext();
    ctx.state.fields.unitInteriorDescriptionManual = "Evet";
    ctx.state.fields.unitInteriorDescription = "KULLANICININ-KENDI-METNI";
    ctx.updateUnitInteriorDescription();
    assert.equal(ctx.state.fields.unitInteriorDescription, "KULLANICININ-KENDI-METNI", "Manuel bayrak 'Evet' iken (force olmadan) alan ÜZERİNE YAZILMAMALI.");
  }
  {
    const { ctx } = buildContext();
    ctx.state.fields.unitInteriorDescriptionManual = "Evet";
    ctx.state.fields.unitInteriorDescription = "KULLANICININ-KENDI-METNI";
    ctx.updateUnitInteriorDescription(true);
    assert.equal(ctx.state.fields.unitInteriorDescription, "YENI-URETILEN-METIN", "force=true iken manuel bayrak GÖRMEZDEN GELİNİP yeniden üretilmeli.");
  }
  console.log("updateUnitInteriorDescription(): composeCurrentUnitInteriorDescription() kablolaması + manuel bayrak/force testi tamam.");
}

// --- 3) applyUnitDecorativeFieldChange(): "önceki üretilmiş metin"
// karşılaştırması ARTIK composeCurrentUnitInteriorDescription() kullanıyor
// (kaynak-düzeyi — çoklu raporda ESKİ composeUnitInteriorDescription()
// çağrısı YANLIŞ karşılaştırma yapardı) ------------------------------------
{
  const body = extractFunction("applyUnitDecorativeFieldChange");
  assert.ok(
    /const previousGeneratedInteriorDescription = composeCurrentUnitInteriorDescription\(\);/.test(body),
    "applyUnitDecorativeFieldChange() 'önceki üretilmiş metin' karşılaştırmasında composeCurrentUnitInteriorDescription() kullanmalı (composeUnitInteriorDescription() DEĞİL)."
  );
  assert.ok(
    !/const previousGeneratedInteriorDescription = composeUnitInteriorDescription\(\);/.test(body),
    "applyUnitDecorativeFieldChange() artık DOĞRUDAN (dağıtımsız) composeUnitInteriorDescription() çağırmamalı."
  );
  console.log("applyUnitDecorativeFieldChange() composeCurrentUnitInteriorDescription() kablolaması (kaynak-düzeyi) testi tamam.");
}

// --- 4) refreshMultiUnitInteriorDescriptionTextFromCurrentFields():
// unitInteriorDescriptionMulti (dahili) hesaplamasının YANINDA artık
// updateUnitInteriorDescription()'ı da (kullanıcı-görünür paylaşımlı alanı
// tazelemek için) çağırıyor (kaynak-düzeyi) ---------------------------------
{
  const body = extractFunction("refreshMultiUnitInteriorDescriptionTextFromCurrentFields");
  assert.ok(
    body.includes("state.fields.unitInteriorDescriptionMulti = normalizeReportDescriptionText(buildMultiUnitInteriorDescriptionText());"),
    "unitInteriorDescriptionMulti (dahili, placeholder için) hesaplaması KORUNMALI."
  );
  assert.ok(
    /state\.fields\.unitInteriorDescriptionMulti = normalizeReportDescriptionText\(buildMultiUnitInteriorDescriptionText\(\)\);[\s\S]{0,400}updateUnitInteriorDescription\(\);/.test(body),
    "unitInteriorDescriptionMulti hesaplamasının HEMEN ardından updateUnitInteriorDescription() çağrılmalı (paylaşımlı alanı da tazelemek için)."
  );
  // Eski, artık var olmayan UI kontrolüne yönelik DOM senkron kodu
  // TAMAMEN kaldırılmış olmalı (2026-09-07'de alan Açıklamalar'dan
  // kaldırıldığından, kullanıcıya görünmeyen bu değeri DOM'a yazmaya
  // gerek yok).
  assert.ok(
    !body.includes('document.querySelector(\'[data-field="unitInteriorDescriptionMulti"]\')'),
    "unitInteriorDescriptionMulti için artık var olmayan bir DOM kontrolü sorgulanmamalı (ölü kod temizlenmeli)."
  );
  console.log("refreshMultiUnitInteriorDescriptionTextFromCurrentFields() -> updateUnitInteriorDescription() kablolaması (kaynak-düzeyi) testi tamam.");
}

// --- 5) TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS / getUnitSectionFieldKeys()
// çapraz kontrolü — GERÇEK app.js kaynağından, TEK-kaynak (drift'siz) -------
{
  const sharedSetStart = appSource.indexOf("const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set([");
  assert(sharedSetStart >= 0, "TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS bulunamadı.");
  const sharedSetEnd = appSource.indexOf("]);", sharedSetStart);
  const sharedSetSrc = appSource.slice(sharedSetStart, sharedSetEnd + 2);

  const sandboxSource = `
    ${sharedSetSrc}
    const sections = [{ id: "unit", fields: [{ key: "legalArea" }, { key: "currentArea" }] }];
    const unitKitchenCabinetOptions = [];
    const unitKitchenCounterOptions = [];
    const unitBathroomFixtureOptions = [];
    const unitMaterialQualityOptions = [];
    ${(() => {
      const marker = "const unitWallFloorRows = [";
      const start = appSource.indexOf(marker);
      const bracketStart = appSource.indexOf("[", start);
      let depth = 0; let idx = bracketStart;
      for (; idx < appSource.length; idx += 1) {
        if (appSource[idx] === "[") depth += 1;
        if (appSource[idx] === "]") { depth -= 1; if (depth === 0) break; }
      }
      const semi = appSource.indexOf(";", idx);
      return appSource.slice(start, semi + 1);
    })()}
    ${(() => {
      const marker = "const unitGeneralDecorativeFields = [";
      const start = appSource.indexOf(marker);
      const bracketStart = appSource.indexOf("[", start);
      let depth = 0; let idx = bracketStart;
      for (; idx < appSource.length; idx += 1) {
        if (appSource[idx] === "[") depth += 1;
        if (appSource[idx] === "]") { depth -= 1; if (depth === 0) break; }
      }
      const semi = appSource.indexOf(";", idx);
      return appSource.slice(start, semi + 1);
    })()}
    ${(() => {
      const marker = "const unitBathroomFixtureFields = [";
      const start = appSource.indexOf(marker);
      const bracketStart = appSource.indexOf("[", start);
      let depth = 0; let idx = bracketStart;
      for (; idx < appSource.length; idx += 1) {
        if (appSource[idx] === "[") depth += 1;
        if (appSource[idx] === "]") { depth -= 1; if (depth === 0) break; }
      }
      const semi = appSource.indexOf(";", idx);
      return appSource.slice(start, semi + 1);
    })()}
    ${extractFunction("getUnitDecorativeFieldKeys")}
    ${extractFunction("getUnitSectionFieldKeys")}
  `;
  // "const" bildirimleri vm.runInContext'te sandbox nesnesinin ÖZELLİĞİ
  // OLMADIĞINDAN (yalnızca "var"/fonksiyon bildirimleri globalThis'e
  // bağlanır) — içerik kontrolü doğrudan KAYNAK METNİ üzerinden yapılır,
  // sandbox yalnızca getUnitSectionFieldKeys() (bir fonksiyon bildirimi,
  // bu yüzden ctx'e bağlanır) çapraz kontrolü için kullanılır.
  assert.ok(sharedSetSrc.includes('"unitInteriorDescription",'), "TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS 'unitInteriorDescription' içermeli.");
  assert.ok(sharedSetSrc.includes('"unitInteriorDescriptionManual",'), "TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS 'unitInteriorDescriptionManual' içermeli.");

  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(sandboxSource, ctx);

  const sectionKeys = ctx.getUnitSectionFieldKeys();
  assert.ok(!sectionKeys.includes("unitInteriorDescription"), "getUnitSectionFieldKeys() (taşınmaza-özgü liste) 'unitInteriorDescription' İÇERMEMELİ (artık paylaşımlı).");
  assert.ok(!sectionKeys.includes("unitInteriorDescriptionManual"), "getUnitSectionFieldKeys() (taşınmaza-özgü liste) 'unitInteriorDescriptionManual' İÇERMEMELİ (artık paylaşımlı).");
  // Regresyon: "unit" bölümünün DİĞER alanları hâlâ taşınmaza-özgü kalmalı.
  ["unitUsageStatus", "facades", "unitFloor", "unitDecorativeDescription"].forEach((key) => {
    assert.ok(sectionKeys.includes(key), `getUnitSectionFieldKeys() REGRESYON: "${key}" hâlâ taşınmaza-özgü listede olmalı.`);
  });
  console.log("TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS/getUnitSectionFieldKeys() çapraz kontrolü (gerçek kaynak, drift'siz) testi tamam.");
}

console.log("Bağımsız Bölüm İç Hacimler Açıklaması paylaşımlı-alan (2026-09-07) testi tamam.");
