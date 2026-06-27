import React from 'react';

export default function LearningHeatmap({ activity = [] }) {
  // Generate the last 16 weeks of dates
  const weeksCount = 16;
  const daysInWeek = 7;
  const totalDays = weeksCount * daysInWeek;
  
  // Create a map of date strings to counts for easy lookup
  const activityMap = React.useMemo(() => {
    const map = {};
    activity.forEach(act => {
      map[act.date] = act.count;
    });
    return map;
  }, [activity]);

  // Generate grid structure
  const cells = React.useMemo(() => {
    const grid = [];
    const today = new Date();
    // Start from the Sunday of the week 16 weeks ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDays + 1);
    
    // Adjust startDate to start on a Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityMap[dateStr] || 0;
      
      grid.push({
        date: dateStr,
        count,
        dayLabel: currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return grid;
  }, [activityMap, totalDays]);

  // Group cells into columns (weeks)
  const columns = [];
  for (let i = 0; i < cells.length; i += daysInWeek) {
    columns.push(cells.slice(i, i + daysInWeek));
  }

  // Activity color function
  const getColorClass = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700';
    if (count <= 2) return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/20';
    if (count <= 5) return 'bg-emerald-300 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100';
    if (count <= 8) return 'bg-emerald-500 dark:bg-emerald-600/80';
    return 'bg-emerald-700 dark:bg-emerald-400 text-white';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Learning Heatmap</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Track your daily study consistency and lessons completed</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-950/40" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-300 dark:bg-emerald-800/60" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500 dark:bg-emerald-600" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-700 dark:bg-emerald-400" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-start gap-3 min-w-[500px]">
          {/* Day indicators */}
          <div className="grid grid-rows-7 gap-1 mt-6 text-[10px] font-bold text-slate-400 select-none">
            {dayLabels.map((lbl, idx) => (
              <span key={lbl} className={`h-3 flex items-center justify-end pr-1 ${idx % 2 === 0 ? 'invisible' : ''}`}>
                {lbl}
              </span>
            ))}
          </div>

          {/* Grid weeks */}
          <div className="flex-1 flex gap-1">
            {columns.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1">
                {/* Week Month labels on top */}
                {week.map((cell, dIdx) => {
                  const showMonthLabel = dIdx === 0 && (wIdx % 4 === 0 || wIdx === 0);
                  const cellDate = new Date(cell.date);
                  const monthName = cellDate.toLocaleString('en-US', { month: 'short' });

                  return (
                    <div key={cell.date} className="relative group flex flex-col items-center">
                      {showMonthLabel && (
                        <span className="absolute -top-5 left-0 text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
                          {monthName}
                        </span>
                      )}
                      
                      <div 
                        className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 cursor-pointer ${getColorClass(cell.count)}`}
                        style={{ contentVisibility: 'auto' }}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute z-10 bottom-full mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-medium py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap dark:bg-slate-800">
                        {cell.count} {cell.count === 1 ? 'activity' : 'activities'} on {cell.dayLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
