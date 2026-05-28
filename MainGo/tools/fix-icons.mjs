/**
 * Ensures icons/icon16|48|128.png are exactly 16, 48, 128 pixels (resizes from assets if needed).
 * Run from MainGo: node tools/fix-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureIconSize, getPngSize, ICON_SIZES } from "./icon-size.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainGo = path.join(__dirname, "..");
const iconsDir = path.join(mainGo, "icons");
const assetsDir = path.join(mainGo, "assets");

const VARIANTS = {
  "icon16.png": ["icon16.png", "icon16.png.png", "maingo-icon16.png"],
  "icon48.png": ["icon48.png", "icon48.png.png", "maingo-icon48.png"],
  "icon128.png": ["icon128.png", "icon128.png.png", "maingo-icon128.png"],
};

function resolveAsset(name) {
  if (!fs.existsSync(assetsDir)) return null;
  for (const v of VARIANTS[name]) {
    const p = path.join(assetsDir, v);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

fs.mkdirSync(iconsDir, { recursive: true });

for (const name of Object.keys(ICON_SIZES)) {
  const dest = path.join(iconsDir, name);
  const src = resolveAsset(name) || (fs.existsSync(dest) ? dest : null);
  if (!src) {
    
    console.error(`No source for ${name} (check assets/ or icons/)`);
    process.exit(1);
  }
  const before = getPngSize(src);
  const result = ensureIconSize(src, name, dest);
  const after = getPngSize(dest);
  console.log(
    `${name}: ${before ? `${before.w}x${before.h}` : "?"} → ${after.w}x${after.h}` +
      (result.resized ? " (resized)" : " (ok)"),
  );
}

console.log("Done. Reload extension and re-zip for store upload.");
