/**
 * Copies icon PNGs into every MainGo extension folder found (e.g. workspace MainGo
 * and %USERPROFILE%\.cursor\projects\empty-window\MainGo).
 * Accepts exact names (any case) or maingo-icon16.png-style aliases.
 * If no full set of assets is found, runs build-icons.mjs once, then mirrors icons to other roots.
 *
 * Run from any MainGo folder: node tools/sync-icons.mjs
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureIconSize, getPngSize } from "./icon-size.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainGo = path.join(__dirname, "..");
const workspaceRoot = path.join(mainGo, "..");

const outputs = ["icon16.png", "icon48.png", "icon128.png"];

const VARIANTS = {
  "icon16.png": [
    "icon16.png",
    "icon16.png.png",
    "maingo-icon16.png",
    "icon-16.png",
  ],
  "icon48.png": [
    "icon48.png",
    "icon48.png.png",
    "maingo-icon48.png",
    "icon-48.png",
  ],
  "icon128.png": [
    "icon128.png",
    "icon128.png.png",
    "maingo-icon128.png",
    "icon-128.png",
  ],
};

/** Other Chrome extension root: sibling of workspaceRoot under .cursor/.../MainGo */
function siblingCursorMainGo(fromMainGo) {
  const parent = path.resolve(fromMainGo, "..");
  const candidate = path.join(parent, ".cursor", "projects", "empty-window", "MainGo");
  if (fs.existsSync(path.join(candidate, "manifest.json"))) return candidate;
  return null;
}

/** Cursor project assets next to MainGo: .../empty-window/assets (not .cursor/... nested twice). */
function siblingCursorAssets(fromMainGo) {
  const parent = path.resolve(fromMainGo, "..");
  if (path.basename(parent) === "empty-window") {
    return path.join(parent, "assets");
  }
  return path.join(parent, ".cursor", "projects", "empty-window", "assets");
}

// Dedupe paths (parent of MainGo is workspaceRoot, so several joins can overlap).
const rawAssetDirs = [
  path.join(mainGo, "assets"),
  path.join(workspaceRoot, "assets"),
  siblingCursorAssets(mainGo),
  path.join(workspaceRoot, "MainGo", "assets"),
];
const candidates = [
  ...new Map(
    rawAssetDirs.filter(Boolean).map((p) => [path.resolve(p), p]),
  ).values(),
];

function discoverOutputRoots() {
  const roots = [];
  const seen = new Set();
  function add(p) {
    if (!p) return;
    const r = path.resolve(p);
    if (seen.has(r)) return;
    if (!fs.existsSync(path.join(r, "manifest.json"))) return;
    seen.add(r);
    roots.push(r);
  }
  add(mainGo);
  add(siblingCursorMainGo(mainGo));
  add(path.join(workspaceRoot, "MainGo"));
  return roots;
}

function readdirSafe(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function resolveOne(dir, outputName) {
  for (const base of VARIANTS[outputName] || [outputName]) {
    const p = path.join(dir, base);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  const want = outputName.toLowerCase();
  for (const f of readdirSafe(dir)) {
    if (f.toLowerCase() === want) return path.join(dir, f);
  }
  return null;
}

function tryDir(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;
  const map = {};
  for (const out of outputs) {
    const src = resolveOne(dir, out);
    if (!src) return null;
    map[out] = src;
  }
  return map;
}

const outputRoots = discoverOutputRoots();
if (!outputRoots.length) {
  console.error("No extension root with manifest.json found.");
  process.exit(1);
}

function copySetToRoots(srcMap, label) {
  console.log(label);
  for (const root of outputRoots) {
    const iconsDir = path.join(root, "icons");
    fs.mkdirSync(iconsDir, { recursive: true });
    for (const out of outputs) {
      const from = srcMap[out];
      const to = path.join(iconsDir, out);
      const dim = getPngSize(from);
      const result = ensureIconSize(from, out, to);
      const tag = result.resized
        ? `resized ${result.from} → ${result.to}`
        : dim
          ? `${dim.w}x${dim.h} ok`
          : "written";
      console.log(" ->", to, `(${tag})`);
    }
  }
}

let srcMap = null;
let srcDir = null;
for (const dir of candidates) {
  if (!dir) continue;
  const m = tryDir(dir);
  if (m) {
    srcMap = m;
    srcDir = dir;
    break;
  }
}

if (srcMap) {
  console.log("Using asset folder:", srcDir);
  copySetToRoots(srcMap, "Copying into all MainGo roots:");
  process.exit(0);
}

function logAssetDiagnostics() {
  console.log("Checked these asset folders (need icon16 + icon48 + icon128, or maingo-* aliases):");
  for (const dir of candidates) {
    if (!dir) continue;
    const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    const pngs = exists
      ? readdirSafe(dir).filter((f) => /\.png$/i.test(f))
      : [];
    console.log(
      exists ? `  [dir] ${dir}` : `  [missing] ${dir}`,
      exists ? `→ PNG files: ${pngs.length ? pngs.join(", ") : "(none)"}` : "",
    );
    if (exists) {
      for (const out of outputs) {
        const hit = resolveOne(dir, out);
        console.log(`      ${out}: ${hit ? "OK " + hit : "MISSING"}`);
      }
    }
  }
}

logAssetDiagnostics();
console.warn(
  "No asset folder had all three icons. Generating with build-icons.mjs, then mirroring…",
);
const buildScript = path.join(__dirname, "build-icons.mjs");
const primary = outputRoots[0];
const r = spawnSync(process.execPath, [buildScript], {
  cwd: primary,
  stdio: "inherit",
});
if (r.status !== 0) process.exit(r.status ?? 1);

const primaryIcons = path.join(primary, "icons");
const built = {};
for (const out of outputs) {
  const p = path.join(primaryIcons, out);
  if (!fs.existsSync(p)) {
    console.error("Missing after build:", p);
    process.exit(1);
  }
  built[out] = p;
}

copySetToRoots(built, "Mirroring generated icons to all MainGo roots:");
process.exit(0);
