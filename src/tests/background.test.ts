import '@videojs/html/video/player';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import content from '../../public/content.js?raw';
import type { ScanResult } from '../detect';

let updated: Parameters<typeof chrome.tabs.onUpdated.addListener>[0];
let activated: Parameters<typeof chrome.tabs.onActivated.addListener>[0];
let message: Parameters<typeof chrome.runtime.onMessage.addListener>[0];
const setIcon = vi.fn(async (_options: Parameters<typeof chrome.action.setIcon>[0]) => {});

beforeEach(async () => {
  vi.resetModules();
  setIcon.mockClear();
  vi.stubGlobal('chrome', {
    action: { setIcon },
    scripting: {
      executeScript: async ({ func }: { func: () => ScanResult }) => [{ result: func() }],
    },
    tabs: {
      onUpdated: {
        addListener: (listener: typeof updated) => {
          updated = listener;
        },
      },
      onActivated: {
        addListener: (listener: typeof activated) => {
          activated = listener;
        },
      },
    },
    runtime: {
      onMessage: {
        addListener: (listener: typeof message) => {
          message = listener;
        },
      },
      sendMessage: (request: { type: 'scan' }) =>
        new Promise((reply) => {
          message(request, { tab: { id: 7 } }, reply);
        }),
    },
  });

  await import('../background');
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('background', () => {
  it.each(['load', 'activation'])('sets the green dot on tab %s without opening the popup', async (event) => {
    document.body.append(document.createElement('video-player'));

    if (event === 'load') updated(7, { status: 'complete' });
    else activated({ tabId: 7 });

    await vi.waitFor(() =>
      expect(setIcon).toHaveBeenCalledWith({
        tabId: 7,
        path: { 16: 'icons/16-found.png', 32: 'icons/32-found.png' },
      }),
    );

    updated(7, { status: 'loading' });
    expect(setIcon).toHaveBeenLastCalledWith({
      tabId: 7,
      path: { 16: 'icons/16-default.png', 32: 'icons/32-default.png' },
    });
  });

  it('rescans when a player is inserted after the document has loaded', async () => {
    window.eval(content);

    await vi.waitFor(
      () =>
        expect(setIcon).toHaveBeenCalledWith({
          tabId: 7,
          path: { 16: 'icons/16-missing.png', 32: 'icons/32-missing.png' },
        }),
      { timeout: 2000 },
    );

    document.body.append(document.createElement('video-player'));

    await vi.waitFor(
      () =>
        expect(setIcon).toHaveBeenLastCalledWith({
          tabId: 7,
          path: { 16: 'icons/16-found.png', 32: 'icons/32-found.png' },
        }),
      { timeout: 2000 },
    );
  });
});
