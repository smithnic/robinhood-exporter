import type { ExtractRequest, ExtractResponse } from '../lib/types.js';

console.log('[robinhood-exporter] content script loaded on', location.href);

browser.runtime.onMessage.addListener(
  (message: unknown): Promise<ExtractResponse> | undefined => {
    if (!isExtractRequest(message)) return undefined;
    if (message.kind === 'stocks') {
      return Promise.resolve({ ok: true, kind: 'stocks', rows: [] });
    }
    return Promise.resolve({ ok: true, kind: 'crypto', rows: [] });
  },
);

function isExtractRequest(value: unknown): value is ExtractRequest {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return v['type'] === 'EXTRACT' && (v['kind'] === 'stocks' || v['kind'] === 'crypto');
}
