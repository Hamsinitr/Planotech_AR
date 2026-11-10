import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Award, Search, Activity, Sparkles } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/Common/StatusBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const DEPT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#f43f5e','#38bdf8','#a78bfa','#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 shadow-xl text-xs">
      {label && <p className="text-slate-400 mb-1.5 font-semibold text-[10px] uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex justify-between gap-3">
          <span>{p.name}</span>
          <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="rank-gold inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-md">🥇</span>;
  if (rank === 2) return <span className="rank-silver inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-sm">🥈</span>;
  if (rank === 3) return <span className="rank-bronze inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-sm">🥉</span>;
  return <span className="text-xs font-bold text-slate-400 font-mono">#{rank}</span>;
};

const ScoreCell = ({ score }) => {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score?.toFixed(0)}</span>
    </div>
  );
};

export const Productivity = ({ selectedDate, onSelectEmployee }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');

  const fetchData = useCallback(async () => {
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
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!selectedDate) {
    return (
      <div className="empty-state p-12">
        <div className="empty-state-icon"><Activity className="w-7 h-7 text-slate-400" /></div>
        <h3 className="text-sm font-bold text-slate-700">Select a date to view productivity</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse-soft">
        <div className="shimmer h-8 w-64 rounded-lg" />
        <div className="shimmer h-48 rounded-2xl" />
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  const deptChartData = (data?.department_summary || []).map((r, i) => ({
    department: r.department?.length > 10 ? r.department.substring(0, 10) + '…' : r.department,
    score: r.productivity_score,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const top1 = data?.top_performers?.[0];
  const top2 = data?.top_performers?.[1];
  const top3 = data?.top_performers?.[2];

  const tableData =
    activeTab === 'top'       ? data?.top_performers  :
    activeTab === 'attention' ? data?.needs_attention  :
    (data?.all_rankings || []).filter(r =>
      !search || r.employee_name.toLowerCase().includes(search.toLowerCase())
    );

  const tabs = [
    { id: 'leaderboard', label: '🏆 Leaderboard',      count: data?.all_rankings?.length },
    { id: 'top',         label: '⭐ Top Performers',    count: data?.top_performers?.length },
    { id: 'attention',   label: '⚠️ Needs Attention',  count: data?.needs_attention?.length },
  ];

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Productivity Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated score formula: Submission 50% · Quality 30% · Attendance 20% · Absent employees protected
          </p>
        </div>
        {data?.average_productivity != null && (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
            <Award className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Company Average</p>
              <p className="text-lg font-black text-blue-900 leading-tight">{data.average_productivity}/100</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Top 3 Performers Champions Podium (Instagram / Olympic style) ── */}
      {top1 && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
          />

          <div className="text-center mb-6 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold tracking-widest uppercase border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Champions Podium
            </span>
            <h3 className="text-lg font-black tracking-tight text-white mt-1">Today's Star Performers</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end relative z-10 max-w-2xl mx-auto">
            {/* Rank #2 Silver */}
            {top2 && (
              <div
                onClick={() => onSelectEmployee?.(top2.employee_name)}
                className="bg-white/5 border border-white/10 hover:border-white/25 rounded-2xl p-4 text-center cursor-pointer transition transform hover:-translate-y-1 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full mx-auto p-0.5 bg-gradient-to-tr from-slate-300 to-slate-100 shadow-md mb-2">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-lg text-white">
                    {top2.employee_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="text-sm">🥈</span>
                <h4 className="text-xs font-bold text-white truncate mt-1">{top2.employee_name}</h4>
                <p className="text-[10px] text-slate-400 truncate">{top2.department}</p>
                <div className="mt-2 py-1 px-2.5 rounded-lg bg-white/10 text-amber-300 font-black text-xs inline-block">
                  {top2.productivity_score} <span className="text-[9px] text-slate-400 font-normal">pts</span>
                </div>
              </div>
            )}

            {/* Rank #1 Gold (Center Elevated) */}
            <div
              onClick={() => onSelectEmployee?.(top1.employee_name)}
              className="bg-gradient-to-b from-amber-500/20 to-amber-900/10 border-2 border-amber-400/60 rounded-3xl p-5 text-center cursor-pointer transition transform hover:-translate-y-1.5 active:scale-95 shadow-2xl relative"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md">
                👑 Rank 1
              </div>
              <div className="w-20 h-20 rounded-full mx-auto p-1 insta-gradient-ring shadow-xl mb-2 animate-story-ring">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-black text-2xl text-white">
                  {top1.employee_name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h4 className="text-sm font-black text-white truncate mt-1">{top1.employee_name}</h4>
              <p className="text-[11px] text-slate-300 truncate">{top1.department}</p>
              <div className="mt-2.5 py-1 px-3.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm inline-block shadow-md">
                {top1.productivity_score} <span className="text-[10px] opacity-80 font-bold">/ 100</span>
              </div>
            </div>

            {/* Rank #3 Bronze */}
            {top3 && (
              <div
                onClick={() => onSelectEmployee?.(top3.employee_name)}
                className="bg-white/5 border border-white/10 hover:border-white/25 rounded-2xl p-4 text-center cursor-pointer transition transform hover:-translate-y-1 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full mx-auto p-0.5 bg-gradient-to-tr from-amber-700 to-amber-500 shadow-md mb-2">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-lg text-white">
                    {top3.employee_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="text-sm">🥉</span>
                <h4 className="text-xs font-bold text-white truncate mt-1">{top3.employee_name}</h4>
                <p className="text-[10px] text-slate-400 truncate">{top3.department}</p>
                <div className="mt-2 py-1 px-2.5 rounded-lg bg-white/10 text-amber-300 font-black text-xs inline-block">
                  {top3.productivity_score} <span className="text-[9px] text-slate-400 font-normal">pts</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Department Score Comparison Bar Chart */}
      {deptChartData.length > 0 && (
        <div className="chart-card p-5">
          <div className="section-header">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Department Productivity Scores</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Average employee score across each department</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} barSize={20}>
                <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[4,4,0,0]} name="Productivity Score">
                  {deptChartData.map((entry, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Employee Rankings Leaderboard */}
      <div className="chart-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="pro-input pl-8 w-48 rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full pro-table">
            <thead>
              <tr>
                <th className="w-14 text-center">Rank</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Submission (50%)</th>
                <th>Quality (30%)</th>
                <th>Attendance (20%)</th>
                <th>Total Productivity</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {(tableData || []).length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon mx-auto">
                        <Trophy className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">No records in this category</p>
                    </div>
                  </td>
                </tr>
              ) : (tableData || []).map(row => (
                <tr
                  key={row.id || row.employee_id || row.employee_name}
                  onClick={() => onSelectEmployee?.(row.employee_name)}
                  className="cursor-pointer hover:bg-slate-50/80 transition"
                >
                  <td className="text-center">
                    <RankBadge rank={row.rank} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {row.employee_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{row.employee_name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{row.employee_id || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-500 font-medium text-xs">{row.department}</td>
                  <td><ScoreCell score={row.submission_score || 0} /></td>
                  <td><ScoreCell score={row.quality_score || 0} /></td>
                  <td><ScoreCell score={row.attendance_score || 0} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black ${
                        row.productivity_score >= 85 ? 'text-emerald-600' :
                        row.productivity_score >= 70 ? 'text-blue-600' :
                        row.productivity_score >= 50 ? 'text-amber-600' : 'text-rose-500'
                      }`}>
                        {row.productivity_score?.toFixed(1)}
                      </span>
                      <span className="text-slate-300 text-[10px]">/100</span>
                    </div>
                  </td>
                  <td><StatusBadge status={row.category} /></td>
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
