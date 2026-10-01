import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, FileX, UserX, Star, TrendingDown } from 'lucide-react';

const FreqBadge = ({ count, type }) => {
  const styles = {
    late: count >= 5 ? 'freq-badge-red' : count >= 3 ? 'freq-badge-amber' : 'freq-badge-blue',
    unsub: count >= 5 ? 'freq-badge-red' : count >= 3 ? 'freq-badge-amber' : 'freq-badge-purple',
  };
  return (
    <span className={`freq-badge ${styles[type] || 'freq-badge-blue'}`}>
      {count}×
    </span>
  );
};

const AlertCard = ({ title, subtitle, icon: Icon, iconColor, borderColor, bgColor, count, children }) => (
  <div className={`rounded-xl border p-4 ${borderColor} ${bgColor}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 leading-none">{title}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <span className={`freq-badge ${count > 0 ? 'freq-badge-red' : 'freq-badge-blue'}`}>{count}</span>
    </div>
    {children}
  </div>
);

export const AttentionAlerts = ({ attentionData, onSelectEmployee }) => {
  const [expanded, setExpanded] = useState(true);

  if (!attentionData) return null;

  const {
    absent_today = [],
    unsubmitted_today = [],
    repeated_unsubmitted = [],
    repeated_late = [],
    top_performers = [],
  } = attentionData;

  const totalIssues = unsubmitted_today.length + repeated_unsubmitted.length + repeated_late.length;

  // Sort repeated offenders by frequency descending
  const sortedLate = [...repeated_late].sort((a, b) => b.late_count - a.late_count);
  const sortedUnsub = [...repeated_unsubmitted].sort((a, b) => b.unsubmitted_count - a.unsubmitted_count);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50/50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-none">Operational Alerts</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Absences, unsubmitted reports, and repeat offenders</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {totalIssues > 0 && (
            <span className="freq-badge freq-badge-red">{totalIssues} issues</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Absent Today */}
          <AlertCard
            title={`Absent Today`}
            subtitle="Not penalised for non-submission"
            icon={UserX}
            iconColor="bg-slate-100 text-slate-500"
            borderColor="border-slate-200"
            bgColor="bg-slate-50/40"
            count={absent_today.length}
          >
            {absent_today.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No absences recorded</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {absent_today.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="alert-row flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg"
                  >
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{emp.employee_name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{emp.department}</span>
                  </div>
                ))}
              </div>
            )}
          </AlertCard>

          {/* Present, No Report */}
          <AlertCard
            title={`No Report Submitted`}
            subtitle="Present employees — action needed"
            icon={FileX}
            iconColor="bg-rose-50 text-rose-500"
            borderColor="border-rose-200"
            bgColor="bg-rose-50/20"
            count={unsubmitted_today.length}
          >
            {unsubmitted_today.length === 0 ? (
              <p className="text-[11px] text-emerald-600 font-medium">✓ All present employees submitted</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {unsubmitted_today.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="alert-row flex items-center justify-between px-2.5 py-1.5 bg-white border border-rose-200 hover:border-rose-400 rounded-lg"
                  >
                    <span className="text-[11px] font-semibold text-rose-800 truncate">{emp.employee_name}</span>
                    <span className="text-[10px] text-rose-400 ml-2 flex-shrink-0">{emp.department}</span>
                  </div>
                ))}
              </div>
            )}
          </AlertCard>

          {/* Repeat Non-Submitters — KEY FEATURE: sorted by frequency */}
          <AlertCard
            title={`Frequent Non-Submitters`}
            subtitle="Missed ≥ 2 times while present"
            icon={TrendingDown}
            iconColor="bg-amber-50 text-amber-600"
            borderColor="border-amber-200"
            bgColor="bg-amber-50/20"
            count={sortedUnsub.length}
          >
            {sortedUnsub.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No repeat offenders detected</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sortedUnsub.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="alert-row flex items-center justify-between px-2.5 py-1.5 bg-white border border-amber-200 hover:border-amber-400 rounded-lg"
                  >
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{emp.employee_name}</span>
                    <FreqBadge count={emp.unsubmitted_count} type="unsub" />
                  </div>
                ))}
              </div>
            )}
          </AlertCard>

          {/* Repeat Late — KEY FEATURE: sorted by frequency */}
          <AlertCard
            title={`Frequent Late Arrivals`}
            subtitle="Punched after 9:45 AM multiple times"
            icon={Clock}
            iconColor="bg-indigo-50 text-indigo-600"
            borderColor="border-indigo-200"
            bgColor="bg-indigo-50/20"
            count={sortedLate.length}
          >
            {sortedLate.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No recurring late arrivals</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sortedLate.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="alert-row flex items-center justify-between px-2.5 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{emp.employee_name}</p>
                      <p className="text-[9px] text-slate-400">{emp.department}</p>
                    </div>
                    <FreqBadge count={emp.late_count} type="late" />
                  </div>
                ))}
              </div>
            )}
          </AlertCard>

        </div>
      )}
    </div>
  );
};

export default AttentionAlerts;
