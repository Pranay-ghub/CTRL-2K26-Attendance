# TECH TALKS CTRL 2K26 – Attendance Scanner

A mobile-first, high-speed attendance scanner web application built with **Vite**, **React**, **Tailwind CSS**, and **Google Sheets** via **Google Apps Script**. Optimized for high-throughput scanning of 1D barcodes and 2D QR codes using the device camera.

---

## ⚡ Key Highlights & Architecture

- **High-Speed Multi-Format Decode**: Powered by `html5-qrcode` with continuous autofocus, 15 FPS sampling, and rectangular 1D-optimized viewfinder.
  - Supports: `CODE_128`, `CODE_39`, `EAN_13`, `EAN_8`, `UPC_A`, `ITF`, `CODABAR`, `QR_CODE`.
- **Zero-Secret Backend with SheetDB or Google Apps Script**:
  - Direct integration with **SheetDB API** (`https://sheetdb.io/api/v1/lsdlngjlrkqbd`) and Google Apps Script Web App.
  - Multi-header normalization: automatically maps student ID to `Roll No`, `RollNo`, `ID`, and `Barcode`.
  - CORS enabled with full browser fetch compatibility.
- **Race-Condition-Proof Concurrent Scanning**: Uses Google Apps Script's `LockService` to serialize multi-volunteer simultaneous check-ins.
- **Automated Duplicate Prevention**: Rejects duplicate student IDs with sound, haptics, and visual alerts, citing the first check-in timestamp.
- **Offline Resiliency & Sync Queue**: Automatically caches scans in `localStorage` when network connectivity drops or times out, auto-syncing when back online.
- **Screen Wake Lock API**: Keeps device screens illuminated throughout the event scanning shift.
- **Web Audio API Chimes**: Native synthesized positive chimes, warning buzzers, and haptic vibration (`navigator.vibrate`) without external asset dependencies.
- **Terminal Bento Grid UI**: High-tech cyber aesthetic with real-time HUD reticle, laser animation, 2x2 live telemetry metrics, and terminal log stream.
- **Volunteer Security PIN**: Optional gatekeeper PIN protection (`VITE_ACCESS_PIN`).

---

## 📁 Project Structure

```
ctrl-attendance/
├── apps-script/
│   └── Code.gs               # Production Google Apps Script backend
├── public/
│   └── favicon.svg           # Neon barcode scanner vector favicon
├── src/
│   ├── components/
│   │   ├── HeaderBar.jsx     # Top cyber bar with live clock, sync & wake lock
│   │   ├── LastScanCard.jsx  # Card displaying last scanned ID with status badges
│   │   ├── LiveLog.jsx       # Terminal log stream of latest 20 scans
│   │   ├── ManualEntryFallback.jsx # Keyboard input for damaged barcodes
│   │   ├── PinModal.jsx      # Volunteer security PIN gatekeeper modal
│   │   ├── ScannerViewport.jsx # Camera viewfinder with HUD reticle & controls
│   │   ├── StatsGrid.jsx     # 2x2 live statistics cards
│   │   ├── StatusChip.jsx    # Metric chips (Camera, Sheet, IST Clock)
│   │   └── Toast.jsx         # Glowing HUD alert banners
│   ├── hooks/
│   │   ├── useScanner.js     # React StrictMode-safe html5-qrcode hook
│   │   └── useWakeLock.js    # Screen Wake Lock management hook
│   ├── pages/
│   │   ├── LandingPage.jsx   # Hero page with typing title and status footer
│   │   └── AttendancePage.jsx # Bento Grid scanner control center
│   ├── services/
│   │   ├── offlineQueue.js   # Local persistence queue for offline scans
│   │   ├── sheets.js         # Google Apps Script HTTP client & mock fallback
│   │   └── sound.js          # Web Audio API synthesizer & vibration feedback
│   ├── App.jsx               # React Router configuration
│   ├── index.css             # Cyberpunk glow, laser sweep, HUD brackets & scanlines
│   └── main.jsx              # Application bootstrap
├── .env.example              # Environment variables template
├── index.html                # App container with Orbitron & JetBrains Mono fonts
├── package.json
└── vite.config.js
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Google Sheets & Apps Script Setup

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named **`CTRL 2K26 Attendance Ledger`**.
2. Go to **Extensions** → **Apps Script**.
3. Clear any existing code in the editor, and paste the entire contents of [`apps-script/Code.gs`](apps-script/Code.gs).
4. Click the **Save** icon (diskette).
5. (Optional) Run `getOrCreateSheet()` once inside the editor to auto-generate the formatted `Attendance` sheet with colored headers.
6. Click **Deploy** (top right) → **New deployment**.
7. In the dialog:
   - Select type: **Web app** (gear icon).
   - **Description**: `CTRL 2K26 Attendance API`.
   - **Execute as**: `Me (your-email@gmail.com)`.
   - **Who has access**: **`Anyone`** *(Crucial: allows mobile scanners to send scans without requiring Google login)*.
8. Click **Deploy**. Authorize the permissions when prompted.
9. Copy the generated **Web App URL** (looks like `https://script.google.com/macros/s/AKfycbx.../exec`).

