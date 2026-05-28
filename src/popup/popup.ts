import type { ExtractKind, ExtractRequest, ExtractResponse } from '../lib/types.js';

const readySection = document.getElementById('ready') as HTMLElement;
const notOnRhSection = document.getElementById('not-on-rh') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const stocksBtn = document.getElementById('export-stocks') as HTMLButtonElement;
const cryptoBtn = document.getElementById('export-crypto') as HTMLButtonElement;

stocksBtn.addEventListener('click', () => void onExport('stocks'));
cryptoBtn.addEventListener('click', () => void onExport('crypto'));

void init();

async function init(): Promise<void> {
  const tab = await getActiveTab();
  if (!tab || !isRobinhoodUrl(tab.url)) {
    notOnRhSection.hidden = false;
    return;
  }
  readySection.hidden = false;
}

async function onExport(kind: ExtractKind): Promise<void> {
  setStatus(`Reading ${kind}…`);
  setButtonsDisabled(true);
  try {
    const tab = await getActiveTab();
    if (!tab?.id || !isRobinhoodUrl(tab.url)) {
      showError('Active tab is not on robinhood.com.');
      return;
    }
    const req: ExtractRequest = { type: 'EXTRACT', kind };
    const res = await sendToContent(tab.id, req);
    console.log('[robinhood-exporter] response', res);
    if (!res.ok) {
      showError(res.error);
      return;
    }
    setStatus(`Got ${res.rows.length} ${kind} row(s). (CSV download not wired yet.)`);
  } catch (err) {
    showError(errorMessage(err));
  } finally {
    setButtonsDisabled(false);
  }
}

async function sendToContent(tabId: number, req: ExtractRequest): Promise<ExtractResponse> {
  try {
    return (await browser.tabs.sendMessage(tabId, req)) as ExtractResponse;
  } catch {
    // Content script not loaded (tab predates extension load). Inject and retry.
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['content/index.js'],
    });
    return (await browser.tabs.sendMessage(tabId, req)) as ExtractResponse;
  }
}

async function getActiveTab(): Promise<browser.tabs.Tab | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isRobinhoodUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === 'robinhood.com' || host.endsWith('.robinhood.com');
  } catch {
    return false;
  }
}

function setStatus(text: string): void {
  statusEl.textContent = text;
  statusEl.classList.remove('error');
}

function showError(text: string): void {
  statusEl.textContent = text;
  statusEl.classList.add('error');
}

function setButtonsDisabled(disabled: boolean): void {
  stocksBtn.disabled = disabled;
  cryptoBtn.disabled = disabled;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
