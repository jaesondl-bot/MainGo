/**
 * Writes minimal pixel-art PNG icons (Node stdlib only).
 * Run: node MainGo/tools/build-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "icons");

const MAP = {
  ".": [254, 249, 230, 255],
  G: [72, 168, 90, 255],
  g: [46, 120, 62, 255],
  Y: [255, 214, 90, 255],
  B: [180, 130, 40, 255],
};

const ROWS = [
  "................",
  "................",
  "....ggGGGGGG....",
  "...gGGGGGGGGg...",
  "..GGGGGGGGGGGG..",
  "..GGGGGGGGGGGG..",
  "..YYYYYYYYYYYY..",
  "..YYYYYYYYYYYY..",
  "..YYYYYYYYYYYY..",
  "..YYYYYYYYYYYY..",
  "................",
  "....BBBBBBBB....",
  "....BBBBBBBB....",
  "................",
  "................",
  "................",
];

const ART = ROWS.map((row) => row.split("").map((ch) => MAP[ch] || MAP["."]));

function packU32BE(n) {
  return Buffer.from([(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = packU32BE(data.length);
  const crc = zlib.crc32(Buffer.concat([t, data])) >>> 0;
  return Buffer.concat([len, t, data, packU32BE(crc)]);
}

function encodePng(width, height, getPixel) {
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = [0];
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      row.push(r, g, b, a);
    }
    rawRows.push(Buffer.from(row));
  }
  const raw = Buffer.concat(rawRows);
  const idat = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function scaleGrid(grid, outW, outH) {
  const inH = grid.length;
  const inW = grid[0].length;
  return (x, y) => {
    const sx = Math.min(inW - 1, Math.floor((x * inW) / outW));
    const sy = Math.min(inH - 1, Math.floor((y * inH) / outH));
    return grid[sy][sx];
  };
}

fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const get = scaleGrid(ART, size, size);
  const png = encodePng(size, size, get);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
}

console.log("Wrote icons to", iconsDir);
