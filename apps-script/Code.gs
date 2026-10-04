/**
 * TECH TALKS CTRL 2K26 – Attendance Scanner
 * Google Apps Script Web App Backend (Code.gs)
 * 
 * Features:
 * - doPost: Receives scan payload, checks for duplicates with LockService mutex, appends valid row.
 * - doGet: Returns live stats (Total, Unique, Duplicates) & last 20 entries for live dashboard sync.
 * - Automated sheet header setup and format configuration.
 */

const SHEET_NAME = "Attendance";
const EVENT_NAME = "CTRL 2K26";
const HEADERS = ["Timestamp", "Barcode/ID", "Event", "Status", "Device/Source", "SyncedAt"];

/**
 * Initializes the sheet headers if not already present.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#050810");
    headerRange.setFontColor("#00f0ff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-fit column widths
    for (let i = 1; i <= HEADERS.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
  }
  return sheet;
}

/**
 * Handles incoming POST requests from the scanner web app.
 * Uses LockService to prevent race conditions during concurrent scans.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // Acquire lock with 10-second timeout
    const hasLock = lock.tryLock(10000);
    if (!hasLock) {
      return jsonResponse({
        success: false,
        status: "BUSY",
        message: "Server busy recording another scan. Please retry."
      });
    }

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        success: false,
        status: "ERROR",
        message: "Empty request payload received."
      });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({
        success: false,
        status: "ERROR",
        message: "Invalid JSON format: " + parseErr.message
      });
    }

    const rawId = payload.id || payload.barcode || payload.studentId;
    if (!rawId || String(rawId).trim() === "") {
      return jsonResponse({
        success: false,
        status: "ERROR",
        message: "Missing 'id' or 'barcode' in request body."
      });
    }

    const studentId = String(rawId).trim().toUpperCase();
    const clientTimestamp = payload.timestamp || new Date().toISOString();
    const event = payload.event || EVENT_NAME;
    const deviceSource = payload.device || payload.source || "camera";
    const serverTimestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    // Check for duplicates in column B (Barcode/ID)
    if (lastRow > 1) {
      const idRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (let i = 0; i < idRange.length; i++) {
        const existingId = String(idRange[i][0]).trim().toUpperCase();
        if (existingId === studentId) {
          const firstScannedAt = sheet.getRange(i + 2, 1).getValue();
          return jsonResponse({
            success: false,
            status: "DUPLICATE",
            message: "Student ID already checked in.",
            firstScannedAt: firstScannedAt,
            data: {
              id: studentId,
              existingRow: i + 2
            }
          });
        }
      }
    }

    // Append new valid attendance row
    sheet.appendRow([
      clientTimestamp,
      studentId,
      event,
      "PRESENT",
      deviceSource,
      serverTimestamp
    ]);

    const newRowNumber = sheet.getLastRow();

    // Color-code the new row slightly for visual clarity in Google Sheets
    const rowRange = sheet.getRange(newRowNumber, 1, 1, HEADERS.length);
    rowRange.setFontFamily("Consolas");
    rowRange.setFontSize(10);

    return jsonResponse({
      success: true,
      status: "SUCCESS",
      message: "Attendance recorded successfully.",
      data: {
        id: studentId,
        timestamp: clientTimestamp,
        event: event,
        status: "PRESENT",
        deviceSource: deviceSource,
        row: newRowNumber
      }
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      status: "ERROR",
      message: "Server exception: " + err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles GET requests:
 * - Ping check: ?action=ping
 * - Live stats & last 20 entries: ?action=stats (default)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "stats";

    if (action === "ping") {
      return jsonResponse({
        success: true,
        status: "CONNECTED",
        event: EVENT_NAME,
        timestamp: new Date().toISOString()
      });
    }

    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return jsonResponse({
        success: true,
        totalScans: 0,
        uniqueStudents: 0,
        duplicatesBlocked: 0,
        lastEntries: [],
        serverTime: new Date().toISOString()
      });
    }

    // Read all rows
    const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const totalScans = data.length;
    const uniqueIds = new Set();
    const entries = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const timeVal = row[0];
      const idVal = String(row[1]).trim().toUpperCase();
      const eventVal = row[2];
      const statusVal = row[3];
      const sourceVal = row[4];

      if (idVal) {
        uniqueIds.add(idVal);
      }

      entries.push({
        id: idVal,
        timestamp: timeVal,
        event: eventVal,
        status: statusVal,
        source: sourceVal
      });
    }

    // Return the latest 20 entries (newest first)
    const latest20 = entries.slice(-20).reverse();

    return jsonResponse({
      success: true,
      totalScans: totalScans,
      uniqueStudents: uniqueIds.size,
      duplicatesBlocked: totalScans - uniqueIds.size, // in sheet duplicates should be 0 because blocked
      lastEntries: latest20,
      serverTime: new Date().toISOString()
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      status: "ERROR",
      message: "Failed to retrieve stats: " + err.toString()
    });
  }
}

/**
 * Helper to build JSON ContentService response with proper MIME type
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
