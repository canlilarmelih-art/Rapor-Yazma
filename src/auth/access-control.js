(function initAccessRoles(globalScope) {
  "use strict";

  const ADMIN_EMAIL = "canlilar.melih@gmail.com";

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function getRoleForEmail(email) {
    return normalizeEmail(email) === ADMIN_EMAIL ? "admin" : "user";
  }

  const api = {
    ADMIN_EMAIL,
    normalizeEmail,
    getRoleForEmail,
    isAdminEmail: (email) => getRoleForEmail(email) === "admin",
  };

  if (globalScope) globalScope.RaporAccessRoles = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
