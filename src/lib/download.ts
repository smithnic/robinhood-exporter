export async function downloadCsv(csv: string, filename: string): Promise<void> {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    await browser.downloads.download({ url, filename, saveAs: false });
  } finally {
    // The browser still needs the blob URL while the download is queued, so
    // delay the revoke. 60s is plenty for a tiny CSV.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
