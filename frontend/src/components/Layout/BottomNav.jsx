import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Plus,
  Trophy,
  Users,
  FileText,
  TrendingUp,
  History,
  Settings,
  MoreHorizontal,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Feed', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'upload', label: 'Ingest', icon: Plus, isCreate: true },
    { id: 'productivity', label: 'Ranks', icon: Trophy },
    { id: 'employees', label: 'People', icon: Users },
  ];

  const moreItems = [
    { id: 'reports', label: 'Reports & Quality', icon: FileText, desc: 'Submission compliance & audit' },
    { id: 'analytics', label: 'Trends & Analytics', icon: TrendingUp, desc: 'Multi-day performance curves' },
    { id: 'history', label: 'Upload History', icon: History, desc: 'Processed file logs & exports' },
    { id: 'settings', label: 'Scoring Settings', icon: Settings, desc: 'Formula weights configuration', adminOnly: true },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Sleek Instagram Bottom Sheet for "More" Navigation */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/80 p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-up">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg insta-gradient-ring flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="Hontime" className="w-full h-full object-contain rounded-[5px]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Hontime Portal</h3>
                  <p className="text-[10px] text-slate-400">Navigation & Account</p>
                </div>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Chip */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full insta-gradient-ring p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'HR Executive'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  <span className="text-[11px] text-slate-500 capitalize">{user?.role || 'Viewer'}</span>
                </div>
              </div>
            </div>

            {/* Additional Menu Items */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">More Modules</p>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sign Out */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Instagram-Style Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isCreate) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  aria-label="Upload daily files"
                  className="relative -top-3 flex flex-col items-center group active:scale-90 transition-transform"
                >
                  <div
                    className="w-13 h-13 rounded-2xl insta-gradient-btn flex items-center justify-center text-white shadow-xl ring-4 ring-white"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 mt-0.5 tracking-tight">Upload</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center h-full py-1.5 transition-all active:scale-90 relative ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-600 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center h-full py-1.5 transition-all active:scale-90 ${
              ['reports', 'analytics', 'history', 'settings'].includes(activeTab)
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
              {['reports', 'analytics', 'history', 'settings'].includes(activeTab) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium text-slate-500 tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
