import React from 'react';
import { Flame, Clock, CheckSquare, Calendar, Mail, FileText } from 'lucide-react';

export default function StudentCard({ student, className = '', onManageClick }) {
  if (!student) return null;

  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`;
  const isOnline = student.lastActiveAt && (new Date() - new Date(student.lastActiveAt)) < 30 * 60 * 1000; // 30 mins

  return (
    <div className={`bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-950/40 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${className}`}>
      
      {/* Decorative background glow circles */}
      <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Main Profile Info */}
      <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black shadow-inner border border-indigo-400/20 text-white select-none uppercase">
            {initials}
          </div>
          {/* Status Indicator */}
          <span className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-4 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
        </div>

        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight truncate">{student.firstName} {student.lastName}</h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/10 text-indigo-200 border border-white/5 select-none">
              Student
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-1 text-slate-300 text-xs">
            <span className="flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">{student.email}</span>
            </span>
            <span className="flex items-center gap-1.5 justify-center sm:justify-start">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Joined {new Date(student.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
          </div>
        </div>

        {onManageClick && (
          <button
            onClick={onManageClick}
            className="sm:self-start bg-white/15 hover:bg-white/20 text-white font-medium text-xs py-2.5 px-4 rounded-xl border border-white/5 transition-all duration-200"
          >
            Manage Student
          </button>
        )}
      </div>

      {student.bio && (
        <p className="mt-5 text-slate-300 text-sm italic border-t border-slate-800/80 pt-4 relative z-10">
          "{student.bio}"
        </p>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-800/80 pt-4 relative z-10">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            Streak
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            {student.streak || 0} <span className="text-xs font-normal text-slate-400">days</span>
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left border-x border-slate-800/60 px-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-emerald-400" />
            Study Time
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            {student.timeSpentHours || 0} <span className="text-xs font-normal text-slate-400">hrs</span>
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            Lessons
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            {student.completedLessons || 0}<span className="text-xs font-normal text-slate-400">/{student.totalLessons || 20}</span>
          </span>
        </div>
      </div>

    </div>
  );
}
