import React from 'react';

export const StatusBadge = ({ status, type }) => {
  if (!status) return <span className="text-slate-400 text-xs">-</span>;

  const s = String(status).toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  // Green group
  if (['present', 'submitted', 'excellent', 'top performer', 'on time'].includes(s)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  // Blue group
  else if (['good', 'consistent'].includes(s)) {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
  }
  // Amber group
  else if (['late', 'grace (9:30-9:45)', 'average', '9:30 am–9:45 am', 'after 9:45 am'].includes(s)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  }
  // Red group
  else if (['not submitted', 'poor', 'needs attention'].includes(s)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }
  // Slate/Neutral group
  else if (['absent', 'not punched in', 'absent / excused', 'leave', 'holiday'].includes(s)) {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
