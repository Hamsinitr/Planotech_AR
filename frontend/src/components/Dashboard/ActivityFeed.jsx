import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  Sparkles,
  Send
} from 'lucide-react';

export const ActivityFeed = ({
  prodSummary,
  attSummary,
  repSummary,
  selectedDate,
  onSelectEmployee
}) => {
  const { showToast } = useToast();
  // Store likes and comments in local state for snappy interactivity
  const [likes, setLikes] = useState({
    'post-1': { count: 34, liked: false },
    'post-2': { count: 28, liked: false },
    'post-3': { count: 19, liked: false },
    'post-4': { count: 42, liked: false },
  });

  const [comments, setComments] = useState({
    'post-1': [
      { user: 'Operations Team', text: 'Incredible dedication! Keep up the brilliant pace 👏', time: '1h ago' },
      { user: 'Kavita M.', text: 'Well deserved recognition! 🚀', time: '35m ago' }
    ],
    'post-2': [
      { user: 'Admin', text: 'Zero late check-ins — benchmark discipline for the company!', time: '2h ago' }
    ],
    'post-3': [
      { user: 'Quality Team', text: 'High clarity and thorough task breakdown.', time: '4h ago' }
    ]
  });

  const [inputComments, setInputComments] = useState({});
  const [activeFloatingHeart, setActiveFloatingHeart] = useState(null);

  const handleLike = (postId) => {
    setLikes((prev) => {
      const current = prev[postId] || { count: 15, liked: false };
      const nextLiked = !current.liked;
      return {
        ...prev,
        [postId]: {
          count: nextLiked ? current.count + 1 : current.count - 1,
          liked: nextLiked
        }
      };
    });

    // Animate floating heart
    setActiveFloatingHeart(postId);
    setTimeout(() => setActiveFloatingHeart(null), 1000);
  };

  const handleAddComment = (postId) => {
    const text = inputComments[postId]?.trim();
    if (!text) return;

    setComments((prev) => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        { user: 'You (Team)', text, time: 'Just now' }
      ]
    }));

    setInputComments((prev) => ({ ...prev, [postId]: '' }));
  };

  // Generate feed posts from real summary data
  const posts = [];

  // Post 1: Top Ranked Employee
  const top1 = prodSummary?.top_performers?.[0];
  if (top1) {
    posts.push({
      id: 'post-1',
      author: top1.employee_name,
      department: top1.department,
      time: selectedDate ? `${selectedDate} • 09:30 AM` : 'Today • 09:30 AM',
      type: 'LEADERBOARD CHAMPION',
      avatar: top1.employee_name.charAt(0).toUpperCase(),
      title: '👑 Ranked #1 on Today\'s Productivity Leaderboard',
      caption: `Huge shoutout to ${top1.employee_name} for securing the #1 spot on today's Productivity Leaderboard with an impeccable score of ${top1.productivity_score}/100! Zero delays, complete reports, top-tier work.`,
      score: top1.productivity_score,
      badgeText: 'Rank #1 Overall',
      stats: [
        { label: 'Overall Score', val: `${top1.productivity_score}/100` },
        { label: 'Report Status', val: 'Submitted' },
        { label: 'Punch-In Status', val: 'On Time' },
      ],
      employeeName: top1.employee_name
    });
  }

  // Post 2: Department Punctuality
  const onTimeDept = (attSummary?.summary_1 || []).find(d => d.after_945 === 0 && d.total_individuals > 0);
  if (onTimeDept) {
    posts.push({
      id: 'post-2',
      author: onTimeDept.department,
      department: 'Department Spotlight',
      time: selectedDate ? `${selectedDate} • 10:00 AM` : 'Today • 10:00 AM',
      type: 'PERFECT PUNCTUALITY',
      avatar: '⚡',
      title: `⚡ 100% On-Time Record: ${onTimeDept.department}`,
      caption: `Exceptional punctuality milestone! Every team member in ${onTimeDept.department} checked in on time before grace period. Setting the gold standard for daily discipline.`,
      badgeText: 'Zero Late Arrivals',
      stats: [
        { label: 'Total Present', val: onTimeDept.total_individuals - onTimeDept.not_punched_or_absent },
        { label: 'Late Punch-ins', val: '0' },
        { label: 'Compliance', val: '100%' },
      ]
    });
  }

  // Post 3: Quality Reports Spotlight
  const topReportDept = (repSummary?.quality_summary || []).find(q => q.avg_quality_score >= 80);
  if (topReportDept) {
    posts.push({
      id: 'post-3',
      author: `${topReportDept.department} Team`,
      department: 'Report Operations',
      time: selectedDate ? `${selectedDate} • 11:15 AM` : 'Today • 11:15 AM',
      type: 'QUALITY EXCELLENCE',
      avatar: '📝',
      title: `🌟 Outstanding Daily Report Quality (${Math.round(topReportDept.avg_quality_score)}%)`,
      caption: `${topReportDept.department} achieved a stellar quality score of ${Math.round(topReportDept.avg_quality_score)}% across daily submissions with detailed execution logs and project updates.`,
      badgeText: 'Top Quality Tier',
      stats: [
        { label: 'Avg Quality', val: `${Math.round(topReportDept.avg_quality_score)}%` },
        { label: 'Submitted', val: topReportDept.submitted },
        { label: 'Pending', val: topReportDept.not_submitted || '0' },
      ]
    });
  }

  // Post 4: Runner up / Second star performer
  const top2 = prodSummary?.top_performers?.[1];
  if (top2) {
    posts.push({
      id: 'post-4',
      author: top2.employee_name,
      department: top2.department,
      time: selectedDate ? `${selectedDate} • 09:30 AM` : 'Today • 09:30 AM',
      type: 'STAR PERFORMER',
      avatar: top2.employee_name.charAt(0).toUpperCase(),
      title: `⭐ High Performer: ${top2.employee_name}`,
      caption: `Consistent excellence! ${top2.employee_name} from ${top2.department} recorded an outstanding productivity score of ${top2.productivity_score}/100 today.`,
      score: top2.productivity_score,
      badgeText: 'Top 3 Performer',
      stats: [
        { label: 'Score', val: `${top2.productivity_score}/100` },
        { label: 'Department', val: top2.department },
        { label: 'Category', val: 'Top Performer' },
      ],
      employeeName: top2.employee_name
    });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {posts.map((post) => {
        const postLikes = likes[post.id] || { count: 18, liked: false };
        const postComments = comments[post.id] || [];

        return (
          <article
            key={post.id}
            className="insta-card overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-sm"
          >
            {/* Post Header (Instagram style) */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full insta-gradient-ring p-0.5 flex-shrink-0 cursor-pointer"
                  onClick={() => post.employeeName && onSelectEmployee && onSelectEmployee(post.employeeName)}
                >
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                    {post.avatar}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition leading-tight"
                      onClick={() => post.employeeName && onSelectEmployee && onSelectEmployee(post.employeeName)}
                    >
                      {post.author}
                    </h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {post.department} • <span className="text-slate-500 font-medium">{post.time}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {post.badgeText}
                </span>
              </div>
            </div>

            {/* Post Content Graphic / Hero Media */}
            <div
              className="p-6 sm:p-8 relative overflow-hidden select-none cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)'
              }}
              onDoubleClick={() => handleLike(post.id)}
            >
              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              />

              {/* Floating Heart Popup when double-tapped or liked */}
              {activeFloatingHeart === post.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="animate-float-heart text-6xl text-rose-500 drop-shadow-2xl">
                    ❤️
                  </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl insta-gradient-ring p-0.5 shadow-xl mb-3 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-2xl font-black text-white">
                    {post.avatar}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-bold tracking-wider mb-2 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {post.type}
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-2 max-w-md">
                  {post.title}
                </h3>

                {/* Stat Badges Row */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm mt-3">
                  {post.stats.map((s, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">{s.label}</span>
                      <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block truncate">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instagram Action Bar */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Heart / Like Button */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 group active:scale-75 transition-transform"
                    aria-label="Like post"
                  >
                    <Heart
                      className={`w-6 h-6 transition-all duration-200 ${
                        postLikes.liked
                          ? 'fill-rose-500 text-rose-500 scale-110'
                          : 'text-slate-700 group-hover:text-rose-500'
                      }`}
                    />
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => {
                      const input = document.getElementById(`comment-input-${post.id}`);
                      if (input) input.focus();
                    }}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition active:scale-90"
                    aria-label="Comment on post"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Recognition post link copied to clipboard!', 'success');
                      }
                    }}
                    className="text-slate-700 hover:text-blue-600 transition active:scale-90"
                    aria-label="Share post"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {post.employeeName && onSelectEmployee && (
                  <button
                    onClick={() => onSelectEmployee(post.employeeName)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    View Record →
                  </button>
                )}
              </div>

              {/* Likes Count */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border border-white" />
                  <div className="w-4 h-4 rounded-full bg-purple-500 border border-white" />
                  <div className="w-4 h-4 rounded-full bg-rose-500 border border-white" />
                </div>
                <p className="text-xs font-bold text-slate-900">
                  Liked by <span className="font-extrabold text-blue-600">Operations Team</span> and{' '}
                  <span className="font-extrabold">{postLikes.count} others</span>
                </p>
              </div>

              {/* Caption */}
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 mr-1.5">{post.author}</span>
                {post.caption}
              </p>

              {/* Existing Comments */}
              {postComments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {postComments.map((c, i) => (
                    <div key={i} className="text-xs flex items-baseline gap-2">
                      <span className="font-bold text-slate-800 flex-shrink-0">{c.user}</span>
                      <span className="text-slate-600 flex-1">{c.text}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{c.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  id={`comment-input-${post.id}`}
                  type="text"
                  placeholder="Drop a cheer or congratulatory note..."
                  value={inputComments[post.id] || ''}
                  onChange={(e) =>
                    setInputComments((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(post.id);
                  }}
                  className="flex-1 text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  disabled={!inputComments[post.id]?.trim()}
                  className="p-2 rounded-full insta-gradient-btn text-white disabled:opacity-30 disabled:pointer-events-none transition active:scale-90"
                  aria-label="Post comment"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
