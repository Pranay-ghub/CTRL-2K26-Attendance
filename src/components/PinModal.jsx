import React, { useState } from 'react';
import { ShieldCheck, Lock, Delete } from 'lucide-react';

export function PinModal({ requiredPin, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === requiredPin) {
          sessionStorage.setItem('ctrl_pin_verified', 'true');
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 700);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050810]/90 backdrop-blur-md">
      <div className={`w-full max-w-xs p-6 rounded-2xl glass-panel border transition-all ${
        error ? 'border-red-500 shadow-[0_0_30px_rgba(255,51,68,0.5)] animate-shake' : 'border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
      }`}>
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 mb-3">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-orbitron font-bold text-lg text-white tracking-wider">
            VOLUNTEER ACCESS
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-1">
            ENTER 4-DIGIT SECURITY PIN
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                error
                  ? 'border-red-500 bg-red-500'
                  : pin.length > i
                  ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_10px_#00f0ff]'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-mono text-center text-red-400 mb-4 animate-bounce">
            ACCESS DENIED. TRY AGAIN.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 font-mono">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              className="h-12 rounded-xl bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-lg font-bold text-slate-200 hover:text-cyan-300 transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="h-12 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
          >
            EXIT
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-lg font-bold text-slate-200 hover:text-cyan-300 transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all active:scale-95"
            aria-label="Delete digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
