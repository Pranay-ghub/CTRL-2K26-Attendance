import React from 'react';

export function StatusChip({ label, value, status = 'online', icon: Icon, onClick, className = '' }) {
  const statusStyles = {
    online: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    offline: 'border-red-500/40 bg-red-950/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    warning: 'border-amber-500/40 bg-amber-950/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    neutral: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
    dim: 'border-slate-700/60 bg-slate-900/50 text-slate-400'
  };

  const dotColors = {
    online: 'bg-emerald-400 animate-pulse',
    offline: 'bg-red-400',
    warning: 'bg-amber-400 animate-pulse',
    neutral: 'bg-cyan-400 animate-pulse',
    dim: 'bg-slate-500'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wide backdrop-blur-md transition-all ${statusStyles[status] || statusStyles.neutral} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColors[status] || dotColors.neutral}`} />
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span className="opacity-75 uppercase text-[10px]">{label}:</span>
      <span className="font-bold tracking-wider">{value}</span>
    </Component>
  );
}
