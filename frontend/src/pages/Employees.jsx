import React, { useEffect, useState } from 'react';
import { Search, Users, Building2 } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';

export const Employees = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees?department=${deptFilter}&search=${search}`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [search, deptFilter]);

  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Master Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Click any employee to view their full performance profile, attendance history, and productivity trends.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-800">{employees.length} Employees</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or employee ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700 outline-none"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
          ))}
        </select>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => onSelectEmployee && onSelectEmployee(emp.employee_id || emp.name)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                {emp.name ? emp.name.charAt(0) : 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition">{emp.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono">{emp.employee_id || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <Building2 className="w-3 h-3" />
                <span>{emp.department}</span>
              </div>
              <StatusBadge status={emp.status} />
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">No employees found.</p>
          <p className="text-xs mt-1">Upload attendance data to populate the employee master.</p>
        </div>
      )}
    </div>
  );
};

export default Employees;
