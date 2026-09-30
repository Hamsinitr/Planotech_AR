import React from 'react';

export const KPICard = ({ title, value, subtitle, icon: Icon, color = 'blue', alert = false }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className={`p-5 bg-white rounded-xl border ${alert ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'} shadow-sm hover:shadow transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value !== undefined && value !== null ? value : '-'}</p>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
