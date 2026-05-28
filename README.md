# Robinhood Portfolio Exporter — Firefox Edition

A Firefox WebExtension that exports your Robinhood stock and crypto positions to CSV. It reads the rendered DOM on robinhood.com — no API access, no token, no credentials.

Inspired by the chrome extension [Robinhood Portfolio Exporter](https://chromewebstore.google.com/detail/robinhood-portfolio-exporter/hcmbkfnolnimohpflddfgghnijoafdhb); reimplemented from scratch for Firefox enjoyers.

## What it does

1. You log into [robinhood.com](https://robinhood.com/account/investing) and open your investing page.
2. Click the extension icon → **Export Stocks** or **Export Crypto**.
3. A CSV downloads, named like `stocks_data_2026-05-27_16-16-31.csv`.

### CSV columns

**Stocks:** `name, symbol, shares, price, averageCost, totalReturn, equity`

**Crypto:** `name, symbol, quantity, price, averageCost, totalReturn, equity`

Numbers are formatted to 3 decimals for shares/quantity and 2 decimals for prices. No thousands separators or currency symbols.

## What it does NOT do

- Read auth tokens, cookies, or call Robinhood's API.
- Fetch historical data, dividends, or options positions.
- Work when you're logged out or off the positions page — it scrapes what's rendered.
- Collect user data. Everything is local in your web browser.

## Install (from source)

Until this is signed and listed on AMO, it loads as a temporary add-on:

1. Clone the repo and build:
   ```bash
   npm install
   npm run build
   ```
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick `dist/manifest.json`.
4. The extension stays loaded until Firefox restarts.

For a smoother dev loop, `npm run run:firefox` launches a fresh Firefox profile with the extension auto-loaded.

## Usage

1. Sign in to robinhood.com and navigate to [`/account/investing`](https://robinhood.com/account/investing).
2. Click the extension icon in the toolbar.
3. Click **Export Stocks** or **Export Crypto**. The CSV downloads to your default downloads folder.

On other sites or pages the extension provides the link to this address. 

## Limitations

The selectors used to pull data from the page that work today may break tomorrow. The extension uses the following to try and mitigate this:

- Numeric fields are parsed and validated; bad rows are skipped with a console warning.
- If anchors look like position links but no rows can be parsed, the popup tells you the layout may have changed.
- Selectors live in [`src/content/extractStocks.ts`](src/content/extractStocks.ts) and [`extractCrypto.ts`](src/content/extractCrypto.ts) so they're easy to update.

## Development

```bash
npm run build       # build into ./dist
npm run typecheck   # tsc --noEmit
npm run lint:ext    # web-ext lint
npm run icons       # rasterize public/icons/icon.svg → PNGs
npm run run:firefox # launch Firefox with extension loaded
```

See [`BUILD.md`](BUILD.md) for more on the build setup and [`CLAUDE.md`](CLAUDE.md) for project conventions.

## License

[MIT](LICENSE). Not affiliated with Robinhood Markets, Inc.
