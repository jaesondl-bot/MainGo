/**
 * MainGo background — opens the side panel from the toolbar icon and reuses one
 * “burst” tab so repeated GoGo Maingo Burst clicks update the same tab.
 */

const BURST_TAB_ID_KEY = "burstTabId";

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "OPEN_BURST" || typeof message.url !== "string") {
    return false;
  }
  openBurstInReusedTab(message.url)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});

async function openBurstInReusedTab(url) {
  const stored = await chrome.storage.session.get(BURST_TAB_ID_KEY);
  const existingId = stored[BURST_TAB_ID_KEY];

  if (existingId != null) {
    try {
      await chrome.tabs.get(existingId);
      await chrome.tabs.update(existingId, { url, active: true });
      return;
    } catch {
      await chrome.storage.session.remove(BURST_TAB_ID_KEY);
    }
  }

  const tab = await chrome.tabs.create({ url, active: true });
  await chrome.storage.session.set({ [BURST_TAB_ID_KEY]: tab.id });
}
