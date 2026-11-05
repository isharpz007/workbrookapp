// Generates the PWA icons in public/icons/ — brand-blue tile with a white
// "W". Run: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

const BRAND = [0x3b, 0x6f, 0xd8];
const WHITE = [0xff, 0xff, 0xff];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)
  );
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function icon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = maskable ? 0 : size * 0.22;
  // W strokes as a polyline, kept inside the ~60% safe zone for maskable.
  const w = [
    [0.26, 0.33],
    [0.39, 0.67],
    [0.5, 0.45],
    [0.61, 0.67],
    [0.74, 0.33],
  ].map(([x, y]) => [x * size, y * size]);
  const half = size * 0.038;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let c = BRAND;
      let a = 255;
      if (!maskable) {
        // Rounded corners for the "any" icon: outside iff the pixel's
        // distance to the inner (shrunk-by-r) rect exceeds r.
        const dx = Math.max(Math.abs(x + 0.5 - size / 2) - (size / 2 - radius), 0);
        const dy = Math.max(Math.abs(y + 0.5 - size / 2) - (size / 2 - radius), 0);
        if (dx * dx + dy * dy > radius * radius) a = 0;
      }
      if (a) {
        const d = Math.min(
          ...w.slice(0, -1).map((p, j) =>
            distToSegment(x + 0.5, y + 0.5, p[0], p[1], w[j + 1][0], w[j + 1][1])
          )
        );
        if (d < half) c = WHITE;
      }
      rgba[i] = c[0];
      rgba[i + 1] = c[1];
      rgba[i + 2] = c[2];
      rgba[i + 3] = a;
    }
  }
  return encodePng(size, rgba);
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), icon(size, false));
  writeFileSync(join(outDir, `icon-maskable-${size}.png`), icon(size, true));
}
console.log("Wrote icons to", outDir);
