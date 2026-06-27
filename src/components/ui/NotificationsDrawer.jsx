import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Bell, 
  Check, 
  CheckCheck, 
  Search, 
  Filter, 
  MessageSquare, 
  BookOpen, 
  Award, 
  AlertCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import { api } from '../../services/api';
import { initSocket, getSocket } from '../../services/socket';

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${diffWeeks}w ago`;
};

// Map notification types to icons and colors
const getNotificationConfig = (type) => {
  const configs = {
    'course_published': { icon: BookOpen, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
    'assignment_due': { icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    'assignment_graded': { icon: Award, color: 'text-green-500 bg-green-50 dark:bg-green-500/10' },
    'quiz_available': { icon: BookOpen, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
    'enrollment_confirmed': { icon: Check, color: 'text-green-500 bg-green-50 dark:bg-green-500/10' },
    'certificate_issued': { icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    'session_starting': { icon: Clock, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
    'forum_reply': { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
    'achievement_unlocked': { icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    'reminder': { icon: Clock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
    'system': { icon: AlertCircle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' }
  };
  return configs[type] || { icon: Bell, color: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10' };
};

export default function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const observerTarget = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize socket and listen for events
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }

    const token = localStorage.getItem('vaizai_session_token');
    if (token) {
      initSocket(token);
      const socket = getSocket();
      
      if (socket) {
        const handleNewNotification = (notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        };
        
        socket.on('notification:new', handleNewNotification);
        
        return () => {
          socket.off('notification:new', handleNewNotification);
        };
      }
    }
  }, [isOpen, fetchNotifications]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'unread' ? !n.isRead : true)
    .filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <>
      {/* Dropdown */}
      <div 
        className={`absolute right-0 top-full mt-2 z-[70] w-[360px] max-h-[80vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 origin-top-right overflow-hidden ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleMarkAllRead}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === 'unread' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notif) => {
                const { icon: Icon, color } = getNotificationConfig(notif.type);
                return (
                  <div 
                    key={notif._id}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                    className={`relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                      notif.isRead 
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' 
                        : 'bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20'
                    }`}
                  >
                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div className={`p-2 rounded-lg shrink-0 mt-1 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`text-sm font-semibold truncate pr-2 ${notif.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-2 ${notif.isRead ? 'text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notif.message}
                      </p>
                    </div>

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
