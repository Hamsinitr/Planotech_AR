import React, { useEffect, useState, useCallback } from 'react';
import { Search, Clock, Activity } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

function isMonthlyData(records) {
  if (!records || records.length === 0) return false;
  return new Set(records.map(r => r.date)).size > 1;
}

function aggregateByEmployee(records) {
  const map = {};
  for (const r of records) {
    const key = r.normalized_name || r.employee_name;
    if (!map[key]) {
      map[key] = {
        employee_name: r.employee_name,
        employee_id: r.employee_id,
        department: r.department,
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        on_time_days: 0,
        grace_days: 0,
        out_of_location_days: 0,
      };
    }
    const e = map[key];
    e.total_days++;
    if (r.attendance_status === 'Present') e.present_days++;
    else e.absent_days++;

    if (r.late_status === 'Late') e.late_days++;
    else if (r.late_status === 'On Time') e.on_time_days++;
    else if (r.late_status?.includes('Grace')) e.grace_days++;

    const ool = r.out_of_location ? String(r.out_of_location).trim().toLowerCase() : '';
    if (ool && !['no', '0', 'false', 'none', '', 'null', 'n/a'].includes(ool)) {
      e.out_of_location_days++;
    }
  }
  return Object.values(map).sort((a, b) => (b.late_days + b.out_of_location_days) - (a.late_days + a.out_of_location_days));
}

const MiniBar = ({ value, max, color }) => (
  <div className="flex items-center gap-2">
    <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden flex-shrink-0">
      <div
        className="h-full rounded-full"
        style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, background: color }}
      />
    </div>
    <span className="text-[11px] font-bold text-slate-700 w-4 text-right">{value}</span>
  </div>
);

