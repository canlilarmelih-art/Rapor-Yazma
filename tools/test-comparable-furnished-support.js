const assert = require("assert");
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function indexOfOrThrow(text, description) {
  const index = source.indexOf(text);
  assert(index >= 0, `${description} bulunamadi.`);
  return index;
}

const natureField = indexOfOrThrow('key: "c23",\n    label: "Emsal Niteliği"', "Emsal Niteliği alanı");
const furnishedField = indexOfOrThrow('key: "c32",\n    label: "Eşyalı"', "Eşyalı alanı");
const furnitureValueField = indexOfOrThrow('key: "c33",\n    label: "Eşya Bedeli"', "Eşya Bedeli alanı");
const statusField = indexOfOrThrow('key: "c2",\n    label: "Emsal Durumu"', "Emsal Durumu alanı");

assert(natureField < furnishedField, "Eşyalı alanı Emsal Niteliğinden sonra gelmelidir.");
assert(furnishedField < furnitureValueField, "Eşya Bedeli, Eşyalı alanının hemen ardından gelmelidir.");
assert(furnitureValueField < statusField, "Eşyalı alanları ilk emsal bilgileri arasında görünmelidir.");

const displayFieldsStart = indexOfOrThrow("function getComparableDisplayFields(viewMode)", "Emsal görünürlük fonksiyonu");
const displayFieldsEnd = source.indexOf("\n}\n\n// Emsaller'de Kat Bazında", displayFieldsStart);
const displayFieldsSource = source.slice(displayFieldsStart, displayFieldsEnd);
assert(displayFieldsSource.includes('field.key === "c33" && !showFurnitureValue'), "Eşya Bedeli yalnızca Evet seçildiğinde görünmelidir.");
assert(!displayFieldsSource.includes('field.key === "c32" &&'), "Eşyalı seçeneği koşulsuz görünür kalmalıdır.");

assert(source.includes('field.key === "c23" || field.key === "c32"'), "Eşyalı seçimi sonrası tablo yeniden çizilmelidir.");
assert(source.includes("const netSaleValue = saleValue - (Number.isFinite(furnitureValue)"), "Eşya bedeli indirgenmiş değer hesabından düşülmelidir.");
assert(source.includes("yalnızca gayrimenkule atfedilen net bedel esas alınmıştır"), "Eşyalı emsal piyasa notu net gayrimenkul bedeli yaklaşımını açıklamalıdır.");

console.log("Emsaller eşyalı alanı görünürlük ve hesaplama regresyon testi tamam.");
