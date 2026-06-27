import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Breadcrumbs from './Breadcrumbs';
import ToastContainer from './ui/ToastContainer';
import ConfirmationDialog from './ui/ConfirmationDialog';
import NotificationsDrawer from './ui/NotificationsDrawer';
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  User, 
  LogOut, 
  Menu, 
  X, 
  BookOpenCheck,
  Sparkles,
  Users,
  Activity,
  Video,
  FileText,
  MessageSquareText,
  Bot,
  BarChart3,
  Award,
  Bell,
  Settings,
  UserCircle
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close user menu on outside click (simple implementation)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isUserMenuOpen && !e.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      addToast('Logged out successfully', 'success');
      navigate('/login');
    } catch (err) {
      addToast('Failed to logout', 'error');
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  const navItems = [
    { 
      label: 'Dashboard', 
      to: '/dashboard', 
      icon: LayoutDashboard,
      roles: ['STUDENT', 'TEACHER']
    },
    { 
      label: 'Courses', 
      to: '/courses', 
      icon: BookOpen,
      roles: ['STUDENT', 'TEACHER']
    },
    {
      label: 'Live Classes',
      to: '/live-classes',
      icon: Video,
      roles: ['STUDENT', 'TEACHER']
    },
    {
      label: 'Assignments',
      to: '/assignments',
      icon: FileText,
      roles: ['STUDENT', 'TEACHER']
    },
    {
      label: 'Students',
      to: '/students',
      icon: Users,
      roles: ['TEACHER']
    },
    {
      label: 'My Progress',
      to: '/my-progress',
      icon: Activity,
      roles: ['STUDENT']
    },
    {
      label: 'Analytics',
      to: '/analytics',
      icon: BarChart3,
      roles: ['TEACHER']
    },
    {
      label: 'Certificates',
      to: '/certificates',
      icon: Award,
      roles: ['STUDENT', 'TEACHER']
    },
    {
      label: 'Forum',
      to: '/forum',
      icon: MessageSquareText,
      roles: ['STUDENT', 'TEACHER']
    },
    {
      label: 'AI Mentor',
      to: '/ai-mentor',
      icon: Bot,
      roles: ['STUDENT']
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const roleColors = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    TEACHER: 'bg-amber-50 text-amber-700 border-amber-200',
    STUDENT: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  return (
    <div className="min-h-screen flex bg-slate-50 transition-colors duration-200">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Vaizai <span className="text-indigo-600">LMS</span>
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User info & actions) */}
        <div className="p-4 border-t border-slate-200 space-y-4">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {user.firstName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${roleColors[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogoutDialogOpen(true)}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors font-medium text-sm flex-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col md:hidden transition-transform duration-300 ease-in-out transform
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-slate-900">Vaizai LMS</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-4">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {user.firstName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${roleColors[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLogoutDialogOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 text-rose-600 font-medium text-sm flex-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <Breadcrumbs />
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            {/* Notifications Dropdown Container */}
            <div 
              className="relative"
              onMouseEnter={() => setIsNotificationsOpen(true)}
              onMouseLeave={() => setIsNotificationsOpen(false)}
            >
              <button
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {/* Unread Badge Mock */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
              </button>

              <NotificationsDrawer 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>

            {/* User Dropdown */}
            <div className="relative user-menu-container hidden md:block">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user?.firstName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-fade-in origin-top-right">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <UserCircle className="h-4 w-4 text-slate-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Notifications Drawer has been moved to header */}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast Render */}
      <ToastContainer />

      {/* Logout dialog */}
      <ConfirmationDialog
        isOpen={isLogoutDialogOpen}
        title="Logout Confirmation"
        message="Are you sure you want to log out of Vaizai LMS? Your local session will be terminated."
        confirmText="Logout"
        cancelText="Stay logged in"
        isDestructive={true}
        isLoading={isLoggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </div>
  );
}
