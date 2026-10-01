import React, { useEffect, useState } from 'react';
import { Search, FileText, CheckCircle, TrendingDown } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

function isMonthlyData(records) {
  if (!records || records.length === 0) return false;
  const uniqueDates = new Set(records.map(r => r.date));
  return uniqueDates.size > 1;
}

function aggregateReportsByEmployee(records) {
  const map = {};
  for (const r of records) {
    const key = r.normalized_name || r.employee_name;
    if (!map[key]) {
      map[key] = {
        employee_name: r.employee_name,
        employee_id: r.employee_id,
        department: r.department,
        total_days: 0,
        submitted_count: 0,
        not_submitted_count: 0,
        absent_count: 0,
        quality_scores: [],
        quality_ratings: { Excellent: 0, Good: 0, Average: 0, Poor: 0 },
      };
    }
    const e = map[key];
    e.total_days++;
    if (r.report_status === 'Submitted') {
      e.submitted_count++;
      if (r.quality_score > 0) e.quality_scores.push(r.quality_score);
      if (r.quality_rating && e.quality_ratings[r.quality_rating] !== undefined) {
        e.quality_ratings[r.quality_rating]++;
      }
    } else if (r.report_status === 'Absent') {
      e.absent_count++;
    } else {
      e.not_submitted_count++;
    }
  }
  return Object.values(map)
    .map(e => ({
      ...e,
      submission_rate: e.total_days > 0 ? Math.round((e.submitted_count / (e.total_days - e.absent_count || 1)) * 100) : 0,
      avg_quality: e.quality_scores.length > 0
        ? Math.round(e.quality_scores.reduce((a, b) => a + b, 0) / e.quality_scores.length)
        : 0,
    }))
    .sort((a, b) => b.not_submitted_count - a.not_submitted_count);
}

const ScoreBar = ({ value, color }) => (
  <div className="flex items-center gap-2">
    <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
    <span className="text-[11px] font-bold text-slate-600">{value}%</span>
  </div>
);

