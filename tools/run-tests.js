"use strict";

/*
  Kullanici bildirimi degil, ortam kisitlamasi: Windows'ta `npm run test`
  ONCEDEN tek bir DEV COK UZUN `node a.js && node b.js && ...` komut
  satirinda ~164 test dosyasini zincirliyordu (package.json'daki "test"
  betigi). Bu proje 100'den fazla oturum boyunca her yeni ozellikte bir
  test dosyasi daha eklenerek buyudu; komut satiri npm'in Windows'ta
  kullandigi `cmd.exe /d /s /c "..."` kabugunun ~8191 karakterlik komut
  satiri sinirina git gide yaklasti. Bu oturumda ("Kat Bazinda Hesaplama
  Tablosu" emsal ortalamasi duzeltmesi) EKLENEN TEK bir yeni test dosyasi
  (test-explanations-floor-valuation-comparable-average.js, +70 karakter)
  bu sinirin AŞILMASINA sebep oldu: `npm run verify` PowerShell'de de,
  Git Bash'te de "The command line is too long." hatasiyla patlıyordu —
  benim degisikligimden ONCE bile zaten 8128 karakterdi (sinira 63 karakter
  kalmisti), yani bu yapisal olarak KIRILGANDI, bir sonraki test eklenince
  zaten patlayacakti.

  Duzeltme: `package.json`'daki dev "test" betigi TEK bir
  `node tools/run-tests.js` cagrisina indirgendi (kisa, sinir riski
  YOK); asagidaki TEST_FILES dizisi ESKI zincirin BIREBIR aynisidir (sira
  ve icerik korunmus, sadece TEK yeni giris eklenmis) — her dosya kendi
  ayri `node` alt surecinde (execFileSync, stdio:'inherit') CALISTIRILIR,
  ilk basarisiz testte ESKI `&&` zincirinin davranisiyla AYNI sekilde
  hemen durulur ve o testin cikis koduyla surec sonlanir. Boylece: (1)
  komut satiri uzunlugu ARTIK sorun degil (tum liste JS dizisi olarak
  node.exe'nin kendi icinde), (2) her test HALA kendi izole alt surecinde
  calisir (mevcut testler process.exit/global degisken sizintisi
  varsayimiyla yazilmis, ayni process'te in-process require ile
  calistirmak bunlari bozabilirdi), (3) "npm run test" / "npm run verify"
  kullanicidan hicbir davranis degisikligi gerektirmez.

  "test:xxx" (tek-amac, tools/test-*.js) kisayollarina DOKUNULMADI —
  onlar zaten kendi basina kisa `node tools/tek-dosya.js` cagrilari,
  uzunluk sorunu yok.
*/

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const TOOLS_DIR = __dirname;

