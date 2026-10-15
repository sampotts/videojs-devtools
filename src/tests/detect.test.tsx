import '@videojs/html/video/player';
import { createPlayer } from '@videojs/react';
import { Video } from '@videojs/react/video';
import { createContext, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { detect } from '../detect';

const { Player } = createPlayer({ features: [] });
let reactRoot: Root | undefined;

afterEach(async () => {
  await act(() => reactRoot?.unmount());
  reactRoot = undefined;
  document.body.replaceChildren();
});

describe('detect', () => {
  it('does not identify ordinary media or a help link as Video.js', () => {
    document.body.innerHTML = '<video></video><a href="https://videojs.org/help">Help</a>';

    expect(detect().found).toBe(false);
  });

  it('identifies an HTML player host whose media is in a closed shadow root', () => {
    const player = document.createElement('video-player');

    player.attachShadow({ mode: 'closed' }).append(document.createElement('video'));
    document.body.append(player);

    expect(player.shadowRoot).toBeNull();
    expect(detect().found).toBe(true);
  });

  it('finds an HTML player inside an open shadow root', () => {
    const host = document.createElement('div');

    host.attachShadow({ mode: 'open' }).append(document.createElement('video-player'));
    document.body.append(host);

    expect(detect().found).toBe(true);
  });

  it('finds a React player without a fallback link and survives function serialization', async () => {
    const host = document.createElement('div');

    document.body.append(host);
    reactRoot = createRoot(host);
    await act(() =>
      reactRoot!.render(
        <Player>
          <Video fallback={null} />
        </Player>,
      ),
    );

    expect(document.querySelector('a')).toBeNull();
    expect(detect().found).toBe(true);
    expect(window.eval(`(${detect.toString()})()`).found).toBe(true);
  });

  it('finds a React player wrapping an iframe', async () => {
    const host = document.createElement('div');

    document.body.append(host);
    reactRoot = createRoot(host);
    await act(() =>
      reactRoot!.render(
        <Player>
          <iframe title="Video" />
        </Player>,
      ),
    );

    expect(detect().found).toBe(true);
  });

  it('rejects an unrelated React context with a similar shape', async () => {
    const Context = createContext({ store: {}, setMedia() {}, setContainer() {} });
    const host = document.createElement('div');

    document.body.append(host);
    reactRoot = createRoot(host);
    await act(() =>
      reactRoot!.render(
        <Context.Provider value={{ store: {}, setMedia() {}, setContainer() {} }}>
          <video />
        </Context.Provider>,
      ),
    );

    expect(detect().found).toBe(false);
  });
});
