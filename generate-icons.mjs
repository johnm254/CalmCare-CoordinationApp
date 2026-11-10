/**
 * epimoyo — icon & splash generator
 * Requires: sharp (npm install -g sharp → C:/Users/USER/AppData/Roaming/npm/node_modules/sharp)
 */
import { createRequire } from 'module';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);

// Load sharp from global npm
process.env.NODE_PATH = 'C:/Users/USER/AppData/Roaming/npm/node_modules';
// Use dynamic require
const sharpPath = 'C:/Users/USER/AppData/Roaming/npm/node_modules/sharp';
const sharp = require(sharpPath);

// ─── Brand colours ────────────────────────────────────────────────────────────
const GUARDIAN = '#12383A';
const LINEN    = '#F5EFE3';
const PULSE    = '#1F7A72';
const CORAL    = '#E8603C';

// ─── Reusable epimoyo SVG icon path group ─────────────────────────────────────
// Drawn in a 48×48 viewBox.
// cx/cy of the guardian arc circle = 24,24  r=18
// Arc: M36.7 11.3 A18 18 0 1 1 36.7 36.7  (open on the right like lowercase e)
// Heartbeat: 8,24 → 15,24 → 19,15 → 23,33 → 27,24 → 36,24
// Dot: cx=39.5 cy=37.5 r=4.5
function epimoyoMark(strokeColor, dotColor, strokeW = 5.5, beatW = 4) {
  return `
  <path d="M36.7 11.3 A18 18 0 1 1 36.7 36.7"
        stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" fill="none"/>
  <polyline points="8,24 15,24 19,15 23,33 27,24 36,24"
        stroke="${strokeColor}" stroke-width="${beatW}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="39.5" cy="37.5" r="4.5" fill="${dotColor}"/>`;
}

// ─── 1. App icon  1024×1024 ───────────────────────────────────────────────────
// Guardian Teal bg · Linen icon · 14% padding each side
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 58 58" width="1024" height="1024">
  <rect x="-5" y="-5" width="58" height="58" fill="${GUARDIAN}"/>
  ${epimoyoMark(LINEN, CORAL, 5.5, 4)}
</svg>`;

// ─── 2. Adaptive icon (Android)  1024×1024  ──────────────────────────────────
// Transparent bg · Linen icon · 25% padding (Android safe zone is central 66%)
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 72 72" width="1024" height="1024">
  ${epimoyoMark(LINEN, CORAL, 5.5, 4)}
</svg>`;

// ─── 3. Notification icon  96×96  ─────────────────────────────────────────────
// Transparent bg · white · used by Android system notifications
const notifSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -7 62 62" width="96" height="96">
  ${epimoyoMark('#FFFFFF', '#FFFFFF', 5.5, 4)}
