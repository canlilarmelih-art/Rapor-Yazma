const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const controlStart = appSource.indexOf("function createMultiCheckboxControl(field)");
const controlEnd = appSource.indexOf("function createImarInstitutionControl(field)", controlStart);
assert(controlStart >= 0 && controlEnd > controlStart, "Coklu secim kontrolu bulunamadi.");
const controlSource = appSource.slice(controlStart, controlEnd);
const imarStart = controlEnd;
const imarEnd = appSource.indexOf("function getImarInstitutionValues", imarStart);
assert(imarEnd > imarStart, "Imar kurumu coklu secim kontrolu bulunamadi.");
const imarSource = appSource.slice(imarStart, imarEnd);
const comparableStart = appSource.indexOf("function createComparableMultiSelectControl(field, row, rowIndex)");
const comparableEnd = appSource.indexOf("function getComparableMultiValues", comparableStart);
assert(comparableStart >= 0 && comparableEnd > comparableStart, "Emsal kat coklu secim kontrolu bulunamadi.");
const comparableSource = appSource.slice(comparableStart, comparableEnd);

assert.match(appSource, /let multiCheckboxFieldToReopen = "";/, "Acik coklu secim alani render sonrasi izlenmelidir.");
assert.match(
  controlSource,
  /if \(field\.key === "projectInstitution"\) \{\s*multiCheckboxFieldToReopen = field\.key;\s*renderSection\(\);/,
  "Proje kurum seciminde render oncesi acik panel bilgisi korunmalidir."
);

assert.match(
  imarSource,
  /const reopenKey = `imar-institution:\$\{field\.key\}`;/,
  "Imar kurumu secimi icin acik panel kimligi korunmalidir."
);
assert.match(
  imarSource,
  /persistSelection\(values\);\s*multiCheckboxFieldToReopen = reopenKey;\s*renderSection\(\);/,
  "Imar kurumu seciminden sonra panel yeniden acilmalidir."
);
assert.match(
  imarSource,
  /if \(multiCheckboxFieldToReopen === reopenKey\) \{\s*multiCheckboxFieldToReopen = "";\s*setOpen\(true\);/,
  "Imar kurumu paneli yeniden cizimde acik kalmalidir."
);
assert.match(
  comparableSource,
  /const reopenKey = `comparable-multi-select:\$\{rowIndex\}:\$\{field\.key\}`;/,
  "Emsal kat secimi icin satira ozel acik panel kimligi korunmalidir."
);
assert.match(
  comparableSource,
  /if \(field\.key === "c6"\) \{\s*multiCheckboxFieldToReopen = reopenKey;\s*renderSection\(\);\s*\}/,
  "Emsal kat seciminde render oncesi acik panel bilgisi korunmalidir."
);
assert.match(
  comparableSource,
  /if \(multiCheckboxFieldToReopen === reopenKey\) \{\s*multiCheckboxFieldToReopen = "";\s*setOpen\(true\);/,
  "Emsal kat paneli yeniden cizimde acik kalmalidir."
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
