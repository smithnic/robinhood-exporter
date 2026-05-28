# Robinhood Portfolio Exporter — Firefox Edition

A Firefox WebExtension that exports your Robinhood positions to CSV by scraping the rendered page. Inspired by the [Chrome extension of the same name](https://chromewebstore.google.com/detail/robinhood-portfolio-exporter/hcmbkfnolnimohpflddfgghnijoafdhb); reimplemented fresh, not copied.

## Stack
- **Manifest V3**, Firefox-native
- **TypeScript** + **Vite**
- No framework — vanilla TS for the popup, querySelector for the content script

## What this actually does

> ⚠️ This is a DOM-scraping extension, not an API client. There is no auth, no token, no `fetch` to Robinhood. It reads what's already rendered on the page the user is looking at.

User flow:
1. User logs into robinhood.com manually and navigates to a page that shows their positions.
2. User clicks the extension icon → popup opens with two buttons: **Export Stocks** and **Export Crypto**.
3. User clicks one. Popup messages the content script in the active tab.
4. Content script runs `querySelector`s against the rendered DOM, extracts rows of position data, returns an array.
5. Popup formats as CSV, triggers a download named like `stocks_data_2026-05-27_16-16-31.csv`.

If the active tab isn't on robinhood.com or doesn't contain the expected elements, the popup tells the user where to go.

## Architecture

```
┌─────────────────┐   sendMessage     ┌──────────────────────┐
│  Popup (UI)     │ ────────────────> │  Content script      │
│  - Stocks btn   │                   │  (runs on robinhood) │
│  - Crypto btn   │                   │  - querySelector     │
│  - Status text  │ <──────────────── │  - returns rows[]    │
│  - CSV download │   response        └──────────────────────┘
└─────────────────┘
```

That's it. The background service worker exists only because MV3 wants it to; it does nothing.

## CSV format (matches original)

**Stocks columns** (in order):
```
name, symbol, shares, price, averageCost, totalReturn, equity
```

**Crypto columns** (in order):
```
name, symbol, quantity, price, averageCost, totalReturn, equity
```
(Only difference: `shares` → `quantity`.)

**Number formatting:**
- `shares` / `quantity`: 3 decimal places
- `price`, `averageCost`, `totalReturn`, `equity`: 2 decimal places
- No thousands separators
- No currency symbols, no `+`/`-` other than minus signs for negatives

Example row: `NVIDIA,NVDA,60.039,212.59,97.58,6905.02,12763.76`

**Filename:** `${type}_data_${YYYY-MM-DD}_${HH-MM-SS}.csv` — local time.

## Project layout

```
.
├── CLAUDE.md                    # this file
├── ANALYSIS.md                  # Phase 0 notes (done)
├── BUILD.md                     # build / dev / load instructions
├── STATUS.md                    # end-of-session handoff notes (write before stopping)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── manifest.json
│   └── icons/
├── reference/                   # gitignored — original CRX contents for reference only
└── src/
    ├── background/
    │   └── index.ts             # near-empty SW (MV3 requirement)
    ├── popup/
    │   ├── index.html
    │   ├── popup.ts             # button handlers, messaging, download trigger
    │   └── popup.css
    ├── content/
    │   ├── index.ts             # message listener, dispatches stocks/crypto extractor
    │   ├── extractStocks.ts     # DOM selectors → Position[]
    │   └── extractCrypto.ts     # DOM selectors → CryptoPosition[]
    └── lib/
        ├── csv.ts               # rows → CSV string (CRLF, proper quoting)
        ├── download.ts          # blob URL + browser.downloads.download
        ├── filename.ts          # `${type}_data_${date}_${time}.csv`
        └── types.ts             # Position, CryptoPosition, ExtractResult
```

## Permissions

Smaller than originally planned — no API host permissions needed.

```json
"permissions": ["activeTab", "scripting", "downloads"],
"host_permissions": []
```

`activeTab` + `scripting` is enough to inject and message a content script on the current tab when the user clicks the action button. No standing access to `*.robinhood.com` is required, which is the better security story.

The original extension declares `https://*.robinhood.com/*` in `host_permissions` and registers the content script statically. That works too. Pick one:

- **Option A — static content script + host permissions** (matches original, content script always runs on robinhood.com tabs). Simpler.
- **Option B — `activeTab` + dynamic injection via `scripting.executeScript`** (content script only runs when user clicks the action). Tighter permissions.

Start with **Option A**; it's what the original does and is one less moving part. Note Option B in `STATUS.md` as a possible v2 hardening.

## The load-bearing risk: DOM selectors

This is the part to be careful about.

DOM scraping breaks when the page changes — and Robinhood A/B-tests its frontend. The selectors that work today may silently start returning the wrong column tomorrow. Three things follow:

1. **Selectors live in their own files** (`extractStocks.ts`, `extractCrypto.ts`) so they're easy to find and update.
2. **Defensive parsing.** Every extracted field gets validated: numbers must parse, symbols must be non-empty strings, row count must be > 0 before we offer a download. On failure, show a clear "couldn't read the page — Robinhood may have changed their layout" message rather than producing a malformed CSV.
3. **Save HTML fixtures.** Once we have a working extractor, save a snapshot of the relevant page HTML (with personal data redacted) to `tests/fixtures/`. Lets us write unit tests on the extractor without needing a live Robinhood session, and gives us a regression check when Robinhood changes things.

We're going to copy the original's selector logic by *behavior*, not by code. Open the original `contentScript.js` to understand what it's looking for; then write your own selectors against the live page (DevTools → inspect a position row → figure out the structure).

## Phased plan

### Phase 1 — Scaffold (1 hr)
- [ ] `npm init`, install Vite + TS + `webextension-polyfill` + `@types/firefox-webext-browser`.
- [ ] Write `manifest.json` (see `BUILD.md`).
- [ ] Empty popup that says "Hello", empty content script that logs, empty background SW.
- [ ] Load in Firefox via `about:debugging`, confirm popup opens and content script logs on robinhood.com.
- [ ] Commit.

### Phase 2 — Popup UI + plumbing (1 hr)
- [ ] Popup with two buttons (Stocks / Crypto) and a status area.
- [ ] On click: send message to content script in active tab via `browser.tabs.sendMessage`.
- [ ] Content script: register listener, respond with a stubbed `{ ok: true, rows: [] }` for now.
- [ ] Popup handles the response, logs to console.
- [ ] Detect "not on robinhood.com" case (tab URL check) and show the user a message + link.
- [ ] Commit.

### Phase 3 — Stocks extractor (2–3 hrs)
- [ ] Open robinhood.com positions page in DevTools, find the DOM structure for position rows.
- [ ] Write `extractStocks.ts` — querySelector-based, returns `Position[]`.
- [ ] Validate each row (numbers parse, symbol non-empty); collect failures separately.
- [ ] Save HTML fixture to `tests/fixtures/stocks.html` (redact account numbers / personal info).
- [ ] Wire into popup → CSV via `lib/csv.ts` → download via `lib/download.ts`.
- [ ] Open the resulting CSV in a spreadsheet, eyeball it against the actual portfolio.
- [ ] Commit.

### Phase 4 — Crypto extractor (1–2 hrs)
- [ ] Same as Phase 3 but for the crypto page. Different selectors, `quantity` instead of `shares`.
- [ ] Fixture, validation, end-to-end test.
- [ ] Commit.

### Phase 5 — Polish (1 hr)
- [ ] Icons (16/32/48/96/128).
- [ ] Error states: not logged in, not on positions page, no rows found, parse failures.
- [ ] README with install instructions.
- [ ] `web-ext lint` clean.
- [ ] Tag v0.1.0.

### Later (v0.2+)
- Options positions (original doesn't support)
- Date-range / historical data (would require API access, scope change)
- Dividends history (ditto)
- Auto-detect stocks vs crypto from current URL instead of two buttons

## Conventions
- TypeScript strict mode on. No `any` without a justifying comment.
- No code from the original extension. Reference it for behavior; write your own.
- Selectors and parsing logic isolated to `src/content/extract*.ts`.
- CSV: CRLF line endings, fields with `,` `"` or newline get quoted with `""` escaping.
- Conventional commit messages.
- Before stopping a work session, update `STATUS.md` with: what's done, what's next, any landmines.

## What we explicitly are NOT doing

These were in the original draft of this doc and shouldn't have been:

- ❌ Reading auth tokens from localStorage / cookies
- ❌ Calling `api.robinhood.com` / `nummus.robinhood.com` directly
- ❌ Pagination of API responses
- ❌ Instrument hydration / quote fetching
- ❌ Programmatic login

The original is a scraper. We are building a scraper. If we ever want an API-based version, it's a different project.
