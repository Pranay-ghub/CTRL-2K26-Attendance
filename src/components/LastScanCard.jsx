import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Barcode, ShieldAlert, CloudOff } from 'lucide-react';

export function LastScanCard({ lastScan }) {
  if (!lastScan) {
    return (
      <div className="rounded-2xl glass-panel border border-cyan-500/20 p-4 sm:p-5 flex flex-col justify-center min-h-[170px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Barcode className="w-20 h-20 text-cyan-400" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-cyan-400">
            LAST SCAN // AWAITING DATA
          </h3>
        </div>
        <div className="text-slate-400 font-mono text-sm mt-1">
          &gt; Sensor idle. Bring student ID or event badge into camera frame.
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] font-mono text-cyan-400/80 bg-slate-900/60 px-2 py-0.5 rounded border border-cyan-500/20">
            MIN 7 DIGITS REQUIRED
          </span>
        </div>
      </div>
    );
  }

  const isSuccess = lastScan.status === 'SUCCESS';
  const isDuplicate = lastScan.status === 'DUPLICATE';
  const isQueued = lastScan.status === 'QUEUED_OFFLINE';
  const isError = lastScan.status === 'ERROR' || lastScan.status === 'INVALID_LENGTH';

  const badgeConfig = {
    SUCCESS: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/30',
      text: 'text-emerald-400',
      shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.25)]',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      label: 'RECORDED'
    },
    DUPLICATE: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/30',
      text: 'text-amber-400',
      shadow: 'shadow-[0_0_15px_rgba(255,170,0,0.25)]',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      label: 'DUPLICATE BLOCKED'
    },
    QUEUED_OFFLINE: {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/30',
      text: 'text-cyan-400',
      shadow: 'shadow-[0_0_15px_rgba(0,240,255,0.25)]',
      icon: <CloudOff className="w-4 h-4 text-cyan-400" />,
      label: 'QUEUED OFFLINE'
    },
    ERROR: {
      border: 'border-red-500/40',
      bg: 'bg-red-950/30',
      text: 'text-red-400',
      shadow: 'shadow-[0_0_15px_rgba(255,51,68,0.25)]',
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      label: lastScan.id.length < 7 ? 'REJECTED (< 7 DIGITS)' : 'SCAN ERROR'
    },
    INVALID_LENGTH: {
      border: 'border-red-500/40',
      bg: 'bg-red-950/30',
      text: 'text-red-400',
      shadow: 'shadow-[0_0_15px_rgba(255,51,68,0.25)]',
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      label: 'REJECTED (< 7 DIGITS)'
    }
  };

  const badge = badgeConfig[lastScan.status] || badgeConfig.ERROR;

  return (
    <div className={`rounded-2xl glass-panel border p-4 sm:p-5 relative overflow-hidden transition-all duration-300 ${badge.border} ${badge.shadow}`}>
      
      {/* Header with Title and Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            isSuccess ? 'bg-emerald-400' : isDuplicate ? 'bg-amber-400' : 'bg-red-400'
          } animate-ping`} />
          <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-slate-300">
            LAST SCANNED ID
          </h3>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold tracking-wider ${badge.border} ${badge.bg} ${badge.text}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Main Scanned ID Display */}
      <div className="my-2">
        <div className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-wider select-all break-all ${
          isError ? 'text-red-400' : isDuplicate ? 'text-amber-300' : 'text-white text-glow-cyan'
        }`}>
          {lastScan.id}
        </div>
      </div>

      {/* Error message detail if rejected */}
      {lastScan.errorMessage && (
        <div className="text-xs font-mono text-red-400 mb-2">
          &gt; {lastScan.errorMessage}
        </div>
      )}

      {/* Timestamp and Details */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{new Date(lastScan.timestamp).toLocaleTimeString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="uppercase text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
            SOURCE: {lastScan.source || 'CAMERA'}
          </span>
          {lastScan.firstScannedAt && (
            <span className="text-[10px] text-amber-400" title={`First scanned: ${lastScan.firstScannedAt}`}>
              PRIOR ENTRY FOUND
            </span>
          )}
          {lastScan.id && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              lastScan.id.length >= 7 ? 'text-emerald-400 bg-emerald-950/40' : 'text-red-400 bg-red-950/40'
            }`}>
              {lastScan.id.length} digits
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
