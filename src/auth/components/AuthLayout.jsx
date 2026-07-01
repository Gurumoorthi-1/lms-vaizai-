/**
 * AuthLayout — Premium split-screen auth wrapper.
 * Left panel: animated branding with floating cards.
 * Right panel: form area with logo + slot content.
 *
 * Responsive behaviour:
 *  - Mobile  : branding panel on top (compact), form below (stacked vertically)
 *  - Desktop : original side-by-side split layout
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Award, Users, ShieldCheck } from 'lucide-react';

const floatingCards = [
  { icon: BookOpen,    label: 'React 19 Masterclass', sub: '2,400 students enrolled', delay: '0s'   },
  { icon: Award,       label: 'Top Rated Course',      sub: '★ 4.9 by 980 learners',  delay: '1.5s' },
  { icon: Users,       label: 'Live Cohort Session',   sub: 'Starting in 10 minutes',  delay: '3s'   },
  { icon: ShieldCheck, label: 'OWASP Security Track',  sub: 'Enroll before Feb 1',     delay: '4.5s' },
];

export default function AuthLayout({ children, title, subtitle, backTo, backLabel }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Left Branding Panel ── */}
      <div className="flex flex-col lg:w-[52%] xl:w-[55%] relative overflow-hidden
                      bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">

        {/* Mesh background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #818cf8 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, #a78bfa 0%, transparent 50%)`
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-6 lg:px-12 py-6 lg:py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Vaizai LMS</span>
          </div>

          {/* Headline + Stats */}
          <div className="mt-6 lg:mt-auto mb-6 lg:mb-10">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Learn Without
              <br />
              <span className="text-indigo-200">Boundaries.</span>
            </h1>
            <p className="mt-3 lg:mt-4 text-indigo-200 text-sm lg:text-base leading-relaxed max-w-sm">
              Access world-class courses, interactive quizzes, and expert feedback — all in one secure platform.
            </p>

            {/* Stats row */}
            <div className="mt-6 lg:mt-8 flex items-center gap-6 lg:gap-8">
              {[
                { value: '12K+', label: 'Active Learners' },
                { value: '240+', label: 'Courses' },
                { value: '98%',  label: 'Satisfaction' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-xl lg:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-indigo-300 font-medium mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating activity cards — 2-col grid on mobile, single col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3 mb-4">
            {floatingCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20
                             rounded-xl px-3 lg:px-4 py-2 lg:py-3 animate-pulse-slow"
                  style={{ animationDelay: card.delay }}
                >
                  <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold leading-none">{card.label}</p>
                    <p className="text-indigo-300 text-[10px] mt-0.5">{card.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12">
          <div className="w-full max-w-md">

            {/* Back link */}
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400
                           hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {backLabel || 'Back'}
              </Link>
            )}

            {/* Page heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Slot — form content from Login / Register etc. */}
            {children}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-800">
          © {new Date().getFullYear()} Vaizai LMS — All rights reserved.
        </div>

      </div>
    </div>
  );
}
