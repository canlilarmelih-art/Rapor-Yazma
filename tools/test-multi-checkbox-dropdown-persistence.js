const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const controlStart = appSource.indexOf("function createMultiCheckboxControl(field)");
const controlEnd = appSource.indexOf("function createImarInstitutionControl(field)", controlStart);
assert(controlStart >= 0 && controlEnd > controlStart, "Coklu secim kontrolu bulunamadi.");
const controlSource = appSource.slice(controlStart, controlEnd);

assert.match(appSource, /let multiCheckboxFieldToReopen = "";/, "Acik coklu secim alani render sonrasi izlenmelidir.");
assert.match(
  controlSource,
  /if \(field\.key === "projectInstitution"\) \{\s*multiCheckboxFieldToReopen = field\.key;\s*renderSection\(\);/,
  "Proje kurum seciminde render oncesi acik panel bilgisi korunmalidir."
);
assert.match(
  controlSource,
  /if \(multiCheckboxFieldToReopen === field\.key\) \{\s*multiCheckboxFieldToReopen = "";\s*setOpen\(true\);/,
  "Yeniden olusan coklu secim alani onceki acik durumuyla geri gelmelidir."
);
assert.match(
  controlSource,
  /if \(!wrapper\.contains\(event\.target\)\) \{\s*setOpen\(false\);/,
  "Panel disina tiklandiginda coklu secim penceresi kapanmalidir."
);
assert.match(
  controlSource,
  /summaryButton\.addEventListener\("click", \(\) => \{\s*setOpen\(list\.hidden\);/,
  "Basliga tiklamak coklu secim penceresini acip kapatmalidir."
);

console.log("Coklu secim acik kalma ve dis-tiklama ile kapanma kaynak testi tamam.");
