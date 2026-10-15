// oxlint-disable anti-slop/no-runtime-typeof -- Probe page-owned runtime objects without imports in the injected function.

export interface ScanResult {
  found: boolean;
  blockedFrames: boolean;
}

interface PlayerValue {
  store?: { [key: symbol]: boolean | undefined };
  setMedia?: unknown;
  setContainer?: unknown;
}

interface Fiber {
  return?: Fiber;
  alternate?: Fiber;
  memoizedProps?: { value?: PlayerValue };
}

/** Self-contained because Chrome serializes this function into the page's main world. */
export function detect(): ScanResult {
  const storeKey = Symbol.for('@videojs/store');
  const contextKey = Symbol.for('@videojs/player');
  const fibers = new WeakSet<Fiber>();
  let blockedFrames = false;

  function isPlayer(value: PlayerValue | undefined): boolean {
    return (
      value?.store?.[storeKey] === true &&
      typeof value.setMedia === 'function' &&
      typeof value.setContainer === 'function'
    );
  }

  function scan(root: ParentNode, doc: Document): boolean {
    const win = doc.defaultView!;
    // SAFETY: the optional legacy global is validated by its version below.
    const legacy = (win as Window & { videojs?: { VERSION?: unknown } }).videojs;
    if (typeof legacy?.VERSION === 'string') return true;

    for (const el of root.querySelectorAll('*')) {
      if (el.localName.includes('-')) {
        let found = false;
        const event = new win.Event('context-request', { bubbles: true, composed: true });

        // A provider ignores requests originating from itself. Use the document as the consumer
        // so an accessible player host can answer even when all its children are in a closed root.
        Object.assign(event, {
          context: contextKey,
          contextTarget: doc.documentElement,
          subscribe: false,
          callback: (store: { [key: symbol]: boolean | undefined }) => {
            found = store?.[storeKey] === true;
          },
        });

        el.dispatchEvent(event);

        if (found) return true;
      }

      const key = Object.getOwnPropertyNames(el).find((name) => name.startsWith('__reactFiber$'));
      // SAFETY: only React's private fiber-prefixed property is read; missing references are skipped.
      const node = el as Element & Record<string, Fiber | undefined>;

      for (let fiber = key ? node[key] : undefined; fiber; fiber = fiber.return) {
        if (fibers.has(fiber)) break;

        fibers.add(fiber);

        if (isPlayer(fiber.memoizedProps?.value) || isPlayer(fiber.alternate?.memoizedProps?.value)) return true;
      }

      if (el.shadowRoot && scan(el.shadowRoot, doc)) return true;

      if (el instanceof win.HTMLIFrameElement) {
        try {
          if (el.contentDocument) {
            if (scan(el.contentDocument, el.contentDocument)) return true;
          } else {
            blockedFrames = true;
          }
        } catch {
          blockedFrames = true;
        }
      }
    }

    return false;
  }

  return { found: scan(document, document), blockedFrames };
}
