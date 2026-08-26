// Çoklu TAKBİS PDF bölme testi (Faz 1, 2026-08-09 — bkz.
// docs/coklu-takbis-import-plan.md). splitMultiTakbisRowBlocks() saf bir
// fonksiyon (DOM/pdf.js bağımlılığı yok) — gerçek kaynaktan çıkarılıp
// sentetik satır (rows) dizileriyle sandbox'ta test edilir.
//
// Kapsanan senaryolar:
//  1) Tek "TAPU KAYIT BİLGİSİ" başlığı → 1 blok, TÜM satırları (başlık
//     ÖNCESİ makbuz/dekont satırları dahil) — mevcut tek-kayıt davranışıyla
//     (readTakbisPdf) BİREBİR aynı, geriye dönük uyumluluk garantisi.
//  2) Üç "TAPU KAYIT BİLGİSİ" başlığı (43 kayıtlı gerçek PDF'in küçültülmüş
//     modeli) → 3 blok, her biri kendi başlığından bir SONRAKİ başlığa kadar.
//  3) Başlık hiç yoksa (boş/hatalı PDF) → 1 blok (tüm satırlar), hata
//     fırlatmaz — mevcut "tapu kayıt bilgisi okunamadı" hata mesajı akışı
//     bloktan SONRA (üst katmanda) devreye girer, bölme aşamasında değil.
//  4) Büyük/küçük harf ve Türkçe karakter varyasyonları (foldTurkish
//     üzerinden) doğru eşleşir.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  let index = appSource.indexOf("{", start);
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

const functionNames = ["foldTurkish", "extractTakbisIdentityNumberFromFoldedWindow", "splitMultiTakbisRowBlocks"];
const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function row(text) {
  return { text };
}

// --- 1) Tek kayıt: tek başlık, geriye dönük uyumluluk ---------------------
{
  const rows = [
    row("Makbuz No Dekont No Başvuru No"),
    row("009026392516 20260612-851-F08472 39251"),
    row("TAPU KAYIT BİLGİSİ"),
    row("Taşınmaz Kimlik No: 116987960 AT Yüzölçüm(m2): 21625.77"),
    row("İl/İlçe: DÜZCE/MERKEZ Bağımsız Bölüm Nitelik: MESKEN"),
  ];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 1, "Tek başlıkta 1 blok dönmeli.");
  assert.equal(blocks[0].length, rows.length, "Tek başlıkta TÜM satırlar (başlık öncesi dahil) korunmalı.");
  assert.deepEqual(blocks[0], rows, "Tek başlıkta satırlar DEĞİŞTİRİLMEDEN dönmeli.");
  console.log("Tek kayit (geriye donuk uyumluluk) testi tamam.");
}

// --- 2) Çoklu kayıt: 3 başlık, doğru sınırlarla bölünme --------------------
{
  const rows = [
    row("Makbuz No Dekont No Başvuru No"),
    row("009026392516 ... 39251"),
    row("TAPU KAYIT BİLGİSİ"),
    row("Taşınmaz Kimlik No: 111"),
    row("İl/İlçe: DÜZCE/MERKEZ"),
    row("MÜLKİYET BİLGİLERİ"),
    row("(SN:1) MALİK BİR"),
    row("TAPU KAYIT BİLGİSİ"),
    row("Taşınmaz Kimlik No: 222"),
    row("İl/İlçe: DÜZCE/MERKEZ"),
    row("MÜLKİYET BİLGİLERİ"),
    row("(SN:2) MALİK İKİ"),
    row("TAPU KAYIT BİLGİSİ"),
    row("Taşınmaz Kimlik No: 333"),
    row("İl/İlçe: DÜZCE/MERKEZ"),
    row("MÜLKİYET BİLGİLERİ"),
    row("(SN:3) MALİK ÜÇ"),
  ];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 3, "Üç başlıkta 3 blok dönmeli.");
  assert.equal(blocks[0][0].text, "TAPU KAYIT BİLGİSİ", "İlk blok kendi başlığıyla başlamalı.");
  assert.equal(blocks[1][0].text, "TAPU KAYIT BİLGİSİ", "İkinci blok kendi başlığıyla başlamalı.");
  assert.equal(blocks[2][0].text, "TAPU KAYIT BİLGİSİ", "Üçüncü blok kendi başlığıyla başlamalı.");
  assert.ok(
    blocks[0].some((r) => r.text.includes("111")) && !blocks[0].some((r) => r.text.includes("222")),
    "İlk blok yalnızca kendi Taşınmaz Kimlik No'sunu (111) içermeli, ikinciyi (222) İÇERMEMELİ."
  );
  assert.ok(
    blocks[1].some((r) => r.text.includes("222")) && !blocks[1].some((r) => r.text.includes("111") || r.text.includes("333")),
    "İkinci blok yalnızca 222'yi içermeli."
  );
  assert.ok(
    blocks[2].some((r) => r.text.includes("333")),
    "Üçüncü blok (son) sona kadar tüm kalan satırları içermeli."
  );
  assert.equal(
    blocks[0].length + blocks[1].length + blocks[2].length,
    rows.length - 2,
    "İlk başlık öncesi 2 satır (makbuz/dekont) hiçbir bloğa dahil edilmemeli (kayıp değil — bilinçli, bkz. yorum)."
  );
  console.log("Coklu kayit (3 blok, dogru sinirlar) testi tamam.");
}

// --- 3) Başlık yok: tek blok, hata fırlatmaz -------------------------------
{
  const rows = [row("Bozuk ya da farklı düzenli bir PDF içeriği"), row("Hiçbir bilinen başlık yok")];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 1, "Başlık yokken tek blok (tüm satırlar) dönmeli, hata fırlatılmamalı.");
  assert.deepEqual(blocks[0], rows, "Başlık yokken satırlar değiştirilmeden dönmeli.");
  console.log("Baslik yok (bozuk PDF, hata firlatmaz) testi tamam.");
}

