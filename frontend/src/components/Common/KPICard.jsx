import React from 'react';

const COLOR_CONFIG = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   bar: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  red:    { bg: 'bg-rose-50',   text: 'text-rose-500',   bar: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  bar: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-600', bar: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  slate:  { bg: 'bg-slate-100', text: 'text-slate-500',  bar: '#94a3b8', glow: 'rgba(148,163,184,0.15)' },
};

export const KPICard = ({ title, value, subtitle, icon: Icon, color = 'blue', alert = false }) => {
  const cfg = COLOR_CONFIG[color] || COLOR_CONFIG.blue;

  return (
    <div className={`kpi-card p-5 ${alert ? 'ring-1 ring-rose-300/60' : ''}`}>
      {/* Top row: icon + alert indicator */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
          style={{ boxShadow: `0 0 0 1px ${cfg.glow}` }}
        >
          <Icon className={`w-4.5 h-4.5 ${cfg.text}`} style={{ width: 18, height: 18 }} />
        </div>
        {alert && (
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0 mt-1" />
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        <p className="text-2xl font-bold text-slate-900 leading-none tracking-tight">
          {value ?? '—'}
        </p>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-slate-700 leading-tight">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[10.5px] text-slate-400 mt-1 leading-tight truncate">{subtitle}</p>
      )}

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-60"
        style={{ background: `linear-gradient(90deg, ${cfg.bar}, transparent)` }}
      />
    </div>
  );
};

export default KPICard;
