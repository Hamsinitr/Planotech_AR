import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../api/client';
import StatusBadge from './StatusBadge';

export const EmployeeDetailModal = ({ employeeIdentifier, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeIdentifier) return;
    setLoading(true);
    api.get(`/employees/${encodeURIComponent(employeeIdentifier)}/history`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [employeeIdentifier]);

  if (!employeeIdentifier) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
              {data?.employee?.name ? data.employee.name.charAt(0) : 'E'}
            </div>
            <div>
              <h2 className="text-lg font-bold">{data?.employee?.name || 'Loading Employee...'}</h2>
              <p className="text-xs text-slate-300">{data?.employee?.employee_id} • {data?.employee?.department} • {data?.employee?.designation}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading performance data...</div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400">Employee record not found.</div>
          ) : (
            <>
              {/* Profile Details Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="font-semibold text-slate-700">{data.employee.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Joining Date</span>
                  <span className="font-semibold text-slate-700">{data.employee.joining_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Attendance Rate</span>
                  <span className="font-semibold text-emerald-600 text-sm">{data.stats.attendance_rate}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Avg Productivity</span>
                  <span className="font-semibold text-blue-600 text-sm">{data.stats.avg_productivity_score} / 100</span>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="text-xs text-emerald-700 block">Present Days</span>
                  <span className="text-xl font-bold text-emerald-800">{data.stats.present_days} / {data.stats.total_days_tracked}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-600 block">Absent Days</span>
                  <span className="text-xl font-bold text-slate-700">{data.stats.absent_days}</span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                  <span className="text-xs text-amber-700 block">Late Punch-Ins</span>
                  <span className="text-xl font-bold text-amber-800">{data.stats.late_days}</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-xs text-blue-700 block">Reports Submitted</span>
                  <span className="text-xl font-bold text-blue-800">{data.stats.reports_submitted}</span>
                </div>
              </div>

              {/* Productivity Timeline Chart */}
              {data.productivity_timeline && data.productivity_timeline.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Productivity Score Trend</h4>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.productivity_timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="productivity_score" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Productivity Score" />
                        <Line type="monotone" dataKey="submission_score" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" name="Submission" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Attendance & Reports Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attendance */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
                    Recent Attendance History
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Punch In</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recent_attendance?.map((a, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-medium">{a.date}</td>
                            <td className="p-2">{a.punch_in_time || '-'}</td>
                            <td className="p-2"><StatusBadge status={a.attendance_status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reports */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
                    Recent Reports & Quality
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Report Status</th>
                          <th className="p-2">Quality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recent_reports?.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-medium">{r.date}</td>
                            <td className="p-2"><StatusBadge status={r.report_status} /></td>
                            <td className="p-2"><StatusBadge status={r.quality_rating} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
