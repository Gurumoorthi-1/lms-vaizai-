import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useAiStore } from '../../store/aiStore';

export default function HistorySidebar({ onClose }) {
  const { history, currentSessionId, startNewSession, setCurrentSession, deleteSession } = useAiStore();

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-4">
        <button
          onClick={() => {
            startNewSession();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>New Generation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Recent Sessions</h3>
        
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 px-2 text-center py-4">No history yet.</p>
        ) : (
          <div className="space-y-1">
            {[...history].reverse().map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
                onClick={() => {
                  setCurrentSession(session.id);
                  if (onClose) onClose();
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`h-4 w-4 shrink-0 ${currentSessionId === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {session.title}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shrink-0"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
