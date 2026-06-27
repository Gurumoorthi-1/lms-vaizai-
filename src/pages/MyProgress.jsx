import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useToastStore } from '../store/toastStore';
import ProgressRing from '../components/ui/ProgressRing';
import LearningHeatmap from '../components/ui/LearningHeatmap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Flame, Clock, CheckSquare, Award, Printer, ShieldCheck, 
  Zap, TrendingUp 
} from 'lucide-react';

export default function MyProgress() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  const loadMyProgress = async () => {
    if (!user) return;
    try {
      const studentProfile = await api.getStudentProfile(user.id);
      const certList = await api.getCertificates(user.id);
      setProfile(studentProfile);
      setCertificates(certList);
    } catch (err) {
      addToast(err.message || 'Failed to load progress metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyProgress();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadMyProgress();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, addToast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-650 dark:border-indigo-400" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Assembling progress dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 dark:text-slate-400">Unable to retrieve student profile. Please try logging in again.</p>
      </div>
    );
  }

  // Calculate overall average progress
  const averageProgress = profile.enrollments.length > 0 
    ? Math.round(profile.enrollments.reduce((sum, e) => sum + e.progress, 0) / profile.enrollments.length)
    : 0;

  // Use real study hours data if available from profile, else fallback to empty structure
  const studyHoursData = profile.studyHoursData || [
    { name: 'Mon', hours: 0 },
    { name: 'Tue', hours: 0 },
    { name: 'Wed', hours: 0 },
    { name: 'Thu', hours: 0 },
    { name: 'Fri', hours: 0 },
    { name: 'Sat', hours: 0 },
    { name: 'Sun', hours: 0 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Learning Hub & Progress</h1>
        <p className="text-sm text-slate-550 dark:text-slate-400">Track your daily study habits, milestones, certificates, and metrics.</p>
      </div>

      {/* Grid: Core Stats Summary cards & Circular Ring */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Progress Ring Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
          <ProgressRing progress={averageProgress} size={130} />
          <h3 className="font-bold text-slate-800 dark:text-white mt-4 text-sm">Overall Syllabus Complete</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Average across all active enrollments</p>
        </div>

        {/* Daily Streak Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-orange-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Daily Streak</span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/20">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">
              {profile.streak} <span className="text-xs font-semibold text-slate-400">days in a row</span>
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-orange-500 h-full rounded-full animate-pulse" style={{ width: `${Math.min(100, (profile.streak / 15) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Keep learning daily to maintain your streak fire!</p>
          </div>
        </div>

        {/* Study Goal Tracker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Weekly Study Goal</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">
              {profile.weeklyGoalProgress} <span className="text-xs font-semibold text-slate-400">/ {profile.weeklyGoalHours} hrs</span>
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (profile.weeklyGoalProgress / profile.weeklyGoalHours) * 100)}%` }} 
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              You are {Math.round((profile.weeklyGoalProgress / profile.weeklyGoalHours) * 100)}% of the way to your weekly target!
            </p>
          </div>
        </div>

        {/* Lessons & Achievements summary */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Lessons Finished</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
              <CheckSquare className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">
              {profile.completedLessons} <span className="text-xs font-semibold text-slate-400">/ {profile.totalLessons} total</span>
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (profile.completedLessons / profile.totalLessons) * 100)}%` }} 
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Avg. {Math.round(profile.timeSpentHours / (profile.completedLessons || 1) * 10) / 10} hours study time per lesson</p>
          </div>
        </div>

      </div>

      {/* Grid: Study Activity Chart & Learning Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts study hour pacing line chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Study Hour Pacing</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500">Track daily screen and study time logged this week</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <TrendingUp className="w-3.5 h-3.5" />
              +15% vs last week
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studyHoursData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} fontWeight={600} />
                <YAxis stroke="#94A3B8" fontSize={11} fontWeight={600} unit="h" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderColor: '#334155', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#4F46E5" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study checklist / Course progress roadmap */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Current Course Roadmap</h3>
            
            <div className="space-y-4">
              {profile.enrollments.map(e => (
                <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{e.courseTitle}</span>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{e.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
                    <div className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full" style={{ width: `${e.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-2.5">Next Milestone</span>
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-205">{profile.nextMilestone?.title || 'Start Learning'}</span>
                <span className="block text-[10px] text-slate-400">{profile.nextMilestone?.description || 'Enroll in a course to begin'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* GitHub-style Learning Heatmap */}
      <LearningHeatmap activity={profile.activityCalendar || []} />

      {/* Grid: Achievements & Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Achievements */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Milestones & Badges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.achievements && profile.achievements.map((ach) => (
              <div key={ach.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-md">
                  ★
                </div>
                <div>
                  <span className="block font-bold text-slate-850 dark:text-slate-200 text-xs">{ach.title}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{ach.description}</span>
                  <span className="block text-[8px] font-bold text-indigo-500 mt-0.5">Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-3 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" />
              My Certificates
            </h3>
            
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map(cert => (
                  <div key={cert.id} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{cert.courseTitle}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">Serial: {cert.serialNumber}</span>
                    </div>
                    <button
                      onClick={() => setViewingCertificate(cert)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-755 text-white text-[10px] font-bold transition-colors shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                Finish any course to 100% completion to earn and unlock official completion certificates!
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Certificate Viewer Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-4 select-none">
              <span className="font-bold text-slate-850 dark:text-slate-200 text-sm">Certificate Viewer</span>
              <button
                onClick={() => setViewingCertificate(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div id="print-certificate" className="bg-white text-slate-900 border-[12px] border-indigo-900 p-8 rounded-2xl text-center space-y-6 relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-center mb-2">
                <div className="bg-indigo-900/5 p-3 rounded-full">
                  <Award className="w-12 h-12 text-indigo-900" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-extrabold tracking-widest text-indigo-900 uppercase">Certificate of Completion</span>
                <span className="block text-[9px] font-bold text-slate-450 tracking-wider">THIS CERTIFIES THAT</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-850 uppercase border-b-2 border-indigo-900/10 pb-2 max-w-sm mx-auto">
                {viewingCertificate.studentName}
              </h2>

              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                has successfully met all administrative and examination criteria to fully complete the 
                professional curriculum for
              </p>

              <h3 className="text-lg font-bold text-indigo-900 italic">
                {viewingCertificate.courseTitle}
              </h3>

              <div className="flex justify-between items-end pt-6 border-t border-slate-200/60 text-left max-w-md mx-auto">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Issue Date</span>
                  <span className="block text-[10px] font-bold text-slate-800">{new Date(viewingCertificate.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/50 px-2 py-0.5 rounded text-[8px] font-black tracking-wide uppercase select-none">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Serial Code</span>
                  <span className="block text-[10px] font-mono font-bold text-slate-800">{viewingCertificate.serialNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-855 select-none">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Download PDF
              </button>
              <button
                onClick={() => setViewingCertificate(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
