import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPngSize, ICON_SIZES } from "./icon-size.mjs";

const iconsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "icons");

for (const [name, size] of Object.entries(ICON_SIZES)) {
  const p = path.join(iconsDir, name);
  if (!fs.existsSync(p)) {
    console.log(`${name}: MISSING`);
    continue;
  }
  const dim = getPngSize(p);
  const ok = dim && dim.w === size && dim.h === size;
  console.log(
    `${name}: ${dim ? `${dim.w}x${dim.h}` : "invalid PNG"} ${ok ? "OK" : `WRONG (need ${size}x${size})`}`,
  );
}
