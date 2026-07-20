const assert = require("node:assert/strict");
const accessRoles = require("../src/auth/access-control.js");

assert.equal(accessRoles.ADMIN_EMAIL, "canlilar.melih@gmail.com");
assert.equal(accessRoles.getRoleForEmail("canlilar.melih@gmail.com"), "admin");
assert.equal(accessRoles.getRoleForEmail("  CANLILAR.MELIH@GMAIL.COM  "), "admin");
assert.equal(accessRoles.getRoleForEmail("baska.kullanici@gmail.com"), "user");
assert.equal(accessRoles.getRoleForEmail("canlilar.melih@example.com"), "user");
assert.equal(accessRoles.getRoleForEmail(null), "user");
assert.equal(accessRoles.isAdminEmail("canlilar.melih@gmail.com"), true);
assert.equal(accessRoles.isAdminEmail("user@gmail.com"), false);

console.log("access-control tests passed");
