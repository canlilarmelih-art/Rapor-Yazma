const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const { parseMapTileRequest } = require(path.join(root, "server.js"));

for (const source of ["osm", "imagery", "transport", "places"]) {
  assert.deepEqual(
    parseMapTileRequest(`/map-tiles/${source}/16/38068/24767`),
    { source, zoom: 16, x: 38068, y: 24767 },
  );
}

assert.equal(parseMapTileRequest("/map-tiles/unknown/16/38068/24767"), null);
assert.equal(parseMapTileRequest("/map-tiles/osm/21/1/1"), null);
assert.equal(parseMapTileRequest("/map-tiles/osm/16/65536/1"), null);

const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
assert.match(
  appSource,
  /const mapTileUrl = \(source\) => `\/map-tiles\/\$\{source\}\/\{z\}\/\{x\}\/\{y\}`;/,
  "Leaflet katmanlari sunucudaki map tile proxy rotasini kullanmali.",
);
assert.match(
  appSource,
  /return \[`\/map-tiles\/imagery\/\$\{zoom\}\/\$\{wrappedX\}\/\$\{y\}`\];/,
  "Kroki JPEG uretimi Esri'ye dogrudan degil, ayni origin map tile proxy uzerinden gitmeli.",
);
assert.match(
  appSource,
  /return \[`\/map-tiles\/osm\/\$\{zoom\}\/\$\{wrappedX\}\/\$\{y\}`\];/,
  "Sokak haritasi krokileri ayni origin map tile proxy uzerinden gitmeli.",
);
assert.doesNotMatch(
  appSource.slice(appSource.indexOf("function getExportTileUrls"), appSource.indexOf("function loadTileImage")),
  /https:\/\/.*(?:arcgisonline|openstreetmap)/,
  "Kroki canvas'i dogrudan harita saglayicisina cikmamalidir; CORS nedeniyle altlik bos kalir.",
);

console.log("map tile contract tests passed");
