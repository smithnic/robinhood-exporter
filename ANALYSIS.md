# Phase 0: Analysis of the original extension

Fill this file in as you work. Treat it as a lab notebook.

## How to get the source

Extension ID: `hcmbkfnolnimohpflddfgghnijoafdhb`

Two paths:

**Option A — CRX downloader site.** Paste the Chrome Web Store URL into [crxviewer](https://robwu.nl/crxviewer/) (also a Chrome extension). View files in the browser; download the zip.

**Option B — direct CRX URL.** Replace `{ID}` and fetch:
```
https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120&acceptformat=crx2,crx3&x=id%3D{ID}%26uc
```
The downloaded file is a CRX; strip the CRX header (first ~16 bytes of magic + a length-prefixed pubkey/sig) or rename to `.zip` — most unzip tools tolerate the prefix and will warn but extract correctly. If not, use a CRX-to-ZIP converter.

- [x] Unzip into `./reference/original/` (gitignored — do not commit someone else's code).

## What to record

### manifest.json
- [x] `manifest_version`: 

    3
- [x] `permissions`: 
    
    `["activeTab", "scripting", "downloads", "tabs"]`
- [x] `host_permissions`: 

    `["https://*.robinhood.com/*"]`
- [x] `content_scripts` matches: 
    
    `["https://*.robinhood.com/*"]`
- [x] `background` type (service_worker / scripts): 

    `"service_worker": "background.js"`
- [x] `action` / popup HTML: 

    ```
    {
        "default_popup": "popup.html",
        "default_icon": {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    }
    ```

### Entry points
Lists every JS file and a one-line what it does:

| File | Role |
|---|---|
|background.js|Empty stub with comment: the extension is using default_popup so chrome.action.onClicked never fires, only exists so manifest can register a background service worker|
|contentScript.js|Functions for parsing the HTML document into the output data, calls chrome.runtime.onMessage.addListener to handle "extractData" request types and process the page data with the helpers|
|popup.js|Calls document.addEventListener for "DOMContentLoaded", logic for the popup buttons and other visuals, querying details about the current page, sending the "extractData" message, processing the response data and triggering the download with utils.js helpers|
|utils.js|Two helper functions, "convertToCSV" which takes the data array and turns it into a CSV formatted string, "downloadCsvString" which takes the CSV string and filename puts them together and triggers the download|

### Selectors Used For Parsing DOM

- [] For stocks:

    Selector: `'a[href^="/stocks/"]'`

    Regex used for path: `/^\/stocks\/[A-Za-z0-9.\-]+$/`
- [] For crypto:

    Selector: `'a[href^="/crypto/"]'`

    Regex used for path: `/^\/crypto\/[A-Za-z0-9.\-]+$/`
### CSV format
- [x] Exact column headers, in order: 

    `["name", "symbol", "shares", "price", "averageCost", "totalReturn", "equity"]` 
    
    (for crypto it is the same but `"shares"` becomes `"quantity"`)
- [x] Date format used (if any): 

    Only date is in the name of the downloaded file
- [x] Number formatting (decimals, thousands separators): 

    Example line: `NVIDIA,NVDA,60.039,212.59,97.58,6905.02,12763.76`

    Looks like 3 decimals for shares, 2 for price, 2 for averageCost, 2 for totalReturn, and 2 for equity
- [x] Filename pattern:

    Example: `stocks_data_2026-05-27_16-16-31.csv`

    Looks like something like `${type}_data_${date}_${time}.csv` where datetime is formatted `YYYY-MM-DD_HH-MM-SS`

### Behavior quirks
- [x] What does it do if you're logged out?

    No auth/api functionality, it searches the page and if present collects data from html, formats it, and triggers download. If the users not on the page it provides a link to navigate to it.

- [x] Does it handle pagination?

    No need, it loops through the found data all on one page and pushes it to an array, then converts it to the desired format.
- [x] Does it fetch quotes, or just use the `last_trade_price` from the instrument?

    Just last trading price as far as I can tell
- [x] Crypto / options support?

    There is support for stocks and for crypto (as separate exports), nothing for options.

## Decisions for the Firefox port

Based on the above, note where you'll **diverge** from the original:

No divergence for base implementation, will consider for added features

- [ ]
- [ ]
- [ ]

## Legal note

You can read this code for interoperability and to learn behavior. Do not paste it into the new project. The new project is a clean reimplementation against the same public-ish "API".
