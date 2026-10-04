import React from 'react';
import { Users, UserCheck, ShieldAlert, Activity } from 'lucide-react';

export function StatsGrid({ totalScanned = 0, uniqueStudents = 0, duplicatesBlocked = 0, scansPerMinute = 0 }) {
  const stats = [
    {
      label: 'TOTAL SCANS',
      sub: 'ALL ATTEMPTS',
      value: totalScanned,
      icon: Users,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      glow: 'shadow-[0_0_15px_rgba(0,240,255,0.1)]'
    },
    {
      label: 'UNIQUE ATTENDEES',
      sub: 'CONFIRMED HEADCOUNT',
      value: uniqueStudents,
      icon: UserCheck,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      glow: 'shadow-[0_0_15px_rgba(57,255,20,0.1)]'
    },
    {
      label: 'DUPLICATES BLOCKED',
      sub: 'REJECTED RE-SCANS',
      value: duplicatesBlocked,
      icon: ShieldAlert,
      color: 'text-amber-400',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      glow: 'shadow-[0_0_15px_rgba(255,170,0,0.1)]'
    },
    {
      label: 'RATE (SCANS / MIN)',
      sub: 'REAL-TIME VELOCITY',
      value: scansPerMinute,
      icon: Activity,
      color: 'text-fuchsia-400',
      border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
      glow: 'shadow-[0_0_15px_rgba(255,43,214,0.1)]'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl glass-panel border p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 ${stat.border} ${stat.glow}`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                {stat.label}
              </span>
              <Icon className={`w-4 h-4 shrink-0 ${stat.color} opacity-80`} />
            </div>

            <div className="my-1">
              <div className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${stat.color}`}>
                {stat.value}
              </div>
            </div>

            <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 tracking-wide uppercase truncate">
              {stat.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
