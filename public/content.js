(() => {
  let timer;

  function schedule() {
    if (timer !== undefined) return;

    timer = setTimeout(() => {
      timer = undefined;
      // Reloading the unpacked extension invalidates content scripts in existing documents.
      void chrome.runtime.sendMessage({ type: 'scan' }).catch(() => observer.disconnect());
    }, 500);
  }

  const observer = new MutationObserver(schedule);

  observer.observe(document, { childList: true, subtree: true });
  window.addEventListener('load', schedule, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') schedule();
  });

  schedule();
  // Hydration can attach a React player to server-rendered DOM without inserting new nodes.
  setTimeout(schedule, 1000);
  setTimeout(schedule, 3000);
})();
