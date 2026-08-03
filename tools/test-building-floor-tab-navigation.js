"use strict";

/*
  Kullanici talebi: "ana tasinmaz katlari kaydet dedikten sonra cikan listede
  TAB tusu yine saga geciyor. burada da emsallerde oldugu gibi taba
  basildiginda alt hucreye gecmesini istiyorum."

  Kat Satirlari tablosu satir-bazli (row-major): dis dongu rows (katlar,
  <tr>), ic dongu buildingFloorUnitColumns (birim turleri, <td>). Bu yuzden
  tarayicinin dogal Tab sirasi ayni sutunda (birim turu) asagi degil,
  sagdaki bir sonraki sutuna atlar. attachBuildingFloorColumnTabNavigation()
  Tab tusunu shell uzerinde keydown ile yakalayip odak sirasini sutun
  icinde asagi/yukari, sutun sinirinda bir sonraki/onceki sutuna gececek
  sekilde yeniden yonlendirir — attachComparableColumnTabNavigation ile ayni
  mantik, ama grup anahtari (data-building-floor-column) satirlar arasinda
  DOGAL olarak zaten dagilmis oldugu icin "sutun" ile "grup" ayni sey.

  attachBuildingFloorColumnTabNavigation() gercek app.js kaynagindan izole
  calistirilir; buildingFloorUnitColumns stub olarak saglanir, gercek DOM
  yerine minimal bir "shell" stub kullanilir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function attachBuildingFloorColumnTabNavigation(");
const end = appSource.indexOf("function updateBuildingFloorTotals(", start);
assert(start >= 0 && end > start, "attachBuildingFloorColumnTabNavigation fonksiyonu bulunamadi.");

function createStop(rowIndex, columnKey) {
  return {
    dataset: { buildingFloorRow: String(rowIndex), buildingFloorColumn: columnKey },
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
      const match = selector.match(/data-building-floor-column="([^"]+)"/);
      const columnKey = match[1];
      return stopsInDomOrder.filter((el) => el.dataset.buildingFloorColumn === columnKey);
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

// 3 kat (satir: 0,1,2) x 2 sutun (c0,c1); DOM sirasi satir-bazli (row-major).
const floor0Col0 = createStop(0, "c0");
const floor0Col1 = createStop(0, "c1");
const floor1Col0 = createStop(1, "c0");
const floor1Col1 = createStop(1, "c1");
const floor2Col0 = createStop(2, "c0");
const floor2Col1 = createStop(2, "c1");
const domOrder = [floor0Col0, floor0Col1, floor1Col0, floor1Col1, floor2Col0, floor2Col1];

function attach() {
  const shell = createShell(domOrder);
  const context = { shell, buildingFloorUnitColumns: [{ key: "c0" }, { key: "c1" }] };
  vm.createContext(context);
  vm.runInContext(appSource.slice(start, end), context);
  context.attachBuildingFloorColumnTabNavigation(shell);
  return shell;
}

// 1) Ayni sutun icinde Tab: c0(kat0) -> c0(kat1), YAN sutuna (floor0Col1) DEGIL.
{
  const shell = attach();
  const event = createEvent({ target: floor0Col0 });
  shell.fireKeydown(event);
  assert.equal(event.defaultPrevented, true, "Sutun icinde ilerlerken tarayicinin varsayilan Tab davranisi engellenmeli.");
  assert.equal(floor1Col0.focused, true, "Odak, ayni sutunun (c0) bir sonraki katina (kat 1) gitmeli.");
  assert.equal(floor0Col1.focused, false, "Odak YANLIŞLIKLA yan sutuna (c1, ayni kat) gitmemeli — bu, kullanicinin bildirdigi hata.");
}

// 2) Shift+Tab geri: c0(kat1) -> c0(kat0).
{
  const shell = attach();
  const event = createEvent({ target: floor1Col0, shiftKey: true });
  shell.fireKeydown(event);
  assert.equal(event.defaultPrevented, true, "Shift+Tab ile geri giderken varsayilan davranis engellenmeli.");
  assert.equal(floor0Col0.focused, true, "Shift+Tab, ayni sutunun bir onceki katina donmeli.");
}

// 3) Sutun sinirinda ileri: c0'in SON katindan (kat2) Tab -> c1'in ILK katina (kat0).
{
  const shell = attach();
  const event = createEvent({ target: floor2Col0 });
  shell.fireKeydown(event);
  assert.equal(floor0Col1.focused, true, "c0 sutununun son katindan Tab, c1 sutununun ilk katina gecmeli.");
}

// 4) Sutun sinirinda geri: c1'in ILK katindan (kat0) Shift+Tab -> c0'in SON katina (kat2).
{
  const shell = attach();
  const event = createEvent({ target: floor0Col1, shiftKey: true });
  shell.fireKeydown(event);
  assert.equal(floor2Col0.focused, true, "c1 sutununun ilk katindan Shift+Tab, c0 sutununun son katina gecmeli.");
}

// 5) En son sutunun en son katindan ileri Tab: tablo disina cikis tarayiciya birakilmali (mudahale edilmemeli).
{
  const shell = attach();
  const event = createEvent({ target: floor2Col1 });
  shell.fireKeydown(event);
  assert.equal(event.defaultPrevented, false, "Son sutunun son katindan Tab, tablo disina normal cikisi engellemeMEli.");
}

console.log("Kat Satirlari Tab sutun ici gezinme testi tamam.");
