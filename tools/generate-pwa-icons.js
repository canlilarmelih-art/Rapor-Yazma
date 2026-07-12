// Geliştirme zamanı aracı: PWA ikonlarını üretir (Faz 3, 2026-07-09).
// Harici bağımlılık yok (bu proje npm paketi kullanmıyor); PNG dosyası
// Node'un yerleşik zlib'i ile elle bayt bayt yazılır. Uygulama çalışma
// zamanında BU DOSYAYI çalıştırmaz — yalnızca `icons/*.png` çıktısı
// index.html/manifest.json tarafından statik olarak servis edilir.
//
// Tasarım: lacivert zemin (#111d3d, sidebar tabanı) + altın (kenar
// çubuğundaki marka kutusuyla aynı degrade, #f6d489 -> #e9b451) köşesi
// kırpılmış (belge/rapor izlenimi) kare — mevcut UI'daki .brand-mark ile
// aynı iki renk, yeni bir marka rengi icat edilmedi.
//
// Kullanım: node tools/generate-pwa-icons.js

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });

const NAVY = [0x11, 0x1d, 0x3d];
const GOLD_TOP = [0xf6, 0xd4, 0x89];
const GOLD_BOTTOM = [0xe9, 0xb4, 0x51];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Basit yuvarlatılmış köşe testi: (x,y) merkez kareye göre köşe yarıçapı
// dışında kalıyorsa false döner (o piksel arka planda kalır).
function withinRoundedSquare(x, y, size, radius) {
  const cx = Math.max(radius, Math.min(size - radius, x));
  const cy = Math.max(radius, Math.min(size - radius, y));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius || (x >= radius && x <= size - radius) || (y >= radius && y <= size - radius);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const pad = Math.round(size * 0.16);
  const innerSize = size - pad * 2;
  const innerRadius = Math.round(innerSize * 0.22);
  const foldSize = Math.round(innerSize * 0.32);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      let r = NAVY[0];
      let g = NAVY[1];
      let b = NAVY[2];
      const ix = x - pad;
      const iy = y - pad;
      const insideInner = ix >= 0 && iy >= 0 && ix < innerSize && iy < innerSize
        && withinRoundedSquare(ix, iy, innerSize, innerRadius);
      const insideFold = ix >= innerSize - foldSize && iy < foldSize && (ix - (innerSize - foldSize)) > (foldSize - iy);
      if (insideInner && !insideFold) {
        const t = iy / innerSize;
        r = lerp(GOLD_TOP[0], GOLD_BOTTOM[0], t);
        g = lerp(GOLD_TOP[1], GOLD_BOTTOM[1], t);
        b = lerp(GOLD_TOP[2], GOLD_BOTTOM[2], t);
      }
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }

  const rowSize = size * 4 + 1;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * rowSize] = 0; // filter: none
    pixels.copy(raw, y * rowSize + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

targets.forEach(({ name, size }) => {
  const png = drawIcon(size);
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(`Yazıldı: icons/${name} (${size}x${size}, ${png.length} bayt)`);
});
