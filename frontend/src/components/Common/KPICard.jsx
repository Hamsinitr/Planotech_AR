import React from 'react';

const colorConfig = {
  blue:   { icon: 'bg-blue-50 text-blue-600 border-blue-100', trend: 'text-blue-500', cls: 'kpi-blue' },
  green:  { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', trend: 'text-emerald-500', cls: 'kpi-green' },
  red:    { icon: 'bg-rose-50 text-rose-600 border-rose-100', trend: 'text-rose-500', cls: 'kpi-red' },
  amber:  { icon: 'bg-amber-50 text-amber-600 border-amber-100', trend: 'text-amber-500', cls: 'kpi-amber' },
  purple: { icon: 'bg-violet-50 text-violet-600 border-violet-100', trend: 'text-violet-500', cls: 'kpi-purple' },
  slate:  { icon: 'bg-slate-100 text-slate-600 border-slate-200', trend: 'text-slate-500', cls: 'kpi-blue' },
};

export const KPICard = ({ title, value, subtitle, icon: Icon, color = 'blue', alert = false }) => {
  const cfg = colorConfig[color] || colorConfig.blue;

  return (
    <div
      className={`kpi-card ${cfg.cls} p-5 bg-white rounded-xl border shadow-sm ${
        alert ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-none">
            {title}
          </p>
          <p className={`text-2xl font-black mt-2 leading-none ${alert ? 'text-rose-600' : 'text-slate-800'}`}>
            {value !== undefined && value !== null ? value : '—'}
          </p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cfg.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
        </div>
      )}
    </div>
  );
};

export default KPICard;
