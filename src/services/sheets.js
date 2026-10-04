/**
 * Google Sheets API Integration Service
 * Communicates with Google Apps Script Web App.
 * Handles timeouts, offline queuing, CORS compatibility, and mock fallback.
 */

import { offlineQueue } from './offlineQueue';

const SHEETS_URL = import.meta.env.VITE_SHEETS_URL || '';
const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'CTRL 2K26';

// Local storage key for mock / local attendance ledger
const MOCK_STORAGE_KEY = 'ctrl_2k26_local_ledger';

function getLocalLedger() {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalLedger(ledger) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(ledger));
  } catch (e) {}
}

/**
 * Pings Google Sheets Web App to test live connectivity.
 */
export async function pingSheet() {
  if (!SHEETS_URL) {
    return { connected: false, mode: 'STANDBY_MOCK', message: 'No Apps Script URL configured in .env' };
  }

  if (!navigator.onLine) {
    return { connected: false, mode: 'OFFLINE', message: 'Device is offline' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${SHEETS_URL}?action=ping&_t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { connected: true, data };
    }
    return { connected: false, message: `HTTP status: ${res.status}` };
  } catch (err) {
    return { connected: false, message: err.message || 'Connection timeout' };
  }
}

/**
 * Records attendance for a scanned barcode / student ID.
 * @param {Object} param0
 * @param {string} param0.id - Scanned ID / barcode
 * @param {string} param0.source - 'camera' | 'manual'
 * @param {string} [param0.timestamp] - ISO string
 */
export async function recordAttendance({ id, source = 'camera', timestamp = new Date().toISOString() }) {
  const cleanId = String(id).trim().toUpperCase();
  const payload = {
    id: cleanId,
    barcode: cleanId,
    timestamp,
    event: EVENT_NAME,
    source,
    device: source
  };

  // Check local offline ledger first for instant local duplicate prevention
  const localLedger = getLocalLedger();
  const existingLocal = localLedger.find(item => item.id === cleanId);

  // If we have no network connectivity, directly enqueue
  if (!navigator.onLine) {
    if (existingLocal) {
      return {
        success: false,
        status: 'DUPLICATE',
        message: 'Barcode already scanned earlier.',
        firstScannedAt: existingLocal.timestamp,
        data: { id: cleanId }
      };
    }
    offlineQueue.enqueue(payload);
    // Also record locally
    localLedger.push({ ...payload, status: 'QUEUED_OFFLINE' });
    saveLocalLedger(localLedger);

    return {
      success: true,
      status: 'QUEUED_OFFLINE',
      message: 'Network offline. Saved to sync queue.',
      data: { id: cleanId, timestamp }
    };
  }

  // If no Sheets URL is configured, run in high-fidelity mock mode
  if (!SHEETS_URL) {
    if (existingLocal) {
      return {
        success: false,
        status: 'DUPLICATE',
        message: 'Barcode already checked in (Local Mock).',
        firstScannedAt: existingLocal.timestamp,
        data: { id: cleanId }
      };
    }

    const mockItem = {
      ...payload,
      status: 'PRESENT',
      serverTime: new Date().toLocaleTimeString()
    };
    localLedger.push(mockItem);
    saveLocalLedger(localLedger);

    return {
      success: true,
      status: 'SUCCESS',
      mode: 'MOCK',
      message: 'Scan recorded successfully (Local Mode).',
      data: mockItem
    };
  }

  // Live Google Sheets Web App submission
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Note: Content-Type: text/plain;charset=utf-8 bypasses CORS preflight in Google Apps Script!
    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const result = await res.json();

    if (result.status === 'DUPLICATE') {
      return {
        success: false,
        status: 'DUPLICATE',
        message: result.message || 'ID already checked in Google Sheets.',
        firstScannedAt: result.firstScannedAt,
        data: { id: cleanId }
      };
    }

    if (result.status === 'SUCCESS' || result.success) {
      // Save locally to mirror
      localLedger.push({ ...payload, status: 'PRESENT' });
      saveLocalLedger(localLedger);

      return {
        success: true,
        status: 'SUCCESS',
        message: result.message || 'Attendance logged to Google Sheets.',
        data: result.data || payload
      };
    }

    return {
      success: false,
      status: 'ERROR',
      message: result.message || 'Server returned an error status.'
    };

  } catch (networkErr) {
    console.warn('Network call failed, falling back to offline queue:', networkErr);
    // Queue for background synchronization
    offlineQueue.enqueue(payload);
    localLedger.push({ ...payload, status: 'QUEUED_OFFLINE' });
    saveLocalLedger(localLedger);

    return {
      success: true,
      status: 'QUEUED_OFFLINE',
      message: 'Sheets sync timed out. Saved in offline queue.',
      data: { id: cleanId, timestamp }
    };
  }
}

/**
 * Fetches dashboard stats and latest 20 scans.
 */
export async function fetchStatsAndLogs() {
  const localLedger = getLocalLedger();
  const queueCount = offlineQueue.count();

  // If live sheets URL is available and online, fetch remote stats
  if (SHEETS_URL && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${SHEETS_URL}?action=stats&_t=${Date.now()}`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            totalScanned: data.totalScans || 0,
            uniqueStudents: data.uniqueStudents || 0,
            duplicatesBlocked: data.duplicatesBlocked || 0,
            recentEntries: data.lastEntries || [],
            offlinePending: queueCount,
            isLive: true
          };
        }
      }
    } catch (e) {
      console.warn('Could not fetch remote stats, using local data', e);
    }
  }

  // Calculate stats from local storage ledger
  const total = localLedger.length;
  const uniqueSet = new Set(localLedger.map(item => item.id));
  const recentEntries = [...localLedger].reverse().slice(0, 20);

  return {
    totalScanned: total,
    uniqueStudents: uniqueSet.size,
    duplicatesBlocked: Math.max(0, total - uniqueSet.size),
    recentEntries: recentEntries,
    offlinePending: queueCount,
    isLive: false
  };
}

/**
 * Synchronizes any pending scans in the offline queue to Google Sheets.
 */
export async function syncOfflineQueue() {
  if (!SHEETS_URL || !navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      remainingCount: offlineQueue.count(),
      message: !navigator.onLine ? 'Device is offline.' : 'No Google Sheets URL configured.'
    };
  }

  const items = offlineQueue.getItems();
  if (items.length === 0) {
    return { success: true, syncedCount: 0, remainingCount: 0, message: 'Queue is already empty.' };
  }

  let synced = 0;
  let duplicates = 0;

  for (const item of items) {
    try {
      const res = await fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'SUCCESS' || json.status === 'DUPLICATE') {
          offlineQueue.remove(item.id);
          if (json.status === 'SUCCESS') synced++;
          if (json.status === 'DUPLICATE') duplicates++;
        }
      }
    } catch (err) {
      console.error('Failed to sync queue item:', item.id, err);
      break; // Pause syncing if network drops mid-way
    }
  }

  return {
    success: true,
    syncedCount: synced,
    duplicatesCount: duplicates,
    remainingCount: offlineQueue.count(),
    message: `Synced ${synced} scans${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}.`
  };
}
