import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import StatCard from '../components/dashboard/StatCard';
import ChartWidget from '../components/dashboard/ChartWidget';
import ListWidget from '../components/dashboard/ListWidget';
import { 
  BookOpen, Users, DollarSign, Award, Clock, 
  CheckCircle, AlertCircle, Bell
} from 'lucide-react';
import { useCourses, useEnrollments } from '../hooks/useLms';
import { api } from '../services/api';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  console.log('[Dashboard] Current user:', user);
  
  // Real-time analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'TEACHER')) {
      const loadAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
          const res = await api.getAnalyticsData();
          setAnalyticsData(res);
        } catch (err) {
          console.error('Failed to load dashboard analytics:', err);
        } finally {
          setAnalyticsLoading(false);
        }
      };
      loadAnalytics();
    }
  }, [user]);

  if (authLoading || coursesLoading || enrollmentsLoading || analyticsLoading || !user) {
    return <DashboardSkeleton />;
  }

  // --- Common Fallback Data ---
  const fallbackActivityData = [
    { name: 'Mon', active: 0, enrollments: 0 },
    { name: 'Tue', active: 0, enrollments: 0 },
    { name: 'Wed', active: 0, enrollments: 0 },
    { name: 'Thu', active: 0, enrollments: 0 },
    { name: 'Fri', active: 0, enrollments: 0 },
    { name: 'Sat', active: 0, enrollments: 0 },
    { name: 'Sun', active: 0, enrollments: 0 },
  ];

  const activityData = analyticsData?.dailyActiveUsers?.map(d => ({
    name: d.date,
    active: d.users,
    enrollments: Math.round(d.users * 0.12)
  })) || fallbackActivityData;

  const renderNotificationItem = (item) => (
    <div className="flex gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${
        item.type === 'alert' ? 'bg-rose-50 text-rose-500' :
        item.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
        'bg-indigo-50 text-indigo-500'
      }`}>
        <Bell className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
      </div>
    </div>
  );

  const renderActivityItem = (item) => (
    <div className="flex gap-3 items-start">
      <div className="mt-1">
        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.action}</p>
        <p className="text-xs text-slate-500">{item.time}</p>
      </div>
    </div>
  );

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================
  if (user.role === 'ADMIN') {
    const stats = {
      users: analyticsData?.summary?.totalStudents || 0,
      courses: courses?.length || 0,
      revenue: `$${(analyticsData?.summary?.totalRevenue || 0).toLocaleString()}`,
      enrollments: analyticsData?.summary?.totalEnrollments || enrollments?.length || 0,
    };

    const notifications = [
      { id: 1, title: 'Welcome to Vaizai LMS Admin Console', time: 'Just now', type: 'info' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">System-wide metrics and performance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={stats.users} icon={Users} color="indigo" />
          <StatCard title="Total Courses" value={stats.courses} icon={BookOpen} color="sky" />
          <StatCard title="Revenue" value={stats.revenue} icon={DollarSign} color="emerald" />
          <StatCard title="Enrollments" value={stats.enrollments} icon={Award} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartWidget 
            className="lg:col-span-2"
            title="Weekly Activity Overview" 
            type="area" 
            data={activityData} 
            dataKeyX="name" 
            dataKeysY={[
              { key: 'active', name: 'Active Users', color: '#6366f1' },
              { key: 'enrollments', name: 'New Enrollments', color: '#10b981' }
            ]} 
          />
          <ListWidget 
            title="System Notifications" 
            items={notifications} 
            renderItem={renderNotificationItem} 
            actionLabel="View all"
            actionLink="/dashboard"
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // TEACHER DASHBOARD
  // ==========================================
  if (user.role === 'TEACHER') {
    const teacherCourses = courses?.filter(c => c.teacherId === user.id) || [];
    
    // Find teacher stats dynamically from active analytics performance scoreboard
    const performance = analyticsData?.teacherPerformance?.find(
      t => t._id === user.id || t.name?.toLowerCase().includes(user.firstName?.toLowerCase())
    ) || { students: 0, rating: 4.8, completionRate: 0 };

    const completionData = [
      { name: 'Week 1', completed: Math.round(performance.students * 0.1) },
      { name: 'Week 2', completed: Math.round(performance.students * 0.25) },
      { name: 'Week 3', completed: Math.round(performance.students * 0.5) },
      { name: 'Week 4', completed: performance.students },
    ];

    const upcomingClasses = [
      { id: 1, title: 'Welcome to the course lobby', time: 'Today', type: 'info' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Instructor Hub</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {user.firstName}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Courses" value={teacherCourses.length} icon={BookOpen} color="indigo" />
          <StatCard title="Total Students" value={performance.students} icon={Users} color="sky" />
          <StatCard title="Completion Rate" value={`${performance.completionRate || 0}%`} icon={CheckCircle} color="emerald" />
          <StatCard title="Avg Course Rating" value={`${performance.rating} ★`} icon={Award} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartWidget 
            className="lg:col-span-2"
            title="Course Completions (Progress Timeline)" 
            type="bar" 
            data={completionData} 
            dataKeyX="name" 
            dataKeysY={[{ key: 'completed', name: 'Completions', color: '#6366f1' }]} 
          />
          <ListWidget 
            title="Upcoming Classes" 
            items={upcomingClasses} 
            renderItem={renderNotificationItem} 
            actionLabel="Schedule"
            actionLink="/live-classes"
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT DASHBOARD
  // ==========================================
  const myEnrollments = enrollments || [];
  
  const studentProgressData = [
    { name: 'Mon', hours: myEnrollments.length > 0 ? 1 : 0 },
    { name: 'Tue', hours: myEnrollments.length > 0 ? 2 : 0 },
    { name: 'Wed', hours: myEnrollments.length > 0 ? 1.5 : 0 },
    { name: 'Thu', hours: myEnrollments.length > 0 ? 3 : 0 },
    { name: 'Fri', hours: myEnrollments.length > 0 ? 2.5 : 0 },
    { name: 'Sat', hours: myEnrollments.length > 0 ? 1 : 0 },
    { name: 'Sun', hours: myEnrollments.length > 0 ? 4 : 0 },
  ];

  const recentActivities = [
    { id: 1, action: 'Ready to start your learning journey!', time: 'Just now' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome, {user.firstName}!</h1>
        <p className="text-slate-500 dark:text-slate-400">Ready to learn?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Enrolled Courses" value={myEnrollments.length} icon={BookOpen} color="indigo" />
        <StatCard title="Assignments Done" value={myEnrollments.filter(e => e.completed).length} icon={CheckCircle} color="emerald" />
        <StatCard title="Study Hours" value={`${Math.round(myEnrollments.length * 8.5)}h`} icon={Clock} color="sky" />
        <StatCard title="Certificates" value={myEnrollments.filter(e => e.progress === 100).length} icon={Award} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartWidget 
          className="lg:col-span-2"
          title="Study Hours (This Week)" 
          type="line" 
          data={studentProgressData} 
          dataKeyX="name" 
          dataKeysY={[{ key: 'hours', name: 'Hours', color: '#10b981' }]} 
        />
        <ListWidget 
          title="Recent Activity" 
          items={recentActivities} 
          renderItem={renderActivityItem} 
          actionLabel="View Profile"
          actionLink="/profile"
        />
      </div>
    </div>
  );
}
