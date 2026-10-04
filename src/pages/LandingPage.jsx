import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, QrCode, ArrowRight, Shield, Database, Sparkles, Terminal, Cpu } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import { pingSheet } from '../services/sheets';

export function LandingPage() {
  const navigate = useNavigate();

  // Typing effect state for "CTRL 2K26"
  const fullTitle = 'CTRL 2K26';
  const [typedTitle, setTypedTitle] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  // System status states
  const [cameraStatus, setCameraStatus] = useState({ label: 'READY', status: 'online' });
  const [sheetStatus, setSheetStatus] = useState({ label: 'CHECKING...', status: 'warning' });
  const [liveClock, setLiveClock] = useState('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Title Typing effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, index));
        index++;
      } else {
        setIsTypingDone(true);
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Check hardware and sheet status
  useEffect(() => {
    // 1. Camera check
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraStatus({ label: 'READY', status: 'online' });
    } else {
      setCameraStatus({ label: 'OFFLINE', status: 'offline' });
    }

    // 2. Google Sheet Web App Ping
    pingSheet().then(res => {
      if (res.connected) {
        setSheetStatus({ label: 'CONNECTED', status: 'online' });
      } else if (res.mode === 'STANDBY_MOCK') {
        setSheetStatus({ label: 'STANDBY (LOCAL)', status: 'neutral' });
      } else {
        setSheetStatus({ label: 'UNREACHABLE', status: 'warning' });
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col justify-between bg-[#050810] bg-cyber-grid scanlines overflow-hidden text-slate-100 select-none">
      
      {/* Background ambient neon glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Bar with Event Badge */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="font-orbitron font-extrabold text-sm tracking-widest text-cyan-300">
              TECH TITANS CLUB
            </span>
            <span className="block text-[10px] font-mono text-slate-400">
              OFFICIAL ATTENDANCE SYSTEM
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300">
            SYSTEM v2.6 // PROD
          </span>
        </div>
      </header>

      {/* Main Full-Screen Hero Section */}
      <main className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center text-center my-auto">
        
        {/* Terminal prompt intro chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <Terminal className="w-3.5 h-3.5" />
          <span>&gt; system.init(scanner_daemon)</span>
        </div>

        {/* Big Glowing Heading: TECH TALKS */}
        <h1 className="font-orbitron text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase text-glow-cyan">
          TECH TALKS
        </h1>

        {/* Monospace Sub-Heading with Glitch Effect & Typing Cursor */}
        <div className="relative mt-2 sm:mt-4 inline-block">
          <div className="font-mono text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-200 glitch-text cursor-default">
            {typedTitle}
            <span className="text-cyan-400 animate-cursor inline-block ml-1">_</span>
          </div>
        </div>

        {/* Small Subtitle */}
        <p className="mt-6 text-sm sm:text-base font-mono text-slate-300 max-w-xl leading-relaxed">
          <span className="text-cyan-400 font-bold">Tech Titans Club</span>
          <span className="mx-2 text-slate-600">•</span>
          <span>Mini Auditorium, Block 10</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="text-amber-300 font-semibold">5th October 2026</span>
        </p>

        {/* Supported Format Tags */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 max-w-lg text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">CODE_128</span>
          <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">CODE_39</span>
          <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">EAN_13</span>
          <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">QR_CODE</span>
          <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">UPC_A</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">AUTO-SYNC SHEETS</span>
        </div>

        {/* Big High-Tech CTA Button */}
        <div className="mt-8 sm:mt-10 w-full max-w-xs sm:max-w-md">
          <button
            onClick={() => navigate('/attendance')}
            className="group relative w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-orbitron font-extrabold text-base sm:text-lg tracking-wider uppercase shadow-[0_0_35px_rgba(0,240,255,0.45)] hover:shadow-[0_0_50px_rgba(57,255,20,0.6)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            {/* High-tech corner highlights */}
            <span className="absolute top-1 left-2 text-[10px] font-mono text-slate-950/60">[01]</span>
            <span className="font-bold">[ MARK ATTENDANCE &rarr; ]</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        <p className="text-[11px] font-mono text-slate-500 mt-3">
          Requires camera permission. Mobile-optimized for Android & iOS.
        </p>

      </main>

      {/* Footer Showing Live System Status Chips */}
      <footer className="relative z-30 w-full border-t border-cyan-500/15 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatusChip
              label="CAMERA"
              value={cameraStatus.label}
              status={cameraStatus.status}
              icon={Camera}
            />

            <StatusChip
              label="SHEET"
              value={sheetStatus.label}
              status={sheetStatus.status}
              icon={Database}
            />
          </div>

          {/* Live Clock & Timestamp */}
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>IST CLOCK: {liveClock || '--:--:--'}</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
