import React, { useState } from 'react';
import { Keyboard, Send, Check } from 'lucide-react';

export function ManualEntryFallback({ onSubmit, isSubmitting = false }) {
  const [manualId, setManualId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = manualId.trim().toUpperCase();
    if (!clean || isSubmitting) return;

    onSubmit(clean);
    setManualId('');
  };

  return (
    <div className="rounded-2xl glass-panel border border-cyan-500/20 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-cyan-400" />
        <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-300">
          MANUAL ENTRY FALLBACK
        </h3>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded ml-auto">
          DAMAGED BARCODE
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value.toUpperCase())}
            placeholder="TYPE BARCODE / ROLL NO..."
            className="w-full bg-[#030612] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-200 uppercase placeholder:text-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          />
        </div>

        <button
          type="submit"
          disabled={!manualId.trim() || isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-orbitron font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.25)] cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'LOGGING...' : 'SUBMIT ID'}</span>
        </button>
      </form>
      
      <p className="text-[11px] font-mono text-slate-500 mt-2">
        Press Enter or tap Submit. All entries are validated and synced with the central ledger.
      </p>
    </div>
  );
}
