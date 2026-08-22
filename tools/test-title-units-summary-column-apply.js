"use strict";

// Kullanıcı talebi (2026-08-22): "tablolarda sütun başlıklarının içine
// sağ alt bölümüne sütunun tümüne uygula butonu koyabilir miyiz? bu
// sayede buradan aynı sütundaki tüm verileri alt sütunlara
// kopyalayabiliriz" — AskUserQuestion ile netleştirme: (1) sütun
// başlığında buton (Excel sürükle-doldur DEĞİL), (2) kopyalanan değer
// HER ZAMAN AKTİF (o an ekranda açık) taşınmazın değeri.
//
// Bu, Çift Yönlü Düzenleme'nin PAYLAŞILAN tüm özet tablolarını
// (Tapu/Adres/İmar/Arsa/Belgeler/Değerleme/Bağımsız Bölüm — hepsi AYNI
// applyTitleUnitsSummaryColumnToAllRows() + attachTitleUnitsSummaryTableEditing()
// kablolamasını paylaşıyor) TEK seferde kapsar.
//
// Bu test kapsamı:
//  1) applyTitleUnitsSummaryColumnToAllRows(): AKTİF taşınmazın değeri,
//     DİĞER TÜM taşınmazlara (aktif hariç) commitTitleUnitsSummaryCellEdit
//     üzerinden yazılır; onay diyaloğu reddedilirse HİÇBİR yazma olmaz;
//     tek taşınmazlı (count<2) raporda no-op; boş fieldKey'de no-op.
//  2) attachTitleUnitsSummaryTableEditing(): ".tus-apply-column-btn"
//     tıklamaları applyTitleUnitsSummaryColumnToAllRows()'u doğru
//     argümanlarla (data-field-key/data-column-label) çağırıyor mu
//     (kaynak-düzeyi — DOM click-event simülasyonu document olmadan
//     mümkün değil, bkz. dosya sonu).

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

