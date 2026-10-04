/**
 * Google Sheets & SheetDB API Integration Service
 * 
 * Supports:
 * 1. SheetDB API (e.g. https://sheetdb.io/api/v1/lsdlngjlrkqbd)
 * 2. Google Apps Script Web App (e.g. https://script.google.com/macros/s/.../exec)
 * 3. Offline Queue & Local Storage Fallback
 */

import { offlineQueue } from './offlineQueue';

const API_URL = import.meta.env.VITE_SHEETS_URL || 'https://sheetdb.io/api/v1/lsdlngjlrkqbd';
const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'CTRL 2K26';

// Local storage key for cached ledger
const LOCAL_STORAGE_KEY = 'ctrl_2k26_local_ledger';

export function isSheetDB() {
  return API_URL.includes('sheetdb.io');
}

export function getLocalLedger() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalLedger(ledger) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ledger));
  } catch (e) {}
}

export function clearLocalLedger() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {}
}

/**
 * Extracts Roll No / ID from any row object (case-insensitive & flexible header format)
 */
export function extractRowId(row) {
  if (!row || typeof row !== 'object') return '';
  
  // 1. Direct common keys
  const direct = 
    row['roll no'] ||
    row['Roll No'] ||
    row['RollNo'] ||
    row['rollno'] ||
    row['roll_no'] ||
    row['Roll_No'] ||
    row['id'] ||
    row['ID'] ||
    row['barcode'] ||
    row['Barcode'] ||
    row.id;
  
  if (direct) return String(direct).trim().toUpperCase();

  // 2. Case-insensitive normalization over all row keys
  for (const k of Object.keys(row)) {
    const norm = k.trim().toLowerCase().replace(/[-_ ]/g, '');
    if (norm === 'rollno' || norm === 'roll' || norm === 'id' || norm === 'barcode' || norm === 'studentid') {
      if (row[k]) return String(row[k]).trim().toUpperCase();
    }
  }

  // 3. Fallback to first non-empty value
  for (const val of Object.values(row)) {
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return String(val).trim().toUpperCase();
    }
  }

  return '';
}

/**
 * Pings Google Sheets / SheetDB to test live connectivity.
 */
export async function pingSheet() {
  if (!API_URL) {
    return { connected: false, mode: 'STANDBY_MOCK', message: 'No API URL configured in .env' };
  }

  if (!navigator.onLine) {
    return { connected: false, mode: 'OFFLINE', message: 'Device is offline' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const pingUrl = isSheetDB() ? `${API_URL}?limit=1` : `${API_URL}?action=ping&_t=${Date.now()}`;
    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.error && String(data.error).includes('Spreadsheet is empty')) {
        return { 
          connected: true, 
          status: 'EMPTY_SHEET',
          message: 'SheetDB connected! (Add "roll no" in Row 1 of your Google Sheet)'
        };
      }
      return { connected: true, status: 'CONNECTED', data };
    }
    return { connected: false, message: `HTTP status: ${res.status}` };
  } catch (err) {
    return { connected: false, message: err.message || 'Connection timeout' };
  }
}

/**
 * Records attendance for a scanned barcode / Roll Number.
 * @param {Object} param0
 * @param {string} param0.id - Scanned Roll No / Barcode
 * @param {string} param0.source - 'camera' | 'manual'
 * @param {string} [param0.timestamp] - ISO string
 */
