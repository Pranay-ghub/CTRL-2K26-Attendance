import React, { useState } from 'react';
import { Terminal, Copy, Check, Filter } from 'lucide-react';

export function LiveLog({ entries = [], onClear }) {
  const [copiedId, setCopiedId] = useState(null);
  const [filterText, setFilterText] = useState('');

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredEntries = entries.filter(entry => 
    !filterText || 
    (entry.id && entry.id.toLowerCase().includes(filterText.toLowerCase())) ||
    (entry.status && entry.status.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="rounded-2xl glass-panel border border-cyan-500/20 flex flex-col h-[340px] sm:h-[380px] overflow-hidden">
      
      {/* Terminal Title Bar */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-cyan-500/15 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
            LIVE LOG // TERMINAL
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
            LATEST 20
          </span>
        </div>

        {/* Search / Filter input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="FILTER ID..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-24 sm:w-32 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded px-2 py-0.5 text-[10px] font-mono text-slate-200 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Terminal Command Header */}
      <div className="px-3 py-1.5 bg-[#020610] border-b border-slate-800/80 font-mono text-[11px] text-cyan-400/70 flex items-center gap-1.5">
        <span className="text-emerald-400 font-bold">&gt;</span>
        <span>system.tail -f /var/log/ctrl-attendance.log</span>
        <span className="w-1.5 h-3 bg-cyan-400 animate-cursor ml-1 inline-block" />
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 bg-[#030612]/90 select-text">
        {filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <span>&gt; NO LOG ENTRIES YET</span>
            <span className="text-[11px] mt-1 text-slate-600">Awaiting incoming sensor streams...</span>
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const timeStr = entry.timestamp 
              ? (entry.timestamp.includes('T') ? new Date(entry.timestamp).toLocaleTimeString() : entry.timestamp)
              : '--:--:--';
            
            const isDuplicate = entry.status === 'DUPLICATE';
            const isQueued = entry.status === 'QUEUED_OFFLINE';
            const isSuccess = entry.status === 'PRESENT' || entry.status === 'SUCCESS' || !entry.status;

            return (
              <div
                key={entry.id + '-' + idx}
                className={`group flex items-center justify-between p-1.5 rounded transition-colors text-[11px] sm:text-xs ${
                  isDuplicate 
                    ? 'hover:bg-amber-950/20 text-amber-300/90' 
                    : isQueued
                    ? 'hover:bg-cyan-950/20 text-cyan-300/90'
                    : 'hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500 shrink-0">
                    [{timeStr}]
                  </span>

                  <span className="text-cyan-400 shrink-0">ID:</span>

                  <span className="font-bold text-white tracking-wide truncate">
                    {entry.id}
                  </span>

                  {isSuccess && (
                    <span className="text-emerald-400 shrink-0 flex items-center gap-0.5">
                      <span>✔</span>
                      <span className="text-[10px] hidden xs:inline">LOGGED</span>
                    </span>
                  )}

                  {isDuplicate && (
                    <span className="text-amber-400 shrink-0 flex items-center gap-0.5 font-bold">
                      <span>⚠</span>
                      <span className="text-[10px]">DUPLICATE</span>
                    </span>
                  )}

                  {isQueued && (
                    <span className="text-cyan-400 shrink-0 flex items-center gap-0.5">
                      <span>⚡</span>
                      <span className="text-[10px]">QUEUED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline">
                    {entry.source || 'CAM'}
                  </span>

                  <button
                    onClick={() => handleCopy(entry.id)}
                    className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                    title="Copy Barcode ID"
                  >
                    {copiedId === entry.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>STATUS: BUFFER FLUSH OK</span>
        <span>COUNT: {entries.length}</span>
      </div>

    </div>
  );
}
