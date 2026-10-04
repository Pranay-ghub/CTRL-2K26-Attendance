import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeaderBar } from '../components/HeaderBar';
import { ScannerViewport } from '../components/ScannerViewport';
import { LastScanCard } from '../components/LastScanCard';
import { StatsGrid } from '../components/StatsGrid';
import { LiveLog } from '../components/LiveLog';
import { ManualEntryFallback } from '../components/ManualEntryFallback';
import { Toast } from '../components/Toast';
import { PinModal } from '../components/PinModal';
import { useScanner } from '../hooks/useScanner';
import { useWakeLock } from '../hooks/useWakeLock';
import { soundService } from '../services/sound';
import { recordAttendance, fetchStatsAndLogs, syncOfflineQueue } from '../services/sheets';
import { offlineQueue } from '../services/offlineQueue';

export function AttendancePage() {
  const accessPin = import.meta.env.VITE_ACCESS_PIN || '';
  const [pinUnlocked, setPinUnlocked] = useState(() => {
    // If no pin configured or already verified this session
    if (!accessPin) return true;
    return sessionStorage.getItem('ctrl_pin_verified') === 'true';
  });

  // State
  const [lastScan, setLastScan] = useState(null);
  const [toast, setToast] = useState(null);
  const [offlineCount, setOfflineCount] = useState(offlineQueue.count());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalScanned: 0,
    uniqueStudents: 0,
    duplicatesBlocked: 0,
    scansPerMinute: 0,
    recentEntries: []
  });

  // Timestamps of scans in the last 60 seconds for velocity calculation
  const scanTimestampsRef = useRef([]);

  // Screen Wake Lock
  const { isActive: wakeLockActive, requestWakeLock, releaseWakeLock } = useWakeLock();

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  // Re-calculate scans per minute
  const updateScansPerMinute = useCallback(() => {
    const now = Date.now();
    // Keep only timestamps within last 60,000 ms
    scanTimestampsRef.current = scanTimestampsRef.current.filter(ts => (now - ts) <= 60000);
    const spm = scanTimestampsRef.current.length;
    setStats(prev => ({ ...prev, scansPerMinute: spm }));
  }, []);

  // Sync offline queue subscription
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((count) => {
      setOfflineCount(count);
    });
    return unsubscribe;
  }, []);

  // Velocity ticker interval
  useEffect(() => {
    const interval = setInterval(updateScansPerMinute, 3000);
    return () => clearInterval(interval);
  }, [updateScansPerMinute]);

  // Initial load of stats from ledger / sheets
  const refreshStats = useCallback(async () => {
    const data = await fetchStatsAndLogs();
    setStats(prev => ({
      ...prev,
      totalScanned: data.totalScanned,
      uniqueStudents: data.uniqueStudents,
      duplicatesBlocked: data.duplicatesBlocked,
      recentEntries: data.recentEntries
    }));
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Background auto-sync when network reconnects
  useEffect(() => {
    const handleOnline = async () => {
      if (offlineQueue.count() > 0) {
        setIsSyncing(true);
        const res = await syncOfflineQueue();
        setIsSyncing(false);
        refreshStats();
        if (res.syncedCount > 0) {
          setToast({
            type: 'SUCCESS',
            title: 'OFFLINE QUEUE SYNCED',
            message: `${res.syncedCount} queued scans uploaded to Google Sheets.`,
            duration: 3500
          });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshStats]);

  /**
   * Core Handler: Process Scanned or Manually Submitted ID
   */
  const processAttendanceId = useCallback(async (cleanId, source = 'camera') => {
    const clientTimestamp = new Date().toISOString();

    // Record timestamp for velocity rate
    scanTimestampsRef.current.push(Date.now());
    updateScansPerMinute();

    // Call sheets API service
    const result = await recordAttendance({
      id: cleanId,
      source,
      timestamp: clientTimestamp
    });

    const scanRecord = {
      id: cleanId,
      timestamp: clientTimestamp,
      status: result.status,
      source: source,
      firstScannedAt: result.firstScannedAt || null
    };

    setLastScan(scanRecord);

    // Provide visual feedback + sound + toast based on outcome
    if (result.status === 'SUCCESS') {
      soundService.playSuccess();
      setToast({
        type: 'SUCCESS',
        id: cleanId,
        title: 'ATTENDANCE LOGGED',
        message: result.message || 'Successfully recorded in Google Sheets.',
        duration: 3000
      });
    } else if (result.status === 'DUPLICATE') {
      soundService.playDuplicate();
      setToast({
        type: 'DUPLICATE',
        id: cleanId,
        title: 'DUPLICATE BLOCKED',
        message: result.message || 'Already checked in earlier today.',
        extra: result.firstScannedAt ? `First entry: ${result.firstScannedAt}` : null,
        duration: 4000
      });
    } else if (result.status === 'QUEUED_OFFLINE') {
      soundService.playSuccess();
      setToast({
        type: 'QUEUED_OFFLINE',
        id: cleanId,
        title: 'SAVED OFFLINE',
        message: 'No connection to Sheets. Scan stored in offline queue.',
        duration: 3500
      });
    } else {
      soundService.playError();
      setToast({
        type: 'ERROR',
        id: cleanId,
        title: 'RECORDING ERROR',
        message: result.message || 'Could not log attendance.',
        duration: 4000
      });
    }

    // Refresh stats from updated ledger
    await refreshStats();
  }, [refreshStats, updateScansPerMinute]);

  // Hook into HTML5 Barcode Scanner
  const {
    isScanning,
    isStarting,
    cameras,
    selectedCameraId,
    errorMessage,
    errorType,
    torchAvailable,
    torchOn,
    flashFeedback,
    startScanner,
    stopScanner,
    switchCamera,
    toggleTorch,
    retryCamera
  } = useScanner({
    onScanSuccess: (decodedText) => {
      processAttendanceId(decodedText, 'camera');
    }
  });

  // Auto-request Screen Wake Lock when scanner is running
  useEffect(() => {
    if (isScanning && !wakeLockActive) {
      requestWakeLock();
    }
  }, [isScanning, wakeLockActive, requestWakeLock]);

  // Manual fallback submission
  const handleManualSubmit = async (manualId) => {
    setIsSubmittingManual(true);
    await processAttendanceId(manualId, 'manual');
    setIsSubmittingManual(false);
  };

  // Sync offline button
  const handleSyncOffline = async () => {
    setIsSyncing(true);
    const res = await syncOfflineQueue();
    setIsSyncing(false);
    refreshStats();
    setToast({
      type: res.success ? 'SUCCESS' : 'ERROR',
      title: 'SYNC COMPLETED',
      message: res.message,
      duration: 3500
    });
  };

  return (
    <div className="min-h-screen bg-[#050810] bg-cyber-grid scanlines text-slate-100 flex flex-col font-sans">
      
      {/* Toast notifications */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Optional PIN Gate Modal */}
      {!pinUnlocked && accessPin && (
        <PinModal
          requiredPin={accessPin}
          onSuccess={() => setPinUnlocked(true)}
          onCancel={() => window.history.back()}
        />
      )}

      {/* Header Bar */}
      <HeaderBar
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={handleToggleWakeLock}
        offlineCount={offlineCount}
        onSyncOffline={handleSyncOffline}
        isSyncing={isSyncing}
      />

      {/* Main Bento Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6">
        
        {/* Bento Grid: 12-column on desktop, single column on mobile with scanner on top */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
          
          {/* LEFT COLUMN: Grid Cell A (Scanner) + Grid Cell E (Manual Entry) */}
          <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4">
            
            {/* Grid Cell A: Live Camera Scanner Viewport */}
            <ScannerViewport
              isScanning={isScanning}
              isStarting={isStarting}
              cameras={cameras}
              selectedCameraId={selectedCameraId}
              errorMessage={errorMessage}
              errorType={errorType}
              torchAvailable={torchAvailable}
              torchOn={torchOn}
              flashFeedback={flashFeedback}
              onStartScanner={startScanner}
              onStopScanner={stopScanner}
              onSwitchCamera={switchCamera}
              onToggleTorch={toggleTorch}
              onRetry={retryCamera}
            />

            {/* Grid Cell E: Manual Entry Fallback */}
            <ManualEntryFallback
              onSubmit={handleManualSubmit}
              isSubmitting={isSubmittingManual}
            />

          </div>

          {/* RIGHT COLUMN: Grid Cell B (Last Scan) + Grid Cell C (Stats) + Grid Cell D (Live Log) */}
          <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
            
            {/* Grid Cell B: LAST SCAN Card */}
            <LastScanCard lastScan={lastScan} />

            {/* Grid Cell C: 2x2 Stats Grid */}
            <StatsGrid
              totalScanned={stats.totalScanned}
              uniqueStudents={stats.uniqueStudents}
              duplicatesBlocked={stats.duplicatesBlocked}
              scansPerMinute={stats.scansPerMinute}
            />

            {/* Grid Cell D: LIVE LOG (Terminal stream) */}
            <LiveLog
              entries={stats.recentEntries}
              onClear={() => setStats(prev => ({ ...prev, recentEntries: [] }))}
            />

          </div>

        </div>

      </main>

    </div>
  );
}
