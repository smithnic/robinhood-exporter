import type { ExtractRequest, ExtractResponse } from '../lib/types.js';
import { extractStocks } from './extractStocks.js';

console.log('[robinhood-exporter] content script loaded on', location.href);

browser.runtime.onMessage.addListener(
  (message: unknown): Promise<ExtractResponse> | undefined => {
    if (!isExtractRequest(message)) return undefined;
    if (message.kind === 'stocks') return Promise.resolve(handleStocks());
    return Promise.resolve({ ok: true, kind: 'crypto', rows: [] });
  },
);

function handleStocks(): ExtractResponse {
  const { rows, skipped } = extractStocks();
  if (rows.length === 0) {
    return {
      ok: false,
      error:
        "Couldn't find any positions on this page. Open robinhood.com/account/investing while signed in, then try again.",
    };
  }
  if (skipped > 0) {
    console.warn(`[robinhood-exporter] skipped ${skipped} row(s) that failed to parse`);
  }
  return { ok: true, kind: 'stocks', rows };
}

function isExtractRequest(value: unknown): value is ExtractRequest {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return v['type'] === 'EXTRACT' && (v['kind'] === 'stocks' || v['kind'] === 'crypto');
}
