import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPngSize } from "./icon-size.mjs";

const zipPath = process.argv[2];
if (!zipPath) {
  console.error("Usage: node tools/inspect-zip.mjs <path-to.zip>");
  process.exit(1);
}

const resolved = path.resolve(zipPath);
if (!fs.existsSync(resolved)) {
  console.error("Not found:", resolved);
  process.exit(1);
}

console.log("File:", resolved);
console.log("Size:", fs.statSync(resolved).size, "bytes");

if (process.platform !== "win32") {
  console.error("This inspector uses Expand-Archive (Windows).");
  process.exit(1);
}

import { spawnSync } from "child_process";
import os from "os";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "maingo-zip-"));
const r = spawnSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Expand-Archive -LiteralPath '${resolved.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force`,
  ],
  { encoding: "utf8" },
);

if (r.status !== 0) {
  console.error("Expand failed:", r.stderr || r.stdout);
  process.exit(1);
}

function walk(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      console.log(rel + "/");
      walk(full, rel);
    } else {
      let extra = "";
      if (e.name.endsWith(".png")) {
        const dim = getPngSize(full);
        extra = dim ? ` (${dim.w}x${dim.h})` : " (not PNG?)";
      }
      console.log(rel + extra);
    }
  }
}

console.log("\nContents:");
walk(tmp);

const manifests = [];
function findManifests(dir, base) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) findManifests(full, base ? `${base}/${name}` : name);
    else if (name === "manifest.json") manifests.push(base ? `${base}/manifest.json` : "manifest.json");
  }
}
findManifests(tmp, "");

console.log("\nManifest count:", manifests.length);
manifests.forEach((m) => console.log("  -", m));

if (manifests.length === 1) {
  const mf = path.join(tmp, manifests[0]);
  const j = JSON.parse(fs.readFileSync(mf, "utf8"));
  console.log("\nmanifest version:", j.version);
  console.log("description length:", (j.description || "").length, "/ 132 max");
}

const bad = [];
function checkIcons(dir, base) {
  const iconsDir = path.join(dir, "icons");
  if (fs.existsSync(iconsDir) && fs.statSync(iconsDir).isDirectory()) {
    for (const [name, size] of Object.entries({ "icon16.png": 16, "icon48.png": 48, "icon128.png": 128 })) {
      const p = path.join(iconsDir, name);
      if (!fs.existsSync(p)) bad.push(`Missing ${base ? base + "/" : ""}icons/${name}`);
      else {
        const dim = getPngSize(p);
        if (!dim || dim.w !== size || dim.h !== size) bad.push(`icons/${name} is ${dim ? dim.w + "x" + dim.h : "?"} need ${size}x${size}`);
      }
    }
  }
}
checkIcons(tmp, "");

if (bad.length) {
  console.log("\nIcon issues:");
  bad.forEach((b) => console.log("  -", b));
} else if (manifests.length === 1) {
  const root = path.dirname(path.join(tmp, manifests[0]));
  if (fs.existsSync(path.join(root, "icons"))) console.log("\nIcons: all sizes OK at manifest root");
}

fs.rmSync(tmp, { recursive: true, force: true });
