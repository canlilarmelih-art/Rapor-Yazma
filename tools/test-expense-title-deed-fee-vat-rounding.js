"use strict";

// Kullanıcı bildirimi (2026-09-15, ekran görüntüsü — 4 taşınmazlı rapor):
// "tapu harcı 2026 yılında 307 TL Kdv Dahil 255,833333 TL ise KDV hariç
// ancak ekran görüntüsünde KDV dahil küsüratlı çıkıyor. bu sorun büyük
// ihtimal küsürattan kaynaklanıyor. bu sorunu giderelim. KDV hari. 255,83
// KDV dahil 307 TL olacak."
//
// Kök neden: admin panelindeki KDV-HARİÇ birim tutar
// (`expenseTitleDeedUnitFeeExVat`, EXPENSE_FEE_2026_DEFAULTS'ta "255.83")
// 2 ondalığa YUVARLANMIŞ olarak saklanır (gerçek değer 307/1,20=
// 255,8333...). Eski kod KDV-DAHİL toplamı "birim(yuvarlanmış) × KDV
// oranı × ADET" sırasıyla hesaplıyordu — yuvarlama HATASI (255,83×1,20=
// 306,996, 307,00 DEĞİL) tek taşınmazda 307,00'a yuvarlanıp gözle
// görülmezken, ADETLE ÇARPILINCA (4×) büyüyüp "1.227,98" gibi küsüratlı
// bir toplam üretiyordu (307×4=1.228,00 OLMASI gerekirken).
//
// Düzeltme: BİRİM KDV-dahil tutar ÖNCE KENDİ BAŞINA yuvarlanır (307,00),
// SONRA adede çarpılır — hangi adet olursa olsun HER ZAMAN tam katı.
// KDV-hariç toplam (A/B) ise hiç round-trip yapılmadan doğrudan
// birim×adet (zaten doğruydu, DEĞİŞMEDİ).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// NOT: appSource'un yerel (Windows) checkout'u CRLF olabilir (git blob'u
// saf LF) — literal `\n` içeren bir marker bu yüzden EŞLEŞMEYEBİLİR (bkz.
// proje belleği "CRLF/LF checkout artifact"). Bu yüzden İKİ ayrı tek-satır
// marker + aradaki en yakın kapanış `}` kullanılır (satır sonu tipinden
// BAĞIMSIZ).
const START_MARKER = "const titleDeedUnitFee = parseValuationNumber(state.fields.expenseTitleDeedUnitFeeExVat);";
const END_LINE_MARKER = 'state.fields.expenseTitleDeedFeeIncVat = "";';

const startIndex = appSource.indexOf(START_MARKER);
assert(startIndex >= 0, "Tapu Harcı hesaplama bloğu başlangıcı bulunamadı.");
const endLineIndex = appSource.indexOf(END_LINE_MARKER, startIndex);
assert(endLineIndex >= 0, "Tapu Harcı hesaplama bloğu sonu (else dalı) bulunamadı.");
const closingBraceIndex = appSource.indexOf("}", endLineIndex + END_LINE_MARKER.length);
assert(closingBraceIndex >= 0, "Tapu Harcı hesaplama bloğunun kapanış süslü ayracı bulunamadı.");
const titleDeedSnippet = appSource.slice(startIndex, closingBraceIndex + 1);

function runTitleDeedCalc({ unitFeeExVat, count, vatMultiplier = 1.2, bankGroup = "A" }) {
  const context = {
    state: { fields: { expenseTitleDeedUnitFeeExVat: unitFeeExVat, expenseTitleDeedCount: count } },
    multiplier: vatMultiplier,
    bankGroup,
    total: 0,
    totalExVat: 0,
    parseValuationNumber(value) {
      const text = String(value ?? "").trim();
      if (!text) return Number.NaN;
      const number = Number.parseFloat(text.replace(",", "."));
      return Number.isFinite(number) ? number : Number.NaN;
    },
    formatValuationMoney(value, options = {}) {
      if (!Number.isFinite(value)) return "";
      const decimals = options.decimals ?? 0;
      return value.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    },
  };
  vm.createContext(context);
  vm.runInContext(titleDeedSnippet, context);
  return {
    exVat: context.state.fields.expenseTitleDeedFeeExVat,
    incVat: context.state.fields.expenseTitleDeedFeeIncVat,
    total: context.total,
    totalExVat: context.totalExVat,
  };
}

