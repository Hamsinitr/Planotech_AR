import React, { useEffect, useState } from 'react';
import { X, User, MapPin, Clock, Award, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-fade-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #080c1a, #162038)' }}>
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              {data?.employee?.name ? data.employee.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">{data?.employee?.name || 'Loading Employee...'}</h2>
                {data?.employee?.employee_id && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-amber-400">
                    {data.employee.employee_id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {data?.employee?.department} • {data?.employee?.designation} • {data?.employee?.status || 'Active'}
              </p>
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading performance data...</div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400">Employee record not found.</div>
          ) : (
            <>
              {/* Profile Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="font-semibold text-slate-700 truncate block">{data.employee.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Joining Date</span>
                  <span className="font-semibold text-slate-700">{data.employee.joining_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Attendance Rate</span>
                  <span className="font-bold text-emerald-600 text-sm">{data.stats.attendance_rate}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Avg Productivity</span>
                  <span className="font-bold text-amber-600 text-sm">{data.stats.avg_productivity_score} / 100</span>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block font-medium">Present Days</span>
                  <span className="text-lg font-bold text-emerald-800">{data.stats.present_days} / {data.stats.total_days_tracked}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-600 block font-medium">Absent Days</span>
                  <span className="text-lg font-bold text-slate-700">{data.stats.absent_days}</span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[11px] text-amber-700 block font-medium">Late Punch-Ins</span>
                  <span className="text-lg font-bold text-amber-800">{data.stats.late_days}</span>
                </div>
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                  <span className="text-[11px] text-rose-700 block font-medium">Out of Location</span>
                  <span className="text-lg font-bold text-rose-800">{data.stats.out_of_location_days || 0}</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-700 block font-medium">Reports Filed</span>
                  <span className="text-lg font-bold text-blue-800">{data.stats.reports_submitted}</span>
                </div>
              </div>

              {/* Productivity Timeline Chart */}
              {data.productivity_timeline && data.productivity_timeline.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Productivity Score Trend</h4>
                    <span className="text-[11px] text-slate-400">Past {data.productivity_timeline.length} records</span>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.productivity_timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                        <Line type="monotone" dataKey="productivity_score" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} name="Productivity" />
                        <Line type="monotone" dataKey="submission_score" stroke="#059669" strokeWidth={1.5} strokeDasharray="3 3" name="Submission" />
                        <Line type="monotone" dataKey="quality_score" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="2 2" name="Quality" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Attendance & Reports Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attendance */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700 flex items-center justify-between">
                    <span>Recent Attendance History</span>
                    <span className="text-[10px] text-slate-400 font-normal">Last 15 records</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/75 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Punch In</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recent_attendance?.map((a, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-600 text-[11px]">{a.date}</td>
                            <td className="p-2 font-semibold text-slate-700">{a.punch_in_time || '—'}</td>
                            <td className="p-2"><StatusBadge status={a.attendance_status} /></td>
                            <td className="p-2">
                              {a.out_of_location ? (
                                <StatusBadge status={['yes', '1', 'true', 'out of location', 'location violation'].includes(String(a.out_of_location).toLowerCase()) ? 'Out of Location' : 'In Location'} />
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reports */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700 flex items-center justify-between">
                    <span>Recent Reports & Quality</span>
                    <span className="text-[10px] text-slate-400 font-normal">Last 15 records</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/75 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Report Status</th>
                          <th className="p-2">Quality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recent_reports?.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-600 text-[11px]">{r.date}</td>
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
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
