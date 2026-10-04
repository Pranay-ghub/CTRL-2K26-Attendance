import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Eye, EyeOff, Volume2, VolumeX, Cloud, CloudOff, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { soundService } from '../services/sound';

export function HeaderBar({ 
  wakeLockActive, 
  onToggleWakeLock, 
  offlineCount = 0, 
  onSyncOffline, 
  isSyncing = false 
}) {
  const navigate = useNavigate();
  const [time, setTime] = useState('');
  const [muted, setMuted] = useState(soundService.isMuted());
  const sheetViewUrl = import.meta.env.VITE_SHEET_VIEW_URL || 'https://docs.google.com/spreadsheets';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !muted;
    soundService.setMuted(next);
    setMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 px-3 py-2.5 sm:px-6 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-all active:scale-95 shrink-0"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse hidden sm:inline-block" />
              <h1 className="font-orbitron font-extrabold text-sm sm:text-base md:text-lg tracking-wider text-white truncate text-glow-cyan">
                CTRL 2K26 <span className="text-cyan-400">// ATTENDANCE</span>
              </h1>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block tracking-wide">
              TECH TITANS CLUB • LIVE PORTAL
            </p>
          </div>
        </div>

        {/* Right: Actions, WakeLock, Sound, Sync & Clock */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 font-mono text-xs">
          
          {/* Offline Sync Badge */}
          {offlineCount > 0 ? (
            <button
              onClick={onSyncOffline}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/50 text-amber-300 hover:bg-amber-900/40 transition-all text-[11px]"
              title="Unsynced scans in queue. Click to sync now."
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SYNC ({offlineCount})</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-400/80 bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded">
              <Cloud className="w-3 h-3" />
              <span>ONLINE</span>
            </div>
          )}

          {/* Wake Lock Screen Awake Toggle */}
          <button
            onClick={onToggleWakeLock}
            className={`p-1.5 rounded-lg border transition-all ${
              wakeLockActive 
                ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={wakeLockActive ? 'Screen Wake Lock Active (Screen will not sleep)' : 'Keep Screen Awake'}
            aria-label="Toggle wake lock"
          >
            {wakeLockActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-all ${
              !muted 
                ? 'bg-slate-900/80 border-slate-700 text-cyan-400' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
            title={muted ? 'Unmute scanner sound' : 'Mute scanner sound'}
            aria-label="Toggle sound"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Open Google Sheet Link */}
          <a
            href={sheetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 transition-all text-xs font-mono"
            title="Open Google Sheet ledger in new tab"
          >
            <span>SHEET</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-cyan-300 text-xs font-mono tracking-widest shadow-[0_0_10px_rgba(0,240,255,0.15)]">
            <Clock className="w-3.5 h-3.5 text-cyan-400 hidden xs:inline" />
            <span>{time}</span>
          </div>

        </div>

      </div>
    </header>
  );
}
