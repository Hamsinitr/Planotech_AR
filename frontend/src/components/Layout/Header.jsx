import React, { useEffect, useState, useRef } from 'react';
import {
  Calendar,
  LogOut,
  FileSpreadsheet,
  RefreshCw,
  Menu,
  ChevronDown,
  Search,
  Bell,
  X,
  User,
  ArrowRight,
  Clock,
  FileText,
  Trophy,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const Header = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  onRefresh,
  onToggleSidebar,
  onSelectEmployee
}) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [availableDates, setAvailableDates] = useState([]);
  const [downloading, setDownloading] = useState(false);

  // Omnisearch State (Amazon / Instagram style)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Notification Bell State
  const [notifOpen, setNotifOpen] = useState(false);
  const [attentionData, setAttentionData] = useState(null);
  const notifContainerRef = useRef(null);

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

  // Fetch attention metrics for notification bell badge
  useEffect(() => {
    if (selectedDate) {
      api.get(`/analytics/attention?date=${selectedDate}`)
        .then((res) => setAttentionData(res.data))
        .catch(() => {});
    }
  }, [selectedDate]);

  // Global Keyboard Shortcut: '/' to focus Omnisearch
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search/notifs when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Employee Search query
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchLoading(true);
      api.get(`/employees?search=${encodeURIComponent(term)}`)
        .then((res) => {
          setSearchResults(res.data || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDownloadExcel = async () => {
    if (!selectedDate || downloading) return;
    setDownloading(true);
    showToast(`Preparing 9-Sheet Master Excel for ${selectedDate}...`, 'info');
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
      showToast(`Master Excel for ${selectedDate} exported successfully!`, 'success');
    } catch (err) {
      showToast('Failed to download Excel file. Please ensure data exists for this date.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleManualRefresh = () => {
    if (onRefresh) {
      onRefresh();
      showToast('Dashboard refreshed with latest data.', 'info', 2000);
    }
  };

  const handleSelectSearchResult = (empName) => {
    if (onSelectEmployee) {
      onSelectEmployee(empName);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelectModule = (tabId) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const titles = {
    dashboard: 'Executive Operations Dashboard',
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

  const totalAlerts = (attentionData?.repeated_late?.length || 0) +
    (attentionData?.repeated_missing_reports?.length || 0) +
    (attentionData?.absent_today?.length || 0);

  const quickNavModules = [
    { id: 'dashboard', label: 'Dashboard & Stories', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance Records', icon: Clock },
    { id: 'reports', label: 'Work Reports & Quality', icon: FileText },
    { id: 'productivity', label: 'Productivity Leaderboard', icon: Trophy },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm gap-2 sm:gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            {titles[activeTab] || 'Analytics Dashboard'}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {subtitles[activeTab] || ''}
          </p>
        </div>
      </div>

      {/* Center: Amazon-style Omnisearch Bar */}
      <div ref={searchContainerRef} className="flex-1 max-w-md mx-2 relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search employees, departments, records... (Press /)"
            className="w-full pl-9 pr-8 py-1.5 rounded-full text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <span className="hidden lg:inline absolute right-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-slate-400 bg-slate-200/60 border border-slate-300/60 pointer-events-none">
              /
            </span>
          )}
        </div>

        {/* Omnisearch Results Dropdown */}
        {searchOpen && (searchQuery.trim() || searchResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-up max-h-[75vh] overflow-y-auto">
            {/* Quick Modules */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Jump to View</span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {quickNavModules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectModule(m.id)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white text-left transition text-xs font-semibold text-slate-700 hover:text-blue-600"
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Employees Search Results */}
            <div className="p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Employees ({searchResults.length})
              </span>

              {searchLoading ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium animate-pulse">
                  Searching directory...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No employee matching "<span className="font-semibold text-slate-600">{searchQuery}</span>"
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  {searchResults.slice(0, 8).map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleSelectSearchResult(emp.name)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
                            {emp.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {emp.department} {emp.employee_id && `• ${emp.employee_id}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Date Selector, Notifications, Export, Refresh, Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Date Selector */}
        {availableDates.length > 0 && (
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none hidden sm:block" />
            <select
              value={selectedDate || ''}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                showToast(`Switched date to ${e.target.value}`, 'info', 2000);
              }}
              className="pl-2 sm:pl-8 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none cursor-pointer transition"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        )}

        {/* Notifications Bell Dropdown */}
        <div ref={notifContainerRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition relative active:scale-95"
            title="Operational Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fade-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900">Today's Notifications</h4>
                  {totalAlerts > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {totalAlerts}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {attentionData?.repeated_late?.length > 0 && (
                  <div
                    onClick={() => {
                      if (setActiveTab) setActiveTab('attendance');
                      setNotifOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 cursor-pointer hover:bg-amber-100/70 transition flex items-start gap-2"
                  >
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{attentionData.repeated_late.length} Frequent Late Arrivals</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">Review punch-in records and grace periods</p>
                    </div>
                  </div>
                )}

                {attentionData?.repeated_missing_reports?.length > 0 && (
                  <div
                    onClick={() => {
                      if (setActiveTab) setActiveTab('reports');
                      setNotifOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 cursor-pointer hover:bg-rose-100/70 transition flex items-start gap-2"
                  >
                    <FileText className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{attentionData.repeated_missing_reports.length} Missing Reports</p>
                      <p className="text-[10px] text-rose-700 mt-0.5">Click to audit non-submission compliance</p>
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Master Roster Active</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">60 active verified employee profiles</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        {selectedDate && (
          <button
            onClick={handleDownloadExcel}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 active:scale-95 shadow-sm"
            style={{ background: downloading ? '#94a3b8' : 'linear-gradient(135deg, #059669, #10b981)' }}
            title="Download 9-Sheet Processed Master Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{downloading ? 'Exporting...' : 'Export Master'}</span>
          </button>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={handleManualRefresh}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition active:scale-95"
            title="Refresh Data"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:inline font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
