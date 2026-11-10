import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileX,
  UserX,
  TrendingDown,
  MapPinOff,
  Search,
  ArrowRight,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const AttentionAlerts = ({ attentionData = {}, onSelectEmployee }) => {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unsubmitted' | 'late' | 'location' | 'absent' | 'unsub_repeat'
  const [search, setSearch] = useState('');

  const {
    absent_today = [],
    unsubmitted_today = [],
    repeated_unsubmitted = [],
    repeated_late = [],
    repeated_out_of_location = [],
    out_of_location_today = [],
  } = attentionData || {};

  // Normalize list with category identifiers
  const allItems = useMemo(() => {
    const list = [];

    unsubmitted_today.forEach(emp => {
      list.push({
        id: `unsub-${emp.employee_name}`,
        category: 'unsubmitted',
        categoryLabel: 'No Report Filed',
        categoryType: 'rose',
        employee_name: emp.employee_name,
        employee_id: emp.employee_id,
        department: emp.department,
        reason: 'Present today but report missing',
        badge: 'Missing Today',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        priority: 1,
      });
    });

    repeated_late.forEach(emp => {
      list.push({
        id: `late-${emp.employee_name}`,
        category: 'late',
        categoryLabel: 'Frequent Late Arrival',
        categoryType: 'amber',
        employee_name: emp.employee_name,
        employee_id: emp.employee_id,
        department: emp.department,
        reason: `Punched after 9:45 AM (${emp.late_count}× recorded)`,
        badge: `${emp.late_count}× Late`,
        badgeColor: emp.late_count >= 5 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200',
        priority: 2,
        count: emp.late_count,
      });
    });

    repeated_out_of_location.forEach(emp => {
      list.push({
        id: `ool-${emp.employee_name}`,
        category: 'location',
        categoryLabel: 'Location Violation',
        categoryType: 'rose',
        employee_name: emp.employee_name,
        employee_id: emp.employee_id,
        department: emp.department,
        reason: `Punched out of location (${emp.out_of_location_count}× recorded)`,
        badge: `${emp.out_of_location_count}× Location`,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        priority: 2,
        count: emp.out_of_location_count,
      });
    });

    repeated_unsubmitted.forEach(emp => {
      list.push({
        id: `unsub-rep-${emp.employee_name}`,
        category: 'unsub_repeat',
        categoryLabel: 'Chronic Non-Submitter',
        categoryType: 'purple',
        employee_name: emp.employee_name,
        employee_id: emp.employee_id,
        department: emp.department,
        reason: `Missed reports while present (${emp.unsubmitted_count}× recorded)`,
        badge: `${emp.unsubmitted_count}× Unsubmitted`,
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        priority: 3,
        count: emp.unsubmitted_count,
      });
    });

    absent_today.forEach(emp => {
      list.push({
        id: `absent-${emp.employee_name}`,
        category: 'absent',
        categoryLabel: 'Absent Today',
        categoryType: 'slate',
        employee_name: emp.employee_name,
        employee_id: emp.employee_id,
        department: emp.department,
        reason: emp.reason || 'Official absence / On Leave',
        badge: 'Absent',
        badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
        priority: 4,
      });
    });

    return list;
  }, [absent_today, unsubmitted_today, repeated_unsubmitted, repeated_late, repeated_out_of_location]);

  // Tab definitions
  const tabs = [
    { id: 'all', label: 'All Items', count: allItems.length, icon: Filter },
    { id: 'unsubmitted', label: 'Missing Report', count: unsubmitted_today.length, icon: FileX, color: 'text-rose-600', dot: 'bg-rose-500' },
    { id: 'late', label: 'Frequent Late', count: repeated_late.length, icon: Clock, color: 'text-amber-600', dot: 'bg-amber-500' },
    { id: 'location', label: 'Out of Location', count: repeated_out_of_location.length, icon: MapPinOff, color: 'text-rose-600', dot: 'bg-rose-500' },
    { id: 'unsub_repeat', label: 'Repeat Non-Submitters', count: repeated_unsubmitted.length, icon: TrendingDown, color: 'text-purple-600', dot: 'bg-purple-500' },
    { id: 'absent', label: 'Absent Today', count: absent_today.length, icon: UserX, color: 'text-slate-600', dot: 'bg-slate-400' },
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (activeTab !== 'all') {
      list = list.filter(item => item.category === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item =>
        item.employee_name?.toLowerCase().includes(q) ||
        item.employee_id?.toLowerCase().includes(q) ||
        item.department?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, activeTab, search]);

  if (!attentionData) return null;

  const totalUrgent = unsubmitted_today.length + repeated_late.length + repeated_out_of_location.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200">
      {/* ─── Header Banner ─── */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Operational Attention & Exceptions Hub
              </h3>
              {totalUrgent > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  {totalUrgent} Actionable
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated compliance audit: punch delays, missing reports, location violations, and absenteeism.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            {allItems.length} total flagged
          </span>
          <button
            type="button"
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ─── Body: Filter Controls + Items Grid ─── */}
      {expanded && (
        <div className="p-5 space-y-4">
          {/* Controls: Search + Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by employee name, ID, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>

            {/* Total Metric Pills */}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 overflow-x-auto pb-1 lg:pb-0">
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 whitespace-nowrap">
                {unsubmitted_today.length} No Report
              </span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 whitespace-nowrap">
                {repeated_late.length} Frequent Late
              </span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 whitespace-nowrap">
                {repeated_unsubmitted.length} Repeat Non-Submit
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : (tab.color || 'text-slate-400')}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-slate-800 text-amber-400'
                        : tab.count > 0
                        ? 'bg-slate-200/80 text-slate-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── Exception Items (Spacious 2-Column Responsive Grid) ─── */}
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No matching issues in this category</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All employees in this category meet requirements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEmployee && onSelectEmployee(item.employee_name)}
                  className="group relative bg-white hover:bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all duration-150 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Employee Name + Department + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/50 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0 group-hover:from-amber-100 group-hover:to-amber-200 group-hover:text-amber-900 group-hover:border-amber-300 transition">
                          {item.employee_name ? item.employee_name.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-700 transition">
                            {item.employee_name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.employee_id && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {item.employee_id}
                              </span>
                            )}
                            {item.employee_id && <span className="text-[10px] text-slate-300">•</span>}
                            <span className="text-[10px] text-slate-500 font-medium truncate">
                              {item.department || 'General'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    {/* Middle: Issue Reason */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="truncate pr-2">{item.reason}</span>
                      <span className="text-[10px] font-semibold text-slate-400 group-hover:text-amber-600 flex items-center gap-0.5 flex-shrink-0 transition">
                        Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttentionAlerts;
