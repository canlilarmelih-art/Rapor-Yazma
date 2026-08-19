# Maliyet Yontemi Kitapcigi Analizi

> Kaynak dosya: `rad_20250709145638442025.xls`
>
> Konum: `C:\Users\90551\OneDrive\Masaustu\OTOMASYON\AGUSTOS\DSTK-202600003 - KUTAHYA ZAFER OSB - FABRIKA\`
>
> Not: Excel icindeki hucreler ve aciklamalar entegrasyon icin incelenen veri/referanstir; uygulama kurali olarak dogrudan kabul edilmemistir.

## Genel Yapı

Dosyada 15 calisma sayfasi bulunuyor. Maliyet yontemi tek bir tablodan olusmuyor; asagidaki calisma gruplari birlikte yer aliyor:

- Maliyet yontemine gore arsa + bina deger hesabi
- 2023 yapim yaklasik birim maliyetleri
- Halkbank bina maliyet tablosu ve kalite seviyeleri
- Bina cikarma / emsalden bina ve arsa degeri ayristirma
- Proje gelistirme yaklasimi
- Gelir indirgeme tabloları
- Seviyeli hesaplama

## 1. Ana Maliyet Yontemi

Ana maliyet tablosunda arsa, bina ve cevre duzenlemesi/ser3fiye ayri kalemler olarak hesaplanir.

### Arsa degeri

```text
Arsa degeri = Arsa alani x Arsa birim fiyati x Hisse orani
```

Ornek:

```text
264.046,19 m2 x 2.000 TL/m2 x 1/1 = 528.092.380 TL
```

### Bina kalemi

Her bina veya yardimci yapi satiri icin temel mantik:

```text
Yapi degeri = Alan x Birim maliyet x Insaat seviyesi x (1 - Yipranma orani)
```

Ornekte fabrika binasi, ek fabrika binasi, bekci kulubesi ve idari bina ayri satirlarda tutuluyor.

### Yasal ve mevcut durum

Iki ayri hesap grubu var:

- Yasal alana gore hesap
- Mevcut alana gore hesap

Her grupta bina kalemleri ve cevre duzenlemesi ayri hesaplanip toplam bina maliyetine ulasiliyor.

### Toplam deger

```text
Toplam deger = Arsa degeri + Toplam yapi degeri + Cevre duzenlemesi/ser3fiye
```

Kaynak aralik: `MALIYET TABLOSU 2023 (2)!C3:AW26`

## 2. Birim Maliyet Kitapcigi

Ana tablonun sag tarafinda yapi sinifi, yapi turu ve kalite seviyesine gore maliyet listesi bulunuyor.

Alanlar:

- Yapi sinifi: `1/A`, `1/B`, `2/C`, `3/A`, `4/B`, `5/C` vb.
- Yapi turu: sanayi tesisi, depo, ticari bina, egitim tesisi vb.
- Kalite seviyesi: dusuk, orta, iyi, luks
- Birim maliyet: TL/m2

Ornek sanayi tesisi degerleri:

```text
Dusuk: 3.638 TL/m2
Orta: 4.800 TL/m2
Iyi: 6.413 TL/m2
Luks: 6.870 TL/m2
```

Bu tablo uygulamaya sabit kod olarak degil, yil ve kaynak bilgisiyle saklanan bir veri tablosu olarak alinmali.

Kaynak aralik: `MALIYET TABLOSU 2023 (2)!AP2:AW18`

## 3. Bina Cikarma Yontemi

Emsal satislardan bina ve arsa degerini ayristiran hesap mantigi:

```text
Gercekci emsal fiyati = Talep edilen fiyat x (1 - Pazarlik payi)
```

```text
Bina degeri = Bina alani x Bina birim fiyati
```

```text
Muteahhit/ser3fiye payi = Gercekci fiyat x Ser3fiye orani
```

```text
Arsaya dusen deger = Gercekci fiyat - Bina degeri - Ser3fiye payi
```

```text
Arsa birim fiyati = Arsaya dusen deger / Arsa alani
```

Arsa birim fiyati daha sonra KAKS/emsal ve konum-ser3fiye katsayisi ile duzeltiliyor.

Kaynak aralik: `BINA CIKARMA TABLOSU 2023!B2:Q27`

## 4. Proje Gelistirme Yaklasimi

Bu sayfa basit bina maliyetinden daha genis bir proje modeli iceriyor:

- Brut ve net arsa alani
- KAKS/emsal
- Insa edilebilir alan
- Ortak alan orani
- Satilabilir alan
- Birim insaat maliyeti
- Toplam insaat maliyeti
- Proje satis geliri
- Kat karsiligi orani
- Yatirimci kari
- Insaat ve satis suresi
- Aylik/yillik indirgeme orani
- Net bugunku deger

Temel formul yapisi:

```text
Toplam proje maliyeti = Satilabilir alan maliyeti + Ortak alan maliyeti
Toplam proje geliri = Satilabilir alan x Birim satis degeri
Net bugunku deger = Gelecekteki nakit akislarinin indirgenmis toplami
```

Bu bolum, arsa ve proje gelistirme calismalari icin ayri bir modul olarak ele alinmali.

Kaynak aralik: `PROJE GELISTIRME YAKLASIMI_!B7:G79`

## 5. Mevcut Uygulama ile Fark

Uygulamada mevcut bina degeri temelde su formul ile hesaplanıyor:

```text
Alan x Birim maliyet x (1 - Yipranma) x Insaat seviyesi
```

Kod referansi: [`app.js`](../app/app.js) icinde `calculateBuildingValuationValue` fonksiyonu.

Mevcut yapida bulunanlar:

- Yasal bina alani
- Mevcut bina alani
- Bina birim maliyeti
- Yipranma orani
- Insaat seviyesi
- Yasal/mevcut bina degeri
- Arsa ve ser3fiye degeri
- Degerleme yontemleri hesap aciklamasi

Excel kitapcigindan henuz tam alinmayanlar:

- Birden fazla bina kaleminin ayri satirlarda tutulmasi
- Yapi turu ve kalite seviyesine gore maliyet secimi
- Kaynak/yil bazli maliyet kitapcigi
- Bina cikarma yontemi
- Muteahhit kari/ser3fiye ayristirmasi
- Proje gelistirme yaklasimi
- Yasal ve mevcut maliyet kalemlerinin detayli tablosu

## 6. Entegrasyon Plani

### A. Maliyet veri tablosu

Asagidaki alanlar tutulmali:

```text
Yil
Kaynak
Yapi sinifi
Yapi turu
Kalite seviyesi
Birim maliyet
Aciklama
```

Kullanici yeni yil tablosu yuklediginde eski tablo silinmemeli; yeni bir versiyon olarak saklanmali.

### B. Maliyet hesap satirlari

Her bina kalemi ayri satir olmali:

- Fabrika binasi
- Ek bina
- Idari bina
- Bekci kulubesi
- Sundurma
- Saha betonu
- Cevre duzenlemesi

Her satirda su alanlar bulunmali:

```text
Aciklama
Yasal alan
Mevcut alan
Yapi sinifi
Yapi turu
Kalite seviyesi
Birim maliyet
Insaat seviyesi
Yipranma orani
Toplam deger
```

### C. Coklu talep kapsami

Coklu calismalarda maliyet satirlari iki farkli kapsamla tasarlanmalı:

- Her tasinmaza ait bina/yapi maliyeti
- Ortak rapor seviyesinde arsa, cevre duzenlemesi ve ortak ser3fiye

Ayni bina veya ortak alan birden fazla bagimsiz bolume aitse maliyetin iki kez yazilmasi engellenmeli; paylastirma orani acikca tutulmali.

### D. Rapor ciktilari

Aciklamalar ve calisma kagidi icin tek bir ortak tablo uretilmeli:

```text
{{MALIYET_YONTEMI_HESAP_TABLOSU}}
```

Tabloda yasal/mevcut alan, birim maliyet, insaat seviyesi, yipranma, kalem toplami ve genel toplamlar yer almali.

## 7. Netlestirilmesi Gereken Kararlar

1. Varsayilan kaynak 2023 Bayindirlik tablosu mu, Halkbank kalite tablosu mu olacak?
2. Yeni yil maliyet tablolarini kim yukleyecek ve onaylayacak?
3. Cevre duzenlemesi sabit tutar, yuzde veya kullanici girisi olarak mi tutulacak?
4. Muteahhit kari/ser3fiye orani her raporda manuel mi olacak?
5. Proje gelistirme modulu maliyet yonteminden ayri mi calisacak?
6. Coklu talepte ortak bina maliyeti tasinmazlara nasil paylastirilacak?

## Sonuc

En dogru entegrasyon, Excel'i oldugu gibi koda gommek degil; maliyet kitapcigini versiyonlu bir veri tablosuna, hesap kisimlarini da ayri ve test edilebilir bir hesap motoruna donusturmektir.

Ilk uygulama adimi olarak birim maliyet kitapcigi ve coklu bina kalemleri eklenmeli; bina cikarma ve proje gelistirme ikinci asamada ayri moduller olarak ele alinmalidir.
