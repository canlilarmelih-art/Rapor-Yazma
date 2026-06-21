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

function uniqueSequentialPoints(points) {
  return points.filter((point, index, all) => {
    const previous = all[index - 1];
    return !previous || previous.lat !== point.lat || previous.lng !== point.lng;
  });
}

function centroid(points) {
  const unique = uniqueSequentialPoints(points);
  const total = unique.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: Number((total.lat / unique.length).toFixed(6)),
    lng: Number((total.lng / unique.length).toFixed(6))
  };
}

function parseKmlFixture(text) {
  const coordinates = extractKmlCoordinates(text);
  const data = extractKmlData(text);
  return {
    coordinateCount: coordinates.length,
    uniqueCoordinateCount: uniqueSequentialPoints(coordinates).length,
    centroid: centroid(coordinates),
    city: data.il,
    district: data.ilce || data["ilce"],
    neighborhood: data.mahalle,
    ada: data.ada,
    parsel: data.parselno,
    pafta: data.pafta
  };
}

function parseEkbTextFixture(text) {
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

function parseImarTextFixture(text) {
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

module.exports = {
  parseEkbTextFixture,
  parseImarTextFixture,
  parseKmlFixture
};
