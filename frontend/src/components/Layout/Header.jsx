import React, { useEffect, useState } from 'react';
import { Calendar, LogOut, FileSpreadsheet, RefreshCw, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const Header = ({ activeTab, selectedDate, setSelectedDate, onRefresh, onToggleSidebar }) => {
  const { logout } = useAuth();
  const [availableDates, setAvailableDates] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const loadDates = () => {
    api.get('/upload-history')
      .then((res) => {
        const dates = [...new Set(res.data.map((h) => h.date))].sort().reverse();
        setAvailableDates(dates);
        if (!selectedDate && dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadDates();
  }, []);

  const handleDownloadExcel = async () => {
    if (!selectedDate || downloading) return;
    setDownloading(true);
    try {
      const response = await api.get(`/export/${selectedDate}/excel`, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Analysis_${selectedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download Excel file. Please make sure data exists for this date.');
    } finally {
      setDownloading(false);
    }
  };

  const titles = {
    dashboard: 'HR Executive Dashboard',
    upload: 'Daily Excel Ingestion',
    attendance: 'Attendance Analysis',
    reports: 'Report Submission & Quality',
    productivity: 'Productivity Leaderboard',
    employees: 'Employee Directory',
    analytics: 'Historical Trends & Analytics',
    history: 'Upload Audit History',
    settings: 'System Configuration',
  };

  const subtitles = {
    dashboard: 'Real-time KPIs, alerts, and department analytics',
    upload: 'Process attendance and daily report Excel files',
    attendance: 'Frequency-based late arrivals and department summaries',
    reports: 'Submission compliance, quality scoring, and employee report evaluations',
    productivity: 'Weighted composite scores ranked by performance',
    employees: 'Employee master records and individual history',
    analytics: 'Multi-day trends across all metrics',
    history: 'Audit trail of all uploaded and processed files',
    settings: 'Configure scoring weights and system defaults',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            {titles[activeTab] || 'HR Analytics'}
          </h2>
          <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
            {subtitles[activeTab] || ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Date Selector */}
        {availableDates.length > 0 && (
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none cursor-pointer transition"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        )}

        {/* Export Button */}
        {selectedDate && (
          <button
            onClick={handleDownloadExcel}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: downloading ? '#94a3b8' : 'linear-gradient(135deg, #059669, #10b981)' }}
            title="Download 9-Sheet Processed Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{downloading ? 'Exporting...' : 'Export'}</span>
          </button>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
