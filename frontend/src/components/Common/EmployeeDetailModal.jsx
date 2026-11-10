import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  Award,
  CheckCircle2,
  Heart,
  Calendar,
  Sparkles,
  Download,
  Copy,
  Check,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api from '../../api/client';
import StatusBadge from './StatusBadge';

export const EmployeeDetailModal = ({ employeeIdentifier, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProfileTab, setActiveProfileTab] = useState('overview'); // 'overview' | 'trends' | 'timeline'
  const [kudosCount, setKudosCount] = useState(24);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);

  useEffect(() => {
    if (!employeeIdentifier) return;
    setLoading(true);
    api.get(`/employees/${encodeURIComponent(employeeIdentifier)}/history`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [employeeIdentifier]);

  const handleKudos = () => {
    setKudosCount(prev => hasLiked ? prev - 1 : prev + 1);
    setHasLiked(!hasLiked);

    if (!hasLiked) {
      const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
      setFloatingHearts(prev => [...prev, newHeart]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 1100);
    }
  };

  const handleCopyId = () => {
    if (data?.employee?.employee_id) {
      navigator.clipboard.writeText(data.employee.employee_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!employeeIdentifier) return null;

  const employeeName = data?.employee?.name || employeeIdentifier;
  const username = `@${employeeName.toLowerCase().replace(/\s+/g, '.')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-up">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-100">

        {/* ── Top Bar: Instagram Header Style ───────────── */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight text-slate-900">{username}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {data?.employee?.status || 'Active Roster'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition active:scale-90"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Main Scroll Area ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-16 h-16 rounded-full shimmer mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Loading performance profile...</p>
            </div>
          ) : !data ? (
            <div className="py-24 text-center text-slate-400 text-xs">Employee record not found.</div>
          ) : (
            <>
              {/* ── Instagram Profile Header Section ──────── */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Large Avatar with Instagram Gradient Ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full insta-gradient-ring p-1 shadow-xl">
                    <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-950 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-inner">
                        {employeeName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {/* Floating hearts animation */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                    {floatingHearts.map((h) => (
                      <div
                        key={h.id}
                        className="absolute animate-float-heart text-rose-500 font-black text-3xl"
                        style={{ transform: `translateX(${h.x}px)` }}
                      >
                        ❤️
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile Bio & Key Stats */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {employeeName}
                      </h2>
                      {data.employee.employee_id && (
                        <button
                          onClick={handleCopyId}
                          title="Click to copy ID"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono text-[10px] font-bold transition active:scale-95"
                        >
                          {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          {data.employee.employee_id}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {data.employee.designation} • <span className="text-blue-600 font-bold">{data.employee.department}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {data.employee.email} • Joined {data.employee.joining_date || '2026'}
                    </p>
                  </div>

                  {/* 4 Stats Counters (Instagram Posts / Followers Style) */}
                  <div className="flex items-center justify-center sm:justify-start gap-5 sm:gap-8 pt-1 border-t border-slate-100">
                    <div className="text-center sm:text-left">
                      <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight">
                        {data.stats.total_days_tracked}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Days</span>
                    </div>

                    <div className="text-center sm:text-left">
                      <span className="text-base sm:text-lg font-black text-emerald-600 block leading-tight">
                        {data.stats.attendance_rate}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Attendance</span>
                    </div>

                    <div className="text-center sm:text-left">
                      <span className="text-base sm:text-lg font-black text-amber-500 block leading-tight">
                        {data.stats.avg_productivity_score}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Avg Score</span>
                    </div>

                    <div className="text-center sm:text-left">
                      <span className="text-base sm:text-lg font-black text-blue-600 block leading-tight">
                        {data.stats.reports_submitted}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Reports</span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                    <button
                      onClick={handleKudos}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                        hasLiked
                          ? 'bg-rose-500 text-white'
                          : 'insta-gradient-btn text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-white' : ''}`} />
                      <span>{hasLiked ? 'Kudos Sent!' : 'Send Kudos'}</span>
                      <span className="text-[10px] opacity-80">({kudosCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Story Highlights / Achievement Badges ──── */}
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                {data.stats.avg_productivity_score >= 80 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Top 10% Tier</span>
                  </div>
                )}
                {data.stats.late_days === 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex-shrink-0">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    <span>Zero Late Arrivals</span>
                  </div>
                )}
                {data.stats.attendance_rate >= 90 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    <span>90%+ Attendance Streak</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold flex-shrink-0">
                  <Award className="w-3 h-3 text-purple-500" />
                  <span>HR Verified Profile</span>
                </div>
              </div>

              {/* ── Instagram Profile Tabs (Grid / Trends / Timeline) ── */}
              <div className="border-t border-slate-200 flex">
                <button
                  onClick={() => setActiveProfileTab('overview')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-t-2 transition-all ${
                    activeProfileTab === 'overview'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => setActiveProfileTab('trends')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-t-2 transition-all ${
                    activeProfileTab === 'trends'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Score Trends</span>
                </button>

                <button
                  onClick={() => setActiveProfileTab('timeline')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-t-2 transition-all ${
                    activeProfileTab === 'timeline'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Logs Timeline</span>
                </button>
              </div>

              {/* ── Tab 1: Overview ───────────────────────── */}
              {activeProfileTab === 'overview' && (
                <div className="space-y-4 animate-fade-up">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 block font-bold uppercase">Present Days</span>
                      <span className="text-base font-extrabold text-emerald-900 mt-0.5 block">
                        {data.stats.present_days} / {data.stats.total_days_tracked}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-600 block font-bold uppercase">Absent Days</span>
                      <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{data.stats.absent_days}</span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 block font-bold uppercase">Late Punch-ins</span>
                      <span className="text-base font-extrabold text-amber-900 mt-0.5 block">{data.stats.late_days}</span>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <span className="text-[10px] text-rose-700 block font-bold uppercase">Out of Location</span>
                      <span className="text-base font-extrabold text-rose-900 mt-0.5 block">{data.stats.out_of_location_days || 0}</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <span className="text-[10px] text-blue-700 block font-bold uppercase">Reports Filed</span>
                      <span className="text-base font-extrabold text-blue-900 mt-0.5 block">{data.stats.reports_submitted}</span>
                    </div>
                  </div>

                  {/* Quick Summary Note */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Performance Evaluation</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {employeeName} maintains an average productivity rating of{' '}
                      <strong>{data.stats.avg_productivity_score}/100</strong> with{' '}
                      <strong>{data.stats.attendance_rate}%</strong> attendance reliability.
                      {data.stats.late_days > 0
                        ? ` Recorded ${data.stats.late_days} punch-in delays after 9:45 AM grace period.`
                        : ` Pristine punch-in discipline with zero late arrivals recorded.`}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Trends ─────────────────────────── */}
              {activeProfileTab === 'trends' && (
                <div className="space-y-4 animate-fade-up">
                  {data.productivity_timeline && data.productivity_timeline.length > 0 ? (
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Historical Productivity Trend</h4>
                          <p className="text-[10px] text-slate-400">Submission 50% • Quality 30% • Attendance 20%</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {data.productivity_timeline.length} Recorded Days
                        </span>
                      </div>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.productivity_timeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', background: '#0f172a', color: '#fff', border: 'none' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                            <Line type="monotone" dataKey="productivity_score" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Productivity" />
                            <Line type="monotone" dataKey="submission_score" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" name="Submission" />
                            <Line type="monotone" dataKey="quality_score" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="2 2" name="Quality" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No multi-day productivity records found for this employee yet.
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 3: Timeline ───────────────────────── */}
              {activeProfileTab === 'timeline' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
                  {/* Attendance Log */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>Attendance Audit</span>
                      <span className="text-[10px] text-slate-400 font-normal">Last 15 records</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-500 sticky top-0 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">In Time</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.recent_attendance?.map((a, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono text-slate-600 text-[10px]">{a.date}</td>
                              <td className="p-2 font-semibold text-slate-700">{a.punch_in_time || '—'}</td>
                              <td className="p-2"><StatusBadge status={a.attendance_status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Reports Log */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>Report Submissions</span>
                      <span className="text-[10px] text-slate-400 font-normal">Last 15 records</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-500 sticky top-0 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Quality</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.recent_reports?.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono text-slate-600 text-[10px]">{r.date}</td>
                              <td className="p-2"><StatusBadge status={r.report_status} /></td>
                              <td className="p-2"><StatusBadge status={r.quality_rating} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Hontime • Verified Employee Master</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-xs active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
