# -*- coding: utf-8 -*-
"""
Ziraat Bankası ek tablo xlsx şablonu üretici.

Kaynak: kullanıcının paylaştığı gerçek Ziraat ek tablosu (4 sayfa).
Çıktı:
  templates/ziraat-ek-tablo.xlsx   — stilli, formüllü, STORED-zip şablon.
                                      Sarı giriş hücrelerine token/0 konur.
  src/exports/ziraat-ek-tablo-manifest.json
                                    — {sheetIndex, sheet, cell, field, type, token}
                                      listesi; tarayıcı doldurma motoru bunu kullanır.

Not: Şablonun stil/formül/birleştirme yapısı KAYNAKTAN gelir (openpyxl load-in-place),
biz yalnızca birincil satırın giriş hücrelerini token/0 yapar, ikincil örnek satırları
boşaltırız. Formüllere DOKUNULMAZ.
"""
import json
import os
import sys
import zipfile
import openpyxl

# Kaynak: Ziraat'in gerçek ek tablosu (4 sayfa). argv[1] ile geçilebilir.
# Varsayılan, bu şablonun ilk üretildiği kaynak dosyadır (kişiseldir; başka
# makinede kendi kaynağınızı argv ile verin). Şablon + manifest zaten repoda
# olduğundan bu script yalnızca yeniden üretim/güncelleme için gerekir.
SRC = sys.argv[1] if len(sys.argv) > 1 else (
    r"C:\Users\90551\OneDrive\Masaüstü\OTOMASYON\TEMMUZ"
    r"\ZRT-202607408 - OSMANGAZİ - SAKARYA - 1 ADET DÜKKAN\202307141538532152.xlsx"
)
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_XLSX = os.path.join(APP, "templates", "ziraat-ek-tablo.xlsx")
OUT_MANIFEST = os.path.join(APP, "src", "exports", "ziraat-ek-tablo-manifest.json")

# Sayfa adları (kaynaktaki sıra) -> tarayıcıda sheet1.xml..sheet4.xml eşleşir.
# (sheetName, [ (cell, field, type, token) ... ]) birincil satır eşlemeleri.
# type: "number" | "text". Blanked = ikinci örnek satır (elle çoğaltılır).
MAPPINGS = {
    "TARLA": {
        "fill": [
            ("B3", "blockNo",     "text",   "{{ADA}}"),
            ("C3", "parcelNo",    "text",   "{{PARSEL}}"),
            ("D3", "landArea",    "number", "{{YUZOLCUMU}}"),
            ("F3", "legalValue",  "number", "{{YASAL_DEGER}}"),
            ("G3", "saleability", "text",   "{{SATIS_KABILIYETI}}"),
            ("F12", "currentValue", "number", "{{MEVCUT_DEGER}}"),
            ("G12", "saleability",  "text",   "{{SATIS_KABILIYETI}}"),
        ],
        "blank": ["B4", "C4", "D4", "F4", "G4", "F13", "G13"],
    },
    "ARSA": {
        "fill": [
            ("B3", "blockNo",   "text",   "{{ADA}}"),
            ("C3", "parcelNo",  "text",   "{{PARSEL}}"),
            ("D3", "landArea",  "number", "{{YUZOLCUMU}}"),
            ("E3", "legend",    "text",   "{{YAPILASMA_FONKSIYONU}}"),
            ("F3", "kaks",      "number", "{{KAKS}}"),
            ("G3", "taks",      "number", "{{TAKS}}"),
            ("H3", "hmax",      "number", "{{HMAX}}"),
            ("K3", "order",     "text",   "{{YAPI_NIZAMI}}"),
            ("F12", "legalValue",  "number", "{{YASAL_DEGER}}"),
            ("G12", "saleability", "text",   "{{SATIS_KABILIYETI}}"),
        ],
        "blank": ["B4", "C4", "D4", "E4", "F4", "G4", "H4", "K4", "F13", "G13"],
    },
    "KONUT-İŞYERLERİ": {
        "fill": [
            ("B3", "titlePropertyId", "text",   "{{TASINMAZ_ID}}"),
            ("C3", "titleQuality",    "text",   "{{GAYRIMENKUL_ADI}}"),
            ("D3", "ZRT_RUHSAT",      "text",   "{{YAPI_RUHSATI}}"),
            ("D4", "ZRT_ISKAN",       "text",   "{{ISKAN_BELGESI}}"),
            ("E3", "legalArea",       "number", "{{YASAL_ALAN}}"),
            ("G3", "legalValue",      "number", "{{YASAL_DEGER}}"),
            ("E10", "currentArea",    "number", "{{MEVCUT_ALAN}}"),
            ("G10", "currentValue",   "number", "{{MEVCUT_DEGER}}"),
            ("D10", "ZRT_RUHSAT",     "text",   "{{YAPI_RUHSATI}}"),
            ("D11", "ZRT_ISKAN",      "text",   "{{ISKAN_BELGESI}}"),
        ],
        "blank": [],
        # F3 birim değer: kaynakta sabit sayı; formüle çeviriyoruz (=değer/alan).
        "formula": [("F3", "=IFERROR(G3/E3,0)")],
    },
    "NİTELİKLİ GAYRİMENKUL": {
        "fill": [
            ("B3", "titlePropertyId",    "text",   "{{TASINMAZ_ID}}"),
            ("C3", "mainPropertyQuality","text",   "{{ANA_GAYRIMENKUL}}"),
            ("G3", "landArea",           "number", "{{ARSA_ALANI}}"),
            ("I3", "legalValue",         "number", "{{YASAL_DEGER}}"),
            ("J3", "saleability",        "text",   "{{SATIS_KABILIYETI}}"),
            ("C4", "titleQuality",       "text",   "{{GAYRIMENKUL_ADI}}"),
            ("D4", "buildingClass",      "text",   "{{YAPI_SINIFI}}"),
            ("E4", "titleFloor",         "text",   "{{KAT}}"),
            ("F4", "ZRT_RUHSAT",         "text",   "{{YAPI_RUHSATI}}"),
            ("G4", "legalArea",          "number", "{{YAPI_ALANI}}"),
            ("I4", "currentValue",       "number", "{{MEVCUT_DEGER}}"),
            ("J4", "saleability",        "text",   "{{SATIS_KABILIYETI}}"),
        ],
        "blank": ["A5", "B5", "C5", "D5", "E5", "F5", "G5", "I5", "J5",
                  "A6", "B6", "C6", "D6", "E6", "F6", "G6", "I6", "J6",
                  "G15", "I15", "G16", "I16"],
    },
}

