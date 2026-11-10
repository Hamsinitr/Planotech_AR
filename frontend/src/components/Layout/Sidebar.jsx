import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  CalendarCheck,
  FileText,
  Award,
  Users,
  TrendingUp,
  History,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const navSections = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Trends & Analytics', icon: TrendingUp },
      ]
    },
    {
      label: 'Daily Operations',
      items: [
        { id: 'upload', label: 'Daily Upload', icon: UploadCloud },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'reports', label: 'Reports & Quality', icon: FileText },
        { id: 'productivity', label: 'Productivity', icon: Award },
      ]
    },
    {
      label: 'People',
      items: [
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'history', label: 'Upload History', icon: History },
        { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
      ]
    }
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        style={{ background: 'linear-gradient(180deg, #080c1a 0%, #0d1424 60%, #111b30 100%)' }}
        className={`fixed md:static top-0 bottom-0 left-0 z-50 w-60 text-slate-300 flex flex-col flex-shrink-0 h-full border-r border-white/5 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="Planotech"
              className="w-8 h-8 rounded-lg object-contain shadow-md flex-shrink-0 ring-1 ring-purple-500/30 bg-black/40"
            />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-none">PLANOTECH</h1>
              <p className="text-[9px] mt-0.5 font-semibold tracking-widest uppercase text-purple-400">
                HR Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-2.5 text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`nav-item w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'active text-slate-200'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`nav-icon w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-600'}`} />
                      <span className="nav-label flex-1 text-left">{item.label}</span>
                      {item.adminOnly && !isAdmin && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-blue-400/70 border border-white/10">
                          Admin
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center space-x-2.5 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'User'}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Viewer'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
