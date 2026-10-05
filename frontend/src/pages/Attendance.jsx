import React, { useEffect, useState } from 'react';
import { Search, Clock, Users, CheckCircle, XCircle, AlertTriangle, MapPin, ArrowUpDown, Filter } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

// ─── Smart detection: are multiple dates loaded? (monthly data)
function isMonthlyData(records) {
  if (!records || records.length === 0) return false;
  const uniqueDates = new Set(records.map(r => r.date));
  return uniqueDates.size > 1;
}

// ─── Aggregate multiple rows per employee into a single frequency row
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
        dates_late: [],
        dates_out_of_location: [],
      };
    }
    map[key].total_days++;
    if (r.attendance_status === 'Present') map[key].present_days++;
    else map[key].absent_days++;

    if (r.late_status === 'Late') {
      map[key].late_days++;
      map[key].dates_late.push(r.date);
    } else if (r.late_status === 'On Time') {
      map[key].on_time_days++;
    } else if (r.late_status?.includes('Grace')) {
      map[key].grace_days++;
    }

    // Check Out of Location
    const ool = r.out_of_location ? String(r.out_of_location).trim().toLowerCase() : '';
    if (ool && !['no', '0', 'false', 'none', '', 'null'].includes(ool)) {
      map[key].out_of_location_days++;
      map[key].dates_out_of_location.push(r.date);
    }
  }
  return Object.values(map).sort((a, b) => (b.late_days + b.out_of_location_days) - (a.late_days + a.out_of_location_days));
}

const FreqBar = ({ value, max, color }) => (
  <div className="flex items-center gap-2">
    <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, background: color }}
      />
    </div>
    <span className="text-[11px] font-bold text-slate-700">{value}</span>
  </div>
);