# Sayı hücrelerine 0 yerine token yazamayız (formül kırar). Bu yüzden:
#  - text  giriş hücresi  -> görünür {{TOKEN}} (dokümantasyon; formül kırmaz)
#  - number giriş hücresi  -> 0 (formül temiz çalışır); token cell comment olarak eklenir
from openpyxl.comments import Comment


def main():
    wb = openpyxl.load_workbook(SRC, data_only=False)
    manifest = []
    sheet_order = wb.sheetnames  # gerçek sıra

    for sheet_name, spec in MAPPINGS.items():
        ws = wb[sheet_name]
        sheet_index = sheet_order.index(sheet_name) + 1  # sheet1.xml = index 1

        for coord, formula in spec.get("formula", []):
            ws[coord] = formula

        for coord, field, typ, token in spec["fill"]:
            cell = ws[coord]
            if typ == "text":
                cell.value = token
            else:
                cell.value = 0
                cell.comment = Comment(token, "Şablon")
            manifest.append({
                "sheetIndex": sheet_index,
                "sheet": sheet_name,
                "cell": coord,
                "field": field,
                "type": typ,
                "token": token,
            })

        for coord in spec.get("blank", []):
            ws[coord] = None

    tmp = OUT_XLSX + ".deflate.xlsx"
    wb.save(tmp)

    # STORED (sıkıştırmasız) yeniden paketle: tarayıcı inflate kütüphanesi olmadan
    # zip içeriğini okuyabilsin diye.
    with zipfile.ZipFile(tmp, "r") as zin:
        names = zin.namelist()
        with zipfile.ZipFile(OUT_XLSX, "w", compression=zipfile.ZIP_STORED) as zout:
            for n in names:
                zout.writestr(n, zin.read(n))
    os.remove(tmp)

    os.makedirs(os.path.dirname(OUT_MANIFEST), exist_ok=True)
    with open(OUT_MANIFEST, "w", encoding="utf-8") as f:
        json.dump({"template": "templates/ziraat-ek-tablo.xlsx",
                   "sheets": sheet_order,
                   "cells": manifest}, f, ensure_ascii=False, indent=2)

    print("OK ->", OUT_XLSX)
    print("OK ->", OUT_MANIFEST)
    print("manifest hucre sayisi:", len(manifest))
    # dogrulama: STORED mi?
    with zipfile.ZipFile(OUT_XLSX) as z:
        comps = set(i.compress_type for i in z.infolist())
        print("compress types (0=STORED):", comps)


if __name__ == "__main__":
    main()
