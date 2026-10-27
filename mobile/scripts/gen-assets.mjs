// Generates minimal valid PNG assets for the Duara app
import { deflateSync } from "zlib"
import { writeFileSync, mkdirSync } from "fs"

function makePNG(width, height, bgR, bgG, bgB, drawFn) {
  const rowSize = width * 3 + 1
  const raw = Buffer.alloc(height * rowSize)

  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0 // filter byte: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawFn(x, y, width, height) ?? [bgR, bgG, bgB]
      const off = y * rowSize + 1 + x * 3
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
    }
  }

  const compressed = deflateSync(raw)

  // CRC32 table
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc32 = (buf) => {
    let crc = 0xffffffff
    for (const b of buf) crc = (crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0
    return (crc ^ 0xffffffff) >>> 0
  }

  const chunk = (type, data) => {
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32BE(data.length)
    const tb = Buffer.from(type)
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])))
    return Buffer.concat([lenBuf, tb, data, crcBuf])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2 // 8-bit RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// Colors
const BG = [13, 28, 28] // #0D1C1C
const TEAL = [0, 196, 160] // #00C4A0
const WHITE = [255, 255, 255]

// Icon: dark bg + teal circle + white dot in centre
function iconDraw(x, y, w, h) {
  const cx = w / 2,
    cy = h / 2
  const outerR = w * 0.42,
    innerR = w * 0.13
  const ringInner = w * 0.24,
    ringOuter = w * 0.31
  const dist = Math.hypot(x - cx, y - cy)

  if (dist < innerR) return WHITE
  if (dist >= ringInner && dist < ringOuter) {
    // partial arc (simple full ring)
    return TEAL
  }
  if (dist >= outerR * 0.7 && dist < outerR) return [...TEAL, 100] // outer faint ring
  return BG
}

// Adaptive icon (same, slightly padded — Android safe zone is inner 66%)
function adaptiveDraw(x, y, w, h) {
  const cx = w / 2,
    cy = h / 2
  const innerR = w * 0.09,
    ringInner = w * 0.18,
    ringOuter = w * 0.24
  const dist = Math.hypot(x - cx, y - cy)
  if (dist < innerR) return WHITE
  if (dist >= ringInner && dist < ringOuter) return TEAL
  return BG
}

// Splash: dark bg + centred teal circle logo (larger)
function splashDraw(x, y, w, h) {
  const cx = w / 2,
    cy = h / 2
  const innerR = w * 0.06,
    ringInner = w * 0.14,
    ringOuter = w * 0.2
  const dist = Math.hypot(x - cx, y - cy)
  if (dist < innerR) return WHITE
  if (dist >= ringInner && dist < ringOuter) return TEAL
  return BG
}

// Notification icon: teal bg + white dot
function notifDraw(x, y, w, h) {
  const cx = w / 2,
    cy = h / 2
  const dist = Math.hypot(x - cx, y - cy)
  if (dist < w * 0.25) return WHITE
  return TEAL
}

mkdirSync("assets", { recursive: true })

writeFileSync("assets/icon.png", makePNG(1024, 1024, ...BG, iconDraw))
console.log("✓ assets/icon.png")

writeFileSync(
  "assets/adaptive-icon.png",
  makePNG(1024, 1024, ...BG, adaptiveDraw),
)
console.log("✓ assets/adaptive-icon.png")

writeFileSync("assets/splash.png", makePNG(1284, 2778, ...BG, splashDraw))
console.log("✓ assets/splash.png")

writeFileSync(
  "assets/notification-icon.png",
  makePNG(96, 96, ...TEAL, notifDraw),
)
console.log("✓ assets/notification-icon.png")

console.log("\nAll assets generated.")
