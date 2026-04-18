// =======================================================
// File: popup.js
// =======================================================

// Get browser API (Chrome, Firefox, Edge, Brave compatible)
const browserAPI =
  typeof chrome !== "undefined" && chrome.runtime
    ? chrome
    : typeof browser !== "undefined" && browser.runtime
      ? browser
      : null;

// Debug mode - SET TO FALSE FOR PRODUCTION
const DEBUG = false;

// Security Constants
const MIN_INTERVAL = 10; // 10 seconds
const MAX_INTERVAL = 86400; // 24 hours max
const SYNC_COOLDOWN = 1000; // 1 second between syncs
const MAX_TIME_DIFF = 365 * 24 * 60 * 60 * 1000; // 1 year max difference

// State Management
const state = {
  ntpServer: "worldtimeapi.org",
  syncInterval: 60,
  serverTime: null,
  lastSync: null,
  timeOffset: null,
  isAutoSync: false,
  countdown: 0,
  isSyncing: false,
  lastSyncTime: 0,
  customLocation: "", // State untuk lokasi
  locationEnabled: false, // State untuk toggle lokasi
};

let clockInterval;

// DOM Elements
const elements = {
  serverTime: document.getElementById("serverTime"),
  serverDate: document.getElementById("serverDate"),
  serverHost: document.getElementById("serverHost"),
  pcTime: document.getElementById("pcTime"),
  pcDate: document.getElementById("pcDate"),
  status: document.getElementById("status"),
  statusDot: document.getElementById("statusDot"),
  syncBtn: document.getElementById("syncBtn"),
  syncBtnText: document.getElementById("syncBtnText"),
  autoBtn: document.getElementById("autoBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  themeToggle: document.getElementById("themeToggle"),
  detachBtn: document.getElementById("detachBtn"),
  modalOverlay: document.getElementById("modalOverlay"),
  closeModal: document.getElementById("closeModal"),
  ntpInput: document.getElementById("ntpInput"),
  intervalInput: document.getElementById("intervalInput"),
  locationInput: document.getElementById("locationInput"),
  locationDisplay: document.getElementById("locationDisplay"),
  saveStatus: document.getElementById("saveStatus"),
  locationToggle: document.getElementById("locationToggle"),
};

// =======================================================
// SECURITY & VALIDATION FUNCTIONS
// =======================================================

function debugLog(message, data = null) {
  if (DEBUG) console.log("[Time Sync]", message, data || "");
}

function isValidDomain(domain) {
  if (!domain || typeof domain !== "string") return false;
  domain = domain.trim();
  if (domain.length > 253 || domain.length < 3) return false;
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}

function sanitizeNumber(value, min, max, defaultValue) {
  const num = parseInt(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(min, num), max);
}

function isValidTimestamp(timestamp) {
  if (typeof timestamp !== "number" || isNaN(timestamp)) return false;
  const now = Date.now();
  const diff = Math.abs(timestamp - now);
  return diff < MAX_TIME_DIFF;
}

function validateWorldTimeResponse(data) {
  if (!data || typeof data !== "object")
    throw new Error("Invalid response structure");
  if (typeof data.unixtime !== "number")
    throw new Error("Missing or invalid unixtime field");
  const timestamp = data.unixtime * 1000;
  if (!isValidTimestamp(timestamp))
    throw new Error("Timestamp out of reasonable range");
  return timestamp;
}

function validateTimeAPIResponse(data) {
  if (!data || typeof data !== "object")
    throw new Error("Invalid response structure");
  if (!data.dateTime || typeof data.dateTime !== "string")
    throw new Error("Missing or invalid dateTime field");
  const date = new Date(data.dateTime + "Z");
  if (isNaN(date.getTime())) throw new Error("Invalid date format");
  if (!isValidTimestamp(date.getTime()))
    throw new Error("Timestamp out of reasonable range");
  return date;
}

function ensureHTTPS(urlString) {
  const url = new URL(urlString);
  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs are allowed");
  return url.href;
}

// =======================================================
// SETTINGS & THEME FUNCTIONS
// =======================================================

function initTheme() {
  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.get(["theme"], (result) => {
      const theme = result.theme || "dark";
      document.documentElement.setAttribute("data-theme", theme);
      if (elements.themeToggle) {
        elements.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
      }
    });
  }
}

