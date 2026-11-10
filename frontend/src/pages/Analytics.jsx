import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import api from '../api/client';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, AreaChart, Area, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-[130px]">
      {label && <p className="text-slate-400 mb-1.5 font-semibold text-[10px] uppercase tracking-wider">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex justify-between gap-3">
          <span>{p.name}</span><span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div className="chart-card p-5">
    <div className="section-header">
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

export const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/trends?days=${range}`);
      setTrends(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse-soft">
        <div className="shimmer h-8 w-72 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const subTrend = trends?.submission_trend || [];
  const attTrend = trends?.attendance_trend || [];
  const prodTrend = trends?.productivity_trend || [];
  const avgProd = prodTrend.length > 0
    ? Math.round(prodTrend.reduce((s, r) => s + (r.avg_productivity || 0), 0) / prodTrend.length)
    : 0;

  return (
    <div className="p-5 space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">Historical Trends & Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Multi-day trends across attendance, report submission, quality, and productivity
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
          {[
            { label: '7 Days', val: 7 },
            { label: '30 Days', val: 30 },
            { label: '90 Days', val: 90 },
          ].map(r => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                range === r.val
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {subTrend.length === 0 && attTrend.length === 0 && prodTrend.length === 0 ? (
        <div className="chart-card empty-state py-20">
          <div className="empty-state-icon mx-auto"><BarChart3 className="w-7 h-7 text-slate-300" /></div>
          <p className="text-sm font-medium text-slate-500">No trend data available</p>
          <p className="text-xs text-slate-400 mt-1">Upload more daily data to generate trend charts.</p>
        </div>
      ) : (
        <>
          {/* Row 1: Submission + Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Report Submission Trend"
              subtitle="Daily submitted vs not-submitted reports"
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subTrend} barSize={12} barGap={3}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="submitted"     fill="#10b981" name="Submitted"     radius={[3,3,0,0]} />
                    <Bar dataKey="not_submitted" fill="#f43f5e" name="Not Submitted" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Attendance Trend"
              subtitle="Present, absent, and late punch-in counts over time"
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attTrend}>
                    <defs>
                      <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fill="url(#gPresent)" name="Present" dot={false} />
                    <Area type="monotone" dataKey="absent"  stroke="#94a3b8" strokeWidth={2} fill="url(#gAbsent)"  name="Absent"  dot={false} />
                    <Area type="monotone" dataKey="late"    stroke="#f59e0b" strokeWidth={2} fill="url(#gLate)"    name="Late"    dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Row 2: Productivity Trend (full width) */}
          <ChartCard
            title="Average Productivity Score Trend"
            subtitle={`Company-wide average productivity score over ${range} days · Current avg: ${avgProd}/100`}
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prodTrend}>
                  <defs>
                    <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.4}
                    label={{ value: 'Target 70', fill: '#3b82f6', fontSize: 9, opacity: 0.6 }} />
                  <Line
                    type="monotone"
                    dataKey="avg_productivity"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    name="Avg Productivity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
};

export default Analytics;
