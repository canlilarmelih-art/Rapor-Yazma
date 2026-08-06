"use strict";

/*
  Kullanici talebi (goruntuler + Excel checklist): "YAPI KREDİ
  DÜZELTİLMESİ GEREKENLER" — 8 madde, Yapı Kredi'nin kendi ekspertiz
  sisteminin ekran goruntuleriyle karsilastirilarak templates/yapikredi.html
  guncellendi:
   1) Tapu bolumunde "Kat No"dan sonra "İç Kapı No" eklendi.
   2) Tapu bolumunde "Taşınmaz ID"den sonra "Tapu senedindeki bağımsız
      bölüm niteliği" eklendi.
   3) "UAVT"den sonra "Konut Niteliği" (Dikey/Yatay Kat İrtifakı ise
      Apartman Dairesi, aksi halde Müstakil Bina) — yeni RESIDENCE_TYPE
      placeholder'i (getResidenceTypeText()).
   4) "Taşınmazın Özellikleri" bolumunde "İç Hacimler"den sonra "Cephe"
      eklendi ({{CEPHELER}}).
   5) "Mevcut Kullanım Alanı"ndan sonra "Zemine İndirgenmiş Alan"
      (Yasal + Mevcut) eklendi.
   6) "EKSPERİN KANAATİ" hucresi {{SALEABİLİTY_NOTE}} (yanlis token,
      bos kaliyordu) yerine {{SALEABİLİTY}} kullaniyor.
   7) "EKSPERTİZ KANAATİ AÇIKLAMASI" hucresi {{VALUATİON_SALEABİLİTY_EXPLANATİON}}
      kullaniyor (once SALEABİLİTY_NOTE ile SATIR 6 ile AYNI yanlis token
      tekrarlaniyordu).
   8) "Aylık Kira Birim Değeri"nden sonra "Yasal/Mevcut Acil Satış
      Değeri" eklendi.
   9) (checklist'te ayri madde) "Gayrimenkul Değerleme" basligindan hemen
      sonra "Arsa / Yapı / Yeniden İnşa Maliyeti Hesap Detayı" alt basligi
      + Değerleme Özet Tablosu ({{DEGERLENDIRME_TABLOSU}}) eklendi — mevcut
      "Değerleme Yöntemleri ve Açıklamalar" bolumundeki AYNI token'in
      sirasini koruyan cok-bankali test (test-bank-templates.js) BOZULMASIN
      diye eski konumdaki DEGERLENDIRME_TABLOSU SILINMEDI, bilerek
      tekrarlandi.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const templatePath = path.join(appDir, "templates", "yapikredi.html");
const template = fs.readFileSync(templatePath, "utf8");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

function indexAfter(text, needle, fromIndex) {
  const idx = text.indexOf(needle, fromIndex);
  assert(idx >= 0, `Bulunamadi: "${needle}"`);
  return idx;
}

// --- 1) Kaynak-duzeyinde: tapu bolumu (Kat No -> İç Kapı No, Taşınmaz ID ->
// Tapu senedindeki bağımsız bölüm niteliği, UAVT -> Konut Niteliği) --------
{
  const katIdx = indexAfter(template, '<td class="l">KAT</td><td>{{TİTLE_FLOOR}}</td>', template.indexOf("Taşınmazın Tapu Bilgileri"));
  const icKapiIdx = indexAfter(template, "İÇ KAPI NO", katIdx);
  assert(icKapiIdx > katIdx, "İÇ KAPI NO satiri KAT satirindan SONRA gelmeli.");
  assert(template.slice(icKapiIdx, icKapiIdx + 80).includes("{{UNİT_NO}}"), "İÇ KAPI NO satiri {{UNİT_NO}} kullanmali.");

  const tasinmazIdIdx = indexAfter(template, "TAŞINMAZ ID", icKapiIdx);
  const tapuSenediIdx = indexAfter(template, "TAPU SENEDİNDEKİ BAĞIMSIZ BÖLÜM NİTELİĞİ", tasinmazIdIdx);
  assert(tapuSenediIdx > tasinmazIdIdx, "TAPU SENEDİNDEKİ BAĞIMSIZ BÖLÜM NİTELİĞİ satiri TAŞINMAZ ID satirindan SONRA gelmeli.");
  assert(template.slice(tapuSenediIdx, tapuSenediIdx + 100).includes("{{TİTLE_QUALİTY}}"), "Bu satir {{TİTLE_QUALİTY}} kullanmali.");

  const uavtIdx = indexAfter(template, "<td class=\"l\">UAVT</td>", tapuSenediIdx);
  const konutNitIdx = indexAfter(template, "KONUT NİTELİĞİ", uavtIdx);
  assert(konutNitIdx > uavtIdx, "KONUT NİTELİĞİ satiri UAVT satirindan SONRA gelmeli.");
  assert(template.slice(konutNitIdx, konutNitIdx + 80).includes("{{RESİDENCE_TYPE}}"), "KONUT NİTELİĞİ artik dinamik {{RESİDENCE_TYPE}} kullanmali (eski sabit metin DEĞİL).");
  assert(!template.slice(konutNitIdx, konutNitIdx + 80).includes("APARTMAN DAİRESİ / MÜSTAKİL BİNA"), "Eski sabit 'APARTMAN DAİRESİ / MÜSTAKİL BİNA' metni SİLİNMELİYDİ.");

  console.log("Tapu bolumu (İç Kapı No / Tapu Senedi Niteligi / Konut Niteligi) testi tamam.");
}

// --- 2) Taşınmazın Özellikleri: İç Hacimler -> Cephe, Mevcut Kullanım
// Alanı -> Zemine İndirgenmiş Alan (Yasal + Mevcut) -----------------------
{
  const sectionStart = template.indexOf("<h2>Taşınmazın Özellikleri</h2>");
  assert(sectionStart >= 0, "Taşınmazın Özellikleri bolumu bulunamadi.");
  const icHacimlerIdx = indexAfter(template, "İÇ HACİMLER", sectionStart);
  const cepheIdx = indexAfter(template, "CEPHE</td>", icHacimlerIdx);
  assert(cepheIdx > icHacimlerIdx, "CEPHE satiri İÇ HACİMLER satirindan SONRA gelmeli.");
  assert(template.slice(cepheIdx, cepheIdx + 60).includes("{{CEPHELER}}"), "CEPHE satiri {{CEPHELER}} kullanmali.");

  const mevcutAlanIdx = indexAfter(template, "MEVCUT KULLANIM ALANI", cepheIdx);
  const zeminYasalIdx = indexAfter(template, "ZEMİNE İNDİRGENMİŞ ALAN (YASAL)", mevcutAlanIdx);
  const zeminMevcutIdx = indexAfter(template, "ZEMİNE İNDİRGENMİŞ ALAN (MEVCUT)", zeminYasalIdx);
  assert(zeminYasalIdx > mevcutAlanIdx, "ZEMİNE İNDİRGENMİŞ ALAN (YASAL) MEVCUT KULLANIM ALANI'ndan SONRA gelmeli.");
  assert(template.slice(zeminYasalIdx, zeminYasalIdx + 80).includes("{{TOTAL_LEGAL_REDUCED_AREA}}"), "Yasal indirgenmis alan {{TOTAL_LEGAL_REDUCED_AREA}} kullanmali.");
  assert(template.slice(zeminMevcutIdx, zeminMevcutIdx + 80).includes("{{TOTAL_CURRENT_REDUCED_AREA}}"), "Mevcut indirgenmis alan {{TOTAL_CURRENT_REDUCED_AREA}} kullanmali.");

  console.log("Taşınmazın Özellikleri (Cephe / Zemine İndirgenmiş Alan) testi tamam.");
}

// --- 3) Gayrimenkul Değerleme: Ekspertin Kanaati / Açıklaması dogru
// token'lari kullanmali, Acil Satış Değerleri eklenmeli, ve başlıktan
// hemen sonra "Arsa / Yapı / Yeniden İnşa Maliyeti Hesap Detayı" +
// Değerleme Özet Tablosu gelmeli. ------------------------------------------
{
  const h2Idx = template.indexOf(">Gayrimenkul Değerleme<");
  assert(h2Idx >= 0, "Gayrimenkul Değerleme basligi bulunamadi.");
  const costDetailIdx = indexAfter(template, "Arsa / Yapı / Yeniden İnşa Maliyeti Hesap Detayı", h2Idx);
  assert(costDetailIdx > h2Idx && costDetailIdx - h2Idx < 200, "Arsa/Yapı/Yeniden İnşa Maliyeti Hesap Detayı basligi Gayrimenkul Değerleme basligindan HEMEN sonra olmali.");
  const firstTableTokenIdx = indexAfter(template, "{{DEGERLENDIRME_TABLOSU}}", costDetailIdx);
  assert(firstTableTokenIdx - costDetailIdx < 100, "Değerleme Özet Tablosu ({{DEGERLENDIRME_TABLOSU}}) bu alt basligin hemen altinda olmali.");

  const eksperinKanaatiIdx = indexAfter(template, "EKSPERİN KANAATİ", firstTableTokenIdx);
  assert(template.slice(eksperinKanaatiIdx, eksperinKanaatiIdx + 60).includes("{{SALEABİLİTY}}"), "EKSPERİN KANAATİ artik {{SALEABİLİTY}} kullanmali.");
  assert(!template.slice(eksperinKanaatiIdx, eksperinKanaatiIdx + 60).includes("{{SALEABİLİTY_NOTE}}"), "EKSPERİN KANAATİ eski yanlis {{SALEABİLİTY_NOTE}} token'ini kullanmamali.");

  const aciklamaIdx = indexAfter(template, "EKSPERTİZ KANAATİ AÇIKLAMASI", eksperinKanaatiIdx);
  assert(template.slice(aciklamaIdx, aciklamaIdx + 90).includes("{{VALUATİON_SALEABİLİTY_EXPLANATİON}}"), "EKSPERTİZ KANAATİ AÇIKLAMASI artik {{VALUATİON_SALEABİLİTY_EXPLANATİON}} kullanmali.");

  const kiraBirimIdx = indexAfter(template, "AYLIK KİRA BİRİM DEĞERİ", aciklamaIdx);
  const yasalAcilIdx = indexAfter(template, "YASAL ACİL SATIŞ DEĞERİ", kiraBirimIdx);
  const mevcutAcilIdx = indexAfter(template, "MEVCUT ACİL SATIŞ DEĞERİ", yasalAcilIdx);
  assert(yasalAcilIdx > kiraBirimIdx, "YASAL ACİL SATIŞ DEĞERİ satiri AYLIK KİRA BİRİM DEĞERİ'nden SONRA gelmeli.");
  assert(template.slice(yasalAcilIdx, yasalAcilIdx + 90).includes("{{LEGAL_URGENT_SALE_VALUE}}"));
  assert(template.slice(mevcutAcilIdx, mevcutAcilIdx + 90).includes("{{CURRENT_URGENT_SALE_VALUE}}"));

  // Eski konumdaki DEGERLENDIRME_TABLOSU (Değerleme Yöntemleri ve
  // Açıklamalar bölümü) BİLEREK korundu — cok-bankali sira testini
  // (test-bank-templates.js) bozmamak icin. Yani token TOPLAM 2 kez
  // gecmeli (yeni + eski konum).
  const occurrences = template.split("{{DEGERLENDIRME_TABLOSU}}").length - 1;
  assert.equal(occurrences, 2, `{{DEGERLENDIRME_TABLOSU}} TAM OLARAK 2 kez gecmeli (yeni + korunan eski konum), bulunan: ${occurrences}`);

  console.log("Gayrimenkul Değerleme (Ekspertin Kanaati/Açıklaması/Acil Satış/Maliyet Detayı) testi tamam.");
}

// --- 4) getResidenceTypeText() — Dikey/Yatay Kat İrtifakı -> Apartman
// Dairesi, aksi halde Müstakil Bina. ----------------------------------------
{
  function sliceFn(startMarker) {
    const start = appSource.indexOf(startMarker);
    assert(start >= 0, `Bulunamadi: ${startMarker}`);
    const end = appSource.indexOf("\n}", start) + 2;
    return appSource.slice(start, end);
  }

  function run(titleOwnershipKind) {
    const context = { state: { fields: { titleOwnershipKind } } };
    vm.createContext(context);
    vm.runInContext(sliceFn("function getResidenceTypeText("), context);
    return context.getResidenceTypeText();
  }

  assert.equal(run("Dikey Kat İrtifakı"), "Apartman Dairesi");
  assert.equal(run("Yatay Kat İrtifakı"), "Apartman Dairesi");
  assert.equal(run("Müstakil Bina"), "Müstakil Bina");
  assert.equal(run("Arsa"), "Müstakil Bina");
  assert.equal(run("Tarla"), "Müstakil Bina");
  assert.equal(run(""), "Müstakil Bina", "Seçilmemişse (bos) varsayilan Müstakil Bina olmali.");
  assert.equal(run(undefined), "Müstakil Bina");

  console.log("getResidenceTypeText() testi tamam.");
}

// --- 5) RESIDENCETYPE placeholder'i template-engine.js'e kablolanmis mi ---
{
  assert(
    /RESIDENCETYPE:\s*\{\s*fn:\s*\(\)\s*=>\s*safeCall\("getResidenceTypeText"\)\s*\}/.test(engineSource),
    "template-engine.js'te RESIDENCETYPE -> getResidenceTypeText() kablolamasi bulunamadi."
  );
  console.log("RESIDENCETYPE LEGACY_ALIASES kablolama testi tamam.");
}

// --- 6) Placeholder referans katalogunda (collectGeneratedTextPlaceholders)
// RESIDENCE_TYPE gorunmeli (0.0.319/0.0.323 kurali). ------------------------
{
  assert(
    appSource.includes('key: "RESIDENCE_TYPE"'),
    "RESIDENCE_TYPE, collectGeneratedTextPlaceholders() katalogunda GÖRÜNMÜYOR (Placeholder referans ekraninda gizli kalir)."
  );
  console.log("RESIDENCE_TYPE placeholder katalog kapsami testi tamam.");
}
