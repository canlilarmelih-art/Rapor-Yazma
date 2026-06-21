const fs = require("node:fs");
const path = require("node:path");
const {
  parseEkbTextFixture,
  parseImarTextFixture,
  parseKmlFixture
} = require("../src/parsers/golden-fixture-parsers");

const root = path.resolve(__dirname, "..");
const fixtureDir = path.join(root, "test-inputs");

const requiredFixtures = [
  "takbis.pdf",
  "adres.pdf",
  "ekb.pdf",
  "imar.pdf",
  "parsel.kml"
];

const parsers = {
  kml: parseKmlFixture,
  ekbText: parseEkbTextFixture,
  imarText: parseImarTextFixture
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(fixtureDir, relativePath), "utf8");
}

function readExpected(name) {
  return JSON.parse(readText(name));
}

function assertEqual(actual, expected, label) {
  assert(
    actual === expected,
    `${label}: beklenen "${expected}", gelen "${actual}"`
  );
}

function assertApprox(actual, expected, tolerance, label) {
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${label}: beklenen ${expected}, gelen ${actual}`
  );
}

function assertObjectSubset(actual, expected, context) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (expectedValue && typeof expectedValue === "object" && !Array.isArray(expectedValue)) {
      assertObjectSubset(actual[key] || {}, expectedValue, `${context}.${key}`);
    } else if (typeof expectedValue === "number") {
      assertApprox(Number(actual[key]), expectedValue, 0.000001, `${context}.${key}`);
    } else {
      assertEqual(String(actual[key] || ""), String(expectedValue), `${context}.${key}`);
    }
  }
}

function runGoldenFixture(expectedFile) {
  const testCase = readExpected(expectedFile);
  const parser = parsers[testCase.type];
  assert(parser, `${expectedFile}: bilinmeyen test tipi "${testCase.type}"`);
  assert(testCase.source, `${expectedFile}: source alani eksik.`);
  assert(testCase.expected, `${expectedFile}: expected alani eksik.`);

  const actual = parser(readText(testCase.source));
  assertObjectSubset(actual, testCase.expected, expectedFile);
}

function main() {
  assert(fs.existsSync(fixtureDir), "test-inputs klasoru bulunamadi.");

  requiredFixtures.forEach((name) => {
    assert(fs.existsSync(path.join(fixtureDir, name)), `${name} test girdisi bulunamadi.`);
  });

  const expectedFiles = fs
    .readdirSync(fixtureDir)
    .filter((name) => name.endsWith(".expected.json"))
    .sort();

  assert(expectedFiles.length > 0, "En az bir expected JSON testi bulunmali.");
  expectedFiles.forEach(runGoldenFixture);

  console.log(`Parser altin testleri tamam. Fixture sayisi: ${requiredFixtures.length}, expected JSON: ${expectedFiles.length}.`);
}

main();
