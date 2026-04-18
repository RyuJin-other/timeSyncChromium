// =======================================================
// File: background.js
// =======================================================

// Universal API Wrapper yang AMAN untuk Chrome dan Firefox
const browserAPI =
  typeof chrome !== "undefined" && chrome.runtime
    ? chrome
    : typeof browser !== "undefined"
      ? browser
      : null;

// --- INITIALIZATION ---
if (browserAPI) {
  browserAPI.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      console.log("Time Sync extension installed");

      // Set default settings
      browserAPI.storage.local.set({
        ntpServer: "worldtimeapi.org", // Disamakan dengan default aplikasi
        syncInterval: 60,
        lastSync: null,
        autoSyncEnabled: false,
        locationEnabled: false,
      });
    } else if (details.reason === "update") {
      console.log(`Updated from version ${details.previousVersion}`);
    }
  });

  // --- MESSAGE HANDLER ---
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSettings") {
      browserAPI.storage.local.get(null, (result) => sendResponse(result));
      return true;
    }

    if (request.action === "saveSettings") {
      browserAPI.storage.local.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  });
}
