import React, { useEffect, useState } from 'react';
import { Search, FileText, CheckCircle, AlertCircle, Award } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

export const Reports = ({ selectedDate, onSelectEmployee }) => {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [qualityFilter, setQualityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const [sumRes, detRes] = await Promise.all([
        api.get(`/reports/summary?date=${selectedDate}`),
        api.get(`/reports/details?date=${selectedDate}&department=${deptFilter}&status=${statusFilter}&quality=${qualityFilter}&search=${search}`)
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
    fetchReports();
  }, [selectedDate, deptFilter, statusFilter, qualityFilter, search]);

  const departments = ['All', 'IT', 'HR', 'Marketing', 'Operations'];
  const statuses = ['All', 'Submitted', 'Not Submitted', 'Absent'];
  const qualities = ['All', 'Excellent', 'Good', 'Average', 'Poor'];

  return (
    <div className="p-6 space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Report Submission & Quality Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">
          Department-level submission compliance, quality scoring, and employee report evaluations for {selectedDate}.
        </p>
      </div>

      {/* Tables 1 & 2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Report Submission Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Department Report Submission</h3>
              <p className="text-[11px] text-slate-300">Submitted • Not Submitted • Absent Reconciliation</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Total Individuals</th>
                  <th className="px-4 py-3 text-right">Reports Submitted</th>
                  <th className="px-4 py-3 text-right">Not Submitted</th>
                  <th className="px-4 py-3 text-right">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.summary?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{row.department}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{row.total_individuals}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{row.reports_submitted}</td>
                    <td className="px-4 py-2.5 text-right text-rose-600 font-medium">{row.reports_not_submitted}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 font-medium">{row.absent}</td>
                  </tr>
                ))}
              </tbody>
              {summary?.summary_total && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{summary.summary_total.total_individuals}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{summary.summary_total.reports_submitted}</td>
                    <td className="px-4 py-3 text-right text-rose-700">{summary.summary_total.reports_not_submitted}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{summary.summary_total.absent}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Department Report Quality Analysis Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Report Quality Analysis</h3>
              <p className="text-[11px] text-slate-300">Excellent • Good • Average • Poor</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Quality
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3 text-right">Reports</th>
                  <th className="px-3 py-3 text-right">Excellent</th>
                  <th className="px-3 py-3 text-right">Good</th>
                  <th className="px-3 py-3 text-right">Average</th>
                  <th className="px-3 py-3 text-right">Poor</th>
                  <th className="px-3 py-3 text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.quality_summary?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{row.department}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{row.total_reports}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">{row.excellent}</td>
                    <td className="px-3 py-2.5 text-right text-sky-600 font-medium">{row.good}</td>
                    <td className="px-3 py-2.5 text-right text-amber-600 font-medium">{row.average}</td>
                    <td className="px-3 py-2.5 text-right text-rose-600 font-medium">{row.poor}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-purple-700">{row.avg_quality_score}%</td>
                  </tr>
                ))}
              </tbody>
              {summary?.quality_total && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="px-3 py-3">Total</td>
                    <td className="px-3 py-3 text-right">{summary.quality_total.total_reports}</td>
                    <td className="px-3 py-3 text-right text-emerald-700">{summary.quality_total.excellent}</td>
                    <td className="px-3 py-3 text-right text-sky-700">{summary.quality_total.good}</td>
                    <td className="px-3 py-3 text-right text-amber-700">{summary.quality_total.average}</td>
                    <td className="px-3 py-3 text-right text-rose-700">{summary.quality_total.poor}</td>
                    <td className="px-3 py-3 text-right text-purple-800 font-bold">{summary.quality_total.avg_quality_score}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Employee Report Status Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Employee Report Status</h3>
            <p className="text-xs text-slate-500">
              Individual submission status with strict absent invariant (Absent employees are marked as Absent, never as Not Submitted)
            </p>
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

            {/* Report Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>Report: {s}</option>
              ))}
            </select>

            {/* Quality */}
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              {qualities.map((q) => (
                <option key={q} value={q}>Quality: {q}</option>
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
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3">Report Status</th>
                <th className="px-5 py-3">Report Quality</th>
                <th className="px-5 py-3">Quality Score</th>
                <th className="px-5 py-3">Task Summary / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    No report records found matching the filters.
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
                    <td className="px-5 py-3">
                      <StatusBadge status={row.attendance_status} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.report_status} />
                      {row.accidental_submission && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                          Accidental
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.quality_rating} />
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-700">
                      {row.report_status === 'Submitted' ? `${row.quality_score}%` : '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                      {row.notes || '-'}
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

export default Reports;
