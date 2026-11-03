/**
 * Mojo icon generator — pure Node.js, no deps.
 * Outputs icon.png, adaptive-icon.png, notification-icon.png, favicon.png
 * Design: bold geometric M on dark ink background.
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ────────────────────────────────────────────────────────────────────

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG encoder ───────────────────────────────────────────────────────────────

function pngChunk(type, data) {
  const t   = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([t, data]);
  const crcBuf   = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function writePng(w, h, rgba) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.allocUnsafe(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const pi = (y * w + x) * 4;
      const ri = y * (1 + w * 4) + 1 + x * 4;
      raw[ri] = rgba[pi]; raw[ri+1] = rgba[pi+1];
      raw[ri+2] = rgba[pi+2]; raw[ri+3] = rgba[pi+3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

// ── Drawing primitives ────────────────────────────────────────────────────────

function setPixel(px, w, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= w || y < 0 || y >= w) return;
  const i = (y * w + x) * 4;
  px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3];
}

function fillRect(px, w, x, y, rw, rh, c) {
  for (let py = y; py < y + rh; py++)
    for (let px2 = x; px2 < x + rw; px2++)
      setPixel(px, w, px2, py, c);
}

function fillTriangle(px, size, x0,y0, x1,y1, x2,y2, c) {
  let pts = [[x0,y0],[x1,y1],[x2,y2]].sort((a,b) => a[1]-b[1]);
  const [ax,ay] = pts[0], [bx,by] = pts[1], [cx,cy] = pts[2];
  const lerp = (y, p1x,p1y, p2x,p2y) => p1y===p2y ? p1x : p1x + (p2x-p1x)*(y-p1y)/(p2y-p1y);
  for (let y = Math.ceil(ay); y <= Math.floor(cy); y++) {
    const xAC  = lerp(y, ax,ay, cx,cy);
    const xMid = y < by ? lerp(y, ax,ay, bx,by) : lerp(y, bx,by, cx,cy);
    const xl = Math.round(Math.min(xAC, xMid));
    const xr = Math.round(Math.max(xAC, xMid));
    for (let x = xl; x <= xr; x++) setPixel(px, size, x, y, c);
  }
}

function fillQuad(px, size, p0, p1, p2, p3, c) {
  fillTriangle(px, size, p0[0],p0[1], p1[0],p1[1], p2[0],p2[1], c);
  fillTriangle(px, size, p0[0],p0[1], p2[0],p2[1], p3[0],p3[1], c);
}

function fillCircle(px, size, cx, cy, r, c) {
  for (let y = Math.floor(cy-r); y <= Math.ceil(cy+r); y++)
    for (let x = Math.floor(cx-r); x <= Math.ceil(cx+r); x++)
      if ((x-cx)**2 + (y-cy)**2 <= r*r) setPixel(px, size, x, y, c);
}

function roundedRect(px, size, x, y, w, h, r, c) {
  fillRect(px, size, x+r, y, w-2*r, h, c);
  fillRect(px, size, x, y+r, r, h-2*r, c);
  fillRect(px, size, x+w-r, y+r, r, h-2*r, c);
  fillCircle(px, size, x+r,   y+r,   r, c);
  fillCircle(px, size, x+w-r, y+r,   r, c);
  fillCircle(px, size, x+r,   y+h-r, r, c);
  fillCircle(px, size, x+w-r, y+h-r, r, c);
}

// ── Mojo M icon ───────────────────────────────────────────────────────────────
//
//  Design on 1024×1024 base:
//  Background (dark ink) rounded card with 80px radius
//  Bold geometric M:
//    Left  vertical stroke  : x 186-306, y 186-838
//    Right vertical stroke  : x 718-838, y 186-838
//    Left  diagonal  : (186,186)→(306,186)→(562,532)→(448,532)
//    Right diagonal  : (718,186)→(838,186)→(576,532)→(448,532)
//
//  V-bottom   y=532  (52% down from 186 to 838 = 652px, so 532-186=346, 346/652≈53%)
//  Stroke width at top: 120px.  V bottom span: 576-448=128px.

function drawMojoIcon(size, transparent, monoWhite) {
  const px = new Uint8Array(size * size * 4);
  const BG   = transparent ? [0,0,0,0]        : [15,27,45,255];    // #0F1B2D
  const TEAL = monoWhite   ? [255,255,255,255] : [20,184,166,255];  // #14B8A6

  // Fill background
  for (let i = 0; i < size * size; i++) {
    px[i*4]=BG[0]; px[i*4+1]=BG[1]; px[i*4+2]=BG[2]; px[i*4+3]=BG[3];
  }

  const s = size / 1024;
  const r = v => Math.round(v * s);

  if (!transparent) {
    // Rounded card background (same colour, just sets up corner radius)
    roundedRect(px, size, 0, 0, size, size, r(80), BG);
  }

  // Left vertical stroke
  fillRect(px, size, r(186), r(186), r(120), r(652), TEAL);
  // Right vertical stroke
  fillRect(px, size, r(718), r(186), r(120), r(652), TEAL);
  // Left diagonal quad
  fillQuad(px, size,
    [r(186),r(186)], [r(306),r(186)],
    [r(576),r(532)], [r(448),r(532)], TEAL);
  // Right diagonal quad
  fillQuad(px, size,
    [r(718),r(186)], [r(838),r(186)],
    [r(576),r(532)], [r(448),r(532)], TEAL);

  return px;
}

// ── Outputs ───────────────────────────────────────────────────────────────────

const ROOT = __dirname;

function save(relPath, size, transparent, monoWhite) {
  const px  = drawMojoIcon(size, transparent, monoWhite);
  const png = writePng(size, size, px);
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, png);
  console.log(`✓  ${relPath}  (${size}×${size})`);
}

save('mobile/assets/icon.png',             1024, false, false);
save('mobile/assets/adaptive-icon.png',    1024, true,  false);
save('mobile/assets/notification-icon.png', 96,  true,  true);
save('clinician-web/public/favicon.png',    64,  false, false);

console.log('\nAll Mojo icons generated.');
