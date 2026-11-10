import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, UserCheck, UserX, FileCheck, FileX,
  Clock, Award, BarChart3, ShieldCheck, AlertOctagon, TrendingUp,
  Activity, LayoutGrid, Radio
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import api from '../api/client';
import KPICard from '../components/Common/KPICard';
import AttentionAlerts from '../components/Common/AttentionAlerts';
import StoryHighlights from '../components/Dashboard/StoryHighlights';
import ActivityFeed from '../components/Dashboard/ActivityFeed';

const PALETTE = {
  green:   '#10b981',
  red:     '#f43f5e',
  amber:   '#f59e0b',
  blue:    '#3b82f6',
  sky:     '#38bdf8',
  purple:  '#8b5cf6',
  slate:   '#e2e8f0',
  navy:    '#1e3a5f',
};

const DEPT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#f43f5e','#38bdf8','#a78bfa','#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 shadow-2xl text-xs min-w-[120px]">
      {label && <p className="text-slate-400 mb-1.5 font-semibold text-[10px] uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex justify-between gap-3" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const SectionTitle = ({ children, sub }) => (
  <div className="section-header">
    <div>
      <h3 className="text-sm font-bold text-slate-800 leading-none">{children}</h3>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="p-4 sm:p-6 space-y-6 animate-pulse-soft">
    {/* Story bubbles shimmer */}
    <div className="flex gap-4 overflow-hidden py-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 rounded-full shimmer" />
          <div className="w-10 h-2 rounded shimmer" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}
    </div>
    <div className="shimmer h-14 rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-60 rounded-2xl" />)}
    </div>
  </div>
);

