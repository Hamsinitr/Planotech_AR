import React, { useEffect, useState, useCallback } from 'react';
import { Search, Users, Building2 } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

const DEPT_COLORS = {
  'Information Technology': '#3b82f6',
  'Human Resources':        '#8b5cf6',
  'Finance & Accounts':     '#10b981',
  'Operations':             '#f59e0b',
  'Marketing':              '#f43f5e',
  'Sales & Marketing':      '#ef4444',
  'Administration':         '#06b6d4',
  'Design':                 '#a855f7',
  'Production':             '#84cc16',
  'Operations Support':     '#f97316',
};

const getColor = (dept) => DEPT_COLORS[dept] || '#6366f1';
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

export const Employees = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees?department=${deptFilter}&search=${search}`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [deptFilter, search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))].sort();

  const deptCounts = employees.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-5 space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Click any employee to view their performance profile, attendance history, and productivity trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-blue-800">{employees.length} Employees</span>
          </div>
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(deptCounts).map(([dept, count]) => (
          <button
            key={dept}
            onClick={() => setDeptFilter(dept === deptFilter ? 'All' : dept)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
              deptFilter === dept
                ? 'text-white border-transparent'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
            style={deptFilter === dept ? { background: getColor(dept), borderColor: getColor(dept) } : {}}
          >
            <span>{dept}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              deptFilter === dept ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="chart-card p-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or employee ID..."
            className="pro-input pl-9 w-full text-sm"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="pro-input"
        >
          {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
        </select>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {loading
            ? [...Array(8)].map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl animate-pulse-soft" />)
            : employees.map(emp => {
                const color = getColor(emp.department);
                return (
                  <div
                    key={emp.id}
                    onClick={() => onSelectEmployee?.(emp.employee_id || emp.name)}
                    className="kpi-card p-4 cursor-pointer group"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition">
                          {emp.name}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400">{emp.employee_id || 'No ID'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                        <Building2 className="w-3 h-3 flex-shrink-0" style={{ color }} />
                        <span className="truncate">{emp.department}</span>
                      </div>
                      <StatusBadge status={emp.status} />
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="chart-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full pro-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((__, j) => (
                          <td key={j}><div className="shimmer h-5 rounded" /></td>
                        ))}
                      </tr>
                    ))
                  : employees.map((emp, i) => {
                      const color = getColor(emp.department);
                      return (
                        <tr
                          key={emp.id}
                          onClick={() => onSelectEmployee?.(emp.employee_id || emp.name)}
                          className="cursor-pointer"
                        >
                          <td className="font-mono text-slate-400 text-[11px]">{i + 1}</td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                style={{ background: color }}
                              >
                                {getInitials(emp.name)}
                              </div>
                              <span className="font-semibold text-slate-800">{emp.name}</span>
                            </div>
                          </td>
                          <td className="font-mono text-slate-400 text-[11px]">{emp.employee_id || '—'}</td>
                          <td>
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              {emp.department}
                            </span>
                          </td>
                          <td className="text-slate-500">{emp.designation || '—'}</td>
                          <td><StatusBadge status={emp.status} /></td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon mx-auto"><Users className="w-7 h-7 text-slate-300" /></div>
          <p className="text-sm font-bold text-slate-600">No employees found</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing the filters, or upload attendance data to populate the employee master.</p>
        </div>
      )}
    </div>
  );
};

export default Employees;