export async function recordAttendance({ id, source = 'camera', timestamp = new Date().toISOString() }) {
  const cleanId = String(id).trim().toUpperCase();
  const localLedger = getLocalLedger();

  const standardItem = {
    id: cleanId,
    'roll no': cleanId,
    'Roll No': cleanId,
    'RollNo': cleanId,
    'roll_no': cleanId,
    'id': cleanId,
    'ID': cleanId,
    'barcode': cleanId,
    'Barcode': cleanId,
    'timestamp': timestamp,
    'Timestamp': timestamp,
    'event': EVENT_NAME,
    'Event': EVENT_NAME,
    'status': 'PRESENT',
    'Status': 'PRESENT',
    'device': source,
    'Device': source,
    timestamp,
    source,
    event: EVENT_NAME,
    status: 'PRESENT'
  };

  // If device is offline, enqueue immediately
  if (!navigator.onLine) {
    const existingLocal = localLedger.find(item => extractRowId(item) === cleanId);
    if (existingLocal) {
      return {
        success: false,
        status: 'DUPLICATE',
        message: `Roll No ${cleanId} already saved in offline queue.`,
        firstScannedAt: existingLocal.timestamp || 'Earlier today',
        data: { id: cleanId }
      };
    }
    offlineQueue.enqueue(standardItem);
    localLedger.push({ ...standardItem, status: 'QUEUED_OFFLINE' });
    saveLocalLedger(localLedger);

    return {
      success: true,
      status: 'QUEUED_OFFLINE',
      message: 'Network offline. Saved to sync queue.',
      data: { id: cleanId, timestamp }
    };
  }

  // If no API URL is configured, use local mock ledger
  if (!API_URL) {
    const existingLocal = localLedger.find(item => extractRowId(item) === cleanId);
    if (existingLocal) {
      return {
        success: false,
        status: 'DUPLICATE',
        message: `Roll No ${cleanId} already checked in (Local Mock).`,
        firstScannedAt: existingLocal.timestamp || 'Earlier today',
        data: { id: cleanId }
      };
    }
    localLedger.push(standardItem);
    saveLocalLedger(localLedger);
    return {
      success: true,
      status: 'SUCCESS',
      mode: 'MOCK',
      message: 'Attendance recorded (Local mode).',
      data: standardItem
    };
  }

  // --- SHEETDB.IO API INTEGRATION ---
  if (isSheetDB()) {
    try {
      console.log(`[SheetDB] Initiating scan submission for: ${cleanId}`);

      // 1. Live duplicate check directly against SheetDB search
      try {
        const searchRes = await fetch(`${API_URL}/search?roll%20no=${encodeURIComponent(cleanId)}&casesensitive=false`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (Array.isArray(searchData) && searchData.length > 0) {
            const first = searchData[0];
            const firstTime = first.timestamp || first['timestamp'] || first['Timestamp'] || 'Earlier today';
            console.log(`[SheetDB] Duplicate detected for: ${cleanId}`);
            return {
              success: false,
              status: 'DUPLICATE',
              message: `Roll No ${cleanId} already recorded in Google Sheet.`,
              firstScannedAt: firstTime,
              data: { id: cleanId }
            };
          }
        }
      } catch (searchErr) {
        console.warn('[SheetDB] Search pre-check skipped:', searchErr);
      }

      // 2. Insert into SheetDB
      // Sending both lowercase and capitalized keys ensures SheetDB matches user's column headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const postBody = {
        data: [
          {
            "roll no": cleanId,
            "Roll No": cleanId,
            "RollNo": cleanId,
            "roll_no": cleanId,
            "id": cleanId,
            "ID": cleanId,
            "timestamp": timestamp,
            "Timestamp": timestamp,
            "event": EVENT_NAME,
            "Event": EVENT_NAME,
            "status": "PRESENT",
            "Status": "PRESENT",
            "device": source,
            "Device": source
          }
        ]
      };

      console.log('[SheetDB] Sending POST to:', API_URL, postBody);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const resText = await res.text();
      let resJson = {};
      try {
        resJson = JSON.parse(resText);
      } catch (e) {}

      console.log('[SheetDB] Server Response:', res.status, resJson);

      // Check if SheetDB indicates row 1 is empty
      if (resJson && resJson.error && String(resJson.error).includes('Spreadsheet is empty')) {
        localLedger.push(standardItem);
        saveLocalLedger(localLedger);
        offlineQueue.enqueue(standardItem);

        return {
          success: true,
          status: 'QUEUED_OFFLINE',
          message: 'Saved locally! Please add "roll no" in Row 1 of your Google Sheet.',
          data: standardItem
        };
      }

      if (res.ok || res.status === 201 || (resJson && resJson.created)) {
        // Save to local cache
        localLedger.push(standardItem);
        saveLocalLedger(localLedger);

        return {
          success: true,
          status: 'SUCCESS',
          message: `Roll No ${cleanId} stored in Google Sheet!`,
          data: standardItem
        };
      }

      throw new Error(resJson.error || resJson.message || `HTTP ${res.status}`);

    } catch (networkErr) {
      console.error('[SheetDB] Error communicating with SheetDB:', networkErr);
      offlineQueue.enqueue(standardItem);
      localLedger.push({ ...standardItem, status: 'QUEUED_OFFLINE' });
      saveLocalLedger(localLedger);

      return {
        success: true,
        status: 'QUEUED_OFFLINE',
        message: 'Sync timed out. Saved in offline queue.',
        data: standardItem
      };
    }
  }

  // --- GOOGLE APPS SCRIPT FALLBACK ---
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(standardItem),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    if (result.status === 'DUPLICATE') {
      return {
        success: false,
        status: 'DUPLICATE',
        message: result.message || 'Already checked in.',
        firstScannedAt: result.firstScannedAt,
        data: { id: cleanId }
      };
    }

    localLedger.push(standardItem);
    saveLocalLedger(localLedger);

    return {
      success: true,
      status: 'SUCCESS',
      message: result.message || 'Attendance logged to Google Sheets.',
      data: result.data || standardItem
    };

  } catch (err) {
    offlineQueue.enqueue(standardItem);
    localLedger.push({ ...standardItem, status: 'QUEUED_OFFLINE' });
    saveLocalLedger(localLedger);

    return {
      success: true,
      status: 'QUEUED_OFFLINE',
      message: 'Saved to offline queue.',
      data: standardItem
    };
  }
}