</svg>`;

// ─── 4. Splash  1284×2778 ────────────────────────────────────────────────────
// Guardian Teal bg · large Linen icon centred at ~42% height · pulse line bottom
const splashW = 1284;
const splashH = 2778;
// Convert 48×48 icon to approx 480×480 at the centre, slightly above midpoint
// Icon centre: (642, 1100)   range: (642-240, 1100-240) → (402, 860) to (882, 1340)
// Scale 48→480: factor 10
const sc = 12;
const ox = splashW / 2 - 24 * sc;   // 642 - 288 = 354
const oy = 700;                       // top of icon — elevated for maximum negative space below
function pt(x, y) { return `${ox + x * sc},${oy + y * sc}`; }

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${splashW}" height="${splashH}">
  <defs>
    <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${PULSE}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${PULSE}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${splashW}" height="${splashH}" fill="${GUARDIAN}"/>

  <!-- Radial glow behind logo -->
  <ellipse cx="${splashW/2}" cy="${oy + 24*sc}" rx="${14*sc + 320}" ry="${14*sc + 320}" fill="url(#haloGlow)"/>

  <!-- Concentric halo rings (3 depths — pushed) -->
  <circle cx="${splashW/2}" cy="${oy + 24*sc}" r="${14*sc + 95}"  fill="none" stroke="${PULSE}" stroke-width="2"   opacity="0.32"/>
  <circle cx="${splashW/2}" cy="${oy + 24*sc}" r="${14*sc + 200}" fill="none" stroke="${PULSE}" stroke-width="1.2" opacity="0.18"/>
  <circle cx="${splashW/2}" cy="${oy + 24*sc}" r="${14*sc + 325}" fill="none" stroke="${PULSE}" stroke-width="1"   opacity="0.10"/>

  <!-- epimoyo guardian arc -->
  <path d="M${pt(36.7, 11.3)} A${18*sc} ${18*sc} 0 1 1 ${pt(36.7, 36.7)}"
        stroke="${LINEN}" stroke-width="${5.5*sc}" stroke-linecap="round" fill="none"/>
  <!-- Heartbeat crossbar -->
  <polyline points="${pt(8,24)} ${pt(15,24)} ${pt(19,15)} ${pt(23,33)} ${pt(27,24)} ${pt(36,24)}"
        stroke="${LINEN}" stroke-width="${4*sc}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Coral beacon dot -->
  <circle cx="${ox + 39.5*sc}" cy="${oy + 37.5*sc}" r="${4.5*sc}" fill="${CORAL}"/>

  <!-- Wordmark — editorial tracking -->
  <text x="${splashW/2}" y="${oy + 48*sc + 118}"
        text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="122" font-weight="400" fill="${LINEN}" letter-spacing="14">epimoyo</text>

  <!-- Thin rule -->
  <line x1="${splashW/2 - 84}" y1="${oy + 48*sc + 158}"
        x2="${splashW/2 + 84}" y2="${oy + 48*sc + 158}"
        stroke="${LINEN}" stroke-width="0.8" opacity="0.30"/>

  <!-- Tagline -->
  <text x="${splashW/2}" y="${oy + 48*sc + 212}"
        text-anchor="middle" font-family="Georgia, serif"
        font-size="44" font-style="italic" fill="${LINEN}" letter-spacing="1" opacity="0.65">Watching over every heartbeat.</text>

  <!-- Pulse line at the bottom -->
  <polyline points="0,${splashH - 60} 160,${splashH - 60} 240,${splashH - 130} 310,${splashH - 20} 380,${splashH - 60} 540,${splashH - 60} 620,${splashH - 100} 680,${splashH - 40} 740,${splashH - 60} 900,${splashH - 60} 980,${splashH - 110} 1050,${splashH - 25} 1120,${splashH - 60} ${splashW},${splashH - 60}"
        fill="none" stroke="${PULSE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.40"/>
</svg>`;

// ─── 5. Web favicon  64×64 ───────────────────────────────────────────────────
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -7 62 62" width="64" height="64">
  <rect x="-7" y="-7" width="62" height="62" rx="12" fill="${GUARDIAN}"/>
  ${epimoyoMark(LINEN, CORAL, 5.5, 4)}
</svg>`;

// ─── Generate all files ───────────────────────────────────────────────────────
const BASE = join(__dirname);
const MOBILE_ASSETS = join(BASE, 'mobile/assets');
const WEB_PUBLIC    = join(BASE, 'clinician-web/public');

async function generate() {
  const tasks = [
    { svg: iconSvg,      out: join(MOBILE_ASSETS, 'icon.png'),              w: 1024, h: 1024 },
    { svg: adaptiveSvg,  out: join(MOBILE_ASSETS, 'adaptive-icon.png'),     w: 1024, h: 1024, transparent: true },
    { svg: notifSvg,     out: join(MOBILE_ASSETS, 'notification-icon.png'), w: 96,   h: 96,   transparent: true },
    { svg: splashSvg,    out: join(MOBILE_ASSETS, 'splash.png'),            w: splashW, h: splashH },
    { svg: faviconSvg,   out: join(WEB_PUBLIC,    'favicon.png'),           w: 64,   h: 64 },
  ];

  for (const { svg, out, w, h, transparent } of tasks) {
    const buf = Buffer.from(svg);
    let pipeline = sharp(buf, { density: 300 }).resize(w, h);
    if (!transparent) {
      pipeline = pipeline.flatten({ background: GUARDIAN });
    }
    await pipeline.png({ compressionLevel: 9 }).toFile(out);
    console.log(`✓ ${out.replace(BASE + '/', '')}`);
  }
  console.log('\nAll icons generated.');
}

generate().catch(err => { console.error(err); process.exit(1); });
