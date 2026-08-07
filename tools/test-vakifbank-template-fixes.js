"use strict";

/*
  Kullanici talebi: Vakıfbank'ın kendi ekspertiz sisteminin (7 ekran
  goruntusu) Tapu / Adres / Takyidat-Teknik Analiz / Rapor-Ozellikler /
  Rapor-Degerleme sekmeleri incelenip templates/vakifbank.html buna gore
  guncellendi + acik talimat: "emsaller kısmını değerleme bölümünden önce
  eklemeyi unutma".

  Yapilan degisiklikler:
   1) Emsaller Sekmesi artik Değerleme Sekmesi'nden ONCE geliyor (acik
      talimat).
   2) Tapu Kaydi tablosuna "Giriş" ({{TİTLE_ENTRANCE}}) ve "Eklentisi"
      ({{TİTLE_ATTACHMENT_BUYUK}}) satirlari eklendi — bankanin ekrani bu
      iki alani gosteriyordu, uygulamada karsiligi (titleEntrance/
      titleAttachment) var ama sablonda hic kullanilmiyordu.
   3) Imar tablosuna "İmar Planı Onay Tarihi" ({{PLAN_DATE}}), "Tevhit
      Şartı Var mı?" ({{TEVHİD_CONDİTİON}}) ve "Terk Var mı?"
      ({{ROAD_SETBACK}}) satirlari eklendi — ayni gerekce.
   4) Değerleme Sekmesi'ne "Genel İnşaat Seviyesi" ({{UNİT_CONSTRUCTİON_LEVEL}})
      satiri eklendi (bankanin "Genel İnşaat Seviyesi %" alaniyla eslesir;
      uygulamada bu deger GDYS bolumunde "TAMAMLANMA ORANI" olarak zaten
      kullaniliyordu).
   5) "BAKIMLI MI, TADİLAT İHTİYACI VAR MI?" satiri SILINDI — hemen ustundeki
      "YAPI KALİTESİ" satiriyla AYNI {{UNİT_MATERİAL_QUALİTY}} token'ini
      tekrarliyordu (uygulamada ayri bir "tadilat ihtiyaci" alani yok),
      kafa karistirici bir tekrar oldugu icin kaldirildi.

  Not: Bankanin ekraninda gorulen bazi alanlarin (Karma Yapı, Mesken
  Kullanım Durumu, Kullanıma Hazır Aynı Cins Boş Gayrimenkul Oranı,
  Yapılaşma/Yenileme Hızı, Arz/Talep, Bölge Satış Hızı, Mülk Değeri
  Değişimi, Bölgede Güvenlik/Asayiş, 2960 Sayılı Boğaziçi Kanunu, Kültür
  Varlığı, Pencere/Kapı Doğramaları, Deprem Dayanıklılığı/Derecesi, Oda/
  Salon/Mutfak/Banyo/WC/Balkon sayısı ayrı satırlar olarak) uygulamada
  KARŞILIĞI YOK (kod tabaninda arastirildi, bulunamadi) — bunlar icin
  placeholder UYDURULMADI, kullaniciya ayrica soruldu.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const templatePath = path.join(appDir, "templates", "vakifbank.html");
const template = fs.readFileSync(templatePath, "utf8");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function indexAfter(text, needle, fromIndex) {
  const idx = text.indexOf(needle, fromIndex);
  assert(idx >= 0, `Bulunamadi: "${needle}"`);
  return idx;
}

// --- 1) Emsaller Sekmesi, Değerleme Sekmesi'nden ONCE gelmeli -------------
{
  const emsallerIdx = template.indexOf(">Emsaller Sekmesi<");
  const degerlemeIdx = template.indexOf(">Değerleme Sekmesi<");
  assert(emsallerIdx >= 0, "Emsaller Sekmesi basligi bulunamadi.");
  assert(degerlemeIdx >= 0, "Değerleme Sekmesi basligi bulunamadi.");
  assert(emsallerIdx < degerlemeIdx, "Emsaller Sekmesi, Değerleme Sekmesi'nden ONCE gelmeli (kullanici talebi).");
  console.log("Emsaller/Değerleme sira testi tamam.");
}

// --- 2) Tapu Kaydi: Giriş / Eklentisi -------------------------------------
{
  const tapuStart = template.indexOf("Tapu Kaydı Sekmesi");
  const katIdx = indexAfter(template, '<td class="l">KAT</td><td>{{TİTLE_FLOOR}}</td>', tapuStart);
  const girisIdx = indexAfter(template, "GİRİŞ</td>", katIdx);
  assert(girisIdx > katIdx, "GİRİŞ satiri KAT satirindan SONRA gelmeli.");
  assert(template.slice(girisIdx, girisIdx + 60).includes("{{TİTLE_ENTRANCE}}"), "GİRİŞ satiri {{TİTLE_ENTRANCE}} kullanmali.");

  const arsaPayiIdx = indexAfter(template, "ARSA PAYI", girisIdx);
  const eklentiIdx = indexAfter(template, "EKLENTİSİ</td>", arsaPayiIdx);
  assert(eklentiIdx > arsaPayiIdx, "EKLENTİSİ satiri ARSA PAYI satirindan SONRA gelmeli.");
  assert(template.slice(eklentiIdx, eklentiIdx + 60).includes("{{TİTLE_ATTACHMENT_BUYUK}}"), "EKLENTİSİ satiri {{TİTLE_ATTACHMENT_BUYUK}} kullanmali.");

  console.log("Tapu Kaydi (Giriş / Eklentisi) testi tamam.");
}

// --- 3) Imar tablosu: İmar Planı Onay Tarihi / Tevhit Şartı / Terk -------
{
  const planScaleIdx = template.indexOf('<td class="l">PLAN ÖLÇEĞİ</td>');
  assert(planScaleIdx >= 0, "PLAN ÖLÇEĞİ satiri bulunamadi.");
  const planDateIdx = indexAfter(template, "İMAR PLANI ONAY TARİHİ", planScaleIdx);
  assert(template.slice(planDateIdx, planDateIdx + 60).includes("{{PLAN_DATE}}"), "İMAR PLANI ONAY TARİHİ satiri {{PLAN_DATE}} kullanmali.");

  const hesaplananEmsalIdx = indexAfter(template, "HESAPLANAN EMSAL", planDateIdx);
  const tevhitIdx = indexAfter(template, "TEVHİT ŞARTI VAR MI?", hesaplananEmsalIdx);
  assert(template.slice(tevhitIdx, tevhitIdx + 80).includes("{{TEVHİD_CONDİTİON}}"), "TEVHİT ŞARTI satiri {{TEVHİD_CONDİTİON}} kullanmali.");

  const terkIdx = indexAfter(template, "TERK VAR MI?", tevhitIdx);
  assert(template.slice(terkIdx, terkIdx + 60).includes("{{ROAD_SETBACK}}"), "TERK VAR MI satiri {{ROAD_SETBACK}} kullanmali.");

  console.log("Imar tablosu (İmar Planı Onay Tarihi / Tevhit Şartı / Terk) testi tamam.");
}

// --- 4) Değerleme Sekmesi: Genel İnşaat Seviyesi --------------------------
{
  const degerlemeIdx = template.indexOf(">Değerleme Sekmesi<");
  const genelInsaatIdx = indexAfter(template, "GENEL İNŞAAT SEVİYESİ", degerlemeIdx);
  assert(genelInsaatIdx > degerlemeIdx, "GENEL İNŞAAT SEVİYESİ, Değerleme Sekmesi basligindan SONRA gelmeli.");
  assert(template.slice(genelInsaatIdx, genelInsaatIdx + 60).includes("{{UNİT_CONSTRUCTİON_LEVEL}}"), "GENEL İNŞAAT SEVİYESİ satiri {{UNİT_CONSTRUCTİON_LEVEL}} kullanmali.");
  console.log("Değerleme Sekmesi (Genel İnşaat Seviyesi) testi tamam.");
}

// --- 5) Yinelenen "BAKIMLI MI, TADİLAT İHTİYACI VAR MI?" satiri SILINMIS -
{
  assert(!template.includes("BAKIMLI MI, TADİLAT İHTİYACI VAR MI?"), "Yinelenen (YAPI KALİTESİ ile ayni token'i tasiyan) satir hala mevcut, silinmeliydi.");
  console.log("Yinelenen tadilat satiri temizligi testi tamam.");
}

// --- 6) Kullanilan tum yeni field-bazli token'larin karsiligi app.js'te
// gercekten var mi (uydurulmus placeholder yok). --------------------------
{
  assert(appSource.includes('key: "titleEntrance"'), "titleEntrance field'i app.js'te bulunamadi.");
  assert(appSource.includes('key: "titleAttachment"'), "titleAttachment field'i app.js'te bulunamadi.");
  assert(appSource.includes('key: "tevhidCondition"'), "tevhidCondition field'i app.js'te bulunamadi.");
  assert(appSource.includes('key: "roadSetback"'), "roadSetback field'i app.js'te bulunamadi.");
  assert(appSource.includes('key: "planDate"'), "planDate field'i app.js'te bulunamadi.");
  console.log("Yeni token'larin field-varlik dogrulamasi testi tamam.");
}
