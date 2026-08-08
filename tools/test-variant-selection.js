"use strict";

/*
  Kullanici karari (docs/cumle-envanteri.md, "Varyant Secim Mekanizmasi",
  2026-08-07): rapor bazinda sabit-tohumlu (reportId'den turetilen
  deterministik hash), cumle bazinda bagimsiz secim. 2026-08-08'de
  GENISLETILDI: "tum cumle versiyonlarini admin modunda secme dugmeleri ile
  gormek istiyorum standart kullanici gorememeli" — admin icin state.fields
  .variantOverrides[sentenceKey] araciligiyla ELLE override eklendi (bkz.
  openVariantControlModal, sadece isCurrentUserAdmin() true iken UI'de
  gorunur/tetiklenebilir).

  Bu test:
  1) Cekirdek altyapiyi (getVariantSelectionSeedId/hashVariantSeedText/
     selectVariant/getAutoVariantIndex/setVariantOverride) app.js'ten
     cikarip dogrudan test eder — determinizm, cumle/rapor bazinda
     farklilasma, VE admin override'in oncelik/gecerlilik/bagimsizlik
     davranisi dahil.
  2) app.js kaynagindaki TUM registerVariantGroup(...) cagrilarini regex ile
     tarayip anahtar tekrari olmadigini dogrular (admin panelindeki kayit
     defteri).
  3) Bu altyapiyi kullanan ilk pilot fonksiyonlari (buildShareExplanation,
     composeMaterialQualitySentence, buildValuationSaleabilityExplanation,
     buildBuildingCompletionExplanation, buildEncumbranceIntroSentence) uctan
     uca dogrular.
  4) src/comparables/comparable-market-analysis.js'e enjekte edilen
     selectVariant kancasinin calistigini ve enjekte edilmezse (mevcut
     testlerle geriye donuk uyum icin) hep orijinal metni dondurdugunu
     dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function extractFn(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert(end > start, `Bulunamadi (bitis): ${endMarker} (${startMarker} sonrasi)`);
  return source.slice(start, end);
}

// --- 1) Cekirdek altyapi -----------------------------------------------
{
  const source = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = { state: {} };
  vm.createContext(context);
  vm.runInContext(source, context);

  // Determinizm: ayni reportId + ayni sentenceKey -> her zaman ayni sonuc.
  context.state = { reportId: "RE-2026-AAAAAA" };
  const first = context.selectVariant("buildFooSentence", 3);
  const second = context.selectVariant("buildFooSentence", 3);
  assert.equal(first, second, "Ayni reportId+key icin secim degismemeli (determinizm).");
  console.log("Determinizm (ayni reportId+key -> ayni secim) testi tamam.");

  // variantCount <= 1 veya gecersizse her zaman 0 (orijinal metin).
  assert.equal(context.selectVariant("x", 0), 0);
  assert.equal(context.selectVariant("x", 1), 0);
  assert.equal(context.selectVariant("x", undefined), 0);
  console.log("variantCount<=1 icin daima index 0 testi tamam.");

  // Cumle bazinda bagimsizlik: ayni rapor icinde farkli sentenceKey'ler
  // farkli secimlere dusebilmeli (hepsi ayni cikarsa "her cumle bagimsiz"
  // ilkesi bozulmus demektir).
  context.state = { reportId: "RE-2026-BBBBBB" };
  const outcomesAcrossKeys = new Set();
  for (let i = 0; i < 40; i++) {
    outcomesAcrossKeys.add(context.selectVariant(`sentence-${i}`, 3));
  }
  assert(outcomesAcrossKeys.size > 1, "40 farkli cumle anahtari icin en az 2 farkli varyant secilmeli.");
  console.log("Cumle bazinda bagimsiz secim (varyasyon var) testi tamam.");

  // Rapor bazinda farklilasma: farkli reportId'ler icin AYNI sentenceKey
  // farkli raporlarda farkli sonuclar uretebilmeli (BDDK riskini kiran asil
  // mekanizma).
  const outcomesAcrossReports = new Set();
  for (let i = 0; i < 40; i++) {
    context.state = { reportId: `RE-2026-REPORT${i}` };
    outcomesAcrossReports.add(context.selectVariant("buildImarPlanningNote", 3));
  }
  assert(outcomesAcrossReports.size > 1, "40 farkli rapor icin ayni cumle en az 2 farkli varyanta dusmeli.");
  console.log("Rapor bazinda farklilasma (BDDK riskini kiran mekanizma) testi tamam.");

  // reportId yoksa state.variantSeed'e tembel dusme + kararlilik.
  context.state = {};
  const seed1 = context.getVariantSelectionSeedId();
  assert(context.state.variantSeed, "reportId yokken variantSeed uretilip state'e yazilmali.");
  const seed2 = context.getVariantSelectionSeedId();
  assert.equal(seed1, seed2, "Ikinci cagrida ayni (onceden uretilmis) seed donmeli.");
  console.log("reportId yokken variantSeed'e tembel dusme + kararlilik testi tamam.");

  // reportId varsa variantSeed'i YOK sayar (reportId oncelikli).
  context.state = { reportId: "RE-2026-CCCCCC", variantSeed: "VS-should-be-ignored" };
  assert.equal(context.getVariantSelectionSeedId(), "RE-2026-CCCCCC", "reportId varsa variantSeed yerine o kullanilmali.");
  console.log("reportId var iken oncelik testi tamam.");
}

// --- 1b) Admin manuel override (2026-08-08 karari) ------------------------
{
  const source = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = { state: {} };
  vm.createContext(context);
  vm.runInContext(source, context);

  // Override yoksa otomatik (deterministik) sonuc donmeli.
  context.state = { reportId: "RE-2026-OVR1", fields: {} };
  const autoResult = context.selectVariant("testKey", 3);
  assert.equal(autoResult, context.getAutoVariantIndex("testKey", 3), "Override yokken selectVariant otomatik sonucla ayni olmali.");

  // Gecerli bir override selectVariant'i BAGLAMALI (otomatik sonuctan
  // FARKLI bir index secerek override'in gercekten calistigini kanitla).
  context.setVariantOverride("testKey", (autoResult + 1) % 3);
  assert.equal(context.selectVariant("testKey", 3), (autoResult + 1) % 3, "Gecerli override selectVariant sonucunu BELIRLEMELI.");
  console.log("Admin override selectVariant'i baglar testi tamam.");

  // Override kaldirilinca (null) tekrar otomatige donmeli.
  context.setVariantOverride("testKey", null);
  assert.equal(context.selectVariant("testKey", 3), autoResult, "Override kaldirilinca otomatik sonuca donulmeli.");
  console.log("Override kaldirma (otomatige donus) testi tamam.");

  // Araligin DISINDAKI override (negatif veya >=variantCount) YOK sayilip
  // otomatige duselim — bozuk/eski veri crash'e yol acmamali.
  context.setVariantOverride("testKey", 99);
  assert.equal(context.selectVariant("testKey", 3), autoResult, "Aralik disi override yok sayilip otomatige dusulmeli.");
  context.setVariantOverride("testKey", -1);
  assert.equal(context.selectVariant("testKey", 3), autoResult, "Negatif override yok sayilip otomatige dusulmeli.");
  console.log("Aralik disi/gecersiz override yok sayma testi tamam.");

  // Farkli sentenceKey'ler birbirinden BAGIMSIZ override tasimali.
  context.setVariantOverride("keyA", 0);
  context.setVariantOverride("keyB", 1);
  assert.equal(context.selectVariant("keyA", 2), 0);
  assert.equal(context.selectVariant("keyB", 2), 1);
  console.log("Cumle bazinda bagimsiz override testi tamam.");

  // Bolum bazli toplu "Orijinal/V1/V2/..." dugmeleri (0.0.372): kullanici
  // talebi "adres ve konum bolumunde V1 bastigim zaman ... tum bolumler V1
  // olmali" — applyBulkVariantOverrideForSection bir bolumdeki TUM gruplara
  // ayni hedef indeksi uygulamali, farkli sayida varyanti olan gruplar kendi
  // ust sinirina (count-1) kirpilmali, DIGER bolumlerin gruplarina DOKUNMAMALI.
  {
    context.state = { reportId: "RE-2026-BULK1", fields: {} };
    context.registerVariantGroup("bulkA", "Test Grubu A (Adres/Konum/Çevre)", 5);
    context.registerVariantGroup("bulkB", "Test Grubu B (Adres/Konum/Çevre)", 2);
    context.registerVariantGroup("bulkC", "Test Grubu C (İmar Durumu)", 5);

    context.applyBulkVariantOverrideForSection("address", 3);
    assert.equal(context.state.fields.variantOverrides.bulkA, 3, "5 varyantli grup hedef indekse (3) tam ulasmali.");
    assert.equal(context.state.fields.variantOverrides.bulkB, 1, "2 varyantli grup kendi ust sinirina (1) kirpilmali.");
    assert.equal(context.state.fields.variantOverrides.bulkC, undefined, "Baska bolumun grubuna dokunulmamali.");
    console.log("Bolum bazli toplu varyant uygulama (kirpma) testi tamam.");

    context.applyBulkVariantOverrideForSection("address", null);
    assert.equal(context.state.fields.variantOverrides.bulkA, undefined, "Otomatik'e donusce override kalkmali (grup A).");
    assert.equal(context.state.fields.variantOverrides.bulkB, undefined, "Otomatik'e donusce override kalkmali (grup B).");
    console.log("Bolum bazli toplu varyant Otomatik'e donus testi tamam.");
  }

  // Kayit defteri: app.js kaynaginda registerVariantGroup("KEY", "LABEL", COUNT)
  // cagrilarinin hepsini regex ile tara — anahtar tekrari OLMAMALI (iki
  // fonksiyon ayni anahtari kullanirsa admin panelinde cakisir ve
  // override'lar birbirine karisir). VM'de calistirmak yerine dogrudan
  // kaynak metni taramak, cagri sirasinin (registerVariantGroup'un
  // tanimlandigi yerden COK SONRA, her varyant dizisinin hemen ardinda
  // dagitik olarak cagrilmasi) test kurulumunu karmasiklastirmamasini saglar.
  const registerCalls = [...appSource.matchAll(/registerVariantGroup\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([^)]+)\)/g)];
  assert(registerCalls.length >= 17, `En az 17 registerVariantGroup cagrisi olmali (pilot fonksiyonlar), bulunan: ${registerCalls.length}`);
  const keys = registerCalls.map((match) => match[1]);
  assert.equal(new Set(keys).size, keys.length, "registerVariantGroup cagrilarinda tekrar eden anahtar OLMAMALI.");
  registerCalls.forEach((match) => {
    const [, key, label] = match;
    assert(label.length > 0, `Grup '${key}' icin okunabilir bir label olmali.`);
  });
  console.log(`registerVariantGroup kayit defteri sanity testi tamam (${registerCalls.length} grup, tekrarsiz anahtar).`);

  // Bölüm bazlı "Varyant" düğmesi (0.0.371): her grup classifyVariantGroupTopic()
  // ile bir konuya (Bölüm 1-9) sınıflandırılabilmeli, aksi halde o grup HİÇBİR
  // bölüm düğmesinde görünmez (yalnızca genel/topbar modalda kalır — sessiz bir
  // kapsam kaybı). Gerçek kaynaktan classifyVariantGroupTopic()'i izole çalıştırıp
  // yukarıda taranan TÜM etiketlerin sınıflandırılabildiğini doğrular.
  {
    const classifyStart = appSource.indexOf("function classifyVariantGroupTopic(");
    const classifyEnd = appSource.indexOf("\n}", classifyStart) + 2;
    assert(classifyStart >= 0 && classifyEnd > classifyStart, "classifyVariantGroupTopic bulunamadi.");
    const classifyContext = {};
    vm.runInNewContext(appSource.slice(classifyStart, classifyEnd), classifyContext);
    const unclassified = registerCalls
      .map((match) => match[2])
      .filter((label) => !classifyContext.classifyVariantGroupTopic(label));
    assert.equal(
      unclassified.length,
      0,
      `Su gruplar hicbir bolum konusuna siniflandirilamiyor (classifyVariantGroupTopic'e yeni bir kural eklenmeli): ${unclassified.join(", ")}`
    );
  }

  // "Açıklamalar" sekmesi merkezi gözden geçirme ekranı (0.0.377):
  // kullanıcı bildirimi — "Açık Adres" gibi pek çok otomatik-üretilen panel
  // asıl "Açıklamalar" sekmesinde görüntüleniyor, veri girişi hangi sekmede
  // olursa olsun. getVariantGroupsForSection("explanations") TÜM
  // sınıflandırılmış grupları döndürmeli (metnin fiilen göründüğü yer),
  // "address" gibi doğal bir sekme ise yalnızca kendi konusunu görmeli.
  {
    const classifyStart2 = appSource.indexOf("function classifyVariantGroupTopic(");
    const classifyEnd2 = appSource.indexOf("\n}", classifyStart2) + 2;
    const registryStart = appSource.indexOf("const VARIANT_TOPIC_TO_SECTION_IDS");
    const registryEnd = appSource.indexOf("\nfunction getVariantGroupsForSection", registryStart);
    const fnStart = appSource.indexOf("function getVariantGroupsForSection");
    const fnEnd = appSource.indexOf("\n}", fnStart) + 2;
    assert(registryStart >= 0 && registryEnd > registryStart, "VARIANT_TOPIC_TO_SECTION_IDS bulunamadi.");
    assert(fnStart >= 0 && fnEnd > fnStart, "getVariantGroupsForSection bulunamadi.");
    const sectionContext = { VARIANT_REGISTRY: registerCalls.map((match) => ({ key: match[1], label: match[2], count: 2 })) };
    vm.createContext(sectionContext);
    vm.runInContext(appSource.slice(classifyStart2, classifyEnd2), sectionContext);
    vm.runInContext(appSource.slice(registryStart, registryEnd), sectionContext);
    vm.runInContext(appSource.slice(fnStart, fnEnd), sectionContext);
    const explanationsGroups = sectionContext.getVariantGroupsForSection("explanations");
    assert.equal(
      explanationsGroups.length,
      registerCalls.length,
      `"Açıklamalar" sekmesi TÜM siniflandirilmis gruplari gostermeli (beklenen ${registerCalls.length}, bulunan ${explanationsGroups.length}).`
    );
    const addressGroups = sectionContext.getVariantGroupsForSection("address");
    assert(
      addressGroups.some((g) => g.key === "buildOpenAddressText:style"),
      "'Açık Adres' grubu 'address' sekmesinde de gorunmeli (dogal veri sekmesi)."
    );
    // Kullanıcı bildirimi (2026-08-09): Ziraat Bankası'na özel 3 aciklama
    // (buildZiraatLocationEnvironmentalExplanation/BuildingPattern/
    // DevelopmentAnalysis) etiketinde "Ziraat" gectigi icin "land" sekmesine
    // baglanmisti, ama panelleri (createZiraatExplanationSectionsPanel) FIILEN
    // "address" (Adres ve Konum) sekmesinde render ediliyor.
    assert(
      addressGroups.some((g) => g.key === "buildZiraatLocationEnvironmentalExplanation:nearby"),
      "Ziraat aciklama gruplari 'address' sekmesinde de gorunmeli (panelleri orada render ediliyor)."
    );
    assert(
      !addressGroups.some((g) => sectionContext.classifyVariantGroupTopic(g.label) === "Emsaller"),
      "'address' sekmesi baska bir konunun (Emsaller) grubunu gostermemeli."
    );
    console.log('"Açıklamalar" merkezi gozden gecirme sekmesi + dogal sekme filtresi testi tamam.');
  }
}

// --- 2) Pilot fonksiyon: buildShareExplanation --------------------------
{
  const source = extractFn(appSource, "const shareExplanationVariants", "function refreshShareExplanationFromCurrentFields");
  const infraSource = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = { state: {} };
  vm.createContext(context);
  vm.runInContext(infraSource, context);
  vm.runInContext(source, context);
  vm.runInContext("globalThis.shareExplanationVariants = shareExplanationVariants;", context);

  context.state = { reportId: "RE-2026-SHARE1" };
  const textA = context.buildShareExplanation();
  assert(context.shareExplanationVariants.includes(textA), "Donen metin taniml varyantlardan biri olmali.");
  assert.equal(textA, context.buildShareExplanation(), "Ayni rapor icin tekrar cagirinca ayni metin donmeli.");

  // Farkli raporlar arasinda cesitlilik olmali (3 varyanttan en az 2'si
  // gorulmeli — makul sayida rapor denenirse).
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    context.state = { reportId: `RE-2026-SHARE${i}` };
    seen.add(context.buildShareExplanation());
  }
  assert(seen.size > 1, "20 farkli rapor icin buildShareExplanation birden fazla varyant uretmeli.");
  console.log("buildShareExplanation() varyant secimi testi tamam.");
}

// --- 3) Pilot fonksiyon: composeMaterialQualitySentence ------------------
{
  const source = extractFn(appSource, "const materialQualitySentenceVariants", "function hasUnitBalconyOrTerrace");
  const infraSource = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = {
    state: { reportId: "RE-2026-MAT1", fields: {} },
    foldTurkish: (value) => String(value || "")
      .toLocaleUpperCase("tr-TR")
      .replace(/Ü/g, "U").replace(/Ç/g, "C").replace(/Ğ/g, "G")
      .replace(/İ/g, "I").replace(/Ö/g, "O").replace(/Ş/g, "S"),
  };
  vm.createContext(context);
  vm.runInContext(infraSource, context);
  vm.runInContext(source, context);
  vm.runInContext("globalThis.materialQualitySentenceVariants = materialQualitySentenceVariants;", context);

  context.state.fields.unitMaterialQuality = "Lüks";
  const luxuryText = context.composeMaterialQualitySentence();
  assert(context.materialQualitySentenceVariants.LUKS.includes(luxuryText), "Luks kalite icin dogru varyant havuzundan secilmeli.");

  context.state.fields.unitMaterialQuality = "Kötü";
  const poorText = context.composeMaterialQualitySentence();
  assert(context.materialQualitySentenceVariants.KOTU.includes(poorText), "Kotu kalite icin dogru varyant havuzundan secilmeli.");

  context.state.fields.unitMaterialQuality = "";
  assert.equal(context.composeMaterialQualitySentence(), "", "Kalite secilmemisse bos donmeli.");
  console.log("composeMaterialQualitySentence() varyant secimi testi tamam.");
}

// --- 4) Pilot fonksiyon: buildValuationSaleabilityExplanation ------------
{
  const source = extractFn(appSource, "const valuationSaleabilityExplanationVariants", "const valuationSaleabilityExplanationFallback");
  const infraSource = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = {
    state: { reportId: "RE-2026-SALE1", fields: { saleability: "Satılabilir" } },
    saleabilityOptions: ["Satılabilir", "Satılamaz"],
    normalizeReportDescriptionText: (value) => String(value || "").trim(),
  };
  vm.createContext(context);
  vm.runInContext(infraSource, context);
  vm.runInContext(source, context);
  vm.runInContext("globalThis.valuationSaleabilityExplanationVariants = valuationSaleabilityExplanationVariants;", context);

  const text = context.buildValuationSaleabilityExplanation();
  assert(context.valuationSaleabilityExplanationVariants.includes(text), "Satilabilir durumunda tanimli varyantlardan biri donmeli.");

  context.state.fields.saleability = "Satılamaz";
  const otherText = context.buildValuationSaleabilityExplanation();
  assert(!context.valuationSaleabilityExplanationVariants.includes(otherText), "Satilamaz durumunda varyant havuzu KULLANILMAMALI (kullanici notu serbest metin).");
  console.log("buildValuationSaleabilityExplanation() varyant secimi testi tamam.");
}

// --- 5) src/comparables/comparable-market-analysis.js enjeksiyonu -------
{
  const { buildComparableMarketAnalysisText } = require(path.join(appDir, "src", "comparables", "comparable-market-analysis.js"));

  const baseInput = {
    fields: { titleNeighborhood: "Görükle", street: "Üniversite Caddesi", legalValueUnit: "24.594" },
    rows: [
      { c2: "Satılık", c12: "110", c13: "100", c8: "-", c21: "10%", c9: "0", c22: "0%", c14: "3.800.000", c15: "3.600.000", c20: "250 m kuzeyinde" },
      { c2: "Satılmış", c12: "126", c13: "100", c8: "-", c21: "5%", c9: "-", c22: "5%", c14: "4.000.000", c20: "438 m batısında" },
    ],
  };

  // selectVariant enjekte edilmezse (mevcut testlerle geriye donuk uyum
  // icin) her zaman orijinal (index 0) metin donmeli.
  const originalText = buildComparableMarketAnalysisText(baseInput);
  assert(originalText.includes("yürütülen saha çalışmaları kapsamında"), "selectVariant verilmezse orijinal P1 metni kullanilmali.");
  assert(originalText.includes("yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler"), "selectVariant verilmezse orijinal P2 metni kullanilmali.");

  // selectVariant enjekte edilirse ve hep index 1 donerse V1 metni gelmeli.
  const variantText = buildComparableMarketAnalysisText({ ...baseInput, selectVariant: () => 1 });
  assert(variantText.includes("gerçekleştirilen yerinde incelemeler kapsamında"), "selectVariant hep 1 donerse V1 P1 metni kullanilmali.");
  assert(variantText.includes("kapsamlı piyasa incelemeleri"), "selectVariant hep 1 donerse V1 P2 metni kullanilmali.");
  assert.notEqual(originalText, variantText, "Varyant enjekte edilince metin degismeli.");
  console.log("comparable-market-analysis.js selectVariant enjeksiyonu (konut/isyeri) testi tamam.");

  // Arsa/Tarla varyanti da ayni sekilde enjekte edilebilmeli.
  const landInput = {
    fields: { ownershipType: "ARSA", titleNeighborhood: "Nilüfer", street: "" },
    rows: [{ c2: "Satılık", c24: "500", c23: "Arsa" }],
  };
  const landOriginal = buildComparableMarketAnalysisText(landInput);
  const landVariant = buildComparableMarketAnalysisText({ ...landInput, selectVariant: () => 1 });
  assert.notEqual(landOriginal, landVariant, "Arsa/Tarla varyantinda da enjeksiyon metni degistirmeli.");
  console.log("comparable-market-analysis.js selectVariant enjeksiyonu (arsa/tarla) testi tamam.");
}

// --- 6) Pilot fonksiyon: buildBuildingCompletionExplanation --------------
{
  const source = extractFn(appSource, "function buildBuildingCompletionExplanation", "function normalizeReviewedDocumentStorageRow");
  const infraSource = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = {
    state: { reportId: "RE-2026-BLD1" },
    calculateBuildingAgeText: () => "5 yıl",
  };
  vm.createContext(context);
  vm.runInContext(infraSource, context);
  vm.runInContext(source, context);

  const occupancyResult = { isoDate: "2020-01-01", source: "occupancy", documentType: "Yapı Kullanma İzin Belgesi", displayDate: "01.01.2020" };
  const text = context.buildBuildingCompletionExplanation(occupancyResult);
  assert(text.includes("01.01.2020"), "Tarih metne gelmeli.");
  assert.equal(text, context.buildBuildingCompletionExplanation(occupancyResult), "Ayni rapor+girdi icin ayni metin donmeli.");

  const noDateResult = { isoDate: "" };
  const noDateText = context.buildBuildingCompletionExplanation(noDateResult);
  assert(/belirsiz/i.test(noDateText), "Tarih tespit edilemedi varyantlarindan biri donmeli.");
  console.log("buildBuildingCompletionExplanation() varyant secimi testi tamam.");
}

// --- 7) Pilot fonksiyon: buildEncumbranceIntroSentence --------------------
{
  const source = extractFn(appSource, "function buildEncumbranceIntroSentence", "function getEncumbranceIntroSentenceForPlaceholder");
  const infraSource = extractFn(appSource, "function getVariantSelectionSeedId", "function saveState");
  const context = {
    state: { reportId: "RE-2026-ENC1", fields: { takbisDate: "2026-08-01", takbisTime: "14:30", takbisMethod: "Webtapu Sistemi" } },
    encumbranceDateOrBila: (value) => value || "Bila",
    encumbranceTextOrBila: (value) => value || "Bila",
  };
  vm.createContext(context);
  vm.runInContext(infraSource, context);
  vm.runInContext(source, context);

  const text = context.buildEncumbranceIntroSentence();
  assert(text.includes("TAKBİS"), "TAKBIS kelimesi metne gelmeli.");
  assert.equal(text, context.buildEncumbranceIntroSentence(), "Ayni rapor icin ayni metin donmeli.");

  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    context.state.reportId = `RE-2026-ENC${i}`;
    seen.add(context.buildEncumbranceIntroSentence());
  }
  assert(seen.size > 1, "20 farkli rapor icin en az 2 farkli varyant gorulmeli.");
  console.log("buildEncumbranceIntroSentence() varyant secimi testi tamam.");
}

console.log("Tum varyant-secim testleri basarili.");
