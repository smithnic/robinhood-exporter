import type { CryptoPosition } from '../lib/types.js';

const CRYPTO_HREF_RE = /^\/crypto\/([A-Za-z0-9.\-]+)$/;
const CRYPTO_HREF_PREFIX_RE = /^\/crypto\//;

export interface ExtractCryptoResult {
  rows: CryptoPosition[];
  // See ExtractStocksResult.urlMatches.
  urlMatches: number;
  skipped: number;
}

export function extractCrypto(root: ParentNode = document): ExtractCryptoResult {
  const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href]');
  const rows: CryptoPosition[] = [];
  let urlMatches = 0;
  let skipped = 0;

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href') ?? '';
    if (!CRYPTO_HREF_PREFIX_RE.test(href)) continue;

    const pathname = href.split('?')[0] ?? '';
    const m = pathname.match(CRYPTO_HREF_RE);
    if (!m) continue;
    const symbol = m[1] ?? '';
    if (!symbol) continue;

    urlMatches++;

    const cells = findRowCells(anchor);
    if (!cells) continue;

    const parsed = parseRow(symbol, cells);
    if (parsed) {
      rows.push(parsed);
    } else {
      skipped++;
    }
  }

  return { rows, urlMatches, skipped };
}

function findRowCells(anchor: HTMLElement): HTMLElement[] | null {
  let node: Element = anchor;
  while (node.children.length === 1) {
    const next = node.children[0];
    if (!(next instanceof HTMLElement)) return null;
    node = next;
  }
  if (node.children.length !== 7) return null;
  return Array.from(node.children) as HTMLElement[];
}

function parseRow(symbolFromHref: string, cells: HTMLElement[]): CryptoPosition | null {
  const [nameCell, symbolCell, qtyCell, priceCell, avgCell, returnCell, equityCell] = cells;
  if (!nameCell || !symbolCell || !qtyCell || !priceCell || !avgCell || !returnCell || !equityCell) {
    return null;
  }

  const name = (nameCell.textContent ?? '').trim();
  const symbol = (symbolCell.textContent ?? '').trim() || symbolFromHref;
  const quantity = parseNumber(qtyCell.textContent);
  const price = parseDollar(priceCell.textContent);
  const averageCost = parseDollar(avgCell.textContent);
  const totalReturnRaw = parseDollar(returnCell.textContent);
  const totalReturn = price < averageCost ? -totalReturnRaw : totalReturnRaw;
  const equity = parseDollar(equityCell.textContent);

  if (!name || !symbol) return null;
  if (![quantity, price, averageCost, totalReturn, equity].every(Number.isFinite)) return null;

  return { name, symbol, quantity, price, averageCost, totalReturn, equity };
}

function parseNumber(raw: string | null): number {
  if (raw == null) return NaN;
  return parseFloat(raw.replace(/,/g, '').trim());
}

function parseDollar(raw: string | null): number {
  if (raw == null) return NaN;
  const cleaned = raw.replace(/[$,]/g, '').replace(/[()]/g, '').trim();
  return parseFloat(cleaned);
}
