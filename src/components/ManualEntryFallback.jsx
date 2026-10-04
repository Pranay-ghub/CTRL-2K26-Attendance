import React, { useState } from 'react';
import { Keyboard, Send, AlertCircle, CheckCircle } from 'lucide-react';

export function ManualEntryFallback({ onSubmit, isSubmitting = false }) {
  const [manualId, setManualId] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  const clean = manualId.trim().toUpperCase();
  const isValidLength = clean.length >= 7;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clean || isSubmitting) return;

    if (clean.length < 7) {
      setErrorNotice(`Roll No must be at least 7 characters (currently ${clean.length}).`);
      return;
    }

    setErrorNotice('');
    onSubmit(clean);
    setManualId('');
  };

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase();
    setManualId(val);
    if (val.trim().length >= 7) {
      setErrorNotice('');
    }
  };

  return (
    <div className="rounded-2xl glass-panel border border-cyan-500/20 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-cyan-400" />
        <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-300">
          MANUAL ENTRY FALLBACK
        </h3>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded ml-auto">
          MIN 7 DIGITS
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={manualId}
            onChange={handleChange}
            placeholder="ENTER ROLL NO (MIN 7 DIGITS)..."
            className={`w-full bg-[#030612] border rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-200 uppercase placeholder:text-slate-600 outline-none transition-all shadow-inner ${
              manualId.length > 0 && !isValidLength
                ? 'border-red-500/60 focus:border-red-400 shadow-[0_0_10px_rgba(255,51,68,0.2)]'
                : 'border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            }`}
          />

          {/* Character length counter badge */}
          {manualId.length > 0 && (
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold flex items-center gap-1 ${
              isValidLength ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isValidLength ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{manualId.length}/7 min</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValidLength || isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-orbitron font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.25)] cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'LOGGING...' : 'SUBMIT ID'}</span>
        </button>
      </form>
      
      {errorNotice ? (
        <p className="text-xs font-mono text-red-400 mt-2 flex items-center gap-1.5 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorNotice}</span>
        </p>
      ) : (
        <p className="text-[11px] font-mono text-slate-500 mt-2">
          Validation rule: Roll Numbers must be at least 7 digits/characters to be recorded.
        </p>
      )}
    </div>
  );
}
