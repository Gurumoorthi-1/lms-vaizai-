import React from 'react';

export default function ProgressRing({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 10, 
  glow = true,
  className = '' 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90 transition-transform duration-500 hover:scale-105"
      >
        {/* Background Track */}
        <circle
          className="text-slate-100 dark:text-slate-800"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated Glow layer */}
        {glow && progress > 0 && (
          <circle
            className="text-indigo-500/20 dark:text-indigo-400/20 filter blur-[4px] transition-all duration-1000 ease-out"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth + 2}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        )}
        {/* Main Progress Arc */}
        <circle
          className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000 ease-out"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          {Math.round(progress)}%
        </span>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
          Done
        </span>
      </div>
    </div>
  );
}
