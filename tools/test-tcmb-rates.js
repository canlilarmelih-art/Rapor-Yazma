const assert = require("node:assert/strict");
const path = require("node:path");

const { parseTcmbRates } = require(path.resolve(__dirname, "..", "server.js"));

const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<Tarih_Date Tarih="03.08.2026" Date="20260803" Bulten_No="2026/148">
  <Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
    <Unit>1</Unit><ForexBuying>47.5331</ForexBuying><ForexSelling>47.5502</ForexSelling>
  </Currency>
  <Currency CrossOrder="1" Kod="EUR" CurrencyCode="EUR">
    <Unit>1</Unit><ForexBuying>54.8617</ForexBuying><ForexSelling>54.9190</ForexSelling>
  </Currency>
</Tarih_Date>`;

assert.deepEqual(parseTcmbRates(sampleXml), {
  source: "TCMB",
  date: "03.08.2026",
  usd: { buying: 47.5331, selling: 47.5502 },
  eur: { buying: 54.8617, selling: 54.919 },
});

assert.throws(() => parseTcmbRates("<Tarih_Date Tarih=\"03.08.2026\" />"), /USD veya EUR/);
console.log("TCMB rate parsing tests passed");
