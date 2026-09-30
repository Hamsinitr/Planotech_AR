import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, FileX, UserX } from 'lucide-react';

export const AttentionAlerts = ({ attentionData, onSelectEmployee }) => {
  const [expanded, setExpanded] = useState(true);

  if (!attentionData) return null;

  const {
    absent_today = [],
    unsubmitted_today = [],
    repeated_unsubmitted = [],
    repeated_late = [],
  } = attentionData;

  const totalIssues = absent_today.length + unsubmitted_today.length + repeated_unsubmitted.length + repeated_late.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div
        className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Operational Alerts & Attention Required</h3>
            <p className="text-xs text-slate-500">Real-time alerts for absences, unsubmitted reports, and repeated patterns</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {totalIssues > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
              {totalIssues} Alerts
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Absent Today */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center space-x-2 text-slate-700 mb-2">
              <UserX className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Absent Today ({absent_today.length})</h4>
            </div>
            <p className="text-[11px] text-slate-500 mb-2 italic">Classified as Absent (Not penalised as unsubmitted)</p>
            {absent_today.length === 0 ? (
              <p className="text-xs text-slate-400">No employees absent today.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {absent_today.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="text-xs p-1.5 rounded bg-white border border-slate-200 hover:border-blue-400 cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-700 truncate">{emp.employee_name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{emp.department}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Unsubmitted Today */}
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/30">
            <div className="flex items-center space-x-2 text-rose-800 mb-2">
              <FileX className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Present, No Report ({unsubmitted_today.length})</h4>
            </div>
            <p className="text-[11px] text-rose-600 mb-2">Employees present today who have not submitted</p>
            {unsubmitted_today.length === 0 ? (
              <p className="text-xs text-slate-400">All present employees submitted reports.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {unsubmitted_today.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="text-xs p-1.5 rounded bg-white border border-rose-200 hover:border-rose-400 cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-medium text-rose-900 truncate">{emp.employee_name}</span>
                    <span className="text-[10px] text-rose-500 ml-1">{emp.department}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Repeated Non-Submission */}
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/30">
            <div className="flex items-center space-x-2 text-amber-800 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Repeated Non-Submission ({repeated_unsubmitted.length})</h4>
            </div>
            <p className="text-[11px] text-amber-600 mb-2">Failed submission &ge; 2 times while present</p>
            {repeated_unsubmitted.length === 0 ? (
              <p className="text-xs text-slate-400">No repeated non-submissions detected.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {repeated_unsubmitted.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="text-xs p-1.5 rounded bg-white border border-amber-200 hover:border-amber-400 cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-800 truncate">{emp.employee_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {emp.unsubmitted_count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Repeated Late Punch-Ins */}
          <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/30">
            <div className="flex items-center space-x-2 text-indigo-800 mb-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Repeated Late Punch-Ins ({repeated_late.length})</h4>
            </div>
            <p className="text-[11px] text-indigo-600 mb-2">Punched in &gt; 9:45 AM on &ge; 2 dates</p>
            {repeated_late.length === 0 ? (
              <p className="text-xs text-slate-400">No recurring late arrivals.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {repeated_late.map((emp, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                    className="text-xs p-1.5 rounded bg-white border border-indigo-200 hover:border-indigo-400 cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-800 truncate">{emp.employee_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {emp.late_count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttentionAlerts;
