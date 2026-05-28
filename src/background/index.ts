// MV3 requires a background script registered in the manifest. This extension
// drives all behavior from the popup + content script, so the background does
// nothing other than log on install for debugging.
browser.runtime.onInstalled.addListener(() => {
  console.log('[robinhood-exporter] background installed');
});
