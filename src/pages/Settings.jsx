import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  ShieldCheck, 
  Laptop,
  Save,
  Settings as SettingsIcon,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { api } from '../services/api';

const TABS = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'sessions', label: 'Active Sessions', icon: Laptop },
];

export default function Settings() {
  const { user, checkAuth } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailAnnouncements: true,
    emailGrades: true,
    smsAlerts: false
  });

  // Security State
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Load user data into local states on mount or user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setBio(user.bio || '');
      setNotifications({
        emailAnnouncements: user.settings?.emailNotifications ?? true,
        emailGrades: user.settings?.desktopNotifications ?? true,
        smsAlerts: user.settings?.smsNotifications ?? false
      });
      setTwoFactor(user.settings?.twoFactor ?? false);
      setLoginAlerts(user.settings?.loginAlerts ?? true);
    }
  }, [user]);

  // Load sessions when relevant tab is selected
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await api.getActiveSessions();
      setSessions(data);
    } catch (err) {
      addToast(err.message || 'Failed to load sessions', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateUserSettings({ firstName, lastName, bio });
      await checkAuth();
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await api.updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password updated successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNotifications = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateUserSettings({
        settings: {
          emailNotifications: notifications.emailAnnouncements,
          desktopNotifications: notifications.emailGrades,
          smsNotifications: notifications.smsAlerts
        }
      });
      await checkAuth();
      addToast('Notification preferences saved successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save notifications', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateUserSettings({
        settings: { twoFactor, loginAlerts }
      });
      await checkAuth();
      addToast('Security settings saved successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save security settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      addToast('Session revoked successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to revoke session', 'error');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h3>
              <p className="text-sm text-slate-500 mt-0.5">Update your account profile details and bio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed" 
                />
                <p className="text-xs text-slate-500">Contact support to change your email address.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
                <textarea 
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" 
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </form>
        );
      
      case 'password':
        return (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h3>
              <p className="text-sm text-slate-500 mt-0.5">Ensure your account is using a secure password.</p>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" 
                />
                <p className="text-xs text-slate-500">Must be at least 8 characters long.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" 
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end md:justify-start">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        );

      case 'notifications':
        return (
          <form onSubmit={handleUpdateNotifications} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h3>
              <p className="text-sm text-slate-500 mt-0.5">Control how and when you receive course and profile notifications.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">Email Announcements</h4>
                  <p className="text-xs text-slate-500">Receive emails for new course content and instructor announcements.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.emailAnnouncements}
                  onChange={() => setNotifications(prev => ({ ...prev, emailAnnouncements: !prev.emailAnnouncements }))}
                  className="w-10 h-5 bg-slate-200 dark:bg-slate-700 checked:bg-indigo-600 rounded-full appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all checked:after:translate-x-5" 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">Grade Alerts</h4>
                  <p className="text-xs text-slate-500">Get notified immediately when your assignments and quizzes are graded.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.emailGrades}
                  onChange={() => setNotifications(prev => ({ ...prev, emailGrades: !prev.emailGrades }))}
                  className="w-10 h-5 bg-slate-200 dark:bg-slate-700 checked:bg-indigo-600 rounded-full appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all checked:after:translate-x-5" 
                />
              </div>



              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">SMS Security Alerts</h4>
                  <p className="text-xs text-slate-500">Receive SMS notifications for critical security events on your profile.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.smsAlerts}
                  onChange={() => setNotifications(prev => ({ ...prev, smsAlerts: !prev.smsAlerts }))}
                  className="w-10 h-5 bg-slate-200 dark:bg-slate-700 checked:bg-indigo-600 rounded-full appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all checked:after:translate-x-5" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        );

      case 'security':
        return (
          <form onSubmit={handleUpdateSecurity} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security Settings</h3>
              <p className="text-sm text-slate-500 mt-0.5">Manage two-factor authentication and review security configurations.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10 gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-xs text-slate-500">Secure your account by requiring an authenticator code alongside your password.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={twoFactor}
                  onChange={() => setTwoFactor(!twoFactor)}
                  className="w-10 h-5 shrink-0 bg-slate-200 dark:bg-slate-700 checked:bg-indigo-600 rounded-full appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all checked:after:translate-x-5" 
                />
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10 gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-500" />
                    Suspicious Login Alerts
                  </h4>
                  <p className="text-xs text-slate-500">Send an email alert whenever there is a login attempt from an unrecognized IP or browser.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={loginAlerts}
                  onChange={() => setLoginAlerts(!loginAlerts)}
                  className="w-10 h-5 shrink-0 bg-slate-200 dark:bg-slate-700 checked:bg-indigo-600 rounded-full appearance-none cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all checked:after:translate-x-5" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end md:justify-start">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </form>
        );

      case 'sessions':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Sessions</h3>
              <p className="text-sm text-slate-500 mt-0.5">Manage and revoke your active sessions across devices.</p>
            </div>
            
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Loading sessions...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No active sessions found.</p>
                ) : (
                  sessions.map(session => (
                    <div key={session._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Laptop className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            {session.deviceInfo || 'Unknown Device'}
                            {session.isCurrent && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">CURRENT</span>}
                          </h4>
                          <p className="text-xs text-slate-500">{session.ipAddress || 'Unknown IP'} • {new Date(session.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button 
                          onClick={() => handleRevokeSession(session._id)}
                          className="text-sm text-rose-500 hover:text-rose-600 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
            <SettingsIcon className="w-12 h-12 opacity-20" />
            <p>This settings module is under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs - Horizontal on Mobile, Vertical on Desktop */}
        <div className="md:w-64 shrink-0 overflow-x-auto md:overflow-visible">
          <nav className="flex md:flex-col gap-1 pb-2 md:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