/**
 * Fetches dashboard stats and latest 20 scans from SheetDB or ledger.
 */
export async function fetchStatsAndLogs() {
  const localLedger = getLocalLedger();
  const queueCount = offlineQueue.count();

  // If online, fetch live rows from SheetDB
  if (API_URL && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const fetchUrl = isSheetDB() ? `${API_URL}?_t=${Date.now()}` : `${API_URL}?action=stats&_t=${Date.now()}`;
      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();

        // SheetDB returns array of rows: [ { "roll no": "...", ... }, ... ]
        if (Array.isArray(data)) {
          const uniqueSet = new Set();
          const parsedEntries = [];

          for (const row of data) {
            const rowId = extractRowId(row);
            if (rowId) {
              uniqueSet.add(rowId);
              parsedEntries.push({
                id: rowId,
                timestamp: row['timestamp'] || row['Timestamp'] || row['Time'] || new Date().toISOString(),
                event: row['event'] || row['Event'] || EVENT_NAME,
                status: row['status'] || row['Status'] || 'PRESENT',
                source: row['device'] || row['Device'] || row['source'] || 'camera'
              });
            }
          }

          // Update local ledger with verified SheetDB rows
          saveLocalLedger(parsedEntries);

          const total = parsedEntries.length;
          const duplicates = Math.max(0, total - uniqueSet.size);
          const recent = [...parsedEntries].reverse().slice(0, 20);

          return {
            totalScanned: total,
            uniqueStudents: uniqueSet.size,
            duplicatesBlocked: duplicates,
            recentEntries: recent,
            offlinePending: queueCount,
            isLive: true
          };
        }

        // Apps Script format
        if (data && data.success) {
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
      console.warn('Could not fetch remote stats, falling back to local storage', e);
    }
  }

  // Local storage fallback
  const total = localLedger.length;
  const uniqueSet = new Set(localLedger.map(item => extractRowId(item) || item.id));
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
 * Synchronizes any pending scans in the offline queue to SheetDB.
 */
export async function syncOfflineQueue() {
  if (!API_URL || !navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      remainingCount: offlineQueue.count(),
      message: !navigator.onLine ? 'Device is offline.' : 'No API URL configured.'
    };
  }

  const items = offlineQueue.getItems();
  if (items.length === 0) {
    return { success: true, syncedCount: 0, remainingCount: 0, message: 'Queue is already empty.' };
  }

  let synced = 0;

  for (const item of items) {
    try {
      const cleanId = extractRowId(item) || item.id;
      if (isSheetDB()) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: [
              {
                "roll no": cleanId,
                "Roll No": cleanId,
                "RollNo": cleanId,
                "timestamp": item.timestamp || new Date().toISOString(),
                "event": EVENT_NAME,
                "status": "PRESENT",
                "device": item.source || 'camera'
              }
            ]
          })
        });

        if (res.ok || res.status === 201) {
          offlineQueue.remove(item.id);
          synced++;
        }
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          offlineQueue.remove(item.id);
          synced++;
        }
      }
    } catch (err) {
      console.error('Failed to sync queue item:', item.id, err);
      break;
    }
  }

  return {
    success: true,
    syncedCount: synced,
    remainingCount: offlineQueue.count(),
    message: `Synced ${synced} scans with SheetDB.`
  };
}