export const Reports = ({ selectedDate, onSelectEmployee }) => {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchReports(); }, [selectedDate, deptFilter, statusFilter, qualityFilter, search]);

  const isMonthly = isMonthlyData(details);
  const aggregated = isMonthly ? aggregateReportsByEmployee(details) : null;

  const depts = ['All', ...new Set(details.map(r => r.department).filter(Boolean))];
  const statuses = ['All', 'Submitted', 'Not Submitted', 'Absent'];
  const qualities = ['All', 'Excellent', 'Good', 'Average', 'Poor'];

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Report Submission & Quality</h2>
        <p className="text-xs text-slate-500 mt-1">
          {isMonthly
            ? 'Monthly view — each employee shown once with total submission counts and average quality'
            : `Department submission compliance, quality scoring, and evaluations for ${selectedDate}`}
        </p>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table 1: Submission */}
        <div className="chart-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #080c1a, #162038)' }}>
            <h3 className="text-xs font-bold text-white tracking-wide">Department Report Submission</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Submitted · Not Submitted · Absent</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Submitted</th>
                  <th className="text-right">Pending</th>
                  <th className="text-right">Absent</th>
                </tr>
              </thead>
              <tbody>
                {[...(summary?.summary || []), summary?.summary_total && { ...summary.summary_total, department: '─ Total ─' }].filter(Boolean).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="font-semibold text-slate-800">{row.department}</td>
                    <td className="text-right font-medium">{row.total_individuals}</td>
                    <td className="text-right text-emerald-600 font-semibold">{row.reports_submitted}</td>
                    <td className="text-right font-semibold" style={{ color: row.reports_not_submitted > 0 ? '#f43f5e' : '#94a3b8' }}>{row.reports_not_submitted}</td>
                    <td className="text-right text-slate-400">{row.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Quality */}
        <div className="chart-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #080c1a, #162038)' }}>
            <h3 className="text-xs font-bold text-white tracking-wide">Department Report Quality</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Excellent · Good · Average · Poor · Avg Score</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="text-right">Reports</th>
                  <th className="text-right">Excellent</th>
                  <th className="text-right">Good</th>
                  <th className="text-right">Avg</th>
                  <th className="text-right">Poor</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {[...(summary?.quality_summary || []), summary?.quality_total && { ...summary.quality_total, department: '─ Total ─' }].filter(Boolean).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="font-semibold text-slate-800">{row.department}</td>
                    <td className="text-right text-slate-500">{row.total_reports}</td>
                    <td className="text-right text-emerald-600 font-semibold">{row.excellent}</td>
                    <td className="text-right text-blue-600 font-semibold">{row.good}</td>
                    <td className="text-right text-amber-600">{row.average}</td>
                    <td className="text-right text-rose-500">{row.poor}</td>
                    <td className="text-right font-bold text-violet-700">{row.avg_quality_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Employee Details */}
      <div className="chart-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isMonthly ? 'Monthly Report Summary (Per Employee)' : 'Employee Report Status'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isMonthly
                ? `${aggregated?.length || 0} unique employees · sorted by most non-submissions`
                : `${details.length} records for ${selectedDate}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name..."
                className="pro-input pl-8 text-xs w-44"
              />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="pro-input text-xs">
              {depts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
            {!isMonthly && (
              <>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pro-input text-xs">
                  {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                </select>
                <select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value)} className="pro-input text-xs">
                  {qualities.map(q => <option key={q} value={q}>{q === 'All' ? 'All Quality' : q}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* ─── MONTHLY ─── */}
          {isMonthly && aggregated ? (
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th className="text-right">Submitted</th>
                  <th className="text-right">Missed</th>
                  <th className="text-right">Absent</th>
                  <th>Submission Rate</th>
                  <th>Avg Quality</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {aggregated
                  .filter(r => deptFilter === 'All' || r.department === deptFilter)
                  .filter(r => !search || r.employee_name.toLowerCase().includes(search.toLowerCase()))
                  .map((emp, i) => {
                    const risk = emp.not_submitted_count >= 5 ? 'high' : emp.not_submitted_count >= 2 ? 'medium' : 'low';
                    return (
                      <tr
                        key={i}
                        onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                        className={`cursor-pointer ${risk === 'high' ? 'freq-row-high' : risk === 'medium' ? 'freq-row-medium' : ''}`}
                      >
                        <td className="font-mono text-slate-400">{i + 1}</td>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800">{emp.employee_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.employee_id || '—'}</p>
                          </div>
                        </td>
                        <td className="text-slate-500">{emp.department}</td>
                        <td className="text-right text-emerald-600 font-semibold">{emp.submitted_count}</td>
                        <td className="text-right font-bold" style={{ color: emp.not_submitted_count > 0 ? '#f43f5e' : '#94a3b8' }}>
                          {emp.not_submitted_count}
                        </td>
                        <td className="text-right text-slate-400">{emp.absent_count}</td>
                        <td>
                          <ScoreBar
                            value={emp.submission_rate}
                            color={emp.submission_rate >= 80 ? '#10b981' : emp.submission_rate >= 50 ? '#f59e0b' : '#f43f5e'}
                          />
                        </td>
                        <td>
                          <ScoreBar value={emp.avg_quality} color="#8b5cf6" />
                        </td>
                        <td>
                          <span className={`freq-badge ${risk === 'high' ? 'freq-badge-red' : risk === 'medium' ? 'freq-badge-amber' : 'freq-badge-blue'}`}>
                            {risk === 'high' ? 'High' : risk === 'medium' ? 'Med' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            /* ─── DAILY ─── */
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Attendance</th>
                  <th>Report Status</th>
                  <th>Quality</th>
                  <th className="text-right">Score</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-12 text-slate-400">No report records found.</td></tr>
                ) : (
                  details.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => onSelectEmployee && onSelectEmployee(row.employee_name)}
                      className="cursor-pointer"
                    >
                      <td className="font-semibold text-slate-800">{row.employee_name}</td>
                      <td className="font-mono text-slate-400 text-[11px]">{row.employee_id || '—'}</td>
                      <td className="text-slate-500">{row.department}</td>
                      <td><StatusBadge status={row.attendance_status} /></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={row.report_status} />
                          {row.accidental_submission && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                              Accidental
                            </span>
                          )}
                        </div>
                      </td>
                      <td><StatusBadge status={row.quality_rating} /></td>
                      <td className="text-right font-bold text-violet-700">
                        {row.report_status === 'Submitted' ? `${row.quality_score}%` : '—'}
                      </td>
                      <td className="text-slate-500 max-w-[180px] truncate text-[11px]">{row.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
