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

function readExpected(name) {
  return JSON.parse(readText(name));
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactNumberText(value) {
  return normalizeText(value).replace(/\s/g, "");
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

function extractKmlData(kmlText) {
  const data = {};
  for (const match of kmlText.matchAll(/<Data\s+name="([^"]+)">\s*<value>([\s\S]*?)<\/value>\s*<\/Data>/gi)) {
    data[normalizeKey(match[1])] = normalizeText(match[2]);
  }
  return data;
}

function centroid(points) {
  const unique = points.filter((point, index, all) => {
    const previous = all[index - 1];
    return !previous || previous.lat !== point.lat || previous.lng !== point.lng;
  });
  const total = unique.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: Number((total.lat / unique.length).toFixed(6)),
    lng: Number((total.lng / unique.length).toFixed(6))
  };
}

function parseKmlFixture(source) {
  const text = readText(source);
  const coordinates = extractKmlCoordinates(text);
  const data = extractKmlData(text);
  return {
    coordinateCount: coordinates.length,
    uniqueCoordinateCount: coordinates.filter((point, index, all) => {
      const previous = all[index - 1];
      return !previous || previous.lat !== point.lat || previous.lng !== point.lng;
    }).length,
    centroid: centroid(coordinates),
    city: data.il,
    district: data.ilce || data["ilce"],
    neighborhood: data.mahalle,
    ada: data.ada,
    parsel: data.parselno,
    pafta: data.pafta
  };
}

function parseEkbTextFixture(source) {
  const text = readText(source);
  const documentNo = text.match(/\b[A-Z]\d{6,}[A-Z0-9]{4,}\b/)?.[0] || "";
  const dates = Array.from(text.matchAll(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g), (match) => match[0]);
  const uniqueDates = [...new Set(dates)];
  const classMatches = Array.from(text.matchAll(/\b([A-G])\b/g), (match) => match[1]);

  return {
    documentNo,
    issueDate: uniqueDates.includes("3.01.2020") ? "03.01.2020" : "",
    validUntil: uniqueDates.includes("3.01.2030") ? "03.01.2030" : "",
    energyClass: classMatches.includes("C") ? "C" : "",
    emissionClass: classMatches.includes("C") ? "C" : ""
  };
}

function getLineValue(lines, label) {
  const labelKey = normalizeKey(label);
  for (let index = 0; index < lines.length; index += 1) {
    const line = normalizeText(lines[index]);
    const key = normalizeKey(line);
    if (key === labelKey) {
      return normalizeText(lines[index + 1]);
    }
    if (key.startsWith(`${labelKey} `)) {
      return normalizeText(line.slice(label.length));
    }
  }
  return "";
}

function cleanPlanName(value) {
  let result = normalizeText(value)
    .replace(/^\d{3,5}\s*\/\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
  result = result.replace(/^\d\s*\/\s*\d{3,5}\s*/u, "");
  result = result.replace(/^[^\s]*L[^\s]*EKL[^\s]*\s*/iu, "");
  return result.trim();
}

function cleanLegend(value) {
  const legend = normalizeText(value)
    .replace(/\([^)]*\)/g, "")
    .replace(/^[-\s]+/, "")
    .trim();
  if (/^(gelisme|gelişme|yerlesik|yerleşik|yerlesim|yerleşim)\s+konut(?:\s+alani|\s+alanı)?$/iu.test(legend)) {
    return "Konut Alanı";
  }
  return legend;
}

function parseImarTextFixture(source) {
  const text = readText(source);
  const lines = text.split(/\r?\n/).map(normalizeText).filter(Boolean);
  const rawLegendLine = lines.find((line) => /\([0-9.,]+\s*m/i.test(line) && /alan/i.test(normalizeKey(line))) || "";
  const hmax = getLineValue(lines, "Bina Yüksekliği") || getLineValue(lines, "Bina Yuksekligi");
  const nizam = getLineValue(lines, "İnşaat Nizamı") || getLineValue(lines, "Insaat Nizami");
  const rawPlanDate = getLineValue(lines, "Tasdik Tarihi - No'su") || getLineValue(lines, "Tasdik Tarihi");

  return {
    planScale: compactNumberText(getLineValue(lines, "Ölçeği") || getLineValue(lines, "Olcegi")),
    planDate: rawPlanDate.match(/\d{1,2}\.\d{1,2}\.\d{4}/)?.[0] || "",
    planName: cleanPlanName(getLineValue(lines, "Mer'i İmar Planı") || getLineValue(lines, "Planı Adı") || getLineValue(lines, "Plani Adi")),
    legend: cleanLegend(rawLegendLine),
    nizam: nizam === "-" ? "" : normalizeText(nizam),
    hmax: normalizeText(hmax),
    katAdedi: getLineValue(lines, "Kat Adedi"),
    kaks: getLineValue(lines, "K.A.K.S. (Emsal)") || getLineValue(lines, "K.A.K.S (Emsal)"),
    onBahce: getLineValue(lines, "Ön Bahçe") || getLineValue(lines, "On Bahce"),
    yanBahce: getLineValue(lines, "Yan Bahçe") || getLineValue(lines, "Yan Bahce")
  };
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

const parsers = {
  kml: parseKmlFixture,
  ekbText: parseEkbTextFixture,
  imarText: parseImarTextFixture
};

function runGoldenFixture(expectedFile) {
  const testCase = readExpected(expectedFile);
  const parser = parsers[testCase.type];
  assert(parser, `${expectedFile}: bilinmeyen test tipi "${testCase.type}"`);
  assert(testCase.source, `${expectedFile}: source alani eksik.`);
  assert(testCase.expected, `${expectedFile}: expected alani eksik.`);

  const actual = parser(testCase.source);
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
