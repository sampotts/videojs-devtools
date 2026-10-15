import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Card, CardContent, CardHeader } from './components/ui/card';

import './styles.css';

type Status = 'scanning' | 'found' | 'missing' | 'error';

const messages = {
  scanning: { title: 'Checking this page…', description: 'Looking for Video.js.' },
  found: { title: 'Video.js found', description: 'This page uses Video.js.' },
  missing: { title: 'Video.js not found', description: 'No supported Video.js player was detected.' },
  error: { title: 'Unable to check this page', description: 'Open a website and try again.' },
} satisfies Record<Status, { title: string; description: string }>;

function Popup() {
  const [status, setStatus] = useState<Status>('scanning');
  const [blockedFrames, setBlockedFrames] = useState(false);

  useEffect(() => {
    async function scan() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id === undefined) throw new Error('No active tab');

        const result = await chrome.runtime.sendMessage({ type: 'scan', tabId: tab.id });
        if (!result) throw new Error('No scan result');

        setBlockedFrames(result.blockedFrames);
        setStatus(result.found ? 'found' : 'missing');
      } catch {
        setStatus('error');
      }
    }

    void scan();
  }, []);

  const message = messages[status];

  return (
    <main>
      <Card className="rounded-none shadow-none ring-0">
        <CardHeader className="flex items-center gap-2.5 border-b pb-4">
          <img src="icons/32-popup.png" width="24" height="24" alt="" className="rounded-sm" />
          <h1 className="text-sm font-semibold">Video.js Dev Tools</h1>
        </CardHeader>
        <CardContent>
          <div role="status" aria-live="polite" aria-atomic="true" className="space-y-1.5">
            <p className="flex items-center gap-2 font-medium">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${status === 'found' ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-muted-foreground'}`}
              />
              {message.title}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">{message.description}</p>
            {status === 'missing' && blockedFrames && (
              <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
                Some embedded frames could not be checked.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
