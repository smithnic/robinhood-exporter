# Build & Dev

## One-time setup

```bash
npm init -y
npm install --save-dev \
  typescript \
  vite \
  @types/firefox-webext-browser \
  @types/chrome \
  web-ext
npm install webextension-polyfill
```

For Vite + extension bundling, two reasonable options:

1. **`@crxjs/vite-plugin`** — handles manifest, HMR, content scripts. Chrome-first but works for Firefox MV3. Recommended.
2. **Hand-rolled Vite multi-entry config** — more control, more code. Pick this if `@crxjs` fights you on Firefox specifics.

Start with #1; bail to #2 only if needed.

## Dev loop

```bash
# Build into ./dist
npm run build

# Or, watch mode
npm run dev
```

### Load in Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Pick `dist/manifest.json`
4. The extension stays loaded until Firefox restarts.

For a smoother loop, use `web-ext`:
```bash
npx web-ext run --source-dir=./dist --target=firefox-desktop
```
This launches a fresh Firefox profile with the extension loaded and auto-reloads on file changes.

## manifest.json starter (MV3, Firefox)

```json
{
  "manifest_version": 3,
  "name": "Robinhood Portfolio Exporter (Firefox)",
  "version": "0.1.0",
  "description": "Export your Robinhood positions to CSV.",
  "browser_specific_settings": {
    "gecko": {
      "id": "robinhood-portfolio-exporter@yourname.dev",
      "strict_min_version": "115.0"
    }
  },
  "action": {
    "default_popup": "popup/index.html",
    "default_title": "Export Robinhood Portfolio"
  },
  "background": {
    "scripts": ["background/index.js"],
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["*://robinhood.com/*", "*://*.robinhood.com/*"],
      "js": ["content/index.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": ["activeTab", "scripting", "downloads"],
  "host_permissions": [
    "*://*.robinhood.com/*"
  ],
  "icons": {
    "48": "icons/48.png",
    "96": "icons/96.png",
    "128": "icons/128.png"
  }
}
```

Notes:
- Firefox MV3 background uses `scripts` + `"type": "module"`, **not** Chrome's `service_worker` key. (You can include both if cross-browser later, but for now keep it Firefox-shaped.)
- `gecko.id` is required for installation. Use a recognizable string; doesn't need to be a real domain.

## Signing / distribution

- **Personal use:** temporary add-on or `web-ext run` is fine forever.
- **Self-hosted install link:** submit to AMO for signing (free), can be "unlisted" — they sign it, you host the `.xpi`.
- **Public:** AMO listed. Code review can take days to weeks.

## Useful commands

```bash
# Lint manifest + general WebExtension checks
npx web-ext lint --source-dir=./dist

# Package for distribution
npx web-ext build --source-dir=./dist --artifacts-dir=./web-ext-artifacts
```
