// Only the extension APIs used by this popup.
declare const chrome: {
  action: {
    setIcon(options: { tabId: number; path: Record<number, string> }): Promise<void>;
  };
  tabs: {
    query(query: { active: boolean; currentWindow: boolean }): Promise<{ id?: number }[]>;
    onUpdated: {
      addListener(listener: (tabId: number, change: { status?: string }) => void): void;
    };
    onActivated: {
      addListener(listener: (tab: { tabId: number }) => void): void;
    };
  };
  runtime: {
    sendMessage(message: { type: 'scan'; tabId?: number }): Promise<import('./detect').ScanResult | null>;
    onMessage: {
      addListener(
        listener: (
          message: { type?: string; tabId?: number },
          sender: { tab?: { id?: number } },
          reply: (result: import('./detect').ScanResult | null) => void,
        ) => true | undefined,
      ): void;
    };
  };
  scripting: {
    executeScript<T>(options: { target: { tabId: number }; world: 'MAIN'; func: () => T }): Promise<{ result?: T }[]>;
  };
};