// --- 1) KULLANICI ÖRNEĞİ (BİREBİR, TEK tapu): "KDV hariç 255,83 KDV -----
// dahil 307 TL olacak."
{
  const result = runTitleDeedCalc({ unitFeeExVat: "255.83", count: "1" });
  assert.equal(result.exVat, "255,83", `KDV Hariç "255,83" olmalı, bulunan: ${result.exVat}`);
  assert.equal(result.incVat, "307,00", `KDV Dahil "307,00" olmalı (KÜSÜRATSIZ), bulunan: ${result.incVat}`);
  console.log("KULLANICI ORNEGI (tek tapu): KDV Haric 255,83 / KDV Dahil 307,00 testi tamam.");
}

// --- 2) KULLANICI SENARYOSU (BİREBİR, ekran görüntüsündeki 4 taşınmazlı --
// rapor): eski kod "1.227,98 TL" üretiyordu, artık "1.228,00 TL" (TAM KAT).
{
  const result = runTitleDeedCalc({ unitFeeExVat: "255.83", count: "4" });
  assert.equal(result.exVat, "1.023,32", `KDV Hariç "1.023,32" olmalı (zaten doğruydu, DEĞİŞMEMELİ), bulunan: ${result.exVat}`);
  assert.equal(result.incVat, "1.228,00", `KDV Dahil "1.228,00" (307×4, KÜSÜRATSIZ) olmalı, "1.227,98" DEĞİL — bulunan: ${result.incVat}`);
  console.log("KULLANICI SENARYOSU (4 tasinmaz, ekran goruntusu): KDV Dahil artik kusuratsiz 1.228,00 testi tamam.");
}

// --- 3) Farklı taşınmaz sayılarında HER ZAMAN 307'nin tam katı (regresyon --
// kilidi — 2, 3, 5, 10 taşınmaz).
{
  [2, 3, 5, 10].forEach((count) => {
    const result = runTitleDeedCalc({ unitFeeExVat: "255.83", count: String(count) });
    const expected = (307 * count).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    assert.equal(result.incVat, expected, `${count} taşınmazlı raporda KDV Dahil "${expected}" (307×${count}, tam kat) olmalı, bulunan: ${result.incVat}`);
  });
  console.log("Farkli tasinmaz sayilarinda HER ZAMAN 307'nin tam kati (2/3/5/10) regresyon testi tamam.");
}

// --- 4) C/D banka grupları: "düz gösterilir (hariç = 307, KDV = 0)" -----
// — KDV Hariç sütunu da 307-bazlı (255,83-bazlı DEĞİL) TEMİZ tutarı
// göstermeli, ExVat === IncVat.
{
  const result = runTitleDeedCalc({ unitFeeExVat: "255.83", count: "4", bankGroup: "C" });
  assert.equal(result.exVat, result.incVat, "C grubunda KDV Hariç sütunu KDV Dahil İLE AYNI (düz gösterim) olmalı.");
  assert.equal(result.exVat, "1.228,00", `C grubunda KDV Hariç de "1.228,00" (307-bazlı, küsüratsız) olmalı, bulunan: ${result.exVat}`);
  console.log("C/D banka grubu: KDV Hariç = KDV Dahil (duz gosterim, kusuratsiz) testi tamam.");
}

// --- 5) total/totalExVat (masraf tablosu Toplam Ücret satırı) da doğru ---
// (küsüratsız) tutarları biriktirmeli.
{
  const result = runTitleDeedCalc({ unitFeeExVat: "255.83", count: "4" });
  assert.equal(result.total, 1228, "Tapu Harcı'nın 'total' (KDV Dahil) birikimine eklediği tutar 1228 (küsüratsız) olmalı.");
  assert.ok(Math.abs(result.totalExVat - 1023.32) < 0.001, `'totalExVat' birikimi 1023.32 olmalı, bulunan: ${result.totalExVat}`);
  console.log("Toplam Ucret biriktirme (total/totalExVat) dogruluk testi tamam.");
}

console.log("Tapu Harci KDV yuvarlama duzeltmesi testleri basarili.");
