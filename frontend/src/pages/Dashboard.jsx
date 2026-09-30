import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  Clock,
  Award,
  BarChart3,
  ShieldCheck,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import api from '../api/client';
import KPICard from '../components/Common/KPICard';
import AttentionAlerts from '../components/Common/AttentionAlerts';

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

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading analytics dashboard for {selectedDate}...
      </div>
    );
  }

  // Prepare chart data for Chart 1 & 2: Reports by Dept & Attendance by Dept
  const deptReportData = (repSummary?.summary || []).map((row) => ({
    department: row.department,
    'Reports Submitted': row.reports_submitted,
    'Reports Not Submitted': row.reports_not_submitted,
    'Absent': row.absent
  }));

  const deptAttendanceData = (attSummary?.summary_1 || []).map((row) => ({
    department: row.department,
    'Before 9:30 AM': row.before_930,
    '9:30-9:45 AM': row.between_930_945,
    'After 9:45 AM (Late)': row.after_945,
    'Absent': row.not_punched_or_absent
  }));

  const deptLateData = (attSummary?.summary_2 || []).map((row) => ({
    department: row.department,
    'Late Punch-Ins': row.late_punch_in
  }));

  const deptQualityData = (repSummary?.quality_summary || []).map((row) => ({
    department: row.department,
    'Average Quality Score': row.avg_quality_score
  }));

  const deptProdData = (prodSummary?.department_summary || []).map((row) => ({
    department: row.department,
    'Productivity Score': row.productivity_score
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Reconciliation Alert Banner */}
      {kpis && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
          kpis.reconciliation_valid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center space-x-3">
            {kpis.reconciliation_valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {kpis.reconciliation_valid ? 'Data Reconciliation Verified' : 'Data Reconciliation Mismatch'}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                {kpis.reconciliation_valid
                  ? `Mathematical reconciliation checks passed for ${selectedDate}: Total (${kpis.total_employees}) = Present (${kpis.present_today}) + Absent (${kpis.absent_today}) = Submitted (${kpis.reports_submitted}) + Not Submitted (${kpis.reports_not_submitted}) + Absent (${kpis.absent_today}).`
                  : `Validation discrepancy: ${kpis.reconciliation_notes}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.open(`/api/export/${selectedDate}/excel`, '_blank')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm ml-4 flex-shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download 9-Sheet Excel</span>
          </button>
        </div>
      )}

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Employees"
          value={kpis?.total_employees}
          subtitle="Full company roster"
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Present Today"
          value={kpis?.present_today}
          subtitle={`Rate: ${kpis?.total_employees ? Math.round((kpis.present_today / kpis.total_employees) * 100) : 0}%`}
          icon={UserCheck}
          color="green"
        />
        <KPICard
          title="Absent Today"
          value={kpis?.absent_today}
          subtitle="Excluded from unsubmitted list"
          icon={UserX}
          color="slate"
        />
        <KPICard
          title="Late Punch-Ins"
          value={kpis?.late_punch_ins}
          subtitle="Punched in after 9:45 AM"
          icon={Clock}
          color="amber"
          alert={kpis?.late_punch_ins > 5}
        />
        <KPICard
          title="Reports Submitted"
          value={kpis?.reports_submitted}
          subtitle={`Of present: ${kpis?.present_today ? Math.round((kpis.reports_submitted / kpis.present_today) * 100) : 0}%`}
          icon={FileCheck}
          color="green"
        />
        <KPICard
          title="Reports Not Submitted"
          value={kpis?.reports_not_submitted}
          subtitle="Present employees with no report"
          icon={FileX}
          color="red"
          alert={kpis?.reports_not_submitted > 0}
        />
        <KPICard
          title="Avg Report Quality"
          value={`${kpis?.avg_quality_score || 0}%`}
          subtitle="Evaluation of submitted reports"
          icon={BarChart3}
          color="purple"
        />
        <KPICard
          title="Avg Productivity Score"
          value={`${kpis?.avg_productivity_score || 0}%`}
          subtitle="Submission 50% • Quality 30% • Att 20%"
          icon={Award}
          color="blue"
        />
      </div>

      {/* Operational Alerts & Attention Required Section */}
      <AttentionAlerts attentionData={attention} onSelectEmployee={onSelectEmployee} />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Department-wise Report Submission */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Chart 1: Department-wise Report Submission</h3>
            <p className="text-xs text-slate-400">Reports Submitted vs Not Submitted vs Absent</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptReportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Reports Submitted" fill="#10b981" stackId="a" />
                <Bar dataKey="Reports Not Submitted" fill="#f43f5e" stackId="a" />
                <Bar dataKey="Absent" fill="#94a3b8" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department-wise Attendance Breakdown */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Chart 2: Department-wise Attendance</h3>
            <p className="text-xs text-slate-400">Breakdown by punch-in time brackets</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Before 9:30 AM" fill="#0284c7" stackId="a" />
                <Bar dataKey="9:30-9:45 AM" fill="#38bdf8" stackId="a" />
                <Bar dataKey="After 9:45 AM (Late)" fill="#f59e0b" stackId="a" />
                <Bar dataKey="Absent" fill="#cbd5e1" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Department-wise Report Quality */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Chart 3: Department-wise Report Quality</h3>
            <p className="text-xs text-slate-400">Average report quality score (0 - 100)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptQualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Average Quality Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Department-wise Productivity Score */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Chart 4: Department-wise Productivity Score</h3>
            <p className="text-xs text-slate-400">Overall weighted composite score (0 - 100)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptProdData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Productivity Score" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 5: Late Punch-Ins by Department */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Chart 5: Late Punch-Ins by Department</h3>
          <p className="text-xs text-slate-400">Count of employees punching in after 9:45 AM</p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptLateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Late Punch-Ins" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
