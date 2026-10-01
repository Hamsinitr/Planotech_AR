import React from 'react';

const BADGE_MAP = {
  // Attendance
  'Present':               'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Absent':                'bg-slate-100 text-slate-500 border-slate-200',
  'Leave':                 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'Not Punched In':        'bg-orange-50 text-orange-600 border-orange-200',
  // Punctuality
  'On Time':               'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Grace (9:30-9:45)':     'bg-sky-50 text-sky-700 border-sky-200',
  'Late':                  'bg-amber-50 text-amber-700 border-amber-200',
  // Reports
  'Submitted':             'bg-blue-50 text-blue-700 border-blue-200',
  'Not Submitted':         'bg-rose-50 text-rose-700 border-rose-200',
  // Quality
  'Excellent':             'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Good':                  'bg-blue-50 text-blue-700 border-blue-200',
  'Average':               'bg-amber-50 text-amber-700 border-amber-200',
  'Poor':                  'bg-rose-50 text-rose-700 border-rose-200',
  'N/A':                   'bg-slate-100 text-slate-400 border-slate-200',
};

const DOTS = {
  'Present':     'bg-emerald-500',
  'Submitted':   'bg-blue-500',
  'Excellent':   'bg-emerald-500',
  'Good':        'bg-blue-500',
  'On Time':     'bg-emerald-500',
  'Late':        'bg-amber-500',
  'Not Submitted': 'bg-rose-500',
  'Absent':      'bg-slate-400',
};

export const StatusBadge = ({ status }) => {
  if (!status || status === 'None') return (
    <span className="text-[10px] text-slate-300 font-medium">—</span>
  );

  const cls = BADGE_MAP[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  const dot = DOTS[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />}
      {status}
    </span>
  );
};

export default StatusBadge;
