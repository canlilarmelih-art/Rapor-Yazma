"use strict";

/*
  Kullanici: "Akbank rapor formatını mevcut template düzenleme
  kurallarımıza göre düzenleyelim" — ayni Ekspertiz sistemi ekran
  goruntuleri (Tapu/Adres/Takyidat-Teknik Analiz/Rapor-Özellikler/Rapor-
  Değerleme) Vakıfbank turunda (0.0.350/0.0.351) kurulan kurallar VE
  bulunan gercek placeholder'lar Akbank'a da uygulandi:

   1) Tapu tablosuna Eski Ada-Parsel / Yevmiye No / Cilt-Sayfa / Giriş /
      Eklentisi / Tapu Tarihi / Edinme Sebebi eklendi (Vakıfbank'taki
      ayni satirlar).
   2) "TAŞINMAZ SATIŞ BİLGİSİ" satiri SABİT "SIFIR TAŞINMAZ / İKİNCİ EL
      TAŞINMAZ" metni yerine GERÇEK {{UNİT_FİRST_SALE_STATUS}} placeholder'i
      kullaniyor artik — bu, ayni turda vakifbank.html'de de (ayni bug)
      duzeltildi (bkz. tools/test-vakifbank-*.js).
   3) Konum/Cevre bolumune Guvenlik/Yapilasma Hizi/Mulk Degeri Degisimi
      tablosu eklendi.
   4) Ana Gayrimenkul bolumune Karma Yapi/Mesken Kullanim/Deprem
      Dayanikliligi/Deprem Derecesi/2960 Sayili Kanun/Kultur Varligi
      eklendi.
   5) Imar/Ruhsat bolumune Imar Plani Onay Tarihi/Hesaplanan Emsal/
      Tevhit Sarti/Terk Var mi eklendi.
   6) Bagimsiz Bolumun Bilgileri tablosuna Pencere/Ic Kapi + Oda/Salon/
      Mutfak/Banyo/WC/Balkon sayilari eklendi.
   7) Değerleme Sekmesi'ne Genel İnşaat Seviyesi eklendi.
   8) Emsaller artik Değerleme Sekmesi'nden ONCE geliyor (Vakıfbank'taki
      ayni kural).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const templatePath = path.join(appDir, "templates", "akbank.html");
const template = fs.readFileSync(templatePath, "utf8");

function indexAfter(text, needle, fromIndex) {
  const idx = text.indexOf(needle, fromIndex);
  assert(idx >= 0, `Bulunamadi: "${needle}"`);
  return idx;
}

// --- 1) Tapu tablosu ek satirlari -----------------------------------------
{
  const start = template.indexOf("ÖZELLİKLER SEKMESİ");
  const parselIdx = indexAfter(template, "PARSEL</td>", start);
  const eskiAdaIdx = indexAfter(template, "ESKİ ADA - PARSEL", parselIdx);
  assert(template.slice(eskiAdaIdx, eskiAdaIdx + 80).includes("{{OLD_BLOCK_NO}} - {{OLD_PARCEL_NO}}"));
  const yevmiyeIdx = indexAfter(template, "YEVMİYE NO", eskiAdaIdx);
  assert(template.slice(yevmiyeIdx, yevmiyeIdx + 60).includes("{{TAPU_YEVMİYESİ}}"));
  const ciltIdx = indexAfter(template, "CİLT SAYFA", yevmiyeIdx);
  assert(template.slice(ciltIdx, ciltIdx + 80).includes("{{REGİSTRY_VOLUME}} / {{REGİSTRY_PAGE}}"));
  const katIdx = indexAfter(template, "KAT</td><td>{{TİTLE_FLOOR}}", ciltIdx);
  const girisIdx = indexAfter(template, "GİRİŞ</td>", katIdx);
  assert(template.slice(girisIdx, girisIdx + 60).includes("{{TİTLE_ENTRANCE}}"));
  const arsaPayiIdx = indexAfter(template, "ARSA PAYI", girisIdx);
  const eklentiIdx = indexAfter(template, "EKLENTİSİ</td>", arsaPayiIdx);
  assert(template.slice(eklentiIdx, eklentiIdx + 60).includes("{{TİTLE_ATTACHMENT_BUYUK}}"));
  const tapuTarihiIdx = indexAfter(template, "TAPU TARİHİ", eklentiIdx);
  assert(template.slice(tapuTarihiIdx, tapuTarihiIdx + 60).includes("{{TAPU_TARİHİ}}"));
  const edinmeIdx = indexAfter(template, "EDİNME SEBEBİ", tapuTarihiIdx);
  assert(template.slice(edinmeIdx, edinmeIdx + 70).includes("{{EDİNME_SEBEBİ_BUYUK}}"));
  console.log("Tapu tablosu ek satirlari testi tamam.");
}

// --- 2) TAŞINMAZ SATIŞ BİLGİSİ artik gercek placeholder kullaniyor --------
{
  const idx = indexAfter(template, "TAŞINMAZ SATIŞ BİLGİSİ", 0);
  assert(template.slice(idx, idx + 60).includes("{{UNİT_FİRST_SALE_STATUS}}"), "TAŞINMAZ SATIŞ BİLGİSİ artik {{UNİT_FİRST_SALE_STATUS}} kullanmali.");
  assert(!template.includes("SIFIR TAŞINMAZ / İKİNCİ EL TAŞINMAZ"), "Eski sabit metin hala mevcut, silinmeliydi.");
  console.log("TAŞINMAZ SATIŞ BİLGİSİ (gercek placeholder) testi tamam.");
}

// --- 3) Konum/Çevre: Güvenlik/Yapılaşma Hızı/Mülk Değeri Değişimi --------
{
  const start = template.indexOf("Gayrimenkulün Konumu, Ulaşımı ve Çevre Bilgileri");
  const guvenlikIdx = indexAfter(template, "BÖLGEDE GÜVENLİK PROBLEMİ VAR MI?", start);
  assert(template.slice(guvenlikIdx, guvenlikIdx + 80).includes("{{REGİON_SECURİTY_İSSUE}}"));
  const yapilasmaIdx = indexAfter(template, "YAPILAŞMA HIZI", guvenlikIdx);
  assert(template.slice(yapilasmaIdx, yapilasmaIdx + 60).includes("{{DEVELOPMENT_SPEED}}"));
  const mulkIdx = indexAfter(template, "MÜLK DEĞERİ DEĞİŞİMİ", yapilasmaIdx);
  assert(template.slice(mulkIdx, mulkIdx + 60).includes("{{PROPERTY_VALUE_TREND}}"));
  console.log("Konum/Çevre bölgesel ozellikler testi tamam.");
}

// --- 4) Ana Gayrimenkul: Karma Yapı/Mesken/Deprem/2960/Kültür ------------
{
  const start = template.indexOf("Ana Gayrimenkulün Fiziksel Özellikleri");
  const karmaIdx = indexAfter(template, "KARMA YAPI VAR MI?", start);
  assert(template.slice(karmaIdx, karmaIdx + 60).includes("{{MİXED_USE_BUİLDİNG}}"));
  const meskenIdx = indexAfter(template, "MESKEN KULLANIM DURUMU", karmaIdx);
  assert(template.slice(meskenIdx, meskenIdx + 70).includes("{{RESİDENTİAL_USAGE_PRESENT}}"));
  const depremDayanikIdx = indexAfter(template, "BİNANIN DEPREM DAYANIKLILIĞI, GÖZLEMSEL HASAR DURUMU", meskenIdx);
  assert(template.slice(depremDayanikIdx, depremDayanikIdx + 90).includes(">Hasarsız<"));
  const depremDereceIdx = indexAfter(template, "DEPREM DERECESİ", depremDayanikIdx);
  assert(template.slice(depremDereceIdx, depremDereceIdx + 60).includes("{{EARTHQUAKE_ZONE}}"));
  const bogaziciIdx = indexAfter(template, "2960 SAYILI BOĞAZİÇİ KANUNU KAPSAMINDA MI?", depremDereceIdx);
  assert(template.slice(bogaziciIdx, bogaziciIdx + 70).includes(">Hayır<"));
  const kulturIdx = indexAfter(template, "KÜLTÜR VARLIĞI / TARİHİ ESER Mİ?", bogaziciIdx);
  assert(template.slice(kulturIdx, kulturIdx + 60).includes(">Hayır<"));
  console.log("Ana Gayrimenkul ek satirlari testi tamam.");
}

// --- 5) İmar/Ruhsat: İmar Planı Onay Tarihi/Hesaplanan Emsal/Tevhit/Terk -
{
  const start = template.indexOf("Gayrimenkulun Çap, İskan, Ruhsat, Onaylı Proje vb. Bilgileri");
  const planDateIdx = indexAfter(template, "İMAR PLANI ONAY TARİHİ", start);
  assert(template.slice(planDateIdx, planDateIdx + 60).includes("{{PLAN_DATE}}"));
  const emsalIdx = indexAfter(template, "HESAPLANAN EMSAL", planDateIdx);
  assert(template.slice(emsalIdx, emsalIdx + 60).includes("{{CALCULATED_EMSAL}}"));
  const tevhitIdx = indexAfter(template, "TEVHİT ŞARTI VAR MI?", emsalIdx);
  assert(template.slice(tevhitIdx, tevhitIdx + 80).includes("{{TEVHİD_CONDİTİON}}"));
  const terkIdx = indexAfter(template, "TERK VAR MI?", tevhitIdx);
  assert(template.slice(terkIdx, terkIdx + 60).includes("{{ROAD_SETBACK}}"));
  console.log("İmar/Ruhsat ek satirlari testi tamam.");
}

// --- 6) Bağımsız Bölümün Bilgileri: Pencere/İç Kapı + oda sayilari -------
{
  const start = template.indexOf("Bağımsız Bölümün Bilgileri");
  const pencereIdx = indexAfter(template, "PENCERE DOĞRAMALARI", start);
  assert(template.slice(pencereIdx, pencereIdx + 60).includes("{{PENCERE}}"));
  const icKapiIdx = indexAfter(template, "İÇ KAPI</td>", pencereIdx);
  assert(template.slice(icKapiIdx, icKapiIdx + 40).includes("{{İÇKAPI}}"));
  const odaIdx = indexAfter(template, "ODA SAYISI", icKapiIdx);
  assert(template.slice(odaIdx, odaIdx + 40).includes("{{ODA}}"));
  const salonIdx = indexAfter(template, "SALON SAYISI", odaIdx);
  assert(template.slice(salonIdx, salonIdx + 40).includes("{{SALON}}"));
  const balkonIdx = indexAfter(template, "BALKON SAYISI", salonIdx);
  assert(template.slice(balkonIdx, balkonIdx + 40).includes("{{BALKON}}"));
  console.log("Bağımsız Bölümün Bilgileri ek satirlari testi tamam.");
}

// --- 7) Değerleme Sekmesi: Genel İnşaat Seviyesi --------------------------
{
  const degerlemeIdx = template.indexOf(">DEĞERLEME SEKMESİ<");
  const genelInsaatIdx = indexAfter(template, "GENEL İNŞAAT SEVİYESİ", degerlemeIdx);
  assert(genelInsaatIdx > degerlemeIdx);
  assert(template.slice(genelInsaatIdx, genelInsaatIdx + 60).includes("{{UNİT_CONSTRUCTİON_LEVEL}}"));
  console.log("Değerleme Sekmesi (Genel İnşaat Seviyesi) testi tamam.");
}

// --- 8) Emsaller, Değerleme Sekmesi'nden ONCE gelmeli ---------------------
{
  const emsallerIdx = template.indexOf(">Emsaller<");
  const degerlemeIdx = template.indexOf(">DEĞERLEME SEKMESİ<");
  assert(emsallerIdx >= 0 && degerlemeIdx >= 0);
  assert(emsallerIdx < degerlemeIdx, "Emsaller, Değerleme Sekmesi'nden ONCE gelmeli.");
  console.log("Emsaller/Değerleme sira testi tamam.");
}

// --- 9) templates/vakifbank.html'deki AYNI bug da duzeltilmis olmali -----
{
  const vakifPath = path.join(appDir, "templates", "vakifbank.html");
  const vakifTemplate = fs.readFileSync(vakifPath, "utf8");
  const idx = indexAfter(vakifTemplate, "TAŞINMAZ İLK KEZ Mİ SATIŞA KONU", 0);
  assert(vakifTemplate.slice(idx, idx + 90).includes("{{UNİT_FİRST_SALE_STATUS}}"), "vakifbank.html'deki ayni bug hala duzeltilmemis.");
  assert(!vakifTemplate.includes("SIFIR TAŞINMAZ / İKİNCİ EL TAŞINMAZ"), "vakifbank.html'de eski sabit metin hala mevcut.");
  console.log("vakifbank.html'deki ayni bug duzeltmesi (capraz kontrol) testi tamam.");
}
