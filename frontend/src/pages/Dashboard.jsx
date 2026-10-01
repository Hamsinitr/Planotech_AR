import React, { useEffect, useState } from 'react';
import {
  Users, UserCheck, UserX, FileCheck, FileX,
  Clock, Award, BarChart3, ShieldCheck, AlertOctagon, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import api from '../api/client';
import KPICard from '../components/Common/KPICard';
import AttentionAlerts from '../components/Common/AttentionAlerts';

const PIE_COLORS = ['#10b981', '#f43f5e', '#94a3b8'];
const DEPT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      {label && <p className="text-slate-400 mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
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

export const Dashboard = ({ selectedDate, onSelectEmployee }) => {
  const [kpis, setKpis] = useState(null);
  const [attention, setAttention] = useState(null);
  const [attSummary, setAttSummary] = useState(null);
  const [repSummary, setRepSummary] = useState(null);
  const [prodSummary, setProdSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!selectedDate) return;
    setLoading(true);
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
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse-soft">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-xl" />
          ))}
        </div>
        <div className="shimmer h-40 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="shimmer h-64 rounded-xl" />
          <div className="shimmer h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Chart Data Preparation ───────────────────────────────────────────────
  // Pie: Present vs Absent
  const presenceData = [
    { name: 'Present', value: kpis?.present_today || 0 },
    { name: 'Absent', value: kpis?.absent_today || 0 },
  ];

  // Pie: Report Submission
  const submissionData = [
    { name: 'Submitted', value: kpis?.reports_submitted || 0 },
    { name: 'Not Submitted', value: kpis?.reports_not_submitted || 0 },
    { name: 'Absent', value: kpis?.absent_today || 0 },
  ];

  // Bar: Dept Attendance Breakdown (stacked)
  const deptAttendanceData = (attSummary?.summary_1 || []).map((row) => ({
    dept: row.department?.substring(0, 8),
    'On Time': row.before_930,
    'Grace': row.between_930_945,
    'Late': row.after_945,
    'Absent': row.not_punched_or_absent,
  }));

  // Bar: Dept Quality vs Productivity
  const deptPerfData = (prodSummary?.department_summary || []).map((row, i) => {
    const repRow = (repSummary?.quality_summary || []).find(r => r.department === row.department);
    return {
      dept: row.department?.substring(0, 8),
      Productivity: Math.round(row.productivity_score),
      Quality: Math.round(repRow?.avg_quality_score || 0),
    };
  });

  // Radial: Dept-wise late punch-ins
  const radialData = (attSummary?.summary_2 || [])
    .filter(r => r.late_punch_in > 0)
    .sort((a, b) => b.late_punch_in - a.late_punch_in)
    .slice(0, 6)
    .map((row, i) => ({
      name: row.department,
      value: row.late_punch_in,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));

  return (
    <div className="p-6 space-y-6 animate-fade-up">

      {/* Reconciliation Banner */}
      {kpis && (
        <div className={`rounded-xl border px-5 py-3 flex items-center justify-between gap-4 ${
          kpis.reconciliation_valid
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {kpis.reconciliation_valid
              ? <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              : <AlertOctagon className="w-5 h-5 text-rose-500 flex-shrink-0" />
            }
            <div>
              <p className={`text-xs font-bold ${kpis.reconciliation_valid ? 'text-emerald-800' : 'text-rose-800'}`}>
                {kpis.reconciliation_valid ? '✓ Data Reconciliation Verified' : '⚠ Reconciliation Mismatch Detected'}
              </p>
              <p className={`text-[10px] mt-0.5 ${kpis.reconciliation_valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpis.reconciliation_valid
                  ? `Total ${kpis.total_employees} = Present ${kpis.present_today} + Absent ${kpis.absent_today} | Submitted ${kpis.reports_submitted} + Pending ${kpis.reports_not_submitted}`
                  : kpis.reconciliation_notes}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              kpis.reconciliation_valid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {selectedDate}
            </span>
          </div>
        </div>
      )}

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <KPICard title="Total Employees" value={kpis?.total_employees} subtitle="Full company roster" icon={Users} color="blue" />
        <KPICard
          title="Present Today"
          value={kpis?.present_today}
          subtitle={`Attendance rate: ${kpis?.total_employees ? Math.round((kpis.present_today / kpis.total_employees) * 100) : 0}%`}
          icon={UserCheck} color="green"
        />
        <KPICard title="Absent Today" value={kpis?.absent_today} subtitle="Excluded from report penalties" icon={UserX} color="slate" />
        <KPICard
          title="Late Punch-Ins"
          value={kpis?.late_punch_ins}
          subtitle="After 9:45 AM cutoff"
          icon={Clock} color="amber"
          alert={kpis?.late_punch_ins > 5}
        />
        <KPICard
          title="Reports Submitted"
          value={kpis?.reports_submitted}
          subtitle={`Of present: ${kpis?.present_today ? Math.round((kpis.reports_submitted / kpis.present_today) * 100) : 0}%`}
          icon={FileCheck} color="green"
        />
        <KPICard
          title="Reports Pending"
          value={kpis?.reports_not_submitted}
          subtitle="Present employees with no report"
          icon={FileX} color="red"
          alert={kpis?.reports_not_submitted > 0}
        />
        <KPICard
          title="Avg Report Quality"
          value={`${kpis?.avg_quality_score || 0}%`}
          subtitle="Evaluated submitted reports"
          icon={BarChart3} color="purple"
        />
        <KPICard
          title="Avg Productivity"
          value={`${kpis?.avg_productivity_score || 0}%`}
          subtitle="Submission 50% · Quality 30% · Att 20%"
          icon={Award} color="blue"
        />
      </div>

      {/* Attention Alerts */}
      <AttentionAlerts attentionData={attention} onSelectEmployee={onSelectEmployee} />

      {/* Row 1: Two Pie Charts + Dept Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pie 1: Presence */}
        <div className="chart-card p-5">
          <SectionTitle sub="Present vs Absent today">Presence Overview</SectionTitle>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={presenceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  <Cell fill="#10b981" />
                  <Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie 2: Submission */}
        <div className="chart-card p-5">
          <SectionTitle sub="Submitted · Pending · Absent">Report Compliance</SectionTitle>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={submissionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {submissionData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Bar: Dept Attendance Timing */}
        <div className="chart-card p-5">
          <SectionTitle sub="Punch-in time brackets by department">Attendance Breakdown</SectionTitle>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptAttendanceData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="On Time" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="Grace" stackId="a" fill="#38bdf8" />
                <Bar dataKey="Late" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Absent" stackId="a" fill="#e2e8f0" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Dept Quality vs Productivity (grouped bar) + Late Radial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Grouped Bar: Quality vs Productivity */}
        <div className="chart-card p-5">
          <SectionTitle sub="Quality & productivity side-by-side per department">Department Performance Comparison</SectionTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerfData} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Quality" fill="#8b5cf6" radius={[3,3,0,0]} />
                <Bar dataKey="Productivity" fill="#3b82f6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Late Punch-in Ranking (radial or horizontal bar) */}
        <div className="chart-card p-5">
          <SectionTitle sub="Departments with most late arrivals today">Late Arrival Ranking</SectionTitle>
          {radialData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">No late arrivals today!</p>
                <p className="text-xs text-slate-400 mt-1">All employees arrived on time</p>
              </div>
            </div>
          ) : (
            <div className="h-64 space-y-3 overflow-y-auto pt-2">
              {radialData.map((dept, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-slate-500 w-20 truncate flex-shrink-0">{dept.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (dept.value / (radialData[0]?.value || 1)) * 100)}%`,
                        background: dept.fill
                      }}
                    />
                  </div>
                  <span className="freq-badge freq-badge-amber flex-shrink-0">{dept.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
