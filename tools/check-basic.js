const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const neighborhoodHelpers = require(path.join(root, "server.js"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function checkFileExists(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} bulunamadi.`);
}

function runNodeSyntaxCheck(relativePath) {
  execFileSync(process.execPath, ["--check", path.join(root, relativePath)], {
    cwd: root,
    stdio: "pipe"
  });
}

function listJavaScriptFiles(relativeDir) {
  const fullDir = path.join(root, relativeDir);
  if (!fs.existsSync(fullDir)) {
    return [];
  }

  return fs.readdirSync(fullDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      return listJavaScriptFiles(relativePath);
    }
    return entry.isFile() && entry.name.endsWith(".js") ? [relativePath] : [];
  });
}

function main() {
  ["index.html", "app.js", "styles.css", "server.js"].forEach(checkFileExists);

  ["app.js", "server.js", "cloud/cloud-sync.js", "cloud/report-library.js", ...listJavaScriptFiles("src")].forEach(runNodeSyntaxCheck);

  const indexHtml = readText("index.html");
  assert(indexHtml.includes("installCompatibilityFixes"), "index.html uyumluluk blogu bulunamadi.");
  assert(
    indexHtml.includes("ReadableStream.prototype[Symbol.asyncIterator]"),
    "iOS PDF icin ReadableStream async iterator duzeltmesi bulunamadi."
  );
  assert(indexHtml.includes("Promise.try"), "pdf.js icin Promise.try guvencesi bulunamadi.");
  assert(indexHtml.includes("Uint8Array.fromBase64"), "pdf.js icin Uint8Array.fromBase64 guvencesi bulunamadi.");
  assert(indexHtml.includes('overlay.setAttribute("data-ios-lite", "true")'), "iOS gate hafif mod isareti bulunamadi.");
  assert(indexHtml.includes('for (var i = 0; !isIOS && i < 10; i++)'), "iOS gate parcacik uretimi kapatilmis gorunmuyor.");
  assert(!indexHtml.includes('window.addEventListener("load", () =>'), "index.html icinde eski Safari icin riskli arrow load listener kalmis.");

  const appJs = readText("app.js");
  const stylesCss = readText("styles.css");
  const serverJs = readText("server.js");
  const leafletJs = readText("vendor/leaflet/leaflet.js");
  const cloudSyncJs = readText("cloud/cloud-sync.js");
  const reportLibraryJs = readText("cloud/report-library.js");
  const accessControlJs = readText("src/auth/access-control.js");
  assert(
    indexHtml.includes('<title>Experify</title>') &&
      indexHtml.includes('<h1>Experify</h1>') &&
      indexHtml.includes('<p>Yarı Otomatik Rapor Oluşturma</p>'),
    "Experify marka metinleri bulunamadi."
  );
  const locationMapToolsSource = appJs.slice(
    appJs.indexOf("function createLocationMapTools()"),
    appJs.indexOf("function formatUploadErrorDetails"),
  );
  assert(
    !locationMapToolsSource.includes('<div class="kml-summary">') &&
      !locationMapToolsSource.includes("data-kml-map") &&
      !locationMapToolsSource.includes("data-kml-apply") &&
      !locationMapToolsSource.includes("data-map-export-ratio>") &&
      !locationMapToolsSource.includes("KML yüklendikten sonra haritadan nihai konumu işaretleyebilirsiniz.") &&
      locationMapToolsSource.includes("data-map-export-menu") &&
      locationMapToolsSource.includes("data-map-export-ratio-option") &&
      locationMapToolsSource.includes("exportMapAsJpeg(mapExportMenuButton)") &&
      locationMapToolsSource.includes('<div class="user-poi-tools">') &&
      locationMapToolsSource.includes('<div class="user-poi-statuses">') &&
      locationMapToolsSource.includes('"Kroki Kaydet"') &&
      locationMapToolsSource.indexOf("data-map-save") > locationMapToolsSource.indexOf("data-user-poi-name") &&
      locationMapToolsSource.indexOf("data-map-export-menu") > locationMapToolsSource.indexOf("data-user-poi-name") &&
      locationMapToolsSource.indexOf("data-user-poi-refresh") > locationMapToolsSource.indexOf("data-map-export-menu") &&
      !locationMapToolsSource.includes('<div class="kml-actions">') &&
      appJs.includes("const originalButtonHtml = triggerButton?.innerHTML") &&
      appJs.includes('triggerButton.innerHTML = originalButtonHtml || "JPG"') &&
      locationMapToolsSource.includes("<span>JPG</span>") &&
      !appJs.includes("mapExportLabels") &&
      !locationMapToolsSource.includes("Önemli noktalar belirtilsin mi?") &&
      !locationMapToolsSource.includes("data-map-export-labels") &&
      locationMapToolsSource.includes('class="field compact-field map-mode-field map-mode-overlay"') &&
      stylesCss.includes(".map-panel-wrap") &&
      stylesCss.includes(".map-mode-overlay") &&
      stylesCss.includes("width: min(100px, calc(100% - 76px));") &&
      stylesCss.includes(".map-mode-overlay select") &&
      stylesCss.includes("background: rgba(255, 255, 255, 0.5);") &&
      stylesCss.includes(".user-poi-tools .compact-field input") &&
      stylesCss.includes("border-color: #d2d4ee;"),
    "Harita ozet seridi veya harita araclarinin yeni yerlesimi korunmuyor."
  );
  assert(
    accessControlJs.includes('const ADMIN_EMAIL = "canlilar.melih@gmail.com"') &&
      accessControlJs.includes('return normalizeEmail(email) === ADMIN_EMAIL ? "admin" : "user"'),
    "Admin ve kullanici rol cozumu korunmuyor."
  );
  assert(
    appJs.includes('adminOnly: true') &&
      appJs.includes("shouldHideSectionForAccess") &&
      appJs.includes("window.RaporAccessControl") &&
      cloudSyncJs.includes("RaporAccessControl?.setCurrentUser") &&
      cloudSyncJs.includes('role: window.RaporAccessControl?.getRole?.() || "user"') &&
      reportLibraryJs.includes("library-role-badge"),
    "Rol tabanli ekran gorunurlugu veya oturum baglantisi korunmuyor."
  );
  assert(
    reportLibraryJs.includes("function openDashboardAfterAuthentication()") &&
      reportLibraryJs.includes("openDashboardAfterAuthentication();") &&
      !reportLibraryJs.includes("DASHBOARD_SESSION_FLAG_KEY") &&
      !reportLibraryJs.includes("maybeAutoShowDashboardOnFreshSession"),
    "Kullanici girisinden sonra Taleplerim ekranina yonlendirme korunmuyor."
  );
  assert(
      reportLibraryJs.includes('actions.insertBefore(button, saveButton)') &&
      reportLibraryJs.includes('id="librarySignOut"') &&
      reportLibraryJs.includes('id="librarySignOutSlot"') &&
      reportLibraryJs.includes("signOutAndClearLocalData") &&
      cloudSyncJs.includes("async function signOutAndClearLocalData()") &&
      !cloudSyncJs.includes('id="cloudSignOut"') &&
      stylesCss.includes(".library-sign-out-button"),
    "Taleplerim ana sayfa gecisi veya cikis dugmesi konumu korunmuyor."
  );
  assert(
    reportLibraryJs.includes("function deriveDocumentStatus(status = {}, fields = {})") &&
      reportLibraryJs.includes("cloudData.payload?.fields") &&
      reportLibraryJs.includes('["Evet", "Hayır"].includes(String(fields.hasEkb || "").trim())') &&
      reportLibraryJs.includes("Eksik Alan = ${missingCount}") &&
      stylesCss.includes(".library-missing-fields"),
    "Bulut belge durumlari veya eksik alan sayaci korunmuyor."
  );
  assert(
    cloudSyncJs.includes("function buildCloudMapState()") &&
      cloudSyncJs.includes("payload.mapState = buildCloudMapState()") &&
      cloudSyncJs.includes("function applyCloudMapState(mapState)") &&
      reportLibraryJs.includes("sourceValues: {") &&
      reportLibraryJs.includes("cloudData.payload.mapState?.kml") &&
      appJs.includes("parsed?.centroid") &&
      appJs.includes("parsed?.coordinates?.[0]"),
    "Buluttan acilan raporlarda harita/kroki durumu korunmuyor."
  );
  assert(
    appJs.includes("function syncRenderedAddressFields()") &&
      appJs.includes("return Object.keys(previousValues).some") &&
      appJs.includes("function isNearbyPlaceInAddressRadius") &&
      appJs.includes("distance <= nearbySelectionRadiusMeters") &&
      appJs.includes("clearOutOfRangeMainArterySelection") &&
      !appJs.includes("function autoSelectMainArtery") &&
      !appJs.includes("function getNearestNearbySelectionIds") &&
      appJs.includes("function getMapLabelPlaces()") &&
      appJs.includes("selectionCustomized: true") &&
      appJs.includes("nearbySource.selectionCustomized") &&
      appJs.includes(": [],") &&
      appJs.includes("const selectedArteryId = String(state.fields.mainArteryId") &&
      cloudSyncJs.includes("selectionCustomized: Boolean(source.nearbyPlaces.selectionCustomized)") &&
      cloudSyncJs.includes("hydrateImportedAddressAdministrativeFields(state)"),
    "Adres yukleme, 1 km POI siniri veya secili olmayan harita noktasi kurali korunmuyor."
  );
  assert(
    appJs.includes("function parseStoredMultiCheckboxOptions") &&
      appJs.includes("if (candidates.includes(text)) return [text]") &&
      appJs.includes("const separatorMatch = text.slice(optionEnd).match(/^,\\s*/)") &&
      appJs.includes("const effectiveField = { ...field, options }") &&
      appJs.includes("parseStoredMultiCheckboxOptions(text, field.options || [])"),
    "Virgul iceren Bolge Yapilasma Kullanim Amaci seceneklerinin kayit sonrasi geri yuklenmesi korunmuyor."
  );
  assert(
    !indexHtml.includes("gate-theme-toggle") &&
      !indexHtml.includes("rapor-gate-theme") &&
      !stylesCss.includes(".gate-theme-toggle") &&
      !stylesCss.includes('[data-gate-theme="light"]'),
    "Giris kapisindaki gece/gunduz tema denetimi kaldirilmamis gorunuyor."
  );
  assert(
    indexHtml.includes('id="themeSettingsBtn"') &&
      indexHtml.includes('id="themeSettingsPanel"') &&
      !indexHtml.includes('id="newCaseBtn"') &&
      appJs.includes("themeStorageKeyForCurrentUser") &&
      appJs.includes("window.RaporThemeProfile = { applyForCurrentUser: applyThemeForCurrentUser }") &&
      cloudSyncJs.includes("window.RaporThemeProfile?.applyForCurrentUser?.();") &&
      stylesCss.includes(".brand-settings-button") &&
      stylesCss.includes(".theme-settings-panel"),
    "Kullaniciya ozel tema ayarlari veya aktif is dosyasi duzeni korunmuyor."
  );
  assert(
    appJs.includes("function getCompactBankStatusLabel(bankName)") &&
      appJs.includes('"Kuveyt Türk Katılım Bankası A.Ş.": "Kuveyt Türk"') &&
      appJs.includes("bankStatus.textContent = getCompactBankStatusLabel(state.fields.bank)") &&
      stylesCss.includes("min-height: 54px;") &&
      stylesCss.includes("font-size: 14px;"),
    "Kompakt durum seridi veya banka kisaltmalari korunmuyor."
  );
  assert(
    serverJs.includes('"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"') &&
      serverJs.includes('"Pragma": "no-cache"') &&
      serverJs.includes('"Expires": "0"'),
    "Statik dosyalar icin tarayici onbellegi kapatilmis gorunmuyor."
  );
  assert(stylesCss.includes('#authGateOverlay[data-ios-lite="true"] .gate-blueprint'), "iOS gate hafif mod CSS'i bulunamadi.");
  assert(
    !stylesCss.includes("html,\r\nbody,\r\n.app-shell,\r\n.workspace {\r\n  touch-action: pan-y;") &&
      !stylesCss.includes("html,\nbody,\n.app-shell,\n.workspace {\n  touch-action: pan-y;") &&
      !stylesCss.includes("overscroll-behavior-y: none;"),
    "Mobil sayfa kaydirmasini kilitleyebilecek global touch/overscroll kurallari bulunuyor."
  );
  assert(
    appJs.includes("function getLeafletInteractionOptions()") &&
      appJs.includes("dragging: false") &&
      appJs.includes("tap: false") &&
      appJs.includes("touchZoom: true"),
    "Touch cihazlarda Leaflet tek parmak sayfa kaydirmasini serbest birakan ayarlar bulunamadi."
  );
  assert(
    !/^\s*warmUpDeferredResources\(\);\s*$/m.test(appJs) &&
      !appJs.includes("loadLocalNeighborhoodDatabase") &&
      !appJs.includes("bursa_manuel_duzeltilmis_ana_dosya.csv") &&
      appJs.includes('fetchRaporApi("/api/neighborhoods"') &&
      serverJs.includes('"/api/neighborhoods": { limit: 60') &&
      serverJs.includes("createReadStream(neighborhoodCsvFile") &&
      serverJs.includes("readline.createInterface") &&
      serverJs.includes('"bursa_manuel_duzeltilmis_ana_dosya.csv",'),
    "Buyuk mahalle veritabani telefona yuklenmemeli; sorgular sunucuda satir satir islenmelidir."
  );
  const neighborhoodFixture = [
    { cityKey: "bursa", districtKey: "osmangazi", neighborhoodKey: "soganli", neighborhood: "SOĞANLI", postalCode: "16150", lat: 40.2, lng: 29.05 },
    { cityKey: "bursa", districtKey: "nilufer", neighborhoodKey: "ihsaniye", neighborhood: "İHSANİYE", postalCode: "16130", lat: 40.22, lng: 28.98 },
  ];
  const postalMatch = neighborhoodHelpers.queryNeighborhoodRows(neighborhoodFixture, {
    operation: "postal",
    city: "Bursa",
    district: "Osmangazi",
    neighborhood: "Soğanlı Mahallesi",
  });
  const nearbyMatches = neighborhoodHelpers.queryNeighborhoodRows(neighborhoodFixture, {
    operation: "nearby",
    lat: 40.2,
    lng: 29.05,
    radius: 500,
    limit: 5,
  });
  assert(
    postalMatch.match?.postalCode === "16150" && nearbyMatches.nearby.length === 1,
    "Sunucu mahalle sorgusu posta kodu veya yakin cevre eslesmesini korumuyor."
  );
  assert(
    appJs.includes('"T.C. Çevre ve Şehircilik Bakanlığı"'),
    "Incelenen belge kurum secenegi dogru Turkce metinle bulunamadi."
  );
  assert(
    !appJs.includes("T.C. Ã‡evre ve Åehircilik BakanlÄ±ÄŸÄ±"),
    "Incelenen belge kurum seceneginde bozuk karakterli metin bulundu."
  );
  assert(
    appJs.includes('input.addEventListener("change", handleTableCellChange)'),
    "Tablo secim alanlari icin change olayi kayit dinleyicisi bulunamadi."
  );
  assert(
    appJs.includes('if (row.c4 !== undefined && String(row.c1 || "").trim()) return row;'),
    "Incelenen belge satirinda bos kurumun ilce belediyesiyle tamamlanmasi korunmuyor."
  );
  assert(
    appJs.includes("panels.push(createUnitInteriorDescriptionField());") &&
      appJs.includes("panel.append(toolbar, createUnitFloorInteriorRows());"),
    "Bagimsiz bolum ic hacimler aciklamasi en alta tasinmis gorunmuyor."
  );
  assert(
    appJs.includes('select.addEventListener("change", handleDecorativeChange);'),
    "Dekoratif secimler icin change olayi bagimsiz bolum aciklamasini guncellemiyor."
  );
  assert(
    appJs.includes("function applyUnitDecorativeFieldChange(key, value)") &&
      appJs.includes("previousGeneratedInteriorDescription"),
    "Dekoratif secimler bagimsiz bolum aciklamasini dinamik yenileme akisini korumuyor."
  );
  assert(
    appJs.includes("const insuranceConstructionCostRows") &&
      appJs.includes("function refreshInsuranceConstructionCostFromCurrentFields") &&
      appJs.includes("5/E") &&
      appJs.includes("103500"),
    "Sigortaya esas yapi birim maliyeti listesi veya otomatik eslestirme bulunamadi."
  );
  assert(
    appJs.includes("insurance_construction_cost_text") &&
      appJs.includes("createInsuranceConstructionCostPanel()"),
    "Sigortaya esas deger aciklamasi placeholder veya Aciklamalar listesi bulunamadi."
  );
  assert(
    appJs.includes("const buildingDepreciationRateRows") &&
      appJs.includes("Çelik karkas") &&
      appJs.includes("75 ve üstü yaş") &&
      appJs.includes("createBuildingDepreciationRatePanel()"),
    "Yapi yipranma oranlari tablosu Aciklamalar bolumune eklenmemis."
  );
  assert(
    appJs.includes("function createValuationBuildingValueTable()") &&
      appJs.includes("calculateBuildingValuationValue") &&
      appJs.includes("syncBuildingValueDefaults") &&
      appJs.includes("legalBuildingValue"),
    "Degerleme bolumunde Yapi Degeri hesap akisi bulunamadi."
  );
  assert(
    appJs.includes("function createValuationPremiumTable()") &&
      appJs.includes("calculateValuationPremiumValue") &&
      appJs.includes("legalPremiumRate") &&
      appJs.includes("currentPremiumValue") &&
      appJs.includes("valuation-input-negative"),
    "Serefiye Bolumu veya yasal/mevcut serefiye hesap akisi bulunamadi."
  );
  assert(
    appJs.includes("createValuationIncomeMetricRow") &&
      appJs.includes("legalCapitalizationRate") &&
      appJs.includes("currentCapitalizationRate") &&
      appJs.includes("legalAmortizationMonths") &&
      appJs.includes("currentAmortizationMonths") &&
      appJs.includes("calculateValuationCapitalizationRate") &&
      appJs.includes("calculateValuationAmortizationMonths"),
    "Yasal/mevcut kira altindaki kapitalizasyon orani veya amortisman suresi hesaplari bulunamadi."
  );
  assert(
    appJs.includes("Şerefiye Değeri") &&
      !appJs.includes("<th>Durum Değeri</th>") &&
      !appJs.includes('createValuationInputCell(row.marketKey, "Durum Değeri"'),
    "Serefiye Bolumunde kaldirilmasi istenen Durum Degeri sutunu duruyor."
  );
  assert(
    !appJs.includes("createValuationSummaryBand()") &&
      !appJs.includes('createValuationPanel("DeÄŸerleme BÃ¶lÃ¼mÃ¼"'),
    "Alt kisimdaki eski Degerleme Bolumu kaldirilmamis."
  );
  assert(
    appJs.includes("shouldShowBuildingDepreciationColumn") &&
      appJs.includes("shouldShowBuildingConstructionLevelColumn") &&
      appJs.includes("getEffectiveBuildingDepreciationRate") &&
      appJs.includes("constructionLevel !== 100 ? 0 :"),
    "Yapi degeri yipranma/insaat seviyesi sutun gizleme veya eksik insaatta yipranma sifirlama kurali bulunamadi."
  );
  assert(
    !appJs.includes("<th>Hesap</th>") &&
      !appJs.includes('createValuationInputCell(row.formulaKey, "Hesap"'),
    "Yapi Degeri tablosunda kaldirilmasi istenen Hesap sutunu duruyor."
  );
  assert(
    appJs.includes("legalBuildingDepreciationRate") &&
      appJs.includes("currentBuildingDepreciationRate") &&
      appJs.includes("legalBuildingUnitCost") &&
      appJs.includes("currentBuildingUnitCost"),
    "Yapi degeri icin kullanici tarafindan degistirilebilir birim deger/yipranma alanlari bulunamadi."
  );
  assert(
    appJs.includes("function createValuationEditor()") &&
      appJs.includes("function refreshValuationComputedFields()") &&
      appJs.includes("valuationMarketRows") &&
      appJs.includes("calculateLandValuationValue") &&
      appJs.includes("function parseValuationNumber(value)"),
    "Degerleme bolumu hesap tablosu veya formul akisi bulunamadi."
  );
  assert(
    appJs.includes("Yasal Durum Değeri") &&
      appJs.includes("Sigortaya Esas Değer") &&
      appJs.includes("Şerefiye Bölümü"),
    "Degerleme bolumu gorseldeki temel basliklari icermiyor."
  );
  assert(
    appJs.includes("function syncValuationAreasFromUnitAreas()") &&
      appJs.includes("state.fields.insuranceValueArea = totals.legal") &&
      appJs.includes("function getValuationUnitAreaTotals()"),
    "Degerleme alanlari bagimsiz bolum toplam alanlarindan beslenmiyor."
  );
  assert(
    appJs.includes("hasOnlyThousandDots") &&
      appJs.includes("parseValuationNumberOrZero"),
    "Degerleme sayi okuma duzeltmesi bulunamadi."
  );
  assert(
    appJs.includes("function createValuationTopControls()") &&
      appJs.includes("const valuationMethodOptions") &&
      appJs.includes("Gelir İndirgeme Yöntemi") &&
      appJs.includes("function createValuationRentExplanationPanel") &&
      appJs.includes("buildValuationRentExplanation") &&
      appJs.includes("yasal ve mevcut kira değerinin") &&
      appJs.includes("mevcut kira değerinin") &&
      appJs.includes("function createValuationSaleabilityExplanationPanel") &&
      appJs.includes("buildValuationSaleabilityExplanation") &&
      appJs.includes("SATILABİLİR olduğu kanaatine varılmıştır") &&
      appJs.includes("Bu sebeple taşınmazın satış kabiliyetinin") &&
      stylesCss.includes("valuation-saleability-explanation-card") &&
      stylesCss.includes("valuation-rent-explanation-card"),
    "Degerleme metodu coklu secim alani bulunamadi."
  );
  assert(
    appJs.includes("function openSaleabilityNoteModal") &&
      appJs.includes("Alıcısı Az") &&
      appJs.includes("Satışı Güç") &&
      appJs.includes("Satılamaz"),
    "Satis kabiliyeti secenekleri veya aciklama pop-up akisi bulunamadi."
  );
  assert(
    appJs.includes("function calculateValuationUnitValue") &&
      appJs.includes("function createWorkplaceFloorCalculationTable") &&
      appJs.includes("shouldShowWorkplaceFloorCalculationTable") &&
      appJs.includes("shouldHideWorkplaceFloorCalculationTableByEqualAreas") &&
      appJs.includes("return !shouldHideWorkplaceFloorCalculationTableByEqualAreas();") &&
      !appJs.includes("return shouldShowWorkplaceFrontageDepthFields() && !shouldHideWorkplaceFloorCalculationTableByEqualAreas();") &&
      appJs.includes('table.className = "valuation-table workplace-floor-calculation-table explanations-floor-valuation-table";') &&
      appJs.includes("Kat alanları, teras alanları, indirgeme oranları, piyasa değeri ve kira değeri") &&
      appJs.includes("calculateWorkplaceFloorCalculationUnitValue") &&
      appJs.includes("Kat Bazında Hesaplama Tablosu") &&
      appJs.includes('createValuationInputCell(row.unitKey, row.unitLabel, { suffix: "TL/m²", readOnly: true })') &&
      appJs.includes('createValuationInputCell(row.totalKey, "Piyasa Değeri"'),
    "Piyasa degeri girilip m2 birim degerinin otomatik hesaplanmasi korunmuyor."
  );
  assert(
    !appJs.includes('{ key: "saleNote", label: "Satış açıklaması"') &&
      !appJs.includes('{ key: "riskCodes", label: "Risk kodları"'),
    "Degerleme formunda kaldirilmasi istenen Satis aciklamasi veya Risk kodlari alani duruyor."
  );
  assert(
    appJs.includes("function calculateBuildingCompletionFromReviewedDocuments()") &&
      appJs.includes("isBuildingCompletionOccupancyDocument") &&
      appJs.includes("addYearsToIsoDate(latestPermit.isoDate, 2)") &&
      appJs.includes("function calculateBuildingAgeText"),
    "Yapi bitis tarihi ve yapi yasi makro mantigi bulunamadi."
  );
  assert(
    appJs.includes('text.includes("KULLANIM")') &&
      appJs.includes('text.includes("OTURMA")'),
    "Yapi kullanma/kullanim veya oturma izin belgesi ruhsata gore oncelikli yakalanmiyor."
  );
  assert(
    appJs.includes("function buildMissingOccupancyPermitArchivePrefix") &&
      appJs.includes('projectInstitutionIncludes("Webtapu") && projectInstitutionIncludes("Belediye")') &&
      appJs.includes("isOccupancyPermitDocument(type)") &&
      appJs.includes("isBuildingCompletionOccupancyDocument(type)"),
    "Webtapu+Belediye ozelinde eksik yapi kullanma izin belgesi belediye arsivi kuralina baglanmamis."
  );
  assert(
      appJs.includes("buildingCompletionExplanation") &&
      appJs.includes("building_completion_explanation_text") &&
      appJs.includes('createBuildingReadOnlyField("Yapı Yaşı", "buildingAge")'),
    "Yapi bitis tarihi Aciklamalar veya Ana Gayrimenkul baglantisi bulunamadi."
  );
  assert(
    !appJs.includes('{ key: "encumbranceExplanation", label: "Takyidat Açıklaması"') &&
      !appJs.includes('{ key: "planningExplanation", label: "İmar Açıklaması"') &&
      !appJs.includes('{ key: "documentExplanation", label: "Belge / Proje Açıklaması"') &&
      !appJs.includes('{ key: "generalExplanation", label: "Genel Açıklama"'),
    "Aciklamalar bolumunde kaldirilmasi istenen temel aciklama alanlari duruyor."
  );
  assert(
    appJs.includes("commercialUnitInteriorValidationOptions") &&
      appJs.includes("getUnitInteriorValidationOptions") &&
      appJs.includes('state.fields.legalUsageNature') &&
      appJs.includes('"Showroom"') &&
      appJs.includes('"Vitrin önü kullanım alanı"'),
    "Ticari/ofis/isyeri yasal kullaniminda ic hacimler secim listesi bulunamadi."
  );
  assert(
    appJs.includes("shouldShowWorkplaceFrontageDepthFields") &&
      appJs.includes("unitShopFrontage") &&
      appJs.includes("unitShopDepth") &&
      appJs.includes("composeUnitShopFrontageDepthSentence") &&
      appJs.includes("dükkan cephe uzunluğu"),
    "Isyeri yasal kullaniminda Cephe/Derinlik alanlari veya aciklama cumlesi bulunamadi."
  );
  assert(
    appJs.includes("shouldShowUnitReductionFields") &&
      appJs.includes("areaReductionRate") &&
      appJs.includes("terraceReductionRate") &&
      appJs.includes("calculateReducedUnitFloorArea") &&
      appJs.includes("calculateReducedUnitFloorTotal") &&
      appJs.includes("createExplanationsFloorValuationTablePanel") &&
      appJs.includes("buildExplanationsFloorValuationRows") &&
      appJs.includes("explanations-floor-valuation-table") &&
      appJs.includes("getExplanationsFloorValuationMetrics") &&
      appJs.includes("Piyasa m² Birim Değeri") &&
      appJs.includes("Piyasa Kira Değeri") &&
      appJs.includes("legalRent") &&
      appJs.includes("currentRent") &&
      stylesCss.includes("explanations-floor-valuation-table") &&
      stylesCss.includes("explanations-floor-valuation-summary-cell") &&
      appJs.includes("createUnitFloorReducedTotalSummary") &&
      appJs.includes("Yasal İnd. Kat Alanı") &&
      appJs.includes("Mevcut İnd. Kat Alanı") &&
      !appJs.includes("currentReductionRate") &&
      !appJs.includes("currentTerraceReductionRate"),
    "Konut/ofis/isyeri/ticari bina icin indirgeme orani ve indirgenmis kat alani hesaplari bulunamadi."
  );
  assert(
    appJs.includes("function calculateConstructionYearText") &&
      appJs.includes("buildingConstructionYear") &&
      appJs.includes('{ key: "buildingConstructionYear", label: "Yapım Yılı", type: "text", readOnly: true }'),
    "Yapi bitis tarihinden Yapim Yili alanina yil aktarimi bulunamadi."
  );
  assert(
    appJs.includes("normalizeImarPlanNameForReport") &&
      appJs.includes("normalizeImarLegendForReport") &&
      appJs.includes('if (key === "planName") return normalizeImarPlanNameForReport(text);') &&
      appJs.includes("suffix = String(text.match"),
    "Imar plan adi veya lejant rapor sadelestirme akisi bulunamadi."
  );
  assert(
    appJs.includes("projectTypeOptions") &&
      appJs.includes("Onaylı Mimari Projesi"),
    "Tapu/Belediye proje turu listesinde Onayli Mimari Projesi ilk secenek akisi bulunamadi."
  );
  assert(
    appJs.includes("buildBuildingInspectionExplanation") &&
      appJs.includes("hasReviewedOccupancyPermitDocument") &&
      appJs.includes("building_inspection_explanation_text") &&
      appJs.includes('if (state.fields.buildingInspectionContractActive === "Evet")') &&
      appJs.includes('if (key === "c0")') &&
      appJs.includes("state.fields.buildingInspectionProgressLevel = \"\";"),
    "Yapi denetim aciklamasi veya yapi kullanma izin belgesiyle gizleme akisi bulunamadi."
  );
  assert(
    appJs.includes("buildingFootprintReferenceOptions") &&
      appJs.includes("bina girişi") &&
      appJs.includes("bina köşe kotları") &&
      appJs.includes("bina özgün şekli") &&
      appJs.includes("cephe görselleri") &&
      appJs.includes("bina oturumu geometrisi") &&
      appJs.includes("buildingFootprintReference") &&
      appJs.includes("buildProjectSuitabilityBuildingReferenceSentence") &&
      appJs.includes("Bina oturumu; vaziyet planında belirtilen") &&
      appJs.includes("Bina girişi, projesine göre binanın"),
    "Projeye uygunluk aciklamasi icin BINAOTURUMU/BGGIRIS/BGYON kaynakli bina oturumu ve giris cumleleri bulunamadi."
  );
  assert(
    appJs.includes("encumbranceDeclarationTypeOptions") &&
      appJs.includes("encumbranceAnnotationTypeOptions") &&
      appJs.includes("ensureEncumbranceTypeDatalist") &&
      appJs.includes('input.type = "date"'),
    "Beyan/serh tur secimleri veya tarih secici akisi bulunamadi."
  );
  assert(
      appJs.includes("getAllNearbyPlacesWithUser") &&
      appJs.includes("getAllMainArteryPlacesWithUser") &&
      appJs.includes("saveUserPoiFromMap") &&
      appJs.includes("saveUserMainArteryFromMap") &&
      appJs.includes("user-poi-tools") &&
      appJs.includes("data-user-poi-save") &&
      appJs.includes("data-user-artery-save") &&
      appJs.includes("refreshUserPoisFromServer({ force: true, select: true, userOnly: true })") &&
      appJs.includes('category: "user-artery"') &&
      appJs.includes('category === "user-artery"') &&
      appJs.includes("const roads = getAllMainArteryPlacesWithUser(source.places || [])") &&
      appJs.includes("if (options.select)") &&
      appJs.includes("getNearbySelectionDisplayPlaces") &&
      appJs.includes("function getUserNearbyPlaces()") &&
      appJs.includes("userNearbyRadiusMeters = 1000") &&
      appJs.includes("function isUserNearbyPlaceInAddressRadius") &&
      appJs.includes("function isNearbyPlaceInAddressRadius") &&
      appJs.includes(".filter((place) => isNearbyPlaceInAddressRadius(place))") &&
      appJs.includes("return withinExpanded.slice(0, mainArteryAutoLimit)") &&
      appJs.includes("return [...userPlaces, ...autoPlaces]") &&
      !appJs.includes("function getNearestNearbySelectionIds") &&
      !appJs.includes("selectMainArtery(roads[0].id, { auto: true })") &&
      appJs.includes("nearbySettlementFallbackMinUsefulCount") &&
      appJs.includes("function isSettlementLikeNearbyPlace") &&
      appJs.includes('nonSettlementCandidates.length >= nearbySettlementFallbackMinUsefulCount') &&
      appJs.includes("validIds.has(id) && displayIds.has(id)") &&
      appJs.includes("const displayPlaces = getNearbySelectionDisplayPlaces(source)") &&
      serverJs.includes("handleUserPoisApi") &&
      serverJs.includes("normalizeUserPoiCategory") &&
      serverJs.includes("user-pois.json"),
    "Kullanici tarafindan kaydedilen onemli nokta akisi bulunamadi."
  );
  assert(
    appJs.includes("createComparableValuationSummaryPanel") &&
      appJs.includes("Emsal Değerleme Tablosu") &&
      appJs.includes("calculateComparableValuationAverages") &&
      appJs.includes("roundComparableValuationValue") &&
      appJs.includes("comparableValuationRoundStep = 50000") &&
      appJs.includes("syncComparableValuationMarketValues") &&
      appJs.includes('state.fields[`${totalKey}ComparableAutoManual`] === "1"'),
    "Emsaller altindaki degerleme tablosu veya 50.000 TL yuvarlamali otomatik degerleme akisi bulunamadi."
  );
  assert(
      appJs.includes('{ key: "c1", label: "Telefon" }') &&
      appJs.includes('key: "c23"') &&
      appJs.includes('label: "Emsal Niteliği"') &&
      appJs.includes('const comparableNatureOptions = ["Konut", "Dükkan", "Tarla", "Arsa", "Müstakil Bina"]') &&
      appJs.includes("comparableViewModeOptions") &&
      appJs.includes('label: "Arsa / Tarla Emsalleri"') &&
      appJs.includes('key: "c24", label: "Yüzölçümü"') &&
      appJs.includes('key: "c26", label: "Nizamı"') &&
      !appJs.includes("buildComparableLandPlanningComparisonText") &&
      appJs.includes('key: "c31", label: "Hesaplanan Emsal"') &&
      appJs.includes('key: "calcCalculatedEmsalUnitValue"') &&
      appJs.includes('key: "calcAdjustedCalculatedEmsalUnitValue"') &&
      appJs.includes('metrics.calculatedEmsalUnitValue') &&
      appJs.includes('metrics.adjustedCalculatedEmsalUnitValue') &&
      appJs.includes('const calculatedEmsalArea = landComparable ? parseComparableNumber(row.c31)') &&
      appJs.includes("calculateComparableLandBuildableArea") &&
      appJs.includes("return landArea * kaks") &&
      appJs.includes("return landArea * floorCount") &&
      appJs.includes('control.dataset.comparableField = field.key') &&
      appJs.includes('data-comparable-field="c31"') &&
      appJs.includes('row.c31Manual = event.target.value.trim() ? "1" : ""') &&
      appJs.includes('if (!force && row.c31Manual === "1" && String(row.c31 || "").trim()) return false') &&
      appJs.includes('function syncComparableLandBuildableArea(row = {}, force = false)') &&
      appJs.includes('syncComparableLandBuildableArea(row, true)') &&
      appJs.includes('if (["c24", "c26", "c27", "c28"].includes(field.key) && syncComparableLandBuildableArea(row, true))') &&
      appJs.includes('if (["c24", "c26", "c27", "c28"].includes(field.key)) return;') &&
      appJs.includes("/^\\d{1,3}(?:\\.\\d{3})+$/.test(text)") &&
      appJs.includes("const adjustedArea = landComparable ? parseComparableNumber(row.c24)") &&
      appJs.includes("formatComparableMapLocationPhrase") &&
      appJs.includes("Math.round(distance / 10) * 10") &&
      appJs.includes("allowEmpty: false") &&
      appJs.includes('key: "c29"') &&
      appJs.includes("comparableRoadFrontageOptions") &&
      !appJs.includes('label: "İmar Şerefiyesi"') &&
      !appJs.includes('key: "calcShortText"') &&
      !appJs.includes("buildComparableShortText") &&
      appJs.includes('if (field.key === "c10") return;') &&
      appJs.includes('const featureAdjustment = landComparable ? 0 : calculateComparableAdjustment(row.c8, row.c21);') &&
      appJs.includes('calculatedEmsalUnitValue * (1 + locationAdjustment)') &&
      appJs.includes("buildComparableLandLongText") &&
      appJs.includes('if (viewMode === "all") return true') &&
      !appJs.includes('options: ["", "Konut", "Dükkan", "Tarla", "Arsa", "Müstakil Bina"]') &&
      appJs.indexOf('label: "Telefon"') < appJs.indexOf('label: "Emsal Niteliği"') &&
      appJs.indexOf('label: "Emsal Niteliği"') < appJs.indexOf('label: "Emsal Durumu"'),
    "Emsaller matrisinde Emsal Niteligi ve arsa/tarla dinamik gorunumu bulunamadi."
  );
  assert(
    appJs.includes("function createIncompleteConstructionValuePanel") &&
      appJs.includes("function buildIncompleteConstructionValueRows") &&
      appJs.includes("function calculateIncompleteConstructionValueRow") &&
      appJs.includes("function isIncompleteConstructionValuationActive") &&
      appJs.includes("function refreshIncompleteConstructionValueFields") &&
      appJs.includes("function createIncompleteConstructionMarketRow") &&
      appJs.includes("function buildValuationIncomeMetricNote") &&
      appJs.includes("function refreshValuationMarketLabels") &&
      appJs.includes("data-market-row-key") &&
      appJs.includes("valuation-label-text") &&
      appJs.includes("Tamamlanması Durumunda Yasal Durum Değeri") &&
      appJs.includes("Natamam Yasal Durum Değeri") &&
      appJs.includes("KAP: %") &&
      appJs.includes("GDS ${amortization} AY") &&
      appJs.includes("constructionLevel < 60 || constructionLevel >= 100") &&
      appJs.includes("area * unitCost * Math.max(0, 1 - constructionLevelRate)") &&
      appJs.includes("roundedMissingManufacturingValue") &&
      appJs.includes("roundComparableValuationValue(incompleteValue, comparableValuationRoundStep)") &&
      appJs.includes("Yuvarlatılmış Eksik İmalat") &&
      !appJs.includes("<th>Eksik İmalat Hesabı</th>") &&
      appJs.includes("NATAMAM DURUM DEĞERİ HESAPLAMA TABLOSU") &&
      stylesCss.includes("incomplete-construction-value-table") &&
      stylesCss.includes("valuation-incomplete-market-row") &&
      stylesCss.includes("valuation-label-note") &&
      stylesCss.includes("incomplete-construction-result"),
    "Insaat seviyesi %60-99 icin eksik imalat ve natamam durum degeri tablosu bulunamadi."
  );
  assert(
    appJs.includes("function createPropertyTaxDeclarationValuePanel") &&
      appJs.includes("function createValuationPropertyTaxDeclarationExplanationPanel") &&
      appJs.includes("function createExplanationsPropertyTaxDeclarationPanel") &&
      appJs.includes("function isZiraatBankSelectedForPropertyTaxDeclaration") &&
      appJs.includes("function shouldShowPropertyTaxUnavailableInValuation") &&
      appJs.includes("function buildPropertyTaxDeclarationValueExplanation") &&
      appJs.includes("function buildPropertyTaxDeclarationUnavailableExplanation") &&
      appJs.includes("propertyTaxDeclarationEnabled") &&
      appJs.includes("propertyTaxDeclarationValue") &&
      appJs.includes("propertyTaxDeclarationExplanation") &&
      appJs.includes("propertyTaxDeclarationUnavailableExplanation") &&
      appJs.includes("malik dışındaki 3. Kişilere verilmediği") &&
      appJs.includes("getPropertyTaxDeclarationInspectionDateText") &&
      appJs.includes("getPropertyTaxDeclarationYearText") &&
      appJs.includes("Emlak Servisinden alınan bilgiye göre değerlemeye konu taşınmazın") &&
      appJs.includes("Yılı Emlak Beyan Değeri") &&
      appJs.includes("Emlak Beyan Değeri") &&
      stylesCss.includes("property-tax-declaration-panel") &&
      stylesCss.includes("property-tax-declaration-value"),
    "Degerleme bolumunde Emlak Beyan Degeri checkboxli paneli bulunamadi."
  );
  assert(
    appJs.includes("state.fields.mainPropertyQuality || state.fields.titleQuality || \"Arsa\"") &&
      appJs.includes("function shouldHideLandAgricultureControls") &&
      appJs.includes('ownershipType === "MUSTAKIL BINA"') &&
      appJs.includes('["landAgricultureType", "landAgriculturalProduct"].includes(fieldKey)') &&
      appJs.includes("if (shouldHideLandAgricultureControls()) return \"\";"),
    "Arsa aciklamasinda ana tasinmaz niteligi onceligi veya tarim alanlari gizleme kurali bulunamadi."
  );
  assert(
    appJs.includes("function createTextareaField(field, labelText") &&
      appJs.includes("refreshEnvironmentDescriptionFromCurrentFields(field.key);"),
    "Manuel yakin cevre/ulasim metni Cevresel Ozellikler aciklamasini es zamanli yenilemiyor."
  );
  assert(
    appJs.includes('id: "halkbankRisk"') &&
      appJs.includes("createHalkbankRiskCodesPanel") &&
      appJs.includes("HALKBANK_RISK_KODLARI") &&
      appJs.includes("HALKBANK_RISK_KODLARI_TABLO"),
    "Halkbank Risk Kodlari bolumu veya placeholder baglantilari bulunamadi."
  );
  const riskRules = readText("src/risk/halkbank-risk-rules.js");
  assert(
    riskRules.includes("directEncumbranceRules") &&
      riskRules.includes('code: "1C"') &&
      riskRules.includes('code: "72B"') &&
      riskRules.includes("collectDurationEncumbranceCodeMatches") &&
      riskRules.includes('code: Number.isFinite(years) && years >= 10 ? "8A" : "8B"') &&
      riskRules.includes('code: Number.isFinite(yearsRemaining) && yearsRemaining < 5 ? "6C" : "6D"'),
    "Halkbank risk kodlari 1. ve 2. paket otomatik kurallari bulunamadi."
  );
  assert(
    indexHtml.includes("src/risk/halkbank-risk-data.js") &&
      indexHtml.includes("src/risk/halkbank-risk-rules.js") &&
      indexHtml.includes("src/comparables/comparable-market-analysis.js") &&
      indexHtml.includes("src/value-factors/value-factors-rules.js") &&
      indexHtml.includes("vendor/leaflet/leaflet.css?v=1.9.4-2") &&
      indexHtml.includes("vendor/leaflet/leaflet.js?v=1.9.4-2") &&
      !indexHtml.includes("unpkg.com/leaflet") &&
      !indexHtml.includes("cdn.jsdelivr.net/npm/leaflet") &&
      indexHtml.includes("styles.css?v=20260720-0215") &&
      indexHtml.includes("src/auth/access-control.js?v=20260719-2200") &&
       /app\.js\?v=\d{8}-\d{4}/.test(indexHtml) &&
      indexHtml.includes("cloud/cloud-sync.js?v=20260719-2200") &&
      indexHtml.includes("cloud/report-library.js?v=20260719-2200") &&
       /src\/templates\/template-engine\.js\?v=\d{8}-\d{4}/.test(indexHtml),
    "Halkbank risk kodu scriptleri veya guncel app surumu index.html icinde bulunamadi."
  );
  checkFileExists("src/risk/halkbank-risk-data.js");
  checkFileExists("src/risk/halkbank-risk-rules.js");
  checkFileExists("src/comparables/comparable-market-analysis.js");
  checkFileExists("src/value-factors/value-factors-rules.js");
  checkFileExists("vendor/leaflet/leaflet.css");
  checkFileExists("vendor/leaflet/leaflet.js");
  checkFileExists("vendor/leaflet/images/marker-icon.png");
  assert(
    leafletJs.includes(").L={})") && !leafletJs.includes(").leaflet={})"),
    "Leaflet UMD paketi window.L globalini olusturmuyor."
  );
  assert(
    serverJs.includes("\"script-src 'self' 'unsafe-inline'\"") &&
      serverJs.includes("\"style-src 'self' 'unsafe-inline'\"") &&
      !serverJs.includes("https://unpkg.com"),
    "Leaflet yerel vendor'a alindigi halde CSP veya CDN referanslari temizlenmemis."
  );
  assert(
    appJs.includes("createComparableMarketAnalysisPanel") &&
      appJs.includes("EMSAL_PIYASA_ANALIZI") &&
      appJs.includes("Piyasa Analizi ve Emsal Değerlendirmesi") &&
      !appJs.includes('key: "marketSummary"') &&
      !appJs.includes('key: "adjustmentNote"'),
    "Emsaller piyasa analizi paneli veya eski piyasa ozeti/duzeltme alan temizligi bulunamadi."
  );
  assert(
    appJs.includes('id: "valueFactors"') &&
      appJs.includes("createValueFactorsPanel") &&
      appJs.includes("documents: Array.isArray(state.tables.documents)") &&
      appJs.includes("DEGERI_ETKILEYEN_OLUMLU_FAKTORLER") &&
      appJs.includes("DEGERI_ETKILEYEN_OLUMSUZ_FAKTORLER") &&
      appJs.includes("DEGERI_ETKILEYEN_FAKTORLER") &&
      readText("src/value-factors/value-factors-rules.js").includes("title-condominium") &&
      readText("src/value-factors/value-factors-rules.js").includes("document-occupancy-permit"),
    "Degeri Etkileyen Faktorler bolumu veya placeholder baglantilari bulunamadi."
  );
  assert(
    appJs.includes("EKB sistemi, E Devlet, resmi kurumlar ve saha araştırması sonucunda taşınmaza ait Enerji Kimlik Belgesi bulunamamıştır") &&
      appJs.includes("Enerji Kimlik Belgesinin son geçerlilik tarihi sona erdiği için değerleme raporunda dikkate alınmamıştır") &&
      appJs.includes("dateParts.push(`veriliş tarihi ${issueDate}`)") &&
      appJs.includes("const inspectionLead = inspectionDateText ? `${inspectionDateText} tarihinde` : \"İnceleme tarihinde\";") &&
      appJs.includes("return `${inspectionLead} EKB sistemi, E Devlet, resmi kurumlar") &&
      appJs.includes("olan` : \"\"") &&
      appJs.includes("return state.fields.appointmentDate || \"\";") &&
      appJs.includes("if (ekbExplanation) parts.push(ekbExplanation);"),
    "EKB aciklamasi yeni Hayir/suresi gecmis metinleriyle incelenen belgeler aciklamasinin sonuna baglanmamis."
  );
  assert(
    appJs.includes("getPenaltyDecisionArchiveInstitutions") &&
      appJs.includes("formatPenaltyDecisionArchiveText") &&
      appJs.includes("hasPenaltyDecisionSpecialInstitution") &&
      appJs.includes("buildCitySpecificInstitution(\"Büyükşehir Belediyesi\")") &&
      appJs.includes("buildCitySpecificInstitution(\"İl Özel İdaresi\")") &&
      appJs.includes("buildDefaultDocumentReviewInstitution()") &&
      appJs.includes('"projectInstitution"') &&
      appJs.includes("joinTurkishList(getPenaltyDecisionArchiveInstitutions())"),
    "Cezai karar aciklamasi belediye/ozel kurum arşiv kurali bulunamadi."
  );
  assert(
    appJs.includes('id: "gabimData"') &&
      appJs.includes("createGabimDataSetPanel") &&
      appJs.includes("buildGabimDataGroups") &&
      appJs.includes("Tapu Bilgileri") &&
      appJs.includes("Yapıya Özel Bilgiler") &&
      appJs.includes("Ek Bilgiler") &&
      appJs.includes("Genel Ek Bilgiler") &&
      appJs.includes("buildGabimGeneralExtraInfoRows") &&
      appJs.includes("Değer Türü") &&
      appJs.includes("Hesaplanan Emsal (m²)") &&
      appJs.includes("Ulaşım İmkanı") &&
      appJs.includes("Çevresinde Büyük Yatırım Projeleri Var mı?") &&
      appJs.includes("Gayrimenkulün Satılabilirliği") &&
      appJs.includes("İnşaat Kalitesi") &&
      appJs.includes("gabimCalculatedEmsalText") &&
      appJs.includes('gabimField("calculatedEmsal")') &&
      appJs.includes("gabimTransportationLevelText") &&
      appJs.includes('gabimField("mainArteryProximity")') &&
      appJs.includes("gabimSaleabilityText") &&
      appJs.includes("gabimConstructionQualityText") &&
      appJs.includes("gabimFirstSaleText") &&
      appJs.includes("calculateUnitFirstSaleStatus") &&
      appJs.includes("isFirstSaleAcquisitionReason") &&
      appJs.includes("unitFirstSaleStatusOptions") &&
      appJs.includes("unitFirstSaleStatusManual") &&
      appJs.includes('unitFirstSaleStatus') &&
      appJs.includes('if (quality.includes("LUKS")) return "Lüks"') &&
      appJs.includes("canEditBuildingAgeManually") &&
      appJs.includes("hasReviewedDocumentInfo") &&
      appJs.includes('field.key === "buildingAge" && canEditBuildingAgeManually()') &&
      appJs.includes("Bağımsız Bölüm / Taşınmaz Özellikleri") &&
      appJs.includes("BB İçin İmar Bilgileri") &&
      appJs.includes("gabimTitleTypeText") &&
      appJs.includes("gabimUrbanTransformationText") &&
      appJs.includes("gabimPoolText") &&
      appJs.includes("gabimSecurityText") &&
      appJs.includes("gabimTotalReducedAreaText") &&
      !appJs.includes("getGabimGroundFloorRows") &&
      appJs.includes('key: "earthquakeZone"') &&
      appJs.includes('["Depreme Dayanıklılık ve Hasar Durumu", gabimField("damageStatus") || "Hasarsız"]') &&
      !appJs.includes('["Taşınmaz Kimlik No", gabimField("titlePropertyId")]') &&
      !appJs.includes('["Eşyalı Satış"') &&
      !appJs.includes("GABİM Genel Bilgiler"),
    "Gabim Veri Seti ana menu bolumu veya otomatik veri gruplari bulunamadi."
  );
  assert(
    appJs.includes('id: "jsonDraft"') &&
      appJs.includes("processJsonDraftFile") &&
      stylesCss.includes("upload-card::before") &&
      stylesCss.includes("Neumorfik dosya yukleme kartlari") &&
      stylesCss.includes("grid-template-columns: repeat(3, minmax(0, 1fr))") &&
      appJs.includes("restoreStateFromImportedJson") &&
      appJs.includes("hydrateImportedAddressAdministrativeFields") &&
      appJs.includes("titleCity") &&
      appJs.includes("titleDistrict"),
    "Dosya bolumunde JSON taslak yukleme ve geri yukleme akisi bulunamadi."
  );
  assert(
    !appJs.includes('class="section-head"') &&
      !appJs.includes('class="section-pill"') &&
      appJs.includes('card.innerHTML = `<div class="section-body"></div>`;'),
    "Bolum ust basliklari kaldirilmis gorunmuyor."
  );
  assert(
    appJs.includes("createOutputExportPanel") &&
      appJs.includes("exportReportJson") &&
      appJs.includes("exportReportWord") &&
      appJs.includes("exportReportPdf") &&
      appJs.includes("data-export-pdf") &&
      appJs.includes("openPdfPrintWindow") &&
      appJs.includes("buildWordReportHtml") &&
      appJs.includes("buildWordReportTablesHtml") &&
      appJs.includes("buildWordReportSketchesHtml"),
    "Banka ve Cikti bolumunde JSON/Word farkli kaydet veya Word tablo/kroki akisi bulunamadi."
  );
  assert(
    appJs.includes("exportZiraatEkTabloWithBankTemplateIfNeeded") &&
      appJs.includes('templateKey !== "ziraat"') &&
      appJs.includes("window.RaporZiraatEkTablo.export") &&
      !appJs.includes("appendZiraatEkTabloXlsxBlock") &&
      !appJs.includes("data-export-ziraat-xlsx"),
    "Ziraat ek tablo ayri buton yerine banka sablonuyla kaydet akisina baglanmamis gorunuyor."
  );
  assert(
    appJs.includes("shouldIncludeGeneratedTextInWord") &&
      appJs.includes("_template") &&
      appJs.includes("Şablonu"),
    "Word ciktisinda placeholder/sablon aciklama metinlerini suzen kural bulunamadi."
  );
  assert(
    appJs.includes("shouldHideSection") &&
      appJs.includes("getVisibleSections") &&
      appJs.includes("shouldIncludeReportCategory") &&
      appJs.includes("DIKEY KAT IRTIFAKI") &&
      appJs.includes("YATAY KAT IRTIFAKI") &&
      appJs.includes('sectionId === "land"') &&
      appJs.includes('sectionId === "building" || sectionId === "unit"'),
    "Gayrimenkul turune gore arsa/ana gayrimenkul/bagimsiz bolum gorunurluk kurallari bulunamadi."
  );
  assert(
    appJs.includes("@page WordLandscape") &&
      appJs.includes("word-table") &&
      appJs.includes("wrapWordLandscapeSection") &&
      appJs.includes("buildComparableMatrixWordTableHtml") &&
      appJs.includes("buildComparableDistanceWordMatrixRow") &&
      appJs.includes("Taşınmaza Olan Mesafesi"),
    "Word ciktisi icin yatay sayfa ve sistem tasarimina yakin tablo duzeni bulunamadi."
  );
  assert(
    appJs.includes("buildPointSketchVml") &&
      appJs.includes("urn:schemas-microsoft-com:vml") &&
      appJs.includes("sketch-vml") &&
      appJs.includes("font-size: 7pt"),
    "Word ciktisi icin kucuk tablo fontu veya Word uyumlu VML kroki uretimi bulunamadi."
  );
  assert(
    appJs.includes("buildWordMhtmlPackage") &&
      appJs.includes("createSketchPngDataUrl") &&
      appJs.includes("Content-Location:") &&
      appJs.includes("image/png"),
    "Word ciktisinda kroki gorsellerini gomulu PNG/MHTML olarak ureten akis bulunamadi."
  );

  console.log("Temel kontrol tamam: dosyalar, JavaScript sozdizimi ve iOS PDF uyumluluk blogu saglam.");
}

main();
