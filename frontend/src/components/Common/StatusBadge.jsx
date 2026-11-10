import React from 'react';

const STATUS_MAP = {
  // Attendance statuses
  'Present':          { cls: 'badge badge-green',  label: 'Present' },
  'Absent':           { cls: 'badge badge-slate',  label: 'Absent' },
  'Leave':            { cls: 'badge badge-blue',   label: 'On Leave' },
  'Holiday':          { cls: 'badge badge-purple', label: 'Holiday' },
  'Not Punched In':   { cls: 'badge badge-amber',  label: 'No Punch-In' },

  // Punctuality
  'On Time':              { cls: 'badge badge-green', label: 'On Time' },
  'Grace (9:30-9:45)':    { cls: 'badge badge-sky',   label: 'Grace Period' },
  'Late':                 { cls: 'badge badge-amber',  label: 'Late' },

  // Report statuses
  'Submitted':     { cls: 'badge badge-blue',  label: 'Submitted' },
  'Not Submitted': { cls: 'badge badge-red',   label: 'Not Submitted' },

  // Quality ratings
  'Excellent': { cls: 'badge badge-green',  label: 'Excellent' },
  'Good':      { cls: 'badge badge-blue',   label: 'Good' },
  'Average':   { cls: 'badge badge-amber',  label: 'Average' },
  'Poor':      { cls: 'badge badge-red',    label: 'Poor' },
  'N/A':       { cls: 'badge badge-slate',  label: 'N/A' },
  'None':      { cls: 'badge badge-slate',  label: '—' },

  // Productivity categories
  'Top Performer':   { cls: 'badge badge-green',  label: '⭐ Top Performer' },
  'Consistent':      { cls: 'badge badge-blue',   label: 'Consistent' },
  'Needs Attention': { cls: 'badge badge-red',    label: 'Needs Attention' },
  'Absent / Excused':{ cls: 'badge badge-slate',  label: 'Absent' },

  // Employee status
  'Active':   { cls: 'badge badge-green', label: 'Active' },
  'Inactive': { cls: 'badge badge-red',   label: 'Inactive' },

  // Location
  'Out of Location': { cls: 'badge badge-red',   label: 'Out of Location' },
  'In Location':     { cls: 'badge badge-green', label: 'In Location' },
};

export const StatusBadge = ({ status }) => {
  if (!status) return <span className="badge badge-slate">—</span>;

  const config = STATUS_MAP[status];
  if (!config) {
    // Fallback: render as-is
    return <span className="badge badge-slate">{status}</span>;
  }

  return <span className={config.cls}>{config.label}</span>;
};

export default StatusBadge;