const SummaryTable = ({ title, subtitle, data, columns }) => (
  <div className="chart-card overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #080c1a, #162038)' }}>
      <div>
        <h3 className="text-xs font-bold text-white tracking-wide">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full pro-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={c.right ? 'text-right' : ''}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
              {columns.map(c => (
                <td key={c.key} className={c.right ? 'text-right' : ''}>
                  {c.render ? c.render(row[c.key], row) : (
                    <span className={c.colorFn ? c.colorFn(row[c.key]) : ''}>{row[c.key]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const Attendance = ({ selectedDate, onSelectEmployee }) => {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lateFilter, setLateFilter] = useState('All');
  const [sortBy, setSortBy] = useState('late_days'); // 'late_days' | 'out_of_location' | 'absent_days' | 'name'
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

  useEffect(() => { fetchAttendance(); }, [selectedDate, deptFilter, statusFilter, lateFilter, search]);

  const isMonthly = isMonthlyData(details);
  const aggregated = isMonthly ? aggregateByEmployee(details) : null;
  const maxLate = aggregated ? Math.max(...aggregated.map(r => r.late_days), 1) : 1;
  const maxLocation = aggregated ? Math.max(...aggregated.map(r => r.out_of_location_days), 1) : 1;

  // Sort aggregated data
  const sortedAggregated = aggregated ? [...aggregated].sort((a, b) => {
    if (sortBy === 'late_days') return b.late_days - a.late_days;
    if (sortBy === 'out_of_location') return b.out_of_location_days - a.out_of_location_days;
    if (sortBy === 'absent_days') return b.absent_days - a.absent_days;
    if (sortBy === 'name') return a.employee_name.localeCompare(b.employee_name);
    return 0;
  }) : [];

  const depts = ['All', ...new Set(details.map(r => r.department).filter(Boolean))];
  const statuses = ['All', 'Present', 'Absent'];
  const lateStatuses = ['All', 'On Time', 'Grace (9:30-9:45)', 'Late'];

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Attendance Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">
          {isMonthly
            ? 'Monthly frequency view — each employee listed once with recurring late punch-ins and location violations'
            : `Punch-in classification, department breakdowns, and reconciliation for ${selectedDate}`}
        </p>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table 1: Time Brackets */}
        <SummaryTable
          title="Attendance by Time Bracket"
          subtitle="Before 9:30 · Grace 9:30–9:45 · Late after 9:45"
          data={[...(summary?.summary_1 || []), summary?.summary_1_total && { ...summary.summary_1_total, department: '─ Total ─' }].filter(Boolean)}
          columns={[
            { key: 'department', label: 'Department' },
            { key: 'total_individuals', label: 'Total', right: true },
            { key: 'before_930', label: 'Before 9:30', right: true, colorFn: () => 'text-emerald-600 font-semibold' },
            { key: 'between_930_945', label: 'Grace', right: true, colorFn: () => 'text-sky-600 font-semibold' },
            { key: 'after_945', label: 'Late', right: true, colorFn: (v) => v > 0 ? 'text-amber-600 font-bold' : 'text-slate-400' },
          ]}
        />

        {/* Table 2: Presence Summary */}
        <SummaryTable
          title="Attendance Status Summary"
          subtitle="Not punched in · Present · Late punch-in count"
          data={[...(summary?.summary_2 || []), summary?.summary_2_total && { ...summary.summary_2_total, department: '─ Total ─' }].filter(Boolean)}
          columns={[
            { key: 'department', label: 'Department' },
            { key: 'total_individuals', label: 'Total', right: true },
            { key: 'not_punched_in', label: 'No Punch', right: true, colorFn: (v) => v > 0 ? 'text-orange-500 font-semibold' : 'text-slate-400' },
            { key: 'present', label: 'Present', right: true, colorFn: () => 'text-emerald-600 font-semibold' },
            { key: 'late_punch_in', label: 'Late', right: true, colorFn: (v) => v > 0 ? 'text-amber-600 font-bold' : 'text-slate-400' },
          ]}
        />
      </div>

      {/* Employee Detail Section */}
      <div className="chart-card overflow-hidden">
        {/* Header + Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isMonthly ? 'Monthly Frequency Summary (Per Employee)' : 'Employee Attendance Records'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isMonthly
                ? `${aggregated?.length || 0} unique employees · aggregated without redundant daily repetitions`
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
                placeholder="Search name or ID..."
                className="pro-input pl-8 text-xs w-44"
              />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="pro-input text-xs">
              {depts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
            {isMonthly ? (
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="pro-input text-xs">
                <option value="late_days">Sort by: Most Late</option>
                <option value="out_of_location">Sort by: Out of Location</option>
                <option value="absent_days">Sort by: Most Absent</option>
                <option value="name">Sort by: Name (A-Z)</option>
              </select>
            ) : (
              <>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pro-input text-xs">
                  {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                </select>
                <select value={lateFilter} onChange={(e) => setLateFilter(e.target.value)} className="pro-input text-xs">
                  {lateStatuses.map(l => <option key={l} value={l}>{l === 'All' ? 'All Punctuality' : l}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        {/* ─── MONTHLY VIEW: Frequency Table ─── */}
        {isMonthly && aggregated ? (
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th className="text-right">Days Present</th>
                  <th className="text-right">Days Absent</th>
                  <th className="text-right">On Time</th>
                  <th className="text-right">Grace</th>
                  <th>Late Arrivals</th>
                  <th>Out of Location</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {sortedAggregated
                  .filter(r => deptFilter === 'All' || r.department === deptFilter)
                  .filter(r => !search || r.employee_name.toLowerCase().includes(search.toLowerCase()))
                  .map((emp, i) => {
                    const lateRisk = emp.late_days >= 5 ? 'high' : emp.late_days >= 2 ? 'medium' : 'low';
                    const locRisk = emp.out_of_location_days >= 5 ? 'high' : emp.out_of_location_days >= 2 ? 'medium' : 'low';
                    const overallRisk = (lateRisk === 'high' || locRisk === 'high') ? 'high' : (lateRisk === 'medium' || locRisk === 'medium') ? 'medium' : 'low';

                    return (
                      <tr
                        key={i}
                        onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_name)}
                        className={`cursor-pointer ${overallRisk === 'high' ? 'freq-row-high' : overallRisk === 'medium' ? 'freq-row-medium' : ''}`}
                      >
                        <td className="font-mono text-slate-400">{i + 1}</td>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800">{emp.employee_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.employee_id || '—'}</p>
                          </div>
                        </td>
                        <td className="text-slate-500">{emp.department}</td>
                        <td className="text-right text-emerald-600 font-semibold">{emp.present_days}</td>
                        <td className="text-right text-slate-400">{emp.absent_days}</td>
                        <td className="text-right text-sky-600 font-semibold">{emp.on_time_days}</td>
                        <td className="text-right text-indigo-500">{emp.grace_days}</td>
                        <td>
                          <FreqBar value={emp.late_days} max={maxLate} color={lateRisk === 'high' ? '#ef4444' : lateRisk === 'medium' ? '#f59e0b' : '#94a3b8'} />
                        </td>
                        <td>
                          <FreqBar value={emp.out_of_location_days} max={maxLocation} color={locRisk === 'high' ? '#e11d48' : locRisk === 'medium' ? '#f43f5e' : '#94a3b8'} />
                        </td>
                        <td>
                          {overallRisk === 'high' && (
                            <span className="freq-badge freq-badge-red">High Risk</span>
                          )}
                          {overallRisk === 'medium' && (
                            <span className="freq-badge freq-badge-amber">Medium</span>
                          )}
                          {overallRisk === 'low' && (
                            <span className="freq-badge freq-badge-blue">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── DAILY VIEW: Individual Records ─── */
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Attendance</th>
                  <th>Punctuality</th>
                  <th>Location Status</th>
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-400">
                      No attendance records found for the selected filters.
                    </td>
                  </tr>
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
                      <td className="text-slate-400 font-mono text-[11px]">{row.date}</td>
                      <td className="font-semibold text-slate-700">{row.punch_in_time || '—'}</td>
                      <td className="text-slate-400">{row.punch_out_time || '—'}</td>
                      <td><StatusBadge status={row.attendance_status} /></td>
                      <td><StatusBadge status={row.late_status} /></td>
                      <td>
                        {row.out_of_location ? (
                          <StatusBadge status={['yes', '1', 'true', 'out of location', 'location violation'].includes(String(row.out_of_location).toLowerCase()) ? 'Out of Location' : 'In Location'} />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
