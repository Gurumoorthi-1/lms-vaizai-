import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendLabel, 
  color = 'indigo' 
}) {
  
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    slate: 'bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white transition-transform duration-300 group-hover:-translate-y-0.5">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {(trendValue || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{trendValue}</span>
            </div>
          )}
          {trendLabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
