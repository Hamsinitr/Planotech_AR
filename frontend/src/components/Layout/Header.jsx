import React, { useEffect, useState } from 'react';
import { Calendar, LogOut, FileSpreadsheet, RefreshCw, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const Header = ({ activeTab, selectedDate, setSelectedDate, onRefresh, onToggleSidebar }) => {
  const { logout } = useAuth();
  const [availableDates, setAvailableDates] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/upload-history')
      .then((res) => {
        const dates = res.data.map((h) => h.date);
        setAvailableDates(dates);
        if (!selectedDate && dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDownloadExcel = async () => {
    if (!selectedDate || downloading) return;
    setDownloading(true);
    try {
      const response = await api.get(`/export/${selectedDate}/excel`, {
        responseType: 'blob',
      });
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
      console.error('Download error:', err);
      alert('Failed to download Excel file. Please make sure data exists for this date.');
    } finally {
      setDownloading(false);
    }
  };

  const titles = {
    dashboard: 'HR Executive Dashboard',
    upload: 'Daily Excel Ingestion',
    attendance: 'Attendance Department Summaries',
    reports: 'Report Submission & Quality',
    productivity: 'Productivity Leaderboard',
    employees: 'Employee Master Directory',
    analytics: 'Historical Trends & Analytics',
    history: 'Upload Audit History',
    settings: 'Scoring Weights & Configuration',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Drawer Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1">{titles[activeTab] || 'HR Analytics'}</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">Continuous reconciliation and daily productivity tracking</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Date Selector */}
        {availableDates.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            <select
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Download Excel Button */}
        {selectedDate && (
          <button
            onClick={handleDownloadExcel}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            title="Download Master 9-Sheet Processed Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{downloading ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="h-4 w-px bg-slate-200" />

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
