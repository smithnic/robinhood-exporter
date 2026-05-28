import type { ExtractKind, ExtractRequest, ExtractResponse } from '../lib/types.js';
import { extractCrypto } from './extractCrypto.js';
import { extractStocks } from './extractStocks.js';

console.log('[robinhood-exporter] content script loaded on', location.href);

browser.runtime.onMessage.addListener(
  (message: unknown): Promise<ExtractResponse> | undefined => {
    if (!isExtractRequest(message)) return undefined;
    if (message.kind === 'stocks') return Promise.resolve(handleStocks());
    return Promise.resolve(handleCrypto());
  },
);

function handleStocks(): ExtractResponse {
  const { rows, urlMatches, skipped } = extractStocks();
  if (rows.length === 0) return failure('stocks', urlMatches);
  if (skipped > 0) warnSkipped('stocks', skipped);
  return { ok: true, kind: 'stocks', rows, skipped };
}

function handleCrypto(): ExtractResponse {
  const { rows, urlMatches, skipped } = extractCrypto();
  if (rows.length === 0) return failure('crypto', urlMatches);
  if (skipped > 0) warnSkipped('crypto', skipped);
  return { ok: true, kind: 'crypto', rows, skipped };
}

function failure(kind: ExtractKind, urlMatches: number): ExtractResponse {
  const what = kind === 'stocks' ? 'stock positions' : 'crypto positions';
  if (urlMatches === 0) {
    return {
      ok: false,
      error:
        `Couldn't find any ${what} on this page. Open ` +
        `robinhood.com/account/investing while signed in, then try again.`,
    };
  }
  return {
    ok: false,
    error:
      `Found ${urlMatches} ${kind} link(s) on the page but couldn't read any rows — ` +
      `Robinhood's layout may have changed. Please file an issue.`,
  };
}

function warnSkipped(kind: ExtractKind, skipped: number): void {
  console.warn(`[robinhood-exporter] skipped ${skipped} ${kind} row(s) that failed to parse`);
}

function isExtractRequest(value: unknown): value is ExtractRequest {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return v['type'] === 'EXTRACT' && (v['kind'] === 'stocks' || v['kind'] === 'crypto');
}
