# MainGo

Minimal **Chrome MV3** extension: pick a **streaming service** and **genre**, tap **GoGo Maingo Burst**, and MainGo opens **one official `https:` page** on that service with a **genre-aligned search**—so you can start a **very short listen** yourself. **No** hosted audio, **no** playback control, **no** tracking. UI lives in the **side panel** (stays open); bursts **reuse one tab** until you close it.

### The bridge

Two populations, one river, a current that can push back. Anyone can **swim** across anytime on their own—or **build a bridge**. **MainGo is that bridge:** one deliberate crossing from “I want this vibe on that app” to the **right bank** (their official site, already lined up). You still take the last step on their shore when you hit **play**.

---

## Agenda (what this repo is for)

| In scope | Out of scope |
|----------|----------------|
| Side panel UI: service + genre + burst button | APIs, accounts, analytics, backends |
| Building one search URL per choice (`popup.js`) | Playing, timing, or downloading music inside the extension |
| `sidePanel`, `tabs`, `storage` (session tab id only) | Content scripts on Spotify/Pandora/etc. |
| Toolbar icons (`icons/`, optional `tools/`) | Curated deep links to specific tracks (unless you add them yourself later) |

---

## Load in Chrome

1. `chrome://extensions` → **Developer mode** → **Load unpacked**
2. Choose the folder that contains this **`manifest.json`**
3. Click the **MainGo** toolbar icon — UI opens in the **side panel** (not a tiny dropdown). The panel stays open until you close it.
4. **GoGo Maingo Burst** updates the same browser tab each time; close that tab if you want the next burst to open a new one.

---

## Icons

Chrome needs **`icons/icon16.png`**, **`icon48.png`**, **`icon128.png`**.

- **Fastest:** double-click **`install-icons.bat`** (Windows) or run  
  `node tools/build-icons.mjs`  
  from this folder.
- **Your own art:** drop `icon16.png` / `icon48.png` / `icon128.png` (or `icon16.png.png` etc.) into **`assets/`** or **`MainGo/assets/`**, then run  
  `node tools/sync-icons.mjs`  
  (auto-resizes to **16×16**, **48×48**, **128×128** on Windows) or `node tools/fix-icons.mjs` to fix `icons/` only.  
  Chrome requires those exact pixel sizes — `icon128.png` must be **128×128**, not “about 128” or a larger PNG.

---

## Customize behavior

Edit **`popup.js`**: `GENRE_QUERIES` and `SERVICE_BUILDERS` (official search URL patterns). Optional: **`wrapBurstUrl(url)`** — return an affiliate or tracking redirect URL; default passes the burst URL through unchanged.

Verify links in a normal browser; providers change URLs sometimes.

---

## Files

| Path | Role |
|------|------|
| `manifest.json` | MV3 manifest |
| `popup.html` / `style.css` | UI |
| `popup.js` | Service + genre → URL; optional `wrapBurstUrl` for affiliates |
| `icons/*.png` | Extension icons |
| `tools/build-icons.mjs` | Generate default icons |
| `tools/sync-icons.mjs` | Copy icons from `assets/` into all `MainGo` roots |
| `install-icons.bat` | Windows helper for `build-icons` |

---

## Disclaimer

You must follow each streaming service’s terms and applicable law. MainGo does not supply or control audio.

## Copyright

© 2026 MainGo. All rights reserved. See [LICENSE](LICENSE). Publishing on the Chrome Web Store does not grant others the right to copy or rebrand this project.
