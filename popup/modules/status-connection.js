// A missing content-script receiver is not a player that is waiting to load.
// Keep the active tab fresh, bound every request, and discard late responses.
export function startStatusConnection(onUpdate) {
  let closed = false, pending = false, generation = 0, timeout = null, windowId = null;
  try { chrome.windows?.getCurrent?.(current => { windowId = current?.id ?? null; }); } catch (_) {}
  const expectedBuild = chrome.runtime.getManifest?.().version_name || chrome.runtime.getManifest?.().version;
  const poll = () => {
    if (closed || pending) return;
    pending = true;
    const token = ++generation;
    let activeTab = null;
    const finish = (response, state) => {
      if (closed || token !== generation || !pending) return;
      clearTimeout(timeout); pending = false; ++generation;
      onUpdate({ response, state, tab: activeTab });
    };
    timeout = setTimeout(() => finish(null, 'panel_disconnected'), 1500);
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const error = chrome.runtime.lastError;
        if (closed || token !== generation) return;
        activeTab = tabs?.find(tab => !tab.discarded);
        if (error || !activeTab?.id) return finish(null, 'panel_no_tab');
        // URL may be unavailable on other hosts without the tabs permission.
        if (!activeTab.url || !/^https:\/\/(?:[^/]+\.)?netflix\.com\//i.test(activeTab.url)) return finish(null, 'panel_no_tab');
        chrome.tabs.sendMessage(activeTab.id, { action: 'getStatus' }, response => {
          const error = chrome.runtime.lastError;
          if (error || !response) return finish(null, 'panel_disconnected');
          if (response.build && expectedBuild && response.build !== expectedBuild) return finish(null, 'panel_disconnected');
          finish(response, null);
        });
      });
    } catch (_) { finish(null, 'panel_disconnected'); }
  };
  const timer = setInterval(poll, 500);
  const activated = info => {
    if (closed || windowId !== null && info?.windowId !== windowId) return;
    ++generation; clearTimeout(timeout); pending = false;
    onUpdate({ response: null, state: 'status_waiting', tab: null });
    poll();
  };
  chrome.tabs.onActivated?.addListener(activated);
  poll();
  const stop = () => {
    if (closed) return;
    closed = true; ++generation; clearInterval(timer); clearTimeout(timeout);
    chrome.tabs.onActivated?.removeListener(activated);
    window.removeEventListener?.('pagehide', stop);
  };
  window.addEventListener('pagehide', stop, { once: true });
  return { stop, poll };
}
