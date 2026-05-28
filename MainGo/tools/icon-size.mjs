import fs from "fs";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ICON_SIZES = {
  "icon16.png": 16,
  "icon48.png": 48,
  "icon128.png": 128,
};

export function getPngSize(filePath) {
  const b = fs.readFileSync(filePath);
  if (b.length < 24 || b[0] !== 0x89 || b.toString("ascii", 1, 4) !== "PNG") {
    return null;
  }
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

export function ensureIconSize(srcPath, outputName, destPath) {
  const target = ICON_SIZES[outputName];
  if (!target) throw new Error(`Unknown icon name: ${outputName}`);

  const dim = getPngSize(srcPath);
  if (dim && dim.w === target && dim.h === target) {
    fs.copyFileSync(srcPath, destPath);
    return { resized: false, from: `${dim.w}x${dim.h}` };
  }

  const from = dim ? `${dim.w}x${dim.h}` : "unknown";
  if (process.platform !== "win32") {
    console.warn(
      `  ${outputName}: ${from} → need ${target}x${target}; auto-resize is Windows-only. Re-export ${target}x${target} PNG.`,
    );
    fs.copyFileSync(srcPath, destPath);
    return { resized: false, from };
  }

  const ps1 = path.join(__dirname, "resize-png.ps1");
  const r = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      ps1,
      "-InputPath",
      path.resolve(srcPath),
      "-OutputPath",
      path.resolve(destPath),
      "-Size",
      String(target),
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(
      `Resize ${outputName} failed (${from} → ${target}x${target}): ${r.stderr || r.stdout || "powershell error"}`,
    );
  }
  return { resized: true, from, to: `${target}x${target}` };
}