export const Dashboard = ({ selectedDate, onSelectEmployee }) => {
  const [kpis, setKpis] = useState(null);
  const [attention, setAttention] = useState(null);
  const [attSummary, setAttSummary] = useState(null);
  const [repSummary, setRepSummary] = useState(null);
  const [prodSummary, setProdSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('analytics'); // 'analytics' | 'feed'

  const fetchData = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, attRes, repRes, prodRes, attenRes] = await Promise.all([
        api.get(`/analytics/kpis?date=${selectedDate}`),
        api.get(`/attendance/summary?date=${selectedDate}`),
        api.get(`/reports/summary?date=${selectedDate}`),
        api.get(`/productivity/summary?date=${selectedDate}`),
        api.get(`/analytics/attention?date=${selectedDate}`)
      ]);
      setKpis(kpiRes.data);
      setAttSummary(attRes.data);
      setRepSummary(repRes.data);
      setProdSummary(prodRes.data);
      setAttention(attenRes.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try refreshing.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!selectedDate) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Activity className="w-7 h-7 text-slate-400" /></div>
        <h3 className="text-sm font-bold text-slate-700">No data loaded yet</h3>
        <p className="text-xs text-slate-400 mt-1">Upload daily attendance and report files to get started.</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="m-6 p-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>
  );

  // Chart data
  const presenceData = [
    { name: 'Present', value: kpis?.present_today || 0 },
    { name: 'Absent',  value: kpis?.absent_today  || 0 },
  ];

  const submissionData = [
    { name: 'Submitted',  value: kpis?.reports_submitted     || 0 },
    { name: 'Pending',    value: kpis?.reports_not_submitted  || 0 },
    { name: 'Absent',     value: kpis?.absent_today          || 0 },
  ];

  const deptAttData = (attSummary?.summary_1 || []).map(row => ({
    dept: row.department?.length > 10 ? row.department.substring(0, 10) + '…' : row.department,
    'On Time': row.before_930,
    'Grace':   row.between_930_945,
    'Late':    row.after_945,
    'Absent':  row.not_punched_or_absent,
  }));

  const deptPerfData = (prodSummary?.department_summary || []).map(row => {
    const repRow = (repSummary?.quality_summary || []).find(r => r.department === row.department);
    return {
      dept: row.department?.length > 10 ? row.department.substring(0, 10) + '…' : row.department,
      Productivity: Math.round(row.productivity_score),
      Quality: Math.round(repRow?.avg_quality_score || 0),
    };
  });

  const lateData = (attSummary?.summary_2 || [])
    .filter(r => r.late_punch_in > 0)
    .sort((a, b) => b.late_punch_in - a.late_punch_in)
    .slice(0, 8)
    .map((row, i) => ({
      name: row.department,
      value: row.late_punch_in,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));

  const attendanceRate = kpis?.total_employees
    ? Math.round((kpis.present_today / kpis.total_employees) * 100)
    : 0;
  const submissionRate = kpis?.present_today
    ? Math.round((kpis.reports_submitted / kpis.present_today) * 100)
    : 0;

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Instagram Stories Carousel ─────────────────── */}
      <StoryHighlights
        kpis={kpis}
        attSummary={attSummary}
        repSummary={repSummary}
        prodSummary={prodSummary}
        attention={attention}
        onSelectEmployee={onSelectEmployee}
      />

      {/* ── View Switcher: Executive Analytics vs Social Activity Feed ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Daily Workforce Intelligence
          </h2>
        </div>

        {/* Segmented View Mode Switcher */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            <span>Executive Analytics</span>
          </button>
          <button
            onClick={() => setViewMode('feed')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'feed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>Highlights Feed</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>

      {/* ── Feed View Mode (Instagram Cards) ─────────────── */}
      {viewMode === 'feed' ? (
        <ActivityFeed
          prodSummary={prodSummary}
          attSummary={attSummary}
          repSummary={repSummary}
          kpis={kpis}
          selectedDate={selectedDate}
          onSelectEmployee={onSelectEmployee}
        />
      ) : (
        /* ── Executive Analytics View Mode ─────────────────── */
        <>
          {/* Reconciliation Banner */}
          {kpis && (
            <div className={`rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-4 shadow-sm ${
              kpis.reconciliation_valid
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                {kpis.reconciliation_valid
                  ? <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  : <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                }
                <div>
                  <p className="text-xs font-bold">
                    {kpis.reconciliation_valid ? '✓ Mathematical Reconciliation 100% Verified' : '⚠ Reconciliation Notice'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {kpis.reconciliation_valid
                      ? `Roster: ${kpis.total_employees} employees · Present: ${kpis.present_today} · Absent: ${kpis.absent_today} · Reports: ${kpis.reports_submitted}`
                      : kpis.reconciliation_notes}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs flex-shrink-0">
                {selectedDate}
              </span>
            </div>
          )}

          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <KPICard
              title="Total Employees"
              value={kpis?.total_employees}
              subtitle="Company roster size"
              icon={Users}
              color="blue"
            />
            <KPICard
              title="Present Today"
              value={kpis?.present_today}
              subtitle={`Attendance rate: ${attendanceRate}%`}
              icon={UserCheck}
              color="green"
            />
            <KPICard
              title="Absent Today"
              value={kpis?.absent_today}
              subtitle="Excluded from report penalties"
              icon={UserX}
              color="slate"
            />
            <KPICard
              title="Late Arrivals"
              value={kpis?.late_punch_ins}
              subtitle="Punch-in after 9:45 AM"
              icon={Clock}
              color="amber"
              alert={(kpis?.late_punch_ins || 0) > 5}
            />
            <KPICard
              title="Reports Submitted"
              value={kpis?.reports_submitted}
              subtitle={`${submissionRate}% of present employees`}
              icon={FileCheck}
              color="green"
            />
            <KPICard
              title="Reports Pending"
              value={kpis?.reports_not_submitted}
              subtitle="Present but no report filed"
              icon={FileX}
              color="red"
              alert={(kpis?.reports_not_submitted || 0) > 0}
            />
            <KPICard
              title="Avg Report Quality"
              value={`${kpis?.avg_quality_score ?? 0}%`}
              subtitle="Across all submitted reports"
              icon={BarChart3}
              color="purple"
            />
            <KPICard
              title="Avg Productivity"
              value={`${kpis?.avg_productivity_score ?? 0}%`}
              subtitle="Submission 50% · Quality 30% · Att 20%"
              icon={Award}
              color="blue"
            />
          </div>

          {/* Attention Alerts */}
          <AttentionAlerts attentionData={attention} onSelectEmployee={onSelectEmployee} />

          {/* Charts Row 1: Pie Charts + Attendance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pie: Presence */}
            <div className="chart-card p-5">
              <SectionTitle sub={`${attendanceRate}% attendance rate today`}>Presence Overview</SectionTitle>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={presenceData}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      dataKey="value" paddingAngle={4}
                      strokeWidth={0}
                    >
                      <Cell fill={PALETTE.green} />
                      <Cell fill={PALETTE.slate} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-1">
                <span className="text-2xl font-bold text-slate-800">{kpis?.present_today}</span>
                <span className="text-xs text-slate-400 ml-1">present</span>
              </div>
            </div>

            {/* Pie: Report Compliance */}
            <div className="chart-card p-5">
              <SectionTitle sub={`${submissionRate}% submission compliance`}>Report Compliance</SectionTitle>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={submissionData}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      dataKey="value" paddingAngle={4}
                      strokeWidth={0}
                    >
                      <Cell fill={PALETTE.blue}  />
                      <Cell fill={PALETTE.red}   />
                      <Cell fill={PALETTE.slate} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-1">
                <span className="text-2xl font-bold text-slate-800">{kpis?.reports_submitted}</span>
                <span className="text-xs text-slate-400 ml-1">submitted</span>
              </div>
            </div>

            {/* Stacked Bar: Dept Attendance */}
            <div className="chart-card p-5">
              <SectionTitle sub="Punch-in brackets by department">Attendance Breakdown</SectionTitle>
              <div className="h-56">
                {deptAttData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptAttData} barSize={12} margin={{ bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="On Time" stackId="a" fill={PALETTE.green} />
                      <Bar dataKey="Grace"   stackId="a" fill={PALETTE.sky}   />
                      <Bar dataKey="Late"    stackId="a" fill={PALETTE.amber}  />
                      <Bar dataKey="Absent"  stackId="a" fill={PALETTE.slate} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No department attendance data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Dept Performance + Late Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Grouped Bar: Quality vs Productivity */}
            <div className="chart-card p-5">
              <SectionTitle sub="Quality & productivity score by department">Department Performance</SectionTitle>
              <div className="h-60">
                {deptPerfData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptPerfData} barSize={12} barGap={4} margin={{ bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Quality"      fill={PALETTE.purple} radius={[3,3,0,0]} />
                      <Bar dataKey="Productivity" fill={PALETTE.blue}   radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No performance data
                  </div>
                )}
              </div>
            </div>

            {/* Late Arrivals Ranking */}
            <div className="chart-card p-5">
              <SectionTitle sub="Departments with most late arrivals today">Late Arrival Ranking</SectionTitle>
              {lateData.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-700">No late arrivals!</p>
                    <p className="text-xs text-slate-400 mt-0.5">All employees punched in on time</p>
                  </div>
                </div>
              ) : (
                <div className="h-60 space-y-2.5 overflow-y-auto pr-1 pt-1">
                  {lateData.map((dept, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-slate-500 w-24 truncate flex-shrink-0">
                        {dept.name}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (dept.value / (lateData[0]?.value || 1)) * 100)}%`,
                            background: dept.fill
                          }}
                        />
                      </div>
                      <span className="freq-badge freq-badge-amber flex-shrink-0 w-8 text-center">
                        {dept.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;