function loadSettings() {
  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.get(
      ["ntpServer", "syncInterval", "customLocation", "locationEnabled"],
      (result) => {
        if (result.ntpServer && isValidDomain(result.ntpServer)) {
          state.ntpServer = result.ntpServer;
        } else {
          state.ntpServer = "worldtimeapi.org";
        }
        state.syncInterval = sanitizeNumber(
          result.syncInterval,
          MIN_INTERVAL,
          MAX_INTERVAL,
          60,
        );
        state.customLocation = result.customLocation || "";

        // --- AMBIL STATUS SAKELAR DARI MEMORI (Default: false) ---
        state.locationEnabled =
          result.locationEnabled !== undefined ? result.locationEnabled : false;

        if (elements.ntpInput) elements.ntpInput.value = state.ntpServer;
        if (elements.intervalInput)
          elements.intervalInput.value = state.syncInterval;
        if (elements.locationInput)
          elements.locationInput.value = state.customLocation;

        // --- SINKRONKAN VISUAL SAKELAR ---
        if (elements.locationToggle) {
          elements.locationToggle.checked = state.locationEnabled;
        }

        updateLocationDisplay();
      },
    );
  }
}

function saveSettings() {
  const settings = {
    ntpServer: state.ntpServer,
    syncInterval: state.syncInterval,
    customLocation: state.customLocation,
    locationEnabled: state.locationEnabled, // Simpan status toggle
  };

  if (browserAPI && browserAPI.storage) {
    browserAPI.storage.local.set(settings);
  }
  showSaveStatus();
}

function showSaveStatus() {
  if (elements.saveStatus) {
    elements.saveStatus.textContent = "✔️ Saved";
    setTimeout(() => {
      elements.saveStatus.textContent = "";
    }, 1000);
  }
}

function updateLocationDisplay() {
  if (!elements.locationDisplay) return;

  // --- PINTU GERBANG PRIVASI ---
  if (!state.locationEnabled) {
    elements.locationDisplay.textContent = "LOC: Nonaktif";
    console.log("[LOKASI] Dimatikan oleh user. Pelacakan dibatalkan.");
    return; // Batalkan pelacakan jika toggle dimatikan
  }

  // 1. Cek Input Manual
  if (state.customLocation && state.customLocation.trim() !== "") {
    elements.locationDisplay.textContent = `LOC: ${state.customLocation}`;
    return;
  }

  elements.locationDisplay.textContent = "LOC: Mendeteksi...";
  console.log("[LOKASI] 1. Memulai pelacakan lokasi...");

  // Jaring Pengaman 2 (Zona Waktu)
  const useFallbackTimezone = (alasan) => {
    console.log("[LOKASI] 4. Jatuh ke Fallback Default karena:", alasan);
    let areaName = "Indonesia";
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) areaName = tz.replace(/_/g, " ");
    } catch (e) {}
    elements.locationDisplay.textContent = `LOC: ${areaName}`;
  };

  // Jaring Pengaman 1 (IP API)
  const useIPLocation = async () => {
    console.log("[LOKASI] 3. Mencoba Jalur Udara (Pelacakan IP)...");
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("API diblokir browser/jaringan");
      const data = await response.json();

      if (data.city && data.country) {
        console.log("[LOKASI] Berhasil dapat lokasi dari IP:", data.city);
        elements.locationDisplay.textContent = `LOC: ${data.city}, ${data.country}`;
      } else {
        useFallbackTimezone("Data kota dari API kosong");
      }
    } catch (err) {
      useFallbackTimezone(err.message);
    }
  };

  // Percobaan Utama (GPS)
  if ("geolocation" in navigator) {
    console.log("[LOKASI] 2. Mencoba Jalur Darat (GPS OS)...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("[LOKASI] GPS Diizinkan! Menerjemahkan koordinat...");
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          );
          if (!response.ok) throw new Error("API Peta Gagal");

          const data = await response.json();
          const exactLocation =
            data.address.city ||
            data.address.town ||
            data.address.county ||
            "GPS Lokasi";
          const countryCode = data.address.country_code
            ? data.address.country_code.toUpperCase()
            : "ID";

          elements.locationDisplay.textContent = `LOC: ${exactLocation}, ${countryCode}`;
        } catch (err) {
          useIPLocation();
        }
      },
      (error) => {
        console.log("[LOKASI] GPS Ditolak Sistem. Beralih ke IP.");
        useIPLocation();
      },
      { timeout: 5000, enableHighAccuracy: false },
    );
  } else {
    useIPLocation();
  }
}

// =======================================================
// UI & TIME FORMATTING FUNCTIONS
// =======================================================

