import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import {
  Search, MessageSquare, ThumbsUp, Bookmark, BookmarkCheck, Pin, Filter,
  Plus, Tag, Eye, Clock, ChevronDown, ChevronUp, X, Send, User,
  ArrowUpDown, TrendingUp, Flame, SlidersHorizontal, MessageCircle
} from 'lucide-react';

/* ─── role badge helper ─────────────────────────────────────────────────── */
const roleBadge = (role) => {
  const m = {
    ADMIN:   'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    TEACHER: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    STUDENT: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${m[role] || m.STUDENT}`}>
      {role}
    </span>
  );
};

/* ─── avatar helper ─────────────────────────────────────────────────────── */
const Avatar = ({ name, role, size = 'sm' }) => {
  const colors = { ADMIN: 'from-rose-500 to-pink-600', TEACHER: 'from-amber-500 to-orange-600', STUDENT: 'from-indigo-500 to-purple-600' };
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[role] || colors.STUDENT} flex items-center justify-center text-white font-bold shrink-0`}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
};

/* ─── skeleton loader ───────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-4 w-6 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

/* ─── Nested Reply Component ────────────────────────────────────────────── */
function ReplyThread({ reply, depth = 0, onReply }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = () => {
    if (!replyText.trim()) return;
    onReply(reply.id, replyText);
    setReplyText('');
    setShowReplyInput(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/50' : ''}`}>
      <div className={`py-3 group rounded-xl px-3 transition-all ${
        ['TEACHER','INSTRUCTOR','ADMIN'].includes(reply.authorRole)
          ? 'bg-amber-50/40 dark:bg-amber-950/10 border-l-4 border-amber-500 dark:border-amber-600 my-1'
          : ''
      }`}>
        <div className="flex items-start gap-3">
          <Avatar name={reply.authorName} role={reply.authorRole} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{reply.authorName}</span>
              {roleBadge(reply.authorRole)}
              {['TEACHER','INSTRUCTOR','ADMIN'].includes(reply.authorRole) && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-wide">
                  ✦ Expert Answer
                </span>
              )}
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ThumbsUp className="h-3.5 w-3.5" /> {reply.votes || 0}
              </button>
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Reply
              </button>
            </div>

            {showReplyInput && (
              <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!replyText.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {reply.replies?.map(child => (
        <ReplyThread key={child.id} reply={child} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DiscussionForum() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [replyText, setReplyText] = useState('');

  /* new question form */
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getForumQuestions();
      if (Array.isArray(data)) {
        setQuestions(data);
      } else if (data && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        setQuestions([]);
      }
    } catch (_e) {
      setQuestions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  /* ── derived data ──────────────────────────────────────────────────────── */
  const categories = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return [...new Set(questions.map(q => q.category).filter(Boolean))];
  }, [questions]);

  const allTags = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return [...new Set(questions.flatMap(q => q.tags || []).filter(Boolean))];
  }, [questions]);

  const filtered = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    let list = [...questions];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(q => q && q.title && q.description && (q.title.toLowerCase().includes(s) || q.description.toLowerCase().includes(s)));
    }
    if (selectedCategory) list = list.filter(q => q.category === selectedCategory);
    if (selectedTag) list = list.filter(q => q.tags?.includes(selectedTag));

    /* sort: pinned always first */
    const pinned = list.filter(q => q.isPinned);
    const rest = list.filter(q => !q.isPinned);
    const sortFn = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      votes:  (a, b) => b.votes - a.votes,
      views:  (a, b) => b.views - a.views,
      trending: (a, b) => (b.votes + (b.replies?.length || 0) * 2) - (a.votes + (a.replies?.length || 0) * 2),
    };
    rest.sort(sortFn[sortBy] || sortFn.newest);
    return [...pinned, ...rest];
  }, [questions, search, selectedCategory, selectedTag, sortBy]);

  /* ── actions ───────────────────────────────────────────────────────────── */
  const handleVote = async (id) => {
    const updated = await api.voteForumQuestion(id);
    if (updated) setQuestions(prev => prev.map(q => q.id === id ? { ...q, votes: updated.votes } : q));
  };

  const handleBookmark = async (id) => {
    const updated = await api.bookmarkForumQuestion(id);
    if (updated) setQuestions(prev => prev.map(q => q.id === id ? { ...q, bookmarks: updated.bookmarks } : q));
  };

  const handleReply = async (questionId, parentReplyId, content) => {
    const updated = await api.createForumReply(questionId, { content }, parentReplyId);
    if (updated) setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setCreating(true);
    try {
      const q = await api.createForumQuestion({
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setQuestions(prev => [q, ...prev]);
      setShowCreateModal(false);
      setNewTitle(''); setNewDesc(''); setNewTags('');
    } catch (_e) { /* ignore */ }
    setCreating(false);
  };

  const countReplies = (replies) => {
    if (!replies) return 0;
    return replies.reduce((sum, r) => sum + 1 + countReplies(r.replies), 0);
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-[80vh]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Discussion Forum
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ask questions, share knowledge, learn together</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Ask Question
        </button>
      </div>

      {/* ── Search + Sort Bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'newest', label: 'Newest', icon: Clock },
            { key: 'votes', label: 'Top', icon: ThumbsUp },
            { key: 'views', label: 'Views', icon: Eye },
            { key: 'trending', label: 'Hot', icon: Flame },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                sortBy === s.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <s.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <div className="flex gap-6">
        {/* Filter Sidebar (desktop always, mobile toggle) */}
        <aside className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:w-56 shrink-0 space-y-5 ${showFilters ? 'mb-4 sm:mb-0' : ''}`}>
          {/* Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  !selectedCategory ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCategory === cat ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Popular Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Forum Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Questions</span><span className="font-bold text-slate-900 dark:text-white">{questions.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Answers</span><span className="font-bold text-slate-900 dark:text-white">{questions.reduce((s, q) => s + countReplies(q.replies), 0)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Categories</span><span className="font-bold text-slate-900 dark:text-white">{categories.length}</span></div>
            </div>
          </div>
        </aside>

        {/* Questions List */}
        <div className="flex-1 min-w-0 space-y-3">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <MessageSquare className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No questions found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {search ? 'Try a different search term' : 'Be the first to ask a question!'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all"
              >
                <Plus className="h-4 w-4 inline mr-1" /> Ask Question
              </button>
            </div>
          ) : (
            filtered.map(q => {
              const isExpanded = expandedId === q.id;
              const isBookmarked = q.bookmarks?.includes(user?.id);
              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? 'border-indigo-300 dark:border-indigo-700 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Vote column */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVote(q.id); }}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{q.votes}</span>
                        <span className="text-[10px] text-slate-400 font-medium">votes</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {q.isPinned && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                                <Pin className="h-3 w-3" /> PINNED
                              </span>
                            )}
                            <h3
                              onClick={() => setExpandedId(isExpanded ? null : q.id)}
                              className="text-base font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors leading-snug"
                            >
                              {q.title}
                            </h3>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBookmark(q.id); }}
                            className={`p-1.5 rounded-lg transition-all ${isBookmarked ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'}`}
                          >
                            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                          </button>
                        </div>

                        {!isExpanded && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{q.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                            {q.category}
                          </span>
                          {q.tags?.map(tag => (
                            <span key={tag} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">#{tag}</span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {countReplies(q.replies)} answers</span>
                            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {q.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar name={q.authorName} role={q.authorRole} />
                            <div className="text-right">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{q.authorName}</div>
                              <div className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                      {/* Full description */}
                      <div className="px-5 pt-4 pb-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{q.description}</p>
                      </div>

                      {/* Replies */}
                      <div className="px-5 pb-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          {countReplies(q.replies)} {countReplies(q.replies) === 1 ? 'Answer' : 'Answers'}
                        </h4>

                        <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                          {q.replies?.map(reply => (
                            <ReplyThread
                              key={reply.id}
                              reply={reply}
                              onReply={(parentId, content) => handleReply(q.id, parentId, content)}
                            />
                          ))}
                        </div>

                        {/* Add reply */}
                        <div className="mt-4">
                          {['TEACHER', 'INSTRUCTOR', 'ADMIN'].includes(user?.role) ? (
                            /* Teacher / Instructor / Admin — highlighted answer box */
                            <div className="rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/10 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wide">
                                  ✦ Teacher's Answer
                                </span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  Your response will be highlighted as an expert answer
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Avatar name={user?.firstName} role={user?.role} />
                                <div className="flex-1 flex gap-2">
                                  <input
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Write your expert answer…"
                                    className="flex-1 text-sm px-4 py-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && replyText.trim()) {
                                        handleReply(q.id, null, replyText);
                                        setReplyText('');
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (replyText.trim()) {
                                        handleReply(q.id, null, replyText);
                                        setReplyText('');
                                      }
                                    }}
                                    disabled={!replyText.trim()}
                                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-amber-500/30"
                                  >
                                    <Send className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Regular student reply box */
                            <div className="flex gap-2">
                              <Avatar name={user?.firstName} role={user?.role} />
                              <div className="flex-1 flex gap-2">
                                <input
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder="Write your answer…"
                                  className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && replyText.trim()) {
                                      handleReply(q.id, null, replyText);
                                      setReplyText('');
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (replyText.trim()) {
                                      handleReply(q.id, null, replyText);
                                      setReplyText('');
                                    }
                                  }}
                                  disabled={!replyText.trim()}
                                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-all active:scale-95"
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ Create Question Modal ═════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ask a Question</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What's your question? Be specific."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={5}
                  placeholder="Provide details, code snippets, and what you've tried so far…"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    {['General', 'React 19', 'Next.js', 'TypeScript', 'Node.js', 'CSS', 'Security', 'DevOps', 'Database', 'AI/ML'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                  <input
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="react, hooks, state"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newDesc.trim() || creating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all active:scale-95"
              >
                {creating ? 'Posting…' : 'Post Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
