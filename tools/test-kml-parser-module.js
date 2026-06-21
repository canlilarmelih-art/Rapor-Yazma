const fs = require("node:fs");
const path = require("node:path");
const { parseKmlDocument } = require("../src/parsers/kml-parser");

const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "test-inputs", "parsel.kml");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  assert(
    actual === expected,
    `${label}: beklenen "${expected}", gelen "${actual}"`
  );
}

function main() {
  const text = fs.readFileSync(fixturePath, "utf8");
  const parsed = parseKmlDocument(text);

  assertEqual(parsed.extended.Ada, "3113", "Ada");
  assertEqual(parsed.extended.ParselNo, "8", "ParselNo");
  assertEqual(parsed.extended.Pafta, "H22d02c3b", "Pafta");
  assertEqual(parsed.coordinates.length, 12, "Koordinat sayisi");
  assertEqual(parsed.centroid.lat, "40.207409", "Merkez enlem");
  assertEqual(parsed.centroid.lng, "29.095407", "Merkez boylam");
  assert(parsed.rawText.includes("Millet"), "Ham metin mahalle bilgisini icermeli.");

  console.log("KML modul testi tamam.");
}

main();
