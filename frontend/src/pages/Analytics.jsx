import React, { useEffect, useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import api from '../api/client';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, AreaChart, Area
} from 'recharts';

export const Analytics = ({ selectedDate }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/trends?days=${range}`);
      setTrends(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, [range]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading historical trends...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historical Trends & Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Multi-day trend analysis across attendance, submission, quality, and productivity.</p>
        </div>
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {[{ label: '7 Days', val: 7 }, { label: '30 Days', val: 30 }, { label: '90 Days', val: 90 }].map(r => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${range === r.val ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Submission Trend */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Report Submission Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Daily reports submitted vs not submitted</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.submission_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="submitted" fill="#10b981" name="Submitted" stackId="a" />
                <Bar dataKey="not_submitted" fill="#f43f5e" name="Not Submitted" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Attendance Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Present, absent, and late punch-in counts over time</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.attendance_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="present" stroke="#10b981" fill="#dcfce7" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#94a3b8" fill="#f1f5f9" name="Absent" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#fef3c7" name="Late" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Trend */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Average Productivity Score Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Company-wide average productivity score (0 – 100) over time</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.productivity_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg_productivity" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 5, fill: '#2563eb' }} name="Avg Productivity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
