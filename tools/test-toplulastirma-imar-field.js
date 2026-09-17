"use strict";

/*
  Kullanici talebi (2026-09-17): "tapu ve takyidat kayıtlarında tüm
  raporlar için eğer toplulaştırma ibaresi geçiyor ise; İmar Durumu
  bölümüne en alt kısıma Toplulaştırma Durumu bölümü eklensin. Seçenekler:
  Devam Ediyor ve Tamamlanmış." + ayni turda takip 1: "Ayrıca Toplulaştırma
  yapan Kurum Kısmı da olmalı." + ayni turda takip 2 (DUZELTME): "sadece
  takyidat bölümünde toplulaştırma ibaresi geçiyor ise edinme sebebini
  karıştırma. edinme sebebi toplulaştırma ise zaten toplulaştırma
  tamamlanmıştır." + ERTESI GUN takip 3 (YENIDEN KONUMLANDIRMA): "toplulaştırma
  durumu ve toplulaştırmayı yapan kurum bölümlerini Taşınmazın imar
  durumunda sorun var mı bölümüne taşı. eğer takyidat kayıtlarında
  toplulaştırma ibaresi var ise otomatik açılsın toplulaştırma ile ilgili
  bölüm ayrıca toplulaştırmayı yapan kurumu ve toplulaştırma durumunu tek
  bir hücrede gerekiyorsa pop up ile göster."

  "İmar Durumu" (planning) bölümüne iki YENİ, KOŞULLU alan eklendi:
  - toplulastirmaStatus (select: Devam Ediyor / Tamamlanmış)
  - toplulastirmaInstitution (text, serbest — kurum adı raporlar arasinda
    cok degisken, diger "kurum" alanlarinin coguyla AYNI serbest-metin
    deseni, ör. documentReviewInstitution)
  Ikisi de SADECE reportMentionsToplulastirma() true iken gorunur
  (shouldHideField'in "planning" dali) — mulkiyet turunden BAGIMSIZ, TUM
  rapor turlerinde gecerli (kullanicinin "tum raporlar icin" talebi).

  Takip 3 (2026-09-18) ile: (a) section.fields dizisinde konumlari
  hasPlanningIssue'nun ("Taşınmazın İmar Durumunda Sorun Var mı?") HEMEN
  ARDINA tasindi (eski konum: en alt, planningNote'tan sonra); (b) createForm()
  hasPlanningIssue'yu render ederken KOSULLU olarak createToplulastirmaControl()'u
  hemen ardina ekliyor (floorCount/hmax ÇİFTİYLE AYNI "tetikleyicide render
  et, takipçi alanlarin generic render'ini atla" deseni) — hasPlanningIssue'nun
  KENDI Evet/Hayır degerinden BAGIMSIZ, TEK tetikleyici reportMentionsToplulastirma();
  (c) iki alan artik TEK bir hucrede (ozet dugme, createRoadSetbackControl/
  createBuildingSocialFacilitiesControl İLE AYNI "ozet + pop-up" deseni)
  birlestirilip openToplulastirmaModal() pop-up'inda birlikte duzenleniyor.

  reportMentionsToplulastirma() ILK surumde Tapu'nun Malikler tablosundaki
  "Edinme sebebi" sutununu VE Nitelik alanlarini (titleQuality/mainPropertyQuality)
  DA taryordu — kullanici bunu YANLIS buldu: "Edinme sebebi: Toplulaştırma"
  zaten TAMAMLANMIŞ bir toplulaştırmanın kanıtıdır (mülkiyet O YOLLA
  edinilmiş), "Devam Ediyor" durumunu ayirt etmek icin anlamli bir sinyal
  DEGILDIR. Artik SADECE Takyidat (encumbranceDeclarations/Annotations/
  Mortgages, her satirin TUM hucreleri — hangi sutunda gectigi ONEMSIZ,
  generic Object.values() ile) + Takyidat aciklamasi (takbisSummary,
  serbest metin) taraniyor — Tapu (title) tablosu/Nitelik alanlari KAPSAM
  DISI. Coklu Talep raporlarinda TUM tasinmazlar kontrol edilir
  (buildAllTitleUnitsForSummaryTable).

  Bu test:
  1) reportMentionsToplulastirma() GERCEK kaynagindan, buildAllTitleUnitsForSummaryTable()
     STUB'lanarak (bu agir/coklu-bagimlilikli makineyi tekrar calistirmadan,
     bu fonksiyonun KENDI mantigini izole test etmek icin) her tarama
     kaynagini (Takyidat aciklamasi, Beyan/Serh/Ipotek tablolari, coklu
     tasinmaz, buyuk/kucuk harf ve Turkce karakter duyarsizligi, yanlis-
     pozitif OLMAMASI) VE Tapu/Edinme-sebebi/Nitelik alanlarinin ARTIK
     KAPSAM DISI oldugunu (kullanicinin duzeltme talebi) dogrular.
  2) Kaynak-duzeyinde: shouldHideField()'in "planning" dali iki YENI alani
     dogru kosula (!reportMentionsToplulastirma()) bagliyor mu.
  3) Kaynak-duzeyinde: "planning" section.fields dizisinde iki alanin
     hasPlanningIssue'nun HEMEN ARDINA tasindigini (eski en-alt konumunda
     OLMADIGINI) dogrular.
  4) Kaynak-duzeyinde: createForm()'un hasPlanningIssue'yu render ederken
     kosullu createToplulastirmaControl() eklendigini + iki alanin KENDI
     generic render'inin atlandigini dogrular.
  5) formatToplulastirmaSummary() GERCEK kaynagindan (bos/kismi/dolu "Durum
     — Kurum" ozetleme) calistirilir.
  6) createToplulastirmaControl() DOM stub ile GERCEKTEN calistirilir: tek
     'field' hucresi, ozet dugmesi mevcut degerleri gosterir, tiklaninca
     openToplulastirmaModal() (stub'lanmis) cagrilir.
  7) Kaynak-duzeyinde: openToplulastirmaModal() iki alani TEK pop-up'ta
     birlikte duzenleyip Kaydet'te ikisini de yaziyor mu.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

function sliceConst(name) {
  return sliceFn(`const ${name} = [`, { toMarker: "];" }) + "];";
}

function makeContext(unitsFixture) {
  const context = {
    buildAllTitleUnitsForSummaryTable: () => unitsFixture,
  };
  vm.createContext(context);
  vm.runInContext(sliceFn("function foldTurkish("), context);
  vm.runInContext(sliceConst("TOPLULASTIRMA_SCANNED_TABLE_KEYS"), context);
  vm.runInContext(sliceConst("TOPLULASTIRMA_SCANNED_FIELD_KEYS"), context);
  vm.runInContext(sliceFn("function reportMentionsToplulastirma("), context);
  return context;
}

function check(unitsFixture) {
  return makeContext(unitsFixture).reportMentionsToplulastirma();
}

// --- 0) Taranan kaynaklar KESIN olarak Takyidat'la sinirli ------------------
//        (kaynak-duzeyinde dogrudan liste kontrolu — regresyon kilidi).
{
  const tableKeysSrc = sliceConst("TOPLULASTIRMA_SCANNED_TABLE_KEYS");
  assert.doesNotMatch(tableKeysSrc, /"title"/, "'title' (Tapu/Malikler) tablosu HALA taraniyor — kullanicinin duzeltme talebiyle CELISIYOR.");
  ["encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages"].forEach((key) => {
    assert.match(tableKeysSrc, new RegExp(`"${key}"`), `'${key}' taranan tablolar listesinde eksik.`);
  });
  const fieldKeysSrc = sliceConst("TOPLULASTIRMA_SCANNED_FIELD_KEYS");
  assert.doesNotMatch(fieldKeysSrc, /"titleQuality"/, "'titleQuality' (Tapu Nitelik) HALA taraniyor — kullanicinin duzeltme talebiyle CELISIYOR.");
  assert.doesNotMatch(fieldKeysSrc, /"mainPropertyQuality"/, "'mainPropertyQuality' (Ana taşınmaz niteliği) HALA taraniyor — kullanicinin duzeltme talebiyle CELISIYOR.");
  assert.match(fieldKeysSrc, /"takbisSummary"/, "'takbisSummary' (Takyidat açıklaması) taranan alanlar listesinde eksik.");
}
console.log("Taranan kaynaklar SADECE Takyidat ile sinirli (kaynak-duzeyi regresyon kilidi) testi tamam.");

// --- 1) Hicbir yerde "toplulastirma" gecmiyorsa false ----------------------
{
  const units = [{
    fields: { titleQuality: "Tarla", takbisSummary: "Herhangi bir sorun yok." },
    tables: {
      title: [{ c0: "Ahmet Yılmaz", c1: "1/1", c2: "Satış", c3: "01.01.2020", c4: "1234" }],
      encumbranceAnnotations: [{ c0: "Şerh", c1: "Kamulaştırma şerhi", c2: "", c3: "01.01.2021", c4: "5678", c5: "" }],
    },
  }];
  assert.equal(check(units), false, "Hicbir takyidat kaydinda 'toplulastirma' gecmiyorken yanlislikla true donuyor.");
}
console.log("Bos/ilgisiz veri -> false testi tamam.");

// --- 2) KULLANICI DUZELTMESI: Tapu (Malikler Edinme Sebebi + Nitelik ------
//        alanlari) ARTIK KAPSAM DISI — "toplulaştırma" gecse bile TEK
//        BASINA tetiklememeli (Takyidat'ta hicbir sey yoksa).
{
  assert.equal(
    check([{ fields: { titleQuality: "Tarla (Toplulaştırma Alanı)" }, tables: {} }]),
    false,
    "titleQuality (Tapu Nitelik) ARTIK taranmamali — kullanicinin 'edinme sebebini karistirma' duzeltmesiyle CELISIYOR."
  );
  assert.equal(
    check([{ fields: { mainPropertyQuality: "Toplulaştırma sonucu oluşan parsel" }, tables: {} }]),
    false,
    "mainPropertyQuality ARTIK taranmamali."
  );
  assert.equal(
    check([{ fields: {}, tables: { title: [{ c0: "Mehmet Kaya", c1: "1/1", c2: "Toplulaştırma", c3: "05.05.2019", c4: "999" }] } }]),
    false,
    "Malikler tablosunun 'Edinme sebebi' sutunundaki 'Toplulaştırma' ARTIK yakalanmamali (kullanici: 'edinme sebebi toplulaştırma ise zaten toplulaştırma tamamlanmıştır', bu DURUM tespiti icin kullanilmamali)."
  );
}
console.log("KULLANICI DUZELTMESI: Tapu/Edinme Sebebi/Nitelik alanlari kapsam disi testi tamam.");

// --- 3) Takyidat açıklaması (takbisSummary) HALA taraniyor ------------------
{
  assert.equal(
    check([{ fields: { takbisSummary: "Parsel toplulaştırma kapsamındadır." }, tables: {} }]),
    true,
    "takbisSummary (Takyidat açıklaması) icindeki 'toplulaştırma' yakalanmadi."
  );
}
console.log("Takyidat açıklaması (takbisSummary) tespiti testi tamam.");

// --- 4) Takyidat tablolarinin HERHANGI bir hucresinde gecerse true --------
//        (Beyanlar/Şerhler/İpotekler — hangi sutunda oldugu ONEMSIZ).
{
  assert.equal(
    check([{ fields: {}, tables: { encumbranceDeclarations: [{ c0: "Beyan", c1: "Toplulaştırma nedeniyle beyan", c2: "", c3: "", c4: "" }] } }]),
    true,
    "encumbranceDeclarations'taki 'Toplulaştırma' yakalanmadi."
  );
  assert.equal(
    check([{ fields: {}, tables: { encumbranceAnnotations: [{ c0: "Toplulaştırma Şerhi", c1: "", c2: "", c3: "", c4: "", c5: "" }] } }]),
    true,
    "encumbranceAnnotations'in Tur sutunundaki 'Toplulaştırma' yakalanmadi (hangi sutunda oldugu ONEMSIZ olmali)."
  );
  assert.equal(
    check([{ fields: {}, tables: { encumbranceMortgages: [{ c0: "T.C. Ziraat Bankası", c1: "1. Derece Toplulaştırma İpoteği", c2: "", c3: "", c4: "", c5: "" }] } }]),
    true,
    "encumbranceMortgages icindeki 'Toplulaştırma' yakalanmadi."
  );
}
console.log("Takyidat (Beyan/Şerh/İpotek) tablolari tespiti testi tamam.");

// --- 5) Buyuk/kucuk harf + Turkce karakter duyarsizligi (Takyidat uzerinden) -
{
  ["TOPLULAŞTIRMA", "toplulaştırma", "ToPluLaştırma", "TOPLULASTIRMA"].forEach((variant) => {
    assert.equal(
      check([{ fields: { takbisSummary: `Parsel ${variant} alanındadır.` }, tables: {} }]),
      true,
      `'${variant}' yazim varyanti yakalanmadi (buyuk/kucuk harf veya Turkce karakter duyarliligi sorunu).`
    );
  });
}
console.log("Buyuk/kucuk harf ve Turkce karakter duyarsizligi testi tamam.");

// --- 6) Coklu Talep: SADECE 2. tasinmazin Takyidat kaydinda gecerse yine ---
//        true (hepsi taranir).
{
  const units = [
    { fields: { takbisSummary: "" }, tables: {} },
    { fields: {}, tables: { encumbranceAnnotations: [{ c0: "Toplulaştırma Şerhi", c1: "", c2: "", c3: "", c4: "", c5: "" }] } },
  ];
  assert.equal(check(units), true, "Coklu Talep'te yalnizca IKINCI tasinmazin Takyidat kaydindaki 'Toplulaştırma' yakalanmadi.");
}
console.log("Coklu Talep (birden fazla tasinmaz) tarama testi tamam.");

// --- 7) Yanlis-pozitif OLMAMALI: benzer ama farkli kelimeler eslesmemeli ---
//        (Takyidat kaynaklari uzerinden — bu artik GERCEK taranan alan).
{
  assert.equal(
    check([{ fields: { takbisSummary: "Toplu Konut Alanı" }, tables: {} }]),
    false,
    "'Toplu Konut' yanlislikla 'Toplulaştırma' ile eslesti (yanlis-pozitif)."
  );
  assert.equal(
    check([{ fields: {}, tables: { encumbranceAnnotations: [{ c0: "Yapılaştırma koşullarına uygun", c1: "", c2: "", c3: "", c4: "", c5: "" }] } }]),
    false,
    "'Yapılaştırma' yanlislikla 'Toplulaştırma' ile eslesti (yanlis-pozitif)."
  );
}
console.log("Yanlis-pozitif OLMAMASI (benzer kelimeler) regresyon testi tamam.");

// --- 8) Kaynak-duzeyi: shouldHideField() 'planning' dali dogru kosula ------
//        bagli mi.
{
  const shouldHideSrc = sliceFn("function shouldHideField(");
  assert.match(
    shouldHideSrc,
    /sectionId === "planning" && \["toplulastirmaStatus", "toplulastirmaInstitution"\]\.includes\(fieldKey\)\) \{\s*\n\s*return !reportMentionsToplulastirma\(\);/,
    "shouldHideField()'in 'planning' dali toplulastirmaStatus/toplulastirmaInstitution'i reportMentionsToplulastirma()'ya dogru baglamiyor."
  );
}
console.log("shouldHideField() 'planning' dali kaynak-duzeyi kablolama testi tamam.");

// --- 9) KULLANICI TAKİP TALEBİ (2026-09-18): "toplulaştırma durumu ve ------
//        toplulaştırmayı yapan kurum bölümlerini Taşınmazın imar durumunda
//        sorun var mı bölümüne taşı" — iki alan artik "planning"
//        section.fields dizisinde hasPlanningIssue'nun HEMEN ARDINDA (eski
//        konumu: en altta, planningNote'tan SONRA — ARTIK ORADA DEGIL).
{
  const planningSectionStart = appSource.indexOf('id: "planning",');
  assert(planningSectionStart >= 0, "'planning' section bulunamadi.");
  const fieldsEnd = appSource.indexOf("\n    ],", planningSectionStart);
  const sectionSrc = appSource.slice(planningSectionStart, fieldsEnd);

  assert.match(
    sectionSrc,
    /\{ key: "hasPlanningIssue"[^}]*\},\s*\n(?:\s*\/\/[^\n]*\n)*\s*\{ key: "toplulastirmaStatus", label: "Toplulaştırma Durumu", type: "select", options: \["", "Devam Ediyor", "Tamamlanmış"\] \},\s*\n\s*\{ key: "toplulastirmaInstitution", label: "Toplulaştırmayı Yapan Kurum", type: "text" \},\s*\n\s*\{ key: "planCancellationStay"/,
    "İki yeni alan 'hasPlanningIssue'nun HEMEN ARDINDA (planCancellationStay'den ONCE) degil."
  );
  assert.doesNotMatch(
    sectionSrc.slice(sectionSrc.indexOf("planningNote")),
    /toplulastirmaStatus/,
    "İki alan HALA eski konumunda (planningNote'tan SONRA, en altta) duruyor — tasima YAPILMAMIS."
  );
}
console.log("'planning' section.fields: iki alan hasPlanningIssue'nun ardina TASINDI testi tamam.");

// --- 10) Kaynak-duzeyi: createForm()'un 'planning' dali hasPlanningIssue'yu
//         render ettikten HEMEN SONRA (kosullu olarak) createToplulastirmaControl()
//         ekliyor mu; toplulastirmaStatus/Institution'in KENDI generic
//         render'i (select/text) atlaniyor mu (floorCount/hmax ÇİFTİYLE
//         AYNI "tetikleyicide render et, takipçilerini atla" deseni).
//         KULLANICI BULGUSU (2026-09-18, ekran goruntusu): admin hesabiyla,
//         takyidatta HİÇ "toplulaştırma" gecmeyen bir raporda hucre HALA
//         gorunuyordu — bir onceki turda eklenen isCurrentUserAdmin() admin-
//         bypass'i YANLIŞTI ve kaldirildi; asagidaki regex artik BU
//         bypass'in OLMADIGINI da dogruluyor (sadece reportMentionsToplulastirma()).
{
  const createFormSrc = sliceFn("function createForm(section) {");
  assert.match(
    createFormSrc,
    /section\.id === "planning" && field\.key === "hasPlanningIssue"\) \{\s*\n\s*form\.append\(createCheckboxControl\(section, field\)\);\s*\n\s*if \(reportMentionsToplulastirma\(\)\) \{\s*\n\s*form\.append\(createToplulastirmaControl\(\)\);/,
    "createForm() 'hasPlanningIssue' render edildiginde kosullu olarak createToplulastirmaControl() eklemiyor."
  );
  {
    const blockStart = appSource.indexOf('if (section.id === "planning" && field.key === "hasPlanningIssue") {');
    assert(blockStart >= 0, "hasPlanningIssue intercept bloğu bulunamadı.");
    const blockEnd = appSource.indexOf("\n    }", blockStart);
    assert.doesNotMatch(
      appSource.slice(blockStart, blockEnd),
      /isCurrentUserAdmin/,
      "REGRESYON: admin-bypass (isCurrentUserAdmin()) GERI EKLENMIS — kullanicinin ekran goruntusuyle bildirdigi soruna geri donus."
    );
  }
  assert.match(
    createFormSrc,
    /section\.id === "planning" && \(field\.key === "toplulastirmaStatus" \|\| field\.key === "toplulastirmaInstitution"\)\) \{\s*\n\s*return;/,
    "createForm() toplulastirmaStatus/toplulastirmaInstitution'in KENDI generic render'ini atlamiyor (cift render riski)."
  );
}
console.log("createForm() 'planning' dali: hasPlanningIssue -> Toplulaştırma kontrolu kaynak-duzeyi kablolama testi tamam.");

// --- 11) formatToplulastirmaSummary(): bos/kismi/dolu durumlar ------------
{
  const context = { state: { fields: {} } };
  vm.createContext(context);
  vm.runInContext(sliceFn("function formatToplulastirmaSummary("), context);

  context.state.fields = {};
  assert.equal(context.formatToplulastirmaSummary(), "Bilgi girilmedi (düzenlemek için tıklayın)", "Bos durumda yer tutucu metin yanlis.");

  context.state.fields = { toplulastirmaStatus: "Devam Ediyor" };
  assert.equal(context.formatToplulastirmaSummary(), "Devam Ediyor", "Sadece Durum doluyken ozet yanlis.");

  context.state.fields = { toplulastirmaInstitution: "Tarım ve Orman Bakanlığı" };
  assert.equal(context.formatToplulastirmaSummary(), "Tarım ve Orman Bakanlığı", "Sadece Kurum doluyken ozet yanlis.");

  context.state.fields = { toplulastirmaStatus: "Tamamlanmış", toplulastirmaInstitution: "Tarım ve Orman Bakanlığı" };
  assert.equal(
    context.formatToplulastirmaSummary(),
    "Tamamlanmış — Tarım ve Orman Bakanlığı",
    "Ikisi de doluyken ozet 'Durum — Kurum' bicimini kullanmiyor (kullanicinin 'tek bir hucrede' talebi)."
  );
}
console.log("formatToplulastirmaSummary() (tek hucre ozeti) testi tamam.");

// --- 12) createToplulastirmaControl(): tek bir 'field' hucresi dondurur, --
//         ozet dugmesine tiklamak openToplulastirmaModal()'i cagirir (pop-up
//         tetikleyicisi, kullanicinin 'gerekirse pop up ile goster' talebi).
{
  function makeElementStub(tag) {
    const el = { tagName: String(tag || "").toUpperCase(), className: "", textContent: "", children: [], _listeners: {},
      append(...nodes) { el.children.push(...nodes); },
      addEventListener(type, handler) { el._listeners[type] = handler; },
      fire(type) { el._listeners[type]?.(); },
    };
    return el;
  }
  let modalOpenCalls = 0;
  const context = {
    state: { fields: { toplulastirmaStatus: "Devam Ediyor", toplulastirmaInstitution: "Tarım ve Orman Bakanlığı" } },
    document: { createElement: (tag) => makeElementStub(tag) },
    createSpan: (text) => { const span = makeElementStub("span"); span.textContent = text; return span; },
    openToplulastirmaModal: (onSave) => { modalOpenCalls += 1; onSave(); },
  };
  vm.createContext(context);
  vm.runInContext(sliceFn("function formatToplulastirmaSummary("), context);
  vm.runInContext(sliceFn("function createToplulastirmaControl("), context);

  const control = context.createToplulastirmaControl();
  assert.equal(control.tagName, "LABEL", "createToplulastirmaControl() bir <label> dondurmuyor.");
  assert.equal(control.className, "field", "Tek hucre 'field' sinifini kullanmiyor.");
  const [spanEl, button] = control.children;
  assert.equal(spanEl.textContent, "Toplulaştırma Bilgileri", "Etiket metni yanlis.");
  assert.equal(button.tagName, "BUTTON", "Ozet dugmesi bulunamadi.");
  assert.equal(button.className, "multi-checkbox-summary", "Ozet dugmesi dogru gorsel sinifi kullanmiyor.");
  assert.equal(button.textContent, "Devam Ediyor — Tarım ve Orman Bakanlığı", "Ozet dugmesi mevcut degerleri yansitmiyor.");

  button.fire("click");
  assert.equal(modalOpenCalls, 1, "Ozet dugmesine tiklamak openToplulastirmaModal()'i cagirmadi (pop-up acilmiyor).");
}
console.log("createToplulastirmaControl() (tek hucre + pop-up tetikleyici) testi tamam.");

// --- 13) Kaynak-duzeyi: openToplulastirmaModal() iki alani TEK pop-up'ta --
//         birlikte duzenleyip Kaydet'te HER IKISINI de yaziyor.
{
  const modalSrc = sliceFn("function openToplulastirmaModal(");
  assert.match(modalSrc, /data-toplulastirma-status/, "Pop-up'ta Toplulaştırma Durumu secimi yok.");
  assert.match(modalSrc, /data-toplulastirma-institution/, "Pop-up'ta Toplulaştırmayı Yapan Kurum alani yok.");
  assert.match(
    modalSrc,
    /data-toplulastirma-save[\s\S]{0,300}state\.fields\.toplulastirmaStatus\s*=\s*statusSelect\.value;\s*\n\s*state\.fields\.toplulastirmaInstitution\s*=\s*institutionInput\.value;/,
    "'Kaydet' dugmesi HER IKI alani da (Durum + Kurum) yazmiyor."
  );
  assert.match(modalSrc, /data-toplulastirma-cancel/, "'Vazgeç' dugmesi bulunamadi.");
}
console.log("openToplulastirmaModal() (tek pop-up, iki alan birlikte) kaynak-duzeyi testi tamam.");

console.log("Toplulaştırma Durumu / Toplulaştırmayı Yapan Kurum (İmar Durumu, koşullu, SADECE Takyidat, tek hücre + pop-up) testleri başarılı.");
