const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const fixtureDir = path.join(root, "test-inputs");

const requiredFixtures = [
  "takbis.pdf",
  "adres.pdf",
  "ekb.pdf",
  "imar.pdf",
  "parsel.kml"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(fixtureDir, relativePath), "utf8");
}

function extractKmlCoordinates(kmlText) {
  const matches = Array.from(kmlText.matchAll(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi));
  return matches
    .flatMap((match) => match[1].trim().split(/\s+/))
    .map((chunk) => {
      const [lng, lat] = chunk.split(",").map(Number);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter(Boolean);
}

function validateExpectedJsonFiles() {
  const expectedFiles = fs
    .readdirSync(fixtureDir)
    .filter((name) => name.endsWith(".expected.json"));

  expectedFiles.forEach((name) => {
    const fullPath = path.join(fixtureDir, name);
    JSON.parse(fs.readFileSync(fullPath, "utf8"));
  });

  return expectedFiles.length;
}

function main() {
  assert(fs.existsSync(fixtureDir), "test-inputs klasoru bulunamadi.");

  requiredFixtures.forEach((name) => {
    assert(fs.existsSync(path.join(fixtureDir, name)), `${name} test girdisi bulunamadi.`);
  });

  const kmlCoordinates = extractKmlCoordinates(readText("parsel.kml"));
  assert(kmlCoordinates.length >= 3, "parsel.kml icinde yeterli koordinat bulunamadi.");

  const expectedCount = validateExpectedJsonFiles();
  console.log(`Parser test altyapisi hazir. Fixture sayisi: ${requiredFixtures.length}, expected JSON: ${expectedCount}.`);
}

main();

