(function installExportValidation(global) {
  "use strict";

  global.confirmExportWithMissingFields = function confirmExportWithMissingFields() {
    const missing = typeof global.getMissingRequiredFields === "function"
      ? global.getMissingRequiredFields()
      : [];
    if (!missing.length) return true;
    const labels = missing
      .slice(0, 10)
      .map((item) => typeof item === "string" ? item : item.label || item.key || "Bilinmeyen alan")
      .join("\n");
    const remainder = missing.length > 10 ? `\n... ve ${missing.length - 10} alan daha` : "";
    return global.confirm(
      `Rapor çıktısı alınmadan önce ${missing.length} zorunlu alanın eksik olduğu görülüyor.\n\n${labels}${remainder}\n\nEksik alanlara rağmen devam edilsin mi?`
    );
  };
})(window);
