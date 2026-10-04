import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, CloudOff, X } from 'lucide-react';

export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const typeConfig = {
    SUCCESS: {
      border: 'border-[#39ff14]',
      bg: 'bg-[#051a0f]/90',
      text: 'text-[#39ff14]',
      shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.35)]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#39ff14] shrink-0 animate-pulse" />
    },
    DUPLICATE: {
      border: 'border-[#ffaa00]',
      bg: 'bg-[#1f1604]/90',
      text: 'text-[#ffaa00]',
      shadow: 'shadow-[0_0_20px_rgba(255,170,0,0.35)]',
      icon: <AlertTriangle className="w-5 h-5 text-[#ffaa00] shrink-0" />
    },
    ERROR: {
      border: 'border-[#ff3344]',
      bg: 'bg-[#1f070a]/90',
      text: 'text-[#ff3344]',
      shadow: 'shadow-[0_0_20px_rgba(255,51,68,0.35)]',
      icon: <XCircle className="w-5 h-5 text-[#ff3344] shrink-0" />
    },
    QUEUED_OFFLINE: {
      border: 'border-[#00f0ff]',
      bg: 'bg-[#041624]/90',
      text: 'text-[#00f0ff]',
      shadow: 'shadow-[0_0_20px_rgba(0,240,255,0.35)]',
      icon: <CloudOff className="w-5 h-5 text-[#00f0ff] shrink-0" />
    }
  };

  const current = typeConfig[toast.type] || typeConfig.SUCCESS;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md pointer-events-auto transition-all duration-300">
      <div className={`p-4 rounded-xl backdrop-blur-xl border ${current.border} ${current.bg} ${current.shadow} flex items-start gap-3 relative overflow-hidden`}>
        {/* Glowing side accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${current.text.replace('text-', 'bg-')}`} />
        
        {current.icon}

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${current.text}`}>
              {toast.title || toast.type}
            </span>
            {toast.id && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                {toast.id}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-200 mt-0.5 leading-snug">
            {toast.message}
          </p>
          {toast.extra && (
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {toast.extra}
            </p>
          )}
        </div>

        <button 
          onClick={onDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
