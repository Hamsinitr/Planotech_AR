import React, { useEffect, useState } from 'react';
import { Trophy, Award, TrendingDown, Search } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const Productivity = ({ selectedDate, onSelectEmployee }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');

  const fetchData = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const res = await api.get(`/productivity/summary?date=${selectedDate}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading productivity data...</div>;

  const deptChartData = (data?.department_summary || []).map(r => ({
    department: r.department,
    'Productivity Score': r.productivity_score,
    'Reports Submitted': r.reports_submitted,
  }));

  const filteredRankings = (data?.all_rankings || []).filter(r =>
    !search || r.employee_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Employee Productivity Leaderboard</h2>
        <p className="text-xs text-slate-500 mt-1">
          Composite score: Submission 50% • Quality 30% • Attendance 20%. Absent employees are not penalized.
        </p>
      </div>

      {/* Department Productivity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white">
          <h3 className="text-xs font-bold uppercase tracking-wider">Department Productivity Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3 text-right">Employees</th>
                <th className="px-5 py-3 text-right">Present</th>
                <th className="px-5 py-3 text-right">Reports Submitted</th>
                <th className="px-5 py-3 text-right">Not Submitted</th>
                <th className="px-5 py-3 text-right">Avg Quality</th>
                <th className="px-5 py-3 text-right">Productivity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.department_summary || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 font-semibold text-slate-800">{row.department}</td>
                  <td className="px-5 py-3 text-right">{row.employees}</td>
                  <td className="px-5 py-3 text-right text-emerald-600">{row.present}</td>
                  <td className="px-5 py-3 text-right text-emerald-600 font-medium">{row.reports_submitted}</td>
                  <td className="px-5 py-3 text-right text-rose-600">{row.reports_not_submitted}</td>
                  <td className="px-5 py-3 text-right text-purple-600 font-medium">{row.avg_quality}%</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-bold text-sm ${row.productivity_score >= 85 ? 'text-emerald-700' : row.productivity_score >= 70 ? 'text-blue-700' : 'text-rose-700'}`}>
                      {row.productivity_score}
                    </span>
                    <span className="text-slate-400"> / 100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dept Productivity Chart */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">Department Productivity Score Comparison</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Productivity Score" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs: Leaderboard | Top Performers | Needs Attention */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex space-x-1">
            {['leaderboard', 'top', 'attention'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {tab === 'leaderboard' ? '🏆 Full Leaderboard' : tab === 'top' ? '⭐ Top Performers' : '⚠️ Needs Attention'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Report Submission</th>
                <th className="px-5 py-3">Quality Score</th>
                <th className="px-5 py-3">Attendance Score</th>
                <th className="px-5 py-3">Productivity Score</th>
                <th className="px-5 py-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'top' ? data?.top_performers :
                activeTab === 'attention' ? data?.needs_attention :
                filteredRankings
              )?.map((row) => (
                <tr
                  key={row.id || row.employee_id}
                  onClick={() => onSelectEmployee && onSelectEmployee(row.employee_name)}
                  className="hover:bg-blue-50/40 cursor-pointer transition"
                >
                  <td className="px-5 py-3">
                    <span className={`font-bold text-base ${row.rank <= 3 ? 'text-amber-500' : 'text-slate-500'}`}>
                      {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : `#${row.rank}`}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{row.employee_name}</td>
                  <td className="px-5 py-3 text-slate-600">{row.department}</td>
                  <td className="px-5 py-3 text-right font-medium">{row.submission_score?.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right font-medium text-purple-700">{row.quality_score?.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right font-medium">{row.attendance_score?.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-sm font-bold ${row.productivity_score >= 85 ? 'text-emerald-700' : row.productivity_score >= 70 ? 'text-blue-700' : 'text-rose-700'}`}>
                      {row.productivity_score?.toFixed(1)}
                    </span>
                    <span className="text-slate-400"> / 100</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Productivity;
