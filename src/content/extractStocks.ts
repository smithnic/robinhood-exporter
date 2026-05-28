import type { Position } from '../lib/types.js';

const STOCK_HREF_RE = /^\/stocks\/([A-Za-z0-9.\-]+)$/;
const STOCK_HREF_PREFIX_RE = /^\/stocks\//;

export interface ExtractStocksResult {
  rows: Position[];
  skipped: number;
}

export function extractStocks(root: ParentNode = document): ExtractStocksResult {
  const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href]');
  const rows: Position[] = [];
  let skipped = 0;

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href') ?? '';
    if (!STOCK_HREF_PREFIX_RE.test(href)) continue;

    const pathname = href.split('?')[0] ?? '';
    const m = pathname.match(STOCK_HREF_RE);
    if (!m) continue;
    const symbol = m[1] ?? '';
    if (!symbol) continue;

    const cells = findRowCells(anchor);
    if (!cells) continue;

    const parsed = parseRow(symbol, cells);
    if (parsed) {
      rows.push(parsed);
    } else {
      skipped++;
    }
  }

  return { rows, skipped };
}

// The row container is reached by walking down single-child descendants of
// the anchor until we hit a node with >1 children. That node holds the 7 cells.
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

function parseRow(symbolFromHref: string, cells: HTMLElement[]): Position | null {
  const [nameCell, symbolCell, sharesCell, priceCell, avgCell, returnCell, equityCell] = cells;
  if (!nameCell || !symbolCell || !sharesCell || !priceCell || !avgCell || !returnCell || !equityCell) {
    return null;
  }

  const name = (nameCell.textContent ?? '').trim();
  const symbol = (symbolCell.textContent ?? '').trim() || symbolFromHref;
  const shares = parseNumber(sharesCell.textContent);
  const price = parseDollar(priceCell.textContent);
  const averageCost = parseDollar(avgCell.textContent);
  // totalReturn = (price - averageCost) * shares, so its sign is just price vs cost.
  // Robinhood's text always shows the magnitude; the up/down triangle is purely visual.
  const totalReturnRaw = parseDollar(returnCell.textContent);
  const totalReturn = price < averageCost ? -totalReturnRaw : totalReturnRaw;
  const equity = parseDollar(equityCell.textContent);

  if (!name || !symbol) return null;
  if (![shares, price, averageCost, totalReturn, equity].every(Number.isFinite)) return null;

  return { name, symbol, shares, price, averageCost, totalReturn, equity };
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