const TEST_FILES = [
  "test-parsers.js",
  "test-takbis-owner-share.js",
  "test-encumbrance-count-summary.js",
  "test-kml-parser-module.js",
  "test-imar-normalizer-module.js",
  "test-imar-institution-control.js",
  "test-ekb-parser-module.js",
  "test-access-control.js",
  "test-map-tile-contract.js",
  "test-land-valuation-manual-override.js",
  "test-tarla-usage-nature-difference.js",
  "test-tarla-saleability-explanation.js",
  "test-valuation-saleability-multi-unit.js",
  "test-valuation-method-multi-unit.js",
  "test-valuation-rent-multi-unit.js",
  "test-minimum-parcel-classification.js",
  "test-project-suitability-status.js",
  "test-comparable-nature-filter.js",
  "test-bank-templates.js",
  "test-ziraat-ek-tablo-xlsx.js",
  "test-report-tables-xlsx.js",
  "test-unit-interior-description.js",
  "test-unit-floors-normalization-skip.js",
  "test-unit-interior-self-heal.js",
  "test-takbis-block-entrance.js",
  "test-title-location-select-case-fold.js",
  "test-address-place-casing.js",
  "test-address-location-select.js",
  "test-title-main-property-hidden-fields.js",
  "test-land-classification-visibility.js",
  "test-comparable-tab-navigation.js",
  "test-building-inspection-law-exemption.js",
  "test-documents-missing-critical-field.js",
  "test-building-inspection-law-exempt-fields-hidden.js",
  "test-building-floor-common-lowercase.js",
  "test-unit-interior-fluent-wording.js",
  "test-valuation-urgent-sale-panel.js",
  "test-valuation-urgent-sale-summary-detail.js",
  "test-foreign-currency-valuation.js",
  "test-comparable-workplace-floor-reduction.js",
  "test-comparable-workplace-floor-description.js",
  "test-comparable-workplace-room-count-hidden.js",
  "test-comparable-valuation-summary-floor-detail.js",
  "test-comparable-phone-bank-normalization.js",
  "test-static-auth-gate.js",
  "test-minify-deploy-coverage.js",
  "test-mfa-flow.js",
  "test-user-approval-flow.js",
  "test-sensitive-visibility-refinements.js",
  "test-bank-template-zip-bundle.js",
  "test-export-authorization.js",
  "test-server-template-rendering.js",
  "test-activity-dashboard.js",
  "test-new-user-notification.js",
  "test-building-floor-tab-navigation.js",
  "test-halkbank-ruhsat-fields.js",
  "test-docx-fill.js",
  "test-facade-count-and-encumbrance-sections.js",
  "test-unit-interior-group-counts.js",
  "test-encumbrance-intro-sentence.js",
  "test-value-factors-list-format.js",
  "test-value-factors-rules.js",
  "test-value-factors-multi-unit.js",
  "test-comparable-card-full-text.js",
  "test-legacy-alias-underscore-folding.js",
  "test-emsal-krokisi-image-embed.js",
  "test-nearby-selection-persistence.js",
  "test-comparable-sketch-label-placement.js",
  "test-leaflet-map-drag-override.js",
  "test-uppercase-table-placeholders.js",
  "test-ziraat-ek-tablo-static-access.js",
  "test-email-plaintext-alternative.js",
  "test-report-list-summary.js",
  "test-yapikredi-template-fixes.js",
  "test-vakifbank-template-fixes.js",
  "test-vakifbank-extra-fields.js",
  "test-akbank-template-fixes.js",
  "test-admin-action-audit-log.js",
  "test-system-health.js",
  "test-admin-duplicate-parcel-detection.js",
  "test-variant-selection.js",
  "test-multi-takbis-split.js",
  "test-title-unit-model.js",
  "test-title-unit-switch.js",
  "test-valuation-active-unit-summary-freshness.js",
  "test-title-unit-import.js",
  "test-takbis-encumbrance-next-record-boundary.js",
  "test-takbis-haciz-rehin-misclassification.js",
  "test-takbis-owner-column-overlap.js",
  "test-multi-encumbrance-grouping.js",
  "test-takyidat-multi-unit-summary.js",
  "test-multi-environment-subject.js",
  "test-agricultural-multi-unit-transport.js",
  "test-transport-direction-street-fallback.js",
  "test-environmental-fields-shared-across-units.js",
  "test-kuveytturk-arsa-arazi-template.js",
  "test-bank-template-dropdown-default.js",
  "test-report-library-cloud-search.js",
  "test-cloud-retention-days.js",
  "test-comparables-sahibinden-search.js",
  "test-emlakkatilim-photo-embed.js",
  "test-emlakkatilim-template-fixes.js",
  "test-title-units-summary-table.js",
  "test-malikler-multi-unit-table.js",
  "test-tapu-field-common-or-ektedir.js",
  "test-comparable-map-scroll-preserving-save.js",
  "test-comparable-matrix-word-table-compact-rows.js",
  "test-bank-template-word-table-css-mso-padding.js",
  "test-reviewed-documents-table-compact-height.js",
  "test-takbis-reset-on-reupload.js",
  "test-takbis-multi-import-confirmation.js",
  "test-address-units-summary-table.js",
  "test-planning-units-summary-table.js",
  "test-address-source-reload-preserves-city-district.js",
  "test-cloud-only-delete-failure-feedback.js",
  "test-land-address-fields-hidden.js",
  "test-tarla-environment-region-type-default.js",
  "test-land-units-summary-table.js",
  "test-title-unit-table-select-editing.js",
  "test-documents-units-summary-table.js",
  "test-documents-block-grouping.js",
  "test-documents-block-description.js",
  "test-valuation-units-summary-table.js",
  "test-building-block-shared-sync.js",
  "test-unit-tab-bar-gate.js",
  "test-halkbank-risk-rules.js",
  "test-comparable-market-analysis.js",
  "test-comparable-furnished-support.js",
  "test-takbis-parsing.js",
  "test-tcmb-rates.js",
  "test-comparable-card-multi-unit-plural.js",
  "test-unit-copy-to-selected.js",
  "test-land-copy-to-selected.js",
  "test-imar-copy-to-selected.js",
  "test-multi-request-scoping-audit.js",
  "test-kml-map-polygon-dedup.js",
  "test-legal-usage-nature-from-takbis.js",
  "test-unit-units-summary-table.js",
  "test-multi-checkbox-dropdown-persistence.js",
  "test-valuation-copy-to-selected.js",
  "test-insurance-construction-cost-recompute.js",
  "test-quick-report-ownership-required.js",
  "test-title-units-summary-column-apply.js",
  "test-ekb-explanation-block-attribution.js",
  "test-project-review-district-merkez.js",
  "test-project-review-block-pluralization.js",
  "test-project-suitability-units-summary-table.js",
  "test-similar-text-merge.js",
  "test-duplicate-title-units-cleanup.js",
  "test-documents-suitability-copy-to-selected.js",
  "test-documents-block-explanation-pluralization.js",
  "test-main-property-description-pluralization.js",
  "test-cloud-fetch-title-units.js",
  "test-title-units-summary-common-fields.js",
  "test-gabim-units-summary-table.js",
  "test-multi-unit-open-address.js",
  "test-documents-block-column-export.js",
  "test-documents-block-column-preview.js",
  "test-building-block-units-summary-table.js",
  "test-multi-unit-interior-description.js",
  "test-user-profile-placeholders.js",
  "test-unit-interior-description-shared.js",
  "test-report-photos-category-label.js",
  "test-explanations-floor-valuation-comparable-average.js",
];

let failed = null;
for (const file of TEST_FILES) {
  const fullPath = path.join(TOOLS_DIR, file);
  try {
    const output = execFileSync(process.execPath, [fullPath], { stdio: "inherit" });
    void output;
  } catch (error) {
    failed = { file, code: Number.isInteger(error.status) ? error.status : 1 };
    break;
  }
}

if (failed) {
  console.error(`\nTest basarisiz: tools/${failed.file}`);
  process.exit(failed.code || 1);
}

console.log(`\nTum testler basarili (${TEST_FILES.length} dosya).`);
