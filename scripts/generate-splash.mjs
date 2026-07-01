// Generates native Android splash PNGs from the app logo (public/icon.svg).
// Replaces Capacitor's default "X" splash with the FinansialKu wallet logo on white.
//
// Run: node scripts/generate-splash.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOGO_SVG = await readFile(resolve(ROOT, "public/icon.svg"));
const RES = resolve(ROOT, "android/app/src/main/res");

// (folder, width, height) — sizes follow Capacitor's default splash layout.
const TARGETS = [
  ["drawable/splash.png", 480, 320], // generic fallback
  // Portrait
  ["drawable-port-mdpi/splash.png", 320, 480],
  ["drawable-port-hdpi/splash.png", 480, 800],
  ["drawable-port-xhdpi/splash.png", 640, 960],
  ["drawable-port-xxhdpi/splash.png", 960, 1600],
  ["drawable-port-xxxhdpi/splash.png", 1280, 1920],
  // Landscape
  ["drawable-land-mdpi/splash.png", 480, 320],
  ["drawable-land-hdpi/splash.png", 640, 480],
  ["drawable-land-xhdpi/splash.png", 960, 640],
  ["drawable-land-xxhdpi/splash.png", 1280, 960],
  ["drawable-land-xxxhdpi/splash.png", 1920, 1440],
];

for (const [rel, w, h] of TARGETS) {
  const out = resolve(RES, rel);
  await mkdir(dirname(out), { recursive: true });
  // Logo occupies ~38% of the shorter edge so it reads well without filling the screen.
  const logoSize = Math.round(Math.min(w, h) * 0.38);
  const logoBuffer = await sharp(LOGO_SVG).resize(logoSize, logoSize, { fit: "contain" }).png().toBuffer();

  await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // white background
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(out);

  console.log(`✓ ${rel}  (${w}x${h})`);
}

console.log("\nAll splash images generated.");
