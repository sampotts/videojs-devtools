import { detect, type ScanResult } from './detect';

async function scan(tabId: number): Promise<ScanResult | null> {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: detect,
    });
    const result = injection?.result;
    if (!result) throw new Error('No scan result');

    await chrome.action.setIcon({
      tabId,
      path: result.found
        ? { 16: 'icons/16-found.png', 32: 'icons/32-found.png' }
        : { 16: 'icons/16-missing.png', 32: 'icons/32-missing.png' },
    });

    return result;
  } catch {
    // Chrome-internal pages, restricted sites, and tabs closed during a scan are inaccessible.
    await chrome.action
      .setIcon({ tabId, path: { 16: 'icons/16-default.png', 32: 'icons/32-default.png' } })
      .catch(() => {});
    return null;
  }
}

chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading') {
    void chrome.action
      .setIcon({ tabId, path: { 16: 'icons/16-default.png', 32: 'icons/32-default.png' } })
      .catch(() => {});
  } else if (change.status === 'complete') {
    void scan(tabId);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void scan(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type !== 'scan') return;

  const tabId = sender.tab?.id ?? message.tabId;
  if (tabId === undefined) return;

  void scan(tabId).then(reply);
  return true;
});
