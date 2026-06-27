import React from 'react';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm flex flex-col space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-96"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-32 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Skeleton */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-96">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40 mb-6"></div>
          <div className="h-72 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full"></div>
        </div>

        {/* List Skeleton */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-96">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
