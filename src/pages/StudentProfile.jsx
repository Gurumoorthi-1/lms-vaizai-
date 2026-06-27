import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToastStore } from '../store/toastStore';
import StudentCard from '../components/ui/StudentCard';
import ProgressRing from '../components/ui/ProgressRing';
import LearningHeatmap from '../components/ui/LearningHeatmap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, BookOpen, Clock, Activity, Award, PlusCircle, CheckCircle, 
  ShieldCheck, Printer, BadgeAlert, User
} from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Enrollment action states
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const studentProfile = await api.getStudentProfile(id);
        const coursesList = await api.getCourses();
        const certList = await api.getCertificates(id);
        setStudent(studentProfile);
        setCourses(coursesList);
        setCertificates(certList);
      } catch (err) {
        addToast(err.message || 'Failed to load student profile', 'error');
        navigate('/students');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id, addToast, navigate]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setEnrolling(true);
    try {
      await api.enrollStudentInCourse(student.id, selectedCourseId);
      addToast('Student enrolled successfully!', 'success');
      // Reload profile
      const updatedProfile = await api.getStudentProfile(student.id);
      setStudent(updatedProfile);
      setSelectedCourseId('');
    } catch (err) {
      addToast(err.message || 'Failed to enroll student', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  // Use real study hours or fallback to 0
  const studyHoursData = student.studyHours || [
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
      
      {/* Back to List */}
      <button
        onClick={() => navigate('/students')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students List
      </button>

      {/* Student Top Header / Profile Card */}
      <StudentCard student={student} />

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto select-none">
        {[
          { id: 'summary', label: 'Summary', icon: User },
          { id: 'progress', label: 'Progress & Activity', icon: Activity },
          { id: 'enrollment', label: 'Enrollments', icon: BookOpen },
          { id: 'certificates', label: 'Certificates', icon: Award }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative whitespace-nowrap
                ${isActive 
                  ? 'text-indigo-650 dark:text-indigo-400' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="mt-4">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Stats */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Progress Ring / Core Stats Overview */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <ProgressRing 
                  progress={
                    student.enrollments.length > 0 
                      ? student.enrollments.reduce((sum, e) => sum + e.progress, 0) / student.enrollments.length
                      : 0
                  } 
                  size={120} 
                />
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">Overall Academic Progress</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This represents the average completion rate across all {student.enrollments.length} enrolled courses. 
                    So far, the student has maintained a study pacing of <strong>{student.weeklyGoalProgress} hours</strong> this week.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                    <div className="bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Weekly Goal: {student.weeklyGoalProgress}/{student.weeklyGoalHours} hrs
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Certificates: {certificates.length} earned
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Heatmap */}
              <LearningHeatmap activity={student.activityCalendar || []} />

            </div>

            {/* Right side: Achievements / Badges */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                  Achievements & Badges
                </h3>
                
                {student.achievements && student.achievements.length > 0 ? (
                  <div className="space-y-3">
                    {student.achievements.map((ach) => (
                      <div key={ach.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-all hover:scale-[1.02]">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          ★
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs">{ach.title}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{ach.description}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                          {new Date(ach.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No achievements unlocked yet.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Detailed Progress and Activity Charts */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recharts Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2">Weekly Study Pacing</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mb-6">Daily hour counts recorded during student interactions</p>

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

            {/* Course Timeline checkpoints */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                Study Timeline
              </h3>
              
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 dark:text-slate-500">No study activity recorded yet.</p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Enrollments and Manual Enrollment form */}
        {activeTab === 'enrollment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Enrollment lists */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Course Enrolled</h3>
              
              {student.enrollments.length > 0 ? (
                <div className="space-y-4">
                  {student.enrollments.map(e => (
                    <div key={e.id} className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-800 dark:text-slate-200 text-sm">{e.courseTitle}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Enrolled on {new Date(e.enrolledAt).toLocaleDateString()}</span>
                        
                        {/* Progress bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${e.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{e.progress}%</span>
                        </div>
                      </div>

                      {e.progress === 100 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40 select-none">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">Not enrolled in any courses.</p>
              )}
            </div>

            {/* Manual enrollment form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                Enroll Student
              </h3>
              
              <form onSubmit={handleEnroll} className="space-y-4">
                <div>
                  <label htmlFor="course-select" className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Course</label>
                  <select
                    id="course-select"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                  >
                    <option value="">Choose a course...</option>
                    {courses
                      .filter(c => !student.enrollments.some(e => e.courseId === c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))
                    }
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!selectedCourseId || enrolling}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-colors"
                >
                  {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Tab 4: Certificates */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            
            {/* List of certificates */}
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map(cert => (
                  <div 
                    key={cert.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <Award className="w-8 h-8 text-amber-500" />
                      <div>
                        <span className="block font-bold text-slate-850 dark:text-slate-200 text-sm">{cert.courseTitle}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Serial: {cert.serialNumber}</span>
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                        Issued {new Date(cert.issueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setViewingCertificate(cert)}
                      className="mt-5 w-full bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 rounded-xl border border-slate-200/25 transition-colors"
                    >
                      View Certificate
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center">
                <BadgeAlert className="w-10 h-10 text-slate-400 mx-auto mb-3 animate-pulse" />
                <h3 className="font-bold text-slate-850 dark:text-slate-200">No Certificates Earned</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[320px] mx-auto">
                  Certificates are automatically generated when a student completes 100% of a course's syllabus.
                </p>
              </div>
            )}

            {/* Certificate Template Preview Modal */}
            {viewingCertificate && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6">
                  
                  {/* Print / View Certificate Header */}
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-4 select-none">
                    <span className="font-bold text-slate-850 dark:text-slate-200 text-sm">Certificate Viewer</span>
                    <button
                      onClick={() => setViewingCertificate(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>

                  {/* High Fidelity Certificate Template */}
                  <div id="print-certificate" className="bg-white text-slate-900 border-[12px] border-indigo-900 p-8 rounded-2xl text-center space-y-6 relative overflow-hidden shadow-inner">
                    {/* Background graphic */}
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

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-850 select-none">
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
        )}
      </div>

    </div>
  );
}
