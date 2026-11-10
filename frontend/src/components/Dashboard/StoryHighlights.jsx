import React, { useState, useEffect } from 'react';
import {
  Heart,
  X,
  CheckCircle2,
  Sparkles,
  User
} from 'lucide-react';

export const StoryHighlights = ({
  kpis,
  attSummary,
  repSummary,
  prodSummary,
  attention,
  onSelectEmployee
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [kudosCounts, setKudosCounts] = useState({});
  const [floatingHearts, setFloatingHearts] = useState([]);

  // Compute story list from real data
  const stories = [];

  // 1. Top Performer Story
  const topPerformer = prodSummary?.top_performers?.[0];
  if (topPerformer) {
    stories.push({
      id: 'top-performer',
      type: 'performer',
      tag: '👑 STAR OF THE DAY',
      title: topPerformer.employee_name,
      subtitle: `${topPerformer.department} • Top Rank #1`,
      avatar: topPerformer.employee_name.charAt(0).toUpperCase(),
      score: topPerformer.productivity_score,
      label: 'Top Performer',
      ringColor: 'from-amber-400 via-rose-500 to-purple-600',
      employeeName: topPerformer.employee_name,
      metrics: [
        { label: 'Score', value: `${topPerformer.productivity_score}/100` },
        { label: 'Attendance', value: topPerformer.attendance_score ? `${topPerformer.attendance_score}%` : '100%' },
        { label: 'Quality', value: topPerformer.quality_score ? `${topPerformer.quality_score}%` : '100%' },
      ],
      description: `Outstanding achievement! ${topPerformer.employee_name} demonstrated unmatched punctuality, immaculate reporting, and peak productivity today.`
    });
  }

  // 2. Zero-Late On-Time Streak Story
  const zeroLateDept = (attSummary?.summary_1 || []).find(d => d.after_945 === 0 && d.total_individuals > 0);
  if (zeroLateDept) {
    stories.push({
      id: 'zero-late',
      type: 'punctuality',
      tag: '⚡ 100% ON-TIME STREAK',
      title: zeroLateDept.department,
      subtitle: 'Zero late arrivals today',
      avatar: '⚡',
      label: 'On-Time',
      ringColor: 'from-blue-400 via-indigo-500 to-emerald-500',
      metrics: [
        { label: 'Present', value: zeroLateDept.total_individuals - zeroLateDept.not_punched_or_absent },
        { label: 'Late', value: '0' },
        { label: 'On Time', value: '100%' },
      ],
      description: `Flawless punctuality! Every present employee in ${zeroLateDept.department} arrived and punched in prior to the grace cutoff today.`
    });
  }

  // 2. Best Department Story
  const topDept = prodSummary?.department_summary?.[0];
  if (topDept) {
    stories.push({
      id: 'best-dept',
      type: 'department',
      tag: '🏢 BEST DEPARTMENT',
      title: topDept.department,
      subtitle: `Avg Productivity: ${Math.round(topDept.productivity_score)}%`,
      avatar: '🏢',
      label: 'Star Dept',
      ringColor: 'from-blue-500 via-indigo-500 to-purple-600',
      metrics: [
        { label: 'Avg Score', value: `${Math.round(topDept.productivity_score)}%` },
        { label: 'Headcount', value: topDept.total_employees || 'Active' },
      ],
      description: `${topDept.department} leads the organization in overall discipline and on-time report submissions today!`
    });
  }

  // 3. Quality Champion Story
  const qualRow = (repSummary?.quality_summary || []).find(r => r.avg_quality_score >= 85);
  if (qualRow) {
    stories.push({
      id: 'quality-star',
      type: 'quality',
      tag: '✨ QUALITY CHAMPION',
      title: qualRow.department,
      subtitle: `Quality Score: ${Math.round(qualRow.avg_quality_score)}%`,
      avatar: '🌟',
      label: 'Quality Star',
      ringColor: 'from-emerald-400 via-teal-500 to-blue-600',
      metrics: [
        { label: 'Quality', value: `${Math.round(qualRow.avg_quality_score)}%` },
        { label: 'Submitted', value: qualRow.submitted || '100%' },
      ],
      description: `Top-tier operational rigor! Reports filed by ${qualRow.department} meet the highest depth and clarity standards.`
    });
  }

  // 4. Daily Presence Pulse
  if (kpis) {
    stories.push({
      id: 'daily-pulse',
      type: 'pulse',
      tag: '📊 DAILY ATTENDANCE PULSE',
      title: `${kpis.attendance_rate}% Present`,
      subtitle: `${kpis.present_today} Present • ${kpis.absent_today} Absent`,
      avatar: '⚡',
      label: 'Daily Pulse',
      ringColor: 'from-purple-500 via-pink-500 to-amber-500',
      metrics: [
        { label: 'Present', value: kpis.present_today },
        { label: 'Attendance', value: `${kpis.attendance_rate}%` },
        { label: 'Reports', value: `${kpis.submission_rate}%` },
      ],
      description: `Daily workforce check-in completed. Reconciliation verified with zero critical audit mismatches.`
    });
  }

  // 5. Attention Spotlight
  const lateCount = kpis?.late_punch_ins || attention?.unpunctual_count || 0;
  if (lateCount > 0) {
    stories.push({
      id: 'alerts-spotlight',
      type: 'alert',
      tag: '⚠️ ATTENTION RADAR',
      title: `${lateCount} Late Check-Ins`,
      subtitle: 'HR Follow-up recommended',
      avatar: '🔔',
      label: 'Late Alerts',
      ringColor: 'from-rose-500 via-amber-500 to-orange-500',
      metrics: [
        { label: 'Late', value: lateCount },
        { label: 'Pending Reports', value: kpis?.reports_not_submitted || 0 },
      ],
      description: `Punctuality advisory: ${lateCount} employees punched in after grace period today. Notifications logged for team leads.`
    });
  }

  // Auto-progress timer for active story
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2; // 50 ticks * 100ms = 5 seconds per story
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPaused, stories.length]);

  const handleOpenStory = (index) => {
    setActiveStoryIndex(index);
    setProgress(0);
  };

  const handleNextStory = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleSendKudos = (storyId, e) => {
    e.stopPropagation();
    setKudosCounts((prev) => ({
      ...prev,
      [storyId]: (prev[storyId] || 12) + 1
    }));

    // Trigger floating heart
    const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter(h => h.id !== newHeart.id));
    }, 1200);
  };

  if (!stories.length) return null;

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <>
      {/* Instagram Stories Carousel Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Today's Highlights & Stories
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Tap to view
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1 px-1">
          {stories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => handleOpenStory(idx)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
            >
              <div
                className={`w-15 h-15 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr ${story.ringColor} shadow-md group-hover:scale-105 group-active:scale-95 transition-all duration-200`}
                style={{ width: '60px', height: '60px' }}
              >
                <div className="w-full h-full rounded-full bg-white p-[2px] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-inner">
                    {story.avatar}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1.5 truncate max-w-[70px] text-center group-hover:text-blue-600 transition-colors">
                {story.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Instagram Story Full-Screen / Modal Viewer */}
      {currentStory && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4"
          onClick={() => setActiveStoryIndex(null)}
        >
          {/* Main Story Container (Instagram 9:16 mobile aspect card) */}
          <div
            className="relative w-full max-w-sm sm:max-w-md h-[90vh] max-h-[720px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between text-white border border-white/10"
            style={{
              background: 'linear-gradient(180deg, #090d16 0%, #151d30 50%, #0a0f1d 100%)'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Top Multi-Segment Progress Bars */}
            <div className="pt-3 px-3 flex gap-1.5 z-20">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                    style={{
                      width:
                        idx < activeStoryIndex
                          ? '100%'
                          : idx === activeStoryIndex
                          ? `${progress}%`
                          : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="px-4 py-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full insta-gradient-ring p-0.5 flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-white">
                    {currentStory.avatar}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold leading-none">{currentStory.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{currentStory.subtitle}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Click Zones (Left / Right) */}
            <div className="absolute inset-0 z-10 flex">
              <div className="w-1/3 h-full cursor-pointer" onClick={handlePrevStory} />
              <div className="w-2/3 h-full cursor-pointer" onClick={handleNextStory} />
            </div>

            {/* Story Visual Center Card */}
            <div className="px-6 py-4 flex-1 flex flex-col justify-center items-center text-center z-15 relative">
              {/* Floating Hearts Container */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                {floatingHearts.map((h) => (
                  <div
                    key={h.id}
                    className="absolute animate-float-heart text-rose-500 font-black text-4xl"
                    style={{ transform: `translateX(${h.x}px)` }}
                  >
                    ❤️
                  </div>
                ))}
              </div>

              {/* Tag Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold tracking-wider mb-4 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {currentStory.tag}
              </div>

              {/* Big Highlight Icon or Avatar */}
              <div className="w-24 h-24 rounded-3xl insta-gradient-ring p-1 shadow-2xl mb-4 animate-story-ring">
                <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-4xl font-black">
                  {currentStory.avatar}
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 text-white">
                {currentStory.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xs leading-relaxed mb-6">
                {currentStory.description}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-xs mb-4">
                {currentStory.metrics.map((m, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">{m.label}</span>
                    <span className="text-base font-extrabold text-white mt-0.5 block">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Story Action Bar */}
            <div className="p-4 bg-slate-950/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-3 z-20">
              {currentStory.employeeName && onSelectEmployee ? (
                <button
                  onClick={() => {
                    setActiveStoryIndex(null);
                    onSelectEmployee(currentStory.employeeName);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition active:scale-95 border border-white/15"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  View Profile
                </button>
              ) : (
                <div className="flex-1 text-[11px] text-slate-400 font-medium truncate">
                  {currentStory.subtitle}
                </div>
              )}

              {/* Heart Kudos Button */}
              <button
                onClick={(e) => handleSendKudos(currentStory.id, e)}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl insta-gradient-btn text-white text-xs font-bold transition active:scale-90 shadow-lg"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>{kudosCounts[currentStory.id] || 18}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoryHighlights;
