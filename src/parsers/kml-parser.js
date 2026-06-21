(function registerKmlParser(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.RaporKmlParser = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createKmlParser(root) {
  function parseKmlDocument(text) {
    const source = String(text || "");
    const Parser = root && root.DOMParser;

    if (typeof Parser === "function") {
      return parseWithDom(source, Parser);
    }

    return parseWithText(source);
  }

  function parseWithDom(text, Parser) {
    const xml = new Parser().parseFromString(text, "application/xml");
    const parseError = xml.querySelector("parsererror");
    if (parseError) {
      throw new Error("KML dosyasi okunamadi.");
    }

    return {
      extended: readKmlExtendedData(xml),
      coordinates: readKmlCoordinates(xml),
      centroid: calculateCentroid(readKmlCoordinates(xml)),
      rawText: xml.documentElement ? xml.documentElement.textContent || text : text,
    };
  }

  function parseWithText(text) {
    const coordinates = readKmlCoordinatesFromText(text);

    return {
      extended: readKmlExtendedDataFromText(text),
      coordinates,
      centroid: calculateCentroid(coordinates),
      rawText: stripXmlTags(text),
    };
  }

  function readKmlExtendedData(xml) {
    const values = {};

    xml.querySelectorAll("Data").forEach((node) => {
      const name = node.getAttribute("name");
      const valueNode = node.querySelector("value");
      const value = valueNode && valueNode.textContent ? valueNode.textContent.trim() : "";
      if (name && value) values[name.trim()] = value;
    });

    xml.querySelectorAll("SimpleData").forEach((node) => {
      const name = node.getAttribute("name");
      const value = node.textContent ? node.textContent.trim() : "";
      if (name && value) values[name.trim()] = value;
    });

    return values;
  }

  function readKmlCoordinates(xml) {
    const points = [];

    xml.querySelectorAll("coordinates").forEach((node) => {
      appendCoordinates(points, node.textContent || "");
    });

    return points;
  }

  function readKmlExtendedDataFromText(text) {
    const values = {};
    const dataPattern = /<Data\b[^>]*\bname=(["'])(.*?)\1[^>]*>[\s\S]*?<value\b[^>]*>([\s\S]*?)<\/value>/gi;
    const simpleDataPattern = /<SimpleData\b[^>]*\bname=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/SimpleData>/gi;
    let match;

    while ((match = dataPattern.exec(text))) {
      const name = decodeXmlText(match[2]).trim();
      const value = decodeXmlText(stripXmlTags(match[3])).trim();
      if (name && value) values[name] = value;
    }

    while ((match = simpleDataPattern.exec(text))) {
      const name = decodeXmlText(match[2]).trim();
      const value = decodeXmlText(stripXmlTags(match[3])).trim();
      if (name && value) values[name] = value;
    }

    return values;
  }

  function readKmlCoordinatesFromText(text) {
    const points = [];
    const coordinatePattern = /<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
    let match;

    while ((match = coordinatePattern.exec(text))) {
      appendCoordinates(points, decodeXmlText(match[1]));
    }

    return points;
  }

  function appendCoordinates(points, coordinateText) {
    const chunks = String(coordinateText || "").trim().split(/\s+/);

    chunks.forEach((chunk) => {
      const parts = chunk.split(",");
      const lng = Number.parseFloat(parts[0]);
      const lat = Number.parseFloat(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        points.push({ lat, lng });
      }
    });
  }

  function calculateCentroid(points) {
    if (!points.length) return null;
    const total = points.reduce(
      (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
      { lat: 0, lng: 0 },
    );

    return {
      lat: (total.lat / points.length).toFixed(6),
      lng: (total.lng / points.length).toFixed(6),
    };
  }

  function stripXmlTags(value) {
    return String(value || "").replace(/<[^>]+>/g, " ");
  }

  function decodeXmlText(value) {
    return String(value || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  return {
    parseKmlDocument,
    readKmlExtendedData,
    readKmlCoordinates,
    calculateCentroid,
  };
});