// --- 1) applyTitleUnitsSummaryColumnToAllRows(): davranışsal ---------------
{
  const sandboxSource = `
    let state = {};
    let confirmResult = true;
    let commitCalls = [];
    const window = { confirm: () => confirmResult };
    function getTitleUnitCount() { return 1 + (Array.isArray(state.titleUnits) ? state.titleUnits.length : 0); }
    // Gerçek getTitleUnitFieldsForLabel yerine basit bir stub — bu test
    // applyTitleUnitsSummaryColumnToAllRows'un KENDİ mantığını (kaynak
    // satır seçimi, döngü, onay-diyaloğu koşulu) hedefler; aktif/gölge
    // okuma kuralının kendisi tools/test-title-units-summary-table.js'te
    // (buildAllTitleUnitsForSummaryTable testi) zaten kapsanıyor.
    function getTitleUnitFieldsForLabel(index) {
      if (index === state.activeTitleUnitIndex) return state.fields;
      if (index === 0) return state.primaryTitleUnitShadow?.fields || {};
      return state.titleUnits?.[index - 1]?.fields || {};
    }
    // commitTitleUnitsSummaryCellEdit'in KENDİSİ (DOM/autosave/render ağır
    // bağımlılıkları) burada test edilmiyor (tools/test-title-unit-switch.js
    // ve tools/test-unit-units-summary-table.js'te ayrıca kapsanıyor) —
    // burada yalnızca DOĞRU argümanlarla ÇAĞRILDIĞI doğrulanır (spy).
    function commitTitleUnitsSummaryCellEdit(fieldKey, rawValue, unitIndex) {
      commitCalls.push({ fieldKey, rawValue, unitIndex });
    }
    ${extractFunction("applyTitleUnitsSummaryColumnToAllRows")}
    return {
      setState: (s) => { state = s; },
      setConfirmResult: (v) => { confirmResult = v; },
      getCommitCalls: () => commitCalls,
      resetCommitCalls: () => { commitCalls = []; },
      applyTitleUnitsSummaryColumnToAllRows,
    };
  `;
  // eslint-disable-next-line no-new-func
  const fns = new Function(sandboxSource)();

  // 1a) Aktif taşınmazın (index 1) değeri, DİĞER İKİ taşınmaza (0 ve 2)
  // uygulanır; aktif taşınmazın kendisi ATLANIR (kendine yazma yok).
  fns.setState({
    activeTitleUnitIndex: 1,
    fields: { titlePropertyId: "AKTIF-DEGER" },
    primaryTitleUnitShadow: { fields: { titlePropertyId: "ESKI-0" } },
    titleUnits: [{}, { fields: { titlePropertyId: "ESKI-2" } }],
  });
  fns.setConfirmResult(true);
  fns.resetCommitCalls();
  fns.applyTitleUnitsSummaryColumnToAllRows("titlePropertyId", "Taşınmaz Kimlik No");
  const calls = fns.getCommitCalls();
  assert.equal(calls.length, 2, `Aktif (index 1) HARİÇ diğer 2 taşınmaza yazılmalıydı, bulunan çağrı sayısı: ${calls.length}.`);
  assert.ok(calls.every((c) => c.fieldKey === "titlePropertyId" && c.rawValue === "AKTIF-DEGER"), "Her çağrı AKTİF taşınmazın değerini ('AKTIF-DEGER') taşımalı.");
  assert.deepEqual(calls.map((c) => c.unitIndex).sort(), [0, 2], "Yalnızca aktif OLMAYAN indexler (0 ve 2) hedeflenmeli.");
  console.log("applyTitleUnitsSummaryColumnToAllRows: aktif deger diger tum satirlara uygulanir, aktif satir atlanir testi tamam.");

  // 1b) Onay diyaloğu REDDEDİLİRSE (window.confirm -> false) HİÇBİR yazma
  // olmamalı (geri alınamaz toplu üzerine-yazma güvenlik ağı).
  fns.setConfirmResult(false);
  fns.resetCommitCalls();
  fns.applyTitleUnitsSummaryColumnToAllRows("titlePropertyId", "Taşınmaz Kimlik No");
  assert.equal(fns.getCommitCalls().length, 0, "Onay diyaloğu reddedilince HİÇBİR commitTitleUnitsSummaryCellEdit çağrısı olmamalı.");
  console.log("applyTitleUnitsSummaryColumnToAllRows: onay reddedilince no-op testi tamam.");

  // 1c) Tek taşınmazlı (count < 2) raporda uygulanacak BAŞKA satır
  // olmadığından no-op (onay diyaloğu bile açılmamalı — burada dolaylı
  // olarak commit çağrısı olmamasıyla doğrulanıyor).
  fns.setState({ activeTitleUnitIndex: 0, fields: { titlePropertyId: "TEK" }, titleUnits: [] });
  fns.setConfirmResult(true);
  fns.resetCommitCalls();
  fns.applyTitleUnitsSummaryColumnToAllRows("titlePropertyId", "Taşınmaz Kimlik No");
  assert.equal(fns.getCommitCalls().length, 0, "Tek taşınmazlı raporda (uygulanacak başka satır yok) hiçbir yazma olmamalı.");
  console.log("applyTitleUnitsSummaryColumnToAllRows: tekil rapor (count<2) no-op testi tamam.");

  // 1d) Boş/undefined fieldKey -> no-op, hata fırlatmaz.
  fns.setState({ activeTitleUnitIndex: 0, fields: {}, titleUnits: [{ fields: {} }] });
  fns.resetCommitCalls();
  fns.applyTitleUnitsSummaryColumnToAllRows("", "Etiket");
  fns.applyTitleUnitsSummaryColumnToAllRows(undefined, "Etiket");
  assert.equal(fns.getCommitCalls().length, 0, "Boş/undefined fieldKey ile çağrıda hiçbir yazma olmamalı.");
  console.log("applyTitleUnitsSummaryColumnToAllRows: bos/undefined fieldKey guvenlik agi testi tamam.");

  // 1e) Aktif taşınmazın değeri BOŞSA bile (boş string olarak) diğer TÜM
  // satırlara uygulanır — "tümüne uygula" tam olarak bunu yapan bir araç,
  // sessizce atlamak yanıltıcı olurdu (kullanıcı onay diyaloğunda "(boş)"
  // ibaresini görüp isterse iptal eder, bkz. app.js yorumu).
  fns.setState({ activeTitleUnitIndex: 0, fields: { titlePropertyId: "" }, titleUnits: [{ fields: { titlePropertyId: "DOLU-DEGER" } }] });
  fns.setConfirmResult(true);
  fns.resetCommitCalls();
  fns.applyTitleUnitsSummaryColumnToAllRows("titlePropertyId", "Taşınmaz Kimlik No");
  const emptyCalls = fns.getCommitCalls();
  assert.equal(emptyCalls.length, 1, "Aktif deger bos olsa bile diger satira yazma cagrisi olmali.");
  assert.equal(emptyCalls[0].rawValue, "", "Yazilan deger aktif tasinmazin (bos) degeriyle AYNI olmali.");
  console.log("applyTitleUnitsSummaryColumnToAllRows: aktif deger bos olsa bile digerlerine uygulanir testi tamam.");
}

// --- 2) attachTitleUnitsSummaryTableEditing(): buton kablolaması ----------
// (kaynak-düzeyi — gerçek DOM click simülasyonu bu test dosyasında
// document olmadığından mümkün değil, bkz. dosya başı yorum; benzer
// kısıtlama tools/test-title-unit-table-select-editing.js'te de var).
{
  const fnSrc = extractFunction("attachTitleUnitsSummaryTableEditing");
  assert.match(
    fnSrc,
    /container\.querySelectorAll\("\.tus-apply-column-btn"\)\.forEach\(\(button\) => \{[\s\S]{0,200}applyTitleUnitsSummaryColumnToAllRows\(button\.dataset\.fieldKey, button\.dataset\.columnLabel\)/,
    "attachTitleUnitsSummaryTableEditing artik '.tus-apply-column-btn' tiklamalarini applyTitleUnitsSummaryColumnToAllRows(fieldKey, columnLabel)'e baglamiyor."
  );
  console.log("attachTitleUnitsSummaryTableEditing: 'tumune uygula' butonu kaynak-duzeyi kablolama testi tamam.");
}

console.log("Ozet tablo 'sutunun tumune uygula' testleri basarili.");
