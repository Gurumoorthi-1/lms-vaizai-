import React from 'react';
import { Link } from 'react-router-dom';

export default function ListWidget({ 
  title, 
  items, 
  renderItem, 
  emptyMessage = "No items to display.",
  actionLabel,
  actionLink,
  className = ''
}) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        {actionLink && actionLabel && (
          <Link 
            to={actionLink} 
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {actionLabel}
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {items && items.length > 0 ? (
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, index) => (
              <div key={item.id || index} className={`pt-4 ${index === 0 ? 'pt-0 border-t-0' : ''}`}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