function formatJustTime(date) {
  if (!date) return "--:--:--";
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatJustDate(date) {
  if (!date) return "Loading...";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatJustTimeUTC(date) {
  if (!date) return "--:--:--";
  return date.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatJustDateUTC(date) {
  if (!date) return "Loading...";
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function updateClock() {
  const now = new Date();
  if (elements.pcTime) elements.pcTime.textContent = formatJustTime(now);
  if (elements.pcDate) elements.pcDate.textContent = formatJustDate(now);
  if (elements.serverHost)
    elements.serverHost.textContent = `HOST: ${state.ntpServer}`;

  if (state.timeOffset !== null && state.lastSync !== null) {
    const elapsed = (now - state.lastSync) / 1000;
    const serverTime = new Date(
      state.lastSync.getTime() + (elapsed + state.timeOffset) * 1000,
    );

    if (elements.serverTime)
      elements.serverTime.textContent = formatJustTimeUTC(serverTime);
    if (elements.serverDate)
      elements.serverDate.textContent = formatJustDateUTC(serverTime);
  }

  if (state.isAutoSync && state.countdown > 0) {
    state.countdown--;
    const mins = Math.floor(state.countdown / 60);
    const secs = state.countdown % 60;

    if (elements.autoBtn) {
      elements.autoBtn.textContent =
        mins > 0 ? `Auto (${mins}m ${secs}s)` : `Auto (${secs}s)`;
    }

    if (state.countdown === 0) {
      syncNow(true);
      state.countdown = state.syncInterval;
    }
  }
}

function setStatus(text, color) {
  if (elements.status) {
    elements.status.textContent = text;
    elements.status.style.color = color;
  }
  if (elements.statusDot) {
    elements.statusDot.style.backgroundColor = color;
  }
}

// =======================================================
// CORE SYNC LOGIC
// =======================================================

async function syncNow(silent = false) {
  const now = Date.now();
  if (now - state.lastSyncTime < SYNC_COOLDOWN) {
    if (!silent) setStatus("● Please wait before syncing again", "#ff9800");
    return;
  }
  state.lastSyncTime = now;

  if (!silent) {
    state.isSyncing = true;
    if (elements.syncBtn) elements.syncBtn.disabled = true;
    if (elements.syncBtnText) elements.syncBtnText.textContent = "SYNCING...";
    setStatus("● Connecting to server...", "#ffc107");
  }

  try {
    let serverDateTime = null;

    // Method 1: WorldTimeAPI
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS(
          "https://worldtimeapi.org/api/timezone/Etc/UTC",
        );
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          serverDateTime = new Date(validateWorldTimeResponse(data));
          debugLog("WorldTimeAPI success");
        }
      } catch (e) {
        debugLog("WorldTimeAPI failed", e.message);
      }
    }

    // Method 2: TimeAPI.io (Diganti dari Method 3 sebelumnya)
    if (!serverDateTime) {
      try {
        const url = ensureHTTPS(
          "https://timeapi.io/api/time/current/zone?timeZone=UTC",
        );
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          serverDateTime = validateTimeAPIResponse(data);
          debugLog("TimeAPI success");
        }
      } catch (e) {
        debugLog("TimeAPI failed", e.message);
      }
    }

    if (serverDateTime) {
      const localDateTime = new Date();
      const offset = (serverDateTime - localDateTime) / 1000;
      state.timeOffset = offset;
      state.lastSync = localDateTime;
      const diff = Math.abs(offset);

      if (diff < 0.4999) {
        setStatus("● SECURE NTP SYNC", "#10B981"); // Hijau terang
      } else {
        setStatus(`● Time Late: ${diff.toFixed(3)}s`, "#F59E0B"); // Oranye
      }
    } else {
      throw new Error("All servers failed");
    }
  } catch (error) {
    setStatus("● Sync failed - " + error.message, "#EF4444"); // Merah
    debugLog("Sync error", error);
  } finally {
    if (!silent) {
      state.isSyncing = false;
      if (elements.syncBtn) elements.syncBtn.disabled = false;
      if (elements.syncBtnText) elements.syncBtnText.textContent = "FORCE SYNC";
    }
  }
}

function toggleAutoSync() {
  if (!state.isAutoSync) {
    state.isAutoSync = true;
    state.countdown = state.syncInterval;
    elements.autoBtn.classList.remove("btn-outline");
    elements.autoBtn.classList.add("btn-success");
    syncNow(true);
  } else {
    state.isAutoSync = false;
    state.countdown = 0;
    elements.autoBtn.classList.remove("btn-success");
    elements.autoBtn.classList.add("btn-outline");
    elements.autoBtn.textContent = "Auto Sync";
  }
}