// --- 4) Büyük/küçük harf ve Türkçe karakter varyasyonu ---------------------
{
  const rows = [
    row("tapu kayıt bilgisi"),
    row("Taşınmaz Kimlik No: 111"),
    row("Tapu Kayit Bilgisi"), // ı/İ karışık, foldTurkish ile eşleşmeli
    row("Taşınmaz Kimlik No: 222"),
  ];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 2, "Büyük/küçük harf ve Türkçe karakter varyasyonlarında da 2 başlık doğru tanınmalı.");
  console.log("Buyuk/kucuk harf ve Turkce karakter varyasyonu testi tamam.");
}

// --- 5) PDF.js başlığı komşu satırlara böldüğünde de ayırma -------------------
{
  const rows = [
    row("TAPU KAYIT"),
    row("BİLGİSİ"),
    row("Taşınmaz Kimlik No: 96455493"),
    row("İlk kaydın devamı"),
    row("TAPU"),
    row("KAYIT"),
    row("BİLGİSİ"),
    row("Taşınmaz Kimlik No: 96455499"),
    row("İkinci kaydın devamı"),
  ];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 2, "Komşu satırlara bölünmüş iki TAKBİS başlığı da bulunmalı.");
  assert.equal(blocks[0][0].text, "TAPU KAYIT", "İlk blok bölünmüş başlığın ilk satırından başlamalı.");
  assert.equal(blocks[1][0].text, "TAPU", "İkinci blok bölünmüş başlığın ilk satırından başlamalı.");
  assert.ok(blocks[0].some((r) => r.text.includes("96455493")) && !blocks[0].some((r) => r.text.includes("96455499")));
  assert.ok(blocks[1].some((r) => r.text.includes("96455499")) && !blocks[1].some((r) => r.text.includes("96455493")));
  console.log("PDF.js satir bolmeli baslik testi tamam.");
}

// --- 6) Başlık filtrelenmişse kimlik numarasıyla yedek ayırma ---------------
{
  const rows = [
    row("Makbuz ve başvuru satırı"),
    row("Taşınmaz Kimlik No: 96455493"),
    row("A/1.BODRUM//6"),
    row("Taşınmaz Kimlik No: 96455499"),
    row("B/1.BODRUM//6"),
  ];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 2, "Başlık satırları yoksa iki kimlik numarası iki blok oluşturmalı.");
  assert.equal(blocks[0][0].text, "Taşınmaz Kimlik No: 96455493", "İlk yedek blok ilk kimlik satırından başlamalı.");
  assert.equal(blocks[1][0].text, "Taşınmaz Kimlik No: 96455499", "İkinci yedek blok ikinci kimlik satırından başlamalı.");
  console.log("Kimlik numarasi yedek ayirma testi tamam.");
}

// --- 7) REGRESYON (2026-08-26, kullanıcı bildirimi: "liste birden buna --
// dönüştü", 43 taşınmaz sekmesi): AYNI kimlik numarası ÇOK SAYFADA -------
// (üstbilgi/dipnot gibi) TEKRARLANIYORSA bunlar TEK bir taşınmaz sayılmalı,
// yalnızca numara GERÇEKTEN DEĞİŞTİĞİNDE yeni blok başlamalı -------------
{
  const rows = [
    row("Makbuz ve başvuru satırı"),
    row("Taşınmaz Kimlik No: 96455493"), // 1. taşınmaz, sayfa 1
    row("Mülkiyet Bilgileri - Sayfa 1 devamı"),
    row("Taşınmaz Kimlik No: 96455493"), // AYNI tasinmaz, sayfa 2 (ustbilgi tekrari)
    row("Takyidat Bilgileri - Sayfa 2 devamı"),
    row("Taşınmaz Kimlik No: 96455493"), // AYNI tasinmaz, sayfa 3 (ustbilgi tekrari)
    row("Ekler - Sayfa 3 devamı"),
    row("Taşınmaz Kimlik No: 96455499"), // 2. (GERCEKTEN FARKLI) tasinmaz basliyor
    row("Mülkiyet Bilgileri - 2. taşınmaz"),
    row("Taşınmaz Kimlik No: 96455499"), // AYNI 2. tasinmaz, kendi sayfa tekrari
    row("Takyidat Bilgileri - 2. taşınmaz devamı"),
  ];
  const blocks = fns.splitMultiTakbisRowBlocks(rows);
  assert.equal(blocks.length, 2, `AYNI kimlik numarasinin sayfa tekrarlari YENI blok SAYILMAMALI - yalnizca GERCEKTEN farkli numaraya gecince (96455499) yeni blok baslamali, bulunan blok sayisi: ${blocks.length}`);
  assert.ok(
    blocks[0].every((r) => !r.text.includes("96455499")) && blocks[0].some((r) => r.text.includes("Sayfa 3 devamı")),
    `Ilk blok 1. tasinmazin TUM sayfalarini (3 sayfa tekrari dahil) icermeli, 2. tasinmaza hic tasmamali, bulunan: ${JSON.stringify(blocks[0].map((r) => r.text))}`
  );
  assert.ok(
    blocks[1].every((r) => !r.text.includes("Sayfa 1") && !r.text.includes("Sayfa 2") && !r.text.includes("Sayfa 3")),
    `Ikinci blok yalnizca 2. tasinmazin satirlarini icermeli, bulunan: ${JSON.stringify(blocks[1].map((r) => r.text))}`
  );
  console.log("AYNI kimlik numarasinin cok sayfada tekrari (REGRESYON) testi tamam.");
}

console.log("Coklu TAKBIS PDF bolme testleri basarili.");
