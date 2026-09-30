import React, { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, AlertCircle, Clock, FileSpreadsheet } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

export const Attendance = ({ selectedDate, onSelectEmployee }) => {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lateFilter, setLateFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchAttendance = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const [sumRes, detRes] = await Promise.all([
        api.get(`/attendance/summary?date=${selectedDate}`),
        api.get(`/attendance/details?date=${selectedDate}&department=${deptFilter}&status=${statusFilter}&late_status=${lateFilter}&search=${search}`)
      ]);
      setSummary(sumRes.data);
      setDetails(detRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, deptFilter, statusFilter, lateFilter, search]);

  const departments = ['All', 'IT', 'HR', 'Marketing', 'Operations'];
  const statuses = ['All', 'Present', 'Absent'];
  const lateStatuses = ['All', 'On Time', 'Grace (9:30-9:45)', 'Late'];

  return (
    <div className="p-6 space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Attendance Analysis & Summaries</h2>
        <p className="text-xs text-slate-500 mt-1">
          Complete punch-in classification, department breakdowns, and automated mathematical reconciliation for {selectedDate}.
        </p>
      </div>

      {/* Summary Table 1 & Table 2 in Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Attendance Department Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Attendance Department Summary (Time Brackets)</h3>
              <p className="text-[11px] text-slate-300">Before 9:30 AM • 9:30–9:45 AM • After 9:45 AM</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Summary 1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Total Individuals</th>
                  <th className="px-4 py-3 text-right">Before 9:30 AM</th>
                  <th className="px-4 py-3 text-right">9:30 AM–9:45 AM</th>
                  <th className="px-4 py-3 text-right">After 9:45 AM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.summary_1?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{row.department}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.total_individuals}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{row.before_930}</td>
                    <td className="px-4 py-2.5 text-right text-sky-600 font-medium">{row.between_930_945}</td>
                    <td className="px-4 py-2.5 text-right text-amber-600 font-medium">{row.after_945}</td>
                  </tr>
                ))}
              </tbody>
              {summary?.summary_1_total && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{summary.summary_1_total.total_individuals}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{summary.summary_1_total.before_930}</td>
                    <td className="px-4 py-3 text-right text-sky-700">{summary.summary_1_total.between_930_945}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{summary.summary_1_total.after_945}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Table 2: Second Attendance Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Attendance Status Summary</h3>
              <p className="text-[11px] text-slate-300">Not Punched In • Present • Late Punch-In</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Summary 2
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Total Individuals</th>
                  <th className="px-4 py-3 text-right">Not Punched In</th>
                  <th className="px-4 py-3 text-right">Present</th>
                  <th className="px-4 py-3 text-right">Late Punch-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.summary_2?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{row.department}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.total_individuals}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 font-medium">{row.not_punched_in}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{row.present}</td>
                    <td className="px-4 py-2.5 text-right text-amber-600 font-medium">{row.late_punch_in}</td>
                  </tr>
                ))}
              </tbody>
              {summary?.summary_2_total && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{summary.summary_2_total.total_individuals}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{summary.summary_2_total.not_punched_in}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{summary.summary_2_total.present}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{summary.summary_2_total.late_punch_in}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Employee Attendance Details Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Employee Attendance Details</h3>
            <p className="text-xs text-slate-500">Individual punch-in, punch-out, and punctuality records</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or ID..."
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            {/* Department */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>Dept: {d}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>Status: {s}</option>
              ))}
            </select>

            {/* Late Status */}
            <select
              value={lateFilter}
              onChange={(e) => setLateFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              {lateStatuses.map((l) => (
                <option key={l} value={l}>Punctuality: {l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-5 py-3">Employee ID</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Punch In</th>
                <th className="px-5 py-3">Punch Out</th>
                <th className="px-5 py-3">Attendance Status</th>
                <th className="px-5 py-3">Late Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    No attendance records found matching the filters.
                  </td>
                </tr>
              ) : (
                details.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onSelectEmployee && onSelectEmployee(row.employee_name)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800">{row.employee_name}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono">{row.employee_id || '-'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.department}</td>
                    <td className="px-5 py-3 text-slate-500">{row.date}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{row.punch_in_time || '-'}</td>
                    <td className="px-5 py-3 text-slate-500">{row.punch_out_time || '-'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.attendance_status} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.late_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