---

### 2. Local Environment Configuration

1. Clone or navigate to the repository directory:
   ```bash
   cd "ctrl attendance"
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and fill in your values:
   ```env
   # Paste your Google Apps Script Web App URL here
   VITE_SHEETS_URL="https://script.google.com/macros/s/AKfycbx_YOUR_ID/exec"

   # URL of your Google Sheet for quick viewing
   VITE_SHEET_VIEW_URL="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"

   # Volunteer Access PIN (leave empty to disable PIN prompt)
   VITE_ACCESS_PIN="2026"

   # Event Identifier
   VITE_EVENT_NAME="CTRL 2K26"
   ```

   > **Note**: If `VITE_SHEETS_URL` is left empty, the application automatically operates in **Local Mock Mode**, allowing instant offline testing and demonstration without configuring Google Sheets!

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

---

## 🚀 Deployment Guide (Vercel / Netlify)

Camera access requires **HTTPS** (or `localhost`). Deploying to Vercel or Netlify provides an automatic HTTPS certificate.

### Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `ctrl-attendance` repository.
4. In the **Environment Variables** section, add:
   - `VITE_SHEETS_URL`: *(Your Apps Script URL)*
   - `VITE_SHEET_VIEW_URL`: *(Your Google Sheet URL)*
   - `VITE_ACCESS_PIN`: `2026`
   - `VITE_EVENT_NAME`: `CTRL 2K26`
5. Click **Deploy**.
6. Once deployed, open the production URL on any mobile smartphone.

---

## 📱 Testing Checklist

| Test Case | Procedure | Expected Result |
| :--- | :--- | :--- |
| **1. HTTPS Camera Access** | Open the production URL on Android Chrome or iOS Safari. | Browser prompts for camera permissions; rear camera stream initializes with continuous autofocus. |
| **2. Printed Barcode Scanning** | Hold a printed student ID card (Code 128 / Code 39) in the viewfinder. | Audio chime sounds, scanner frame flashes green, device vibrates, and ID is logged. |
| **3. Damaged Barcode Fallback** | Enter an illegible ID into the Manual Entry box and tap `SUBMIT ID`. | ID is recorded and logged as `SOURCE: MANUAL`. |
| **4. Duplicate Scan Prevention** | Scan or submit the exact same barcode twice within 10 seconds. | Warning buzzer sounds, scanner frame flashes amber, duplicate toast appears, and sheet duplicate row is prevented. |
| **5. Low-Light Environment** | Test scanning in dim or uneven event auditorium lighting. | Toggle the **Torch** button on compatible devices to illuminate the barcode. |
| **6. Offline Resiliency** | Switch device to Airplane Mode and scan barcodes. | Scans are saved to `localStorage` offline queue (`QUEUED_OFFLINE`); reconnecting triggers auto-sync to Google Sheets. |
| **7. Screen Wake Lock** | Keep scanner active for over 5 minutes without touching the screen. | Display remains active and does not sleep or dim. |

---

## 🔧 Camera Troubleshooting Guide

### 1. "Camera permission was denied"
- **Android Chrome**: Tap the lock/page info icon beside the URL bar → **Permissions** → **Camera** → Set to **Allow**, then tap **RETRY CAMERA PERMISSION**.
- **iOS Safari**: Open **Settings** app → **Safari** → **Camera** → Set to **Allow** (or **Ask**). If previously denied on the site, tap the `aA` icon in the address bar → **Website Settings** → **Camera** → **Allow**.

### 2. "Camera is in use by another application"
- Close any background apps that may be holding the camera hardware (Instagram, WhatsApp, Zoom, default Camera app).
- Close duplicate browser tabs that have an active camera session open.

### 3. "Insecure Context / Camera blocked"
- Web browsers strictly prohibit camera streaming over plain HTTP (e.g. `http://192.168.x.x:5173`).
- **Fix**: Use `localhost` on your development computer, or deploy to Vercel/Netlify for free automatic HTTPS. For local network mobile testing, use tools like `ngrok http 5173` or `localtunnel`.

### 4. Poor barcode recognition on glossy ID cards
- Avoid direct overhead light reflection that washes out the black bars.
- Angle the phone at ~15° relative to the card surface so the glare reflects away from the camera lens.

---

## 📄 License
Created for **Tech Titans Club** • Event: **CTRL 2K26**
Licensed under the MIT License.
