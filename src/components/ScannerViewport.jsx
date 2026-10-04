import React from 'react';
import { Camera, CameraOff, RefreshCw, Zap, ZapOff, AlertOctagon, HelpCircle, ShieldAlert } from 'lucide-react';

export function ScannerViewport({
  isScanning,
  isStarting,
  cameras,
  selectedCameraId,
  errorMessage,
  errorType,
  torchAvailable,
  torchOn,
  flashFeedback,
  onStartScanner,
  onStopScanner,
  onSwitchCamera,
  onToggleTorch,
  onRetry
}) {
  return (
    <div className={`relative flex flex-col rounded-2xl glass-panel border overflow-hidden transition-all duration-300 ${
      flashFeedback === 'success' 
        ? 'flash-success' 
        : flashFeedback === 'duplicate' 
        ? 'flash-duplicate' 
        : 'border-cyan-500/25 hover:border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.08)]'
    }`}>
      {/* Top HUD bar with indicators */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/15 bg-slate-950/60 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            isScanning ? 'bg-emerald-400 animate-ping' : isStarting ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
          }`} />
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            {isScanning ? 'SENSOR // ACTIVE' : isStarting ? 'INIT CAM...' : 'CAMERA STANDBY'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {torchAvailable && (
            <span className="text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
              TORCH READY
            </span>
          )}
          <span className="text-[10px] text-cyan-400/80 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded">
            1D / 2D MULTI-DECODE
          </span>
        </div>
      </div>

      {/* Viewport Area */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] bg-[#020408] overflow-hidden flex items-center justify-center">
        
        {/* html5-qrcode video mount target */}
        <div id="reader" className="w-full h-full relative z-10" />

        {/* HUD Overlay when scanning */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center p-4">
            
            {/* Viewfinder Target Frame suited for 1D Barcode & QR */}
            <div className="relative w-[85%] max-w-sm h-40 sm:h-48 border border-cyan-500/40 rounded-xl bg-cyan-500/[0.02] shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center overflow-hidden">
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

              {/* Animated Laser Beam */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ff3344] animate-laser z-30" />

              {/* Sub-reticle crosshair */}
              <div className="w-8 h-8 border border-cyan-500/30 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full" />
              </div>

              {/* Alignment guides for 1D barcode */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest -rotate-90">
                BARCODE
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest rotate-90">
                ALIGN
              </div>
            </div>

            <p className="mt-3 text-[11px] font-mono text-cyan-300/80 tracking-widest bg-black/60 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm">
              ALIGN BARCODE OR QR INSIDE FRAME
            </p>
          </div>
        )}

        {/* Inactive / Idle State Overlay */}
        {!isScanning && !errorMessage && !isStarting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#050810]/70 to-[#020408]/90">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 mb-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <Camera className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="font-orbitron font-bold text-base text-white tracking-wider">
              CAMERA SCANNER READY
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1 max-w-xs">
              Continuous autofocus, low-light compensation & ultra-fast multi-format decode.
            </p>
            <button
              onClick={onStartScanner}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-extrabold text-sm tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              [ START SCANNER ]
            </button>
          </div>
        )}

        {/* Starting / Initializing State */}
        {isStarting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#050810]/90">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="font-orbitron font-bold text-sm text-cyan-300 tracking-wider">
              INITIALIZING VIDEO STREAM...
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Requesting hardware access & sensor focus
            </p>
          </div>
        )}

        {/* Error States with User Instructions */}
        {errorMessage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 text-center bg-[#0a0406]/95 backdrop-blur-md">
            <div className="p-3 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-400 mb-3">
              {errorType === 'PERMISSION' ? (
                <ShieldAlert className="w-8 h-8 animate-bounce" />
              ) : errorType === 'INSECURE' ? (
                <AlertOctagon className="w-8 h-8" />
              ) : (
                <CameraOff className="w-8 h-8" />
              )}
            </div>

            <h3 className="font-orbitron font-bold text-sm text-red-400 tracking-wider">
              {errorType === 'PERMISSION' ? 'CAMERA PERMISSION DENIED' : 'CAMERA HARDWARE ERROR'}
            </h3>

            <p className="text-xs text-slate-300 font-mono mt-1.5 max-w-sm leading-relaxed">
              {errorMessage}
            </p>

            {/* Step-by-step guidance for permission errors */}
            {errorType === 'PERMISSION' && (
              <div className="mt-3 text-left bg-slate-900/80 p-3 rounded-lg border border-red-500/20 text-[11px] font-mono text-slate-400 max-w-xs space-y-1">
                <div className="text-red-300 font-bold">How to enable:</div>
                <div>1. Tap the lock/tune icon in the browser URL bar.</div>
                <div>2. Set "Camera" permission to "Allow".</div>
                <div>3. Reload this page or tap Retry below.</div>
              </div>
            )}

            {/* Insecure context notice */}
            {errorType === 'INSECURE' && (
              <div className="mt-3 text-left bg-amber-950/50 p-3 rounded-lg border border-amber-500/30 text-[11px] font-mono text-amber-200 max-w-xs">
                Camera access is blocked by browsers on unencrypted HTTP. Please open using <strong>HTTPS</strong> or <strong>localhost</strong>.
              </div>
            )}

            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,51,68,0.4)] active:scale-95"
            >
              RETRY CAMERA PERMISSION
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-3 bg-slate-950/80 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-2">
        {/* Toggle Scan Button */}
        {isScanning ? (
          <button
            onClick={onStopScanner}
            className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/40 font-mono text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <CameraOff className="w-4 h-4" />
            <span>PAUSE SENSOR</span>
          </button>
        ) : (
          <button
            onClick={onStartScanner}
            disabled={isStarting}
            className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-cyan-950/50 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/50 font-mono text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>START SENSOR</span>
          </button>
        )}

        {/* Camera Selector Dropdown / Switch */}
        {cameras.length > 1 && (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCameraId || ''}
              onChange={(e) => onSwitchCamera(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-2 py-2 outline-none focus:border-cyan-500 cursor-pointer max-w-[160px] truncate"
              title="Switch camera device"
            >
              {cameras.map((cam, idx) => (
                <option key={cam.id || idx} value={cam.id}>
                  {cam.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Torch Toggle (if available) */}
        {torchAvailable && (
          <button
            onClick={onToggleTorch}
            className={`p-2 rounded-xl border transition-all ${
              torchOn 
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_#ffaa00]' 
                : 'bg-slate-900/80 border-slate-700 text-amber-400 hover:border-amber-400/50'
            }`}
            title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
            aria-label="Toggle flashlight"
          >
            {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
