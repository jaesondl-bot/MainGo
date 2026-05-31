# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

MainGo is a **Chrome Manifest V3 extension** (vanilla JS/CSS/HTML under `MainGo/`). There is no backend, no `package.json`, and no automated test suite in-tree. Development means loading the unpacked extension in Chrome and exercising the side panel + burst flow.

### System dependencies

| Tool | Purpose |
|------|---------|
| **Google Chrome** (`google-chrome-stable`) | Manual testing via `chrome://extensions` → Load unpacked |
| **Chrome for Testing** (optional, for automation) | Supports `--load-extension` (removed in branded Chrome 137+) |
| **Node.js** (optional) | Icon tooling only: `node MainGo/tools/build-icons.mjs` |

Icons are already committed under `MainGo/icons/`. Regenerate only if missing or intentionally changing art.

### Branded Chrome vs Chrome for Testing

**Important:** Official **Google Chrome 137+** ignores `--load-extension` on the command line. Cloud agents and automation should use **Chrome for Testing**, for example:

```bash
npx @puppeteer/browsers install chrome@stable --path /tmp/cft
CFT=/tmp/cft/chrome/linux-*/chrome-linux64/chrome
DISPLAY=:1 "$CFT" \
  --user-data-dir=/tmp/maingo-profile \
  --disable-extensions-except=/workspace/MainGo \
  --load-extension=/workspace/MainGo \
  --no-first-run
```

Unpacked extension ID for path `/workspace/MainGo` is stable: `npddoajbdfkejclncbackcbpihjbglnj`.

Manual load (Desktop): `chrome://extensions` → Developer mode → **Load unpacked** → select `MainGo/` (folder containing `manifest.json`).

### Validate without opening Spotify in the UI

```bash
node --check MainGo/popup.js
node --check MainGo/background.js
```

URL builder smoke (all service × genre pairs produce valid `https:` URLs) can be run with a short Node one-liner that evaluates the `SERVICE_BUILDERS` / `GENRE_QUERY_VARIANTS` blocks from `popup.js` (see cloud setup logs).

### End-to-end burst check (automation)

After Chrome for Testing is installed, Puppeteer can drive the popup and assert a Spotify search tab opens, for example:

- Open `chrome-extension://npddoajbdfkejclncbackcbpihjbglnj/popup.html`
- Select **Spotify** + **chill**, click **GoGo Maingo Burst**
- Expect a tab like `https://open.spotify.com/search/...`

Outbound HTTPS to streaming sites is required for live destination pages; the extension itself has no env vars or secrets.

### Lint / tests

There is no ESLint or unit test config. Use `node --check` on `popup.js` and `background.js` as the lint equivalent.

### Privacy page

`privacy.html` at repo root is static documentation (e.g. GitHub Pages), not part of extension runtime.
