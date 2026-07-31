"use strict";

/*
  Kullanici talebi: "Emsaller bölümünde ... TAB tuşuna bastığımda birinci
  emsal sütunundan ikinci emsal sütununa geçiyor sağa doğru benim isteğim
  aynı emsal sütununda alt hücreye geçmesi TAB tuşuna basıldığında."

  Emsaller matrisi satir-bazli (row-major) bir <table>: dis dongu
  comparableFields (alanlar, <tr>), ic dongu visibleRows (emsaller, <td>).
  Bu yuzden tarayicinin dogal Tab sirasi ayni emsal icinde asagi degil,
  sagdaki bir sonraki emsale atlar. attachComparableColumnTabNavigation()
  Tab tusunu shell uzerinde keydown ile yakalayip odak sirasini sutun
  (emsal) icinde asagi/yukari, sutun sinirinda bir sonraki/onceki emsale
  gececek sekilde yeniden yonlendirir.

  attachComparableColumnTabNavigation() gercek app.js kaynagindan izole
  calistirilir; gercek DOM yerine minimal bir "shell" stub kullanilir:
  querySelectorAll(`[data-comparable-row="X"]`) DOM-siradaki elemanlari
  dondurur, addEventListener/keydown tetiklemesi elle simule edilir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function attachComparableColumnTabNavigation(");
const end = appSource.indexOf("function getComparableFieldForRow(field, row) {", start);
assert(start >= 0 && end > start, "attachComparableColumnTabNavigation fonksiyonu bulunamadi.");

function createStop(rowIndex, fieldKey) {
  return {
    dataset: { comparableRow: String(rowIndex), comparableField: fieldKey },
    disabled: false,
    offsetParent: {}, // gorunur kabul edilir
    focused: false,
    focus() { this.focused = true; },
  };
}

function createShell(stopsInDomOrder) {
  const listeners = {};
  return {
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    querySelectorAll(selector) {
      const match = selector.match(/data-comparable-row="([^"]+)"/);
      const rowKey = match[1];
      return stopsInDomOrder.filter((el) => el.dataset.comparableRow === rowKey);
    },
    fireKeydown(event) {
      listeners.keydown(event);
    },
  };
}

function createEvent({ target, shiftKey = false }) {
  return {
    key: "Tab",
    shiftKey,
    target,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  };
}

// 3 emsal (sutun: 0,1,2) x 2 alan (c0,c1); DOM sirasi satir-bazli (field-major).
const comp0Field0 = createStop(0, "c0");
const comp1Field0 = createStop(1, "c0");
const comp2Field0 = createStop(2, "c0");
const comp0Field1 = createStop(0, "c1");
const comp1Field1 = createStop(1, "c1");
const comp2Field1 = createStop(2, "c1");
const domOrder = [comp0Field0, comp1Field0, comp2Field0, comp0Field1, comp1Field1, comp2Field1];

function attach() {
  const shell = createShell(domOrder);
  const context = { shell };
  vm.createContext(context);
  vm.runInContext(appSource.slice(start, end), context);
  context.attachComparableColumnTabNavigation(shell, [{ index: 0 }, { index: 1 }, { index: 2 }]);
  return shell;
}

// 1) Ayni sutun icinde Tab: c0(emsal0) -> c1(emsal0), YAN emsale (comp1Field0) DEGIL.
{
  const shell = attach();
  const event = createEvent({ target: comp0Field0 });
  shell.fireKeydown(event);
  assert.equal(event.defaultPrevented, true, "Sutun icinde ilerlerken tarayicinin varsayilan Tab davranisi engellenmeli.");
  assert.equal(comp0Field1.focused, true, "Odak, ayni emsalin (sutun 0) bir sonraki alanina (c1) gitmeli.");
  assert.equal(comp1Field0.focused, false, "Odak YANLIŞLIKLA bir sonraki emsale (sutun 1, c0) gitmemeli — bu, kullanicinin bildirdigi hata.");
}

// 2) Shift+Tab geri: c1(emsal0) -> c0(emsal0).
{
  const shell = attach();
  const event = createEvent({ target: comp0Field1, shiftKey: true });
  shell.fireKeydown(event);
  assert.equal(event.defaultPrevented, true, "Shift+Tab ile geri giderken varsayilan davranis engellenmeli.");
  assert.equal(comp0Field0.focused, true, "Shift+Tab, ayni emsalin bir onceki alanina donmeli.");
}

// 3) Sutun sinirinda ileri: emsal0'in SON alanindan (c1) Tab -> emsal1'in ILK alanina (c0).
{
  const shell = attach();
  const event = createEvent({ target: comp0Field1 });
  shell.fireKeydown(event);
  assert.equal(comp1Field0.focused, true, "Emsal 0'in son alanindan Tab, emsal 1'in ilk alanina gecmeli.");
}

// 4) Sutun sinirinda geri: emsal1'in ILK alanindan (c0) Shift+Tab -> emsal0'in SON alanina (c1).
{
  const shell = attach();
  const event = createEvent({ target: comp1Field0, shiftKey: true });
  shell.fireKeydown(event);
  assert.equal(comp0Field1.focused, true, "Emsal 1'in ilk alanindan Shift+Tab, emsal 0'in son alanina gecmeli.");
}

// 5) En son emsalin en son alanindan ileri Tab: tablo disina cikis tarayiciya birakilmali (mudahale edilmemeli).
{
  const shell = attach();
  const event = createEvent({ target: comp2Field1 });
  shell.fireKeydown(event);
  assert.equal(event.defaultPrevented, false, "Son emsalin son alanindan Tab, tablo disina normal cikisi engellemeMEli.");
}

console.log("Emsaller Tab sutun ici gezinme testi tamam.");
