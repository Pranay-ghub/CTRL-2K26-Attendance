import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

const ATTENDANCE_PASSWORD = 'TT2K26DDCTRL';

export function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (password === ATTENDANCE_PASSWORD) {
      sessionStorage.setItem('ctrl_attendance_access', 'true');
      onSuccess();
      return;
    }

    setPassword('');
    setHasError(true);
  };

  return (
    <main className="min-h-screen bg-[#050810] bg-cyber-grid scanlines text-slate-100 flex items-center justify-center p-4">
      <section className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,240,255,0.12)]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK
        </Link>

        <div className="mt-8 text-center">
          <div className="inline-flex rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-3 text-cyan-300">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="mt-5 font-mono text-[11px] tracking-[0.18em] text-cyan-300">CTRL 2K26 // ACCESS</p>
          <h1 className="mt-2 font-orbitron text-xl font-bold text-white">Attendance Access</h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-7">
          <label htmlFor="attendance-password" className="mb-2 block font-mono text-xs text-slate-400">
            PASSWORD
          </label>
          <input
            id="attendance-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setHasError(false);
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'password-error' : undefined}
            placeholder="Enter access password"
            className={`w-full rounded-lg border bg-slate-950/70 px-4 py-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400 ${
              hasError ? 'border-red-500' : 'border-slate-700'
            }`}
          />

          {hasError && (
            <p id="password-error" role="alert" className="mt-2 font-mono text-xs text-red-400">
              Incorrect password. Try again.
            </p>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-3 font-orbitron text-sm font-bold text-slate-950 transition hover:brightness-110 active:scale-[0.99]"
          >
            UNLOCK SCANNER
          </button>
        </form>
      </section>
    </main>
  );
}