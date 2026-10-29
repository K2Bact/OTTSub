// Open the settings beside the video when the user clicks the extension icon.
// Registration belongs to each worker startup; failures never start a retry loop.
(async () => {
  try {
    if (typeof chrome === 'undefined' || typeof chrome.sidePanel?.setPanelBehavior !== 'function') {
      console.warn('[OTTSub] Side Panel API is unavailable in this browser.');
      return;
    }
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.warn('[OTTSub] Side panel registration failed:', error?.message || String(error));
  }
})();