const SummaryPanel = ({ title, subtitle, children }) => (
  <div className="chart-card overflow-hidden">
    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
      <div>
        <h3 className="text-xs font-bold text-white tracking-wide">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

export const Attendance = ({ selectedDate, onSelectEmployee }) => {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lateFilter, setLateFilter] = useState('All');
  const [sortBy, setSortBy] = useState('late_days');
  const [search, setSearch] = useState('');

  const fetchAttendance = useCallback(async () => {
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
  }, [selectedDate, deptFilter, statusFilter, lateFilter, search]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (!selectedDate) {
    return (
      <div className="empty-state p-12">
        <div className="empty-state-icon"><Activity className="w-7 h-7 text-slate-400" /></div>
        <h3 className="text-sm font-bold text-slate-700">Select a date to view attendance</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse-soft">
        <div className="shimmer h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="shimmer h-48 rounded-2xl" />
          <div className="shimmer h-48 rounded-2xl" />
        </div>
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  const isMonthly = isMonthlyData(details);
  const aggregated = isMonthly ? aggregateByEmployee(details) : null;
  const maxLate = aggregated ? Math.max(...aggregated.map(r => r.late_days), 1) : 1;
  const maxLoc  = aggregated ? Math.max(...aggregated.map(r => r.out_of_location_days), 1) : 1;

  const sortedAgg = aggregated ? [...aggregated].sort((a, b) => {
    if (sortBy === 'late_days')      return b.late_days - a.late_days;
    if (sortBy === 'out_of_location') return b.out_of_location_days - a.out_of_location_days;
    if (sortBy === 'absent_days')    return b.absent_days - a.absent_days;
    if (sortBy === 'name')           return a.employee_name.localeCompare(b.employee_name);
    return 0;
  }) : [];

  const depts = ['All', ...new Set(details.map(r => r.department).filter(Boolean))];

  return (
    <div className="p-5 space-y-5 animate-fade-up">

      {/* Header */}
      <div>
        <h2 className="page-title">Attendance Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">
          {isMonthly
            ? 'Monthly view — each employee shown once with cumulative late arrivals and location violations'
            : `Punch-in classification, department breakdowns, and reconciliation · ${selectedDate}`}
        </p>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryPanel
          title="Attendance by Time Bracket"
          subtitle="Before 9:30 AM · Grace 9:30–9:45 AM · Late after 9:45 AM"
        >
          <table className="w-full pro-table">
            <thead>
              <tr>
                <th>Department</th>
                <th className="text-right">Total</th>
                <th className="text-right">Before 9:30</th>
                <th className="text-right">Grace</th>
                <th className="text-right">Late</th>
                <th className="text-right">Absent</th>
              </tr>
            </thead>
            <tbody>
              {[...(summary?.summary_1 || []), summary?.summary_1_total && { ...summary.summary_1_total, department: 'Total', _isTotal: true }]
                .filter(Boolean)
                .map((row, i) => (
                  <tr key={i} className={row._isTotal ? 'bg-slate-50 font-bold border-t border-slate-200' : ''}>
                    <td className={`font-${row._isTotal ? 'bold' : 'medium'} text-slate-800`}>
                      {row._isTotal ? '─ Total ─' : row.department}
                    </td>
                    <td className="text-right text-slate-600">{row.total_individuals}</td>
                    <td className="text-right text-emerald-600 font-semibold">{row.before_930}</td>
                    <td className="text-right text-sky-600 font-semibold">{row.between_930_945}</td>
                    <td className={`text-right font-semibold ${row.after_945 > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                      {row.after_945}
                    </td>
                    <td className={`text-right ${row.not_punched_or_absent > 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                      {row.not_punched_or_absent}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </SummaryPanel>

        <SummaryPanel
          title="Attendance Status Summary"
          subtitle="Present · Absent / Not punched in · Late punch-in count"
        >
          <table className="w-full pro-table">
            <thead>
              <tr>
                <th>Department</th>
                <th className="text-right">Total</th>
                <th className="text-right">No Punch</th>
                <th className="text-right">Present</th>
                <th className="text-right">Late</th>
              </tr>
            </thead>
            <tbody>
              {[...(summary?.summary_2 || []), summary?.summary_2_total && { ...summary.summary_2_total, department: 'Total', _isTotal: true }]
                .filter(Boolean)
                .map((row, i) => (
                  <tr key={i} className={row._isTotal ? 'bg-slate-50 font-bold border-t border-slate-200' : ''}>
                    <td className={`font-${row._isTotal ? 'bold' : 'medium'} text-slate-800`}>
                      {row._isTotal ? '─ Total ─' : row.department}
                    </td>
                    <td className="text-right text-slate-600">{row.total_individuals}</td>
                    <td className={`text-right ${row.not_punched_in > 0 ? 'text-orange-500 font-semibold' : 'text-slate-300'}`}>
                      {row.not_punched_in}
                    </td>
                    <td className="text-right text-emerald-600 font-semibold">{row.present}</td>
                    <td className={`text-right ${row.late_punch_in > 0 ? 'text-amber-600 font-semibold' : 'text-slate-300'}`}>
                      {row.late_punch_in}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </SummaryPanel>
      </div>

      {/* Employee Detail Table */}
      <div className="chart-card overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isMonthly ? 'Monthly Frequency Summary' : 'Employee Attendance Records'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isMonthly
                ? `${sortedAgg?.length || 0} unique employees`
                : `${details.length} records for ${selectedDate}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or ID..."
                className="pro-input pl-8 w-44"
              />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="pro-input">
              {depts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
            {isMonthly ? (
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="pro-input">
                <option value="late_days">Sort: Most Late</option>
                <option value="out_of_location">Sort: Out of Location</option>
                <option value="absent_days">Sort: Most Absent</option>
                <option value="name">Sort: Name A–Z</option>
              </select>
            ) : (
              <>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pro-input">
                  {['All', 'Present', 'Absent'].map(s =>
                    <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                </select>
                <select value={lateFilter} onChange={e => setLateFilter(e.target.value)} className="pro-input">
                  {['All', 'On Time', 'Grace (9:30-9:45)', 'Late'].map(l =>
                    <option key={l} value={l}>{l === 'All' ? 'All Punctuality' : l}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Monthly Frequency Table */}
        {isMonthly && sortedAgg ? (
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th className="text-right">Present</th>
                  <th className="text-right">Absent</th>
                  <th className="text-right">On Time</th>
                  <th className="text-right">Grace</th>
                  <th>Late Arrivals</th>
                  <th>Out of Location</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgg
                  .filter(r => deptFilter === 'All' || r.department === deptFilter)
                  .filter(r => !search || r.employee_name.toLowerCase().includes(search.toLowerCase()))
                  .map((emp, i) => {
                    const lateRisk = emp.late_days >= 5 ? 'high' : emp.late_days >= 2 ? 'medium' : 'low';
                    const locRisk  = emp.out_of_location_days >= 3 ? 'high' : emp.out_of_location_days >= 1 ? 'medium' : 'low';
                    const risk = (lateRisk === 'high' || locRisk === 'high') ? 'high' : (lateRisk === 'medium' || locRisk === 'medium') ? 'medium' : 'low';
                    return (
                      <tr
                        key={i}
                        onClick={() => onSelectEmployee?.(emp.employee_name)}
                        className={`cursor-pointer ${risk === 'high' ? 'freq-row-high' : risk === 'medium' ? 'freq-row-medium' : ''}`}
                      >
                        <td className="font-mono text-slate-400 text-[11px]">{i + 1}</td>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800">{emp.employee_name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{emp.employee_id || '—'}</p>
                          </div>
                        </td>
                        <td className="text-slate-500">{emp.department}</td>
                        <td className="text-right text-emerald-600 font-semibold">{emp.present_days}</td>
                        <td className="text-right text-slate-400">{emp.absent_days}</td>
                        <td className="text-right text-emerald-600">{emp.on_time_days}</td>
                        <td className="text-right text-sky-600">{emp.grace_days}</td>
                        <td>
                          <MiniBar value={emp.late_days} max={maxLate}
                            color={lateRisk === 'high' ? '#ef4444' : lateRisk === 'medium' ? '#f59e0b' : '#94a3b8'} />
                        </td>
                        <td>
                          <MiniBar value={emp.out_of_location_days} max={maxLoc}
                            color={locRisk === 'high' ? '#e11d48' : locRisk === 'medium' ? '#f97316' : '#94a3b8'} />
                        </td>
                        <td>
                          <span className={`freq-badge ${risk === 'high' ? 'freq-badge-red' : risk === 'medium' ? 'freq-badge-amber' : 'freq-badge-blue'}`}>
                            {risk === 'high' ? 'High' : risk === 'medium' ? 'Med' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Daily View */
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th className="text-center">Date</th>
                  <th className="text-center">Punch In</th>
                  <th className="text-center">Punch Out</th>
                  <th>Status</th>
                  <th>Punctuality</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-16 text-slate-400">
                      <div className="empty-state">
                        <div className="empty-state-icon mx-auto">
                          <Clock className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No attendance records found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting the filters or select a different date.</p>
                      </div>
                    </td>
                  </tr>
                ) : details.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => onSelectEmployee?.(row.employee_name)}
                    className="cursor-pointer"
                  >
                    <td className="font-semibold text-slate-800">{row.employee_name}</td>
                    <td className="font-mono text-slate-400 text-[11px]">{row.employee_id || '—'}</td>
                    <td className="text-slate-500">{row.department}</td>
                    <td className="text-center font-mono text-slate-400 text-[11px]">{row.date}</td>
                    <td className="text-center font-semibold text-slate-700">{row.punch_in_time || '—'}</td>
                    <td className="text-center text-slate-400">{row.punch_out_time || '—'}</td>
                    <td><StatusBadge status={row.attendance_status} /></td>
                    <td><StatusBadge status={row.late_status} /></td>
                    <td>
                      {row.out_of_location
                        ? <StatusBadge status={
                            ['yes','1','true','out of location','location violation'].includes(
                              String(row.out_of_location).toLowerCase()
                            ) ? 'Out of Location' : 'In Location'
                          } />
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