// =======================================================
// EVENT LISTENERS
// =======================================================

if (elements.syncBtn)
  elements.syncBtn.addEventListener("click", () => syncNow(false));
if (elements.autoBtn)
  elements.autoBtn.addEventListener("click", toggleAutoSync);

if (elements.settingsBtn) {
  elements.settingsBtn.addEventListener("click", () => {
    elements.modalOverlay.classList.add("active");
  });
}

if (elements.closeModal) {
  elements.closeModal.addEventListener("click", () => {
    elements.modalOverlay.classList.remove("active");
  });
}

if (elements.modalOverlay) {
  elements.modalOverlay.addEventListener("click", (e) => {
    if (e.target === elements.modalOverlay) {
      elements.modalOverlay.classList.remove("active");
    }
  });
}

if (elements.locationToggle) {
  elements.locationToggle.addEventListener("change", (e) => {
    // Update state berdasarkan posisi sakelar
    state.locationEnabled = e.target.checked;

    // Simpan ke memori secara universal (Firefox/Chrome/Edge)
    browserAPI.storage.local.set({ locationEnabled: state.locationEnabled });

    // Langsung eksekusi pembaruan tampilan di layar
    updateLocationDisplay();
  });
}

// Detach button
if (elements.detachBtn) {
  elements.detachBtn.addEventListener("click", () => {
    if (browserAPI && browserAPI.windows) {
      browserAPI.windows.create(
        {
          url: browserAPI.runtime.getURL("window.html"),
          type: "popup",
          width: 420,
          height: 180,
          left: 100,
          top: 100,
          focused: true,
        },
        (newWindow) => {
          setTimeout(() => {
            if (window.close) window.close();
          }, 100);
        },
      );
    } else {
      window.open(
        "window.html",
        "TimeSyncWindow",
        "width=420,height=220,left=100,top=100",
      );
    }
  });
}

// Theme Toggle Listener
if (elements.themeToggle) {
  elements.themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    elements.themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
    if (browserAPI && browserAPI.storage) {
      browserAPI.storage.local.set({ theme: newTheme });
    }
  });
}

// Settings Inputs Validation
if (elements.ntpInput) {
  elements.ntpInput.addEventListener("input", (e) => {
    const value = e.target.value.trim();
    if (value === "" || isValidDomain(value)) {
      elements.ntpInput.style.borderColor = "";
      state.ntpServer = value || "worldtimeapi.org"; // Diselaraskan dari pool.ntp.org
      saveSettings();
    } else {
      elements.ntpInput.style.borderColor = "#EF4444";
    }
  });
}

if (elements.intervalInput) {
  elements.intervalInput.addEventListener("input", (e) => {
    const value = sanitizeNumber(
      e.target.value,
      MIN_INTERVAL,
      MAX_INTERVAL,
      60,
    );
    elements.intervalInput.value = value;
    state.syncInterval = value;
    saveSettings();
  });
}

// Location Input Listener
if (elements.locationInput) {
  elements.locationInput.addEventListener("input", (e) => {
    // Implementasi Anti-XSS Realtime
    const safeValue = sanitizeInput(e.target.value);
    if (e.target.value !== safeValue) {
      e.target.value = safeValue;
    }
    state.customLocation = safeValue;
    updateLocationDisplay();
    saveSettings();
  });
}

// Quick Select Buttons
document.querySelectorAll(".quick-select-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const server = e.currentTarget.getAttribute("data-server");
    if (isValidDomain(server)) {
      state.ntpServer = server;
      if (elements.ntpInput) elements.ntpInput.value = server;
      saveSettings();
      setStatus(`● Syncing with ${server}...`, "#F59E0B");
      setTimeout(() => syncNow(true), 500);
    }
  });
});

// Fungsi untuk membuang karakter HTML/Script berbahaya (Anti-XSS)
function sanitizeInput(str) {
  if (!str) return "";
  // Buang tanda kurung siku < dan >, serta batasi maksimal 40 karakter
  return str.replace(/[<>]/g, "").substring(0, 40);
}

// =======================================================
// INITIALIZATION
// =======================================================

loadSettings(); // loadSettings sekarang mengatur segalanya termasuk lokasi dan sakelar
initTheme();
clockInterval = setInterval(updateClock, 1000);
updateClock();
setTimeout(() => syncNow(true), 500);
