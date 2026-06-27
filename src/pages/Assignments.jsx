import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCourses, useAssignments, useEnrollments, useSubmissions } from '../hooks/useLms';
import { api } from '../services/api';
import { initSocket, getSocket, disconnectSocket } from '../services/socket';
import { useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Clock, CheckCircle, AlertCircle, Award, 
  ChevronRight, Calendar, BookOpen 
} from 'lucide-react';

export default function Assignments() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: enrollments = [] } = useEnrollments();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [countdownMap, setCountdownMap] = useState({});

  // Filter student-enrolled courses if role is Student
  const availableCourses = courses.filter(c => 
    user?.role !== 'STUDENT' || enrollments.some(e => e.courseId === c.id)
  );

  // Initialize selected course if not set
  useEffect(() => {
    if (availableCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(availableCourses[0].id);
    }
  }, [availableCourses, selectedCourseId]);

  // Retrieve assignments for selected course
  const { data: allAssignments = [], isLoading: assignmentsLoading } = useAssignments(
    selectedCourseId
  );

  // Filter assignments by selected course ID (in case all assignments were fetched)
  const assignments = selectedCourseId
    ? allAssignments.filter(a => a.courseId === selectedCourseId)
    : allAssignments;

  // Retrieve submission status for all assignments
  useEffect(() => {
    async function fetchSubmissions() {
      if (assignments.length === 0 || user?.role !== 'STUDENT') return;
      setLoadingSubmissions(true);
      try {
        const submissionData = {};
        for (const asg of assignments) {
          const res = await api.getSubmissions(asg.id);
          // Handle case where res is { submissions: [...] }
          const submissions = res.submissions || res;
          // Handle both array and { submissions: [] } responses
          const actualSubmissions = Array.isArray(submissions) 
            ? submissions 
            : submissions?.submissions || [];
          
          const sub = actualSubmissions.find(s => 
            (s.studentId?._id || s.studentId) === (user._id || user.id)
          );
          if (sub) {
            submissionData[asg.id] = {
              ...sub,
              grade: sub.marks
            };
          }
        }
        setSubmissionsMap(submissionData);
      } catch (err) {
        console.error('Failed to load student submissions', err);
      } finally {
        setLoadingSubmissions(false);
      }
    }
    fetchSubmissions();
  }, [assignments, user]);

  // Socket.io setup for real-time updates
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('vaizai_session_token');
    if (!token) {
      console.log('[Assignments] No token found for socket');
      return;
    }

    const socket = initSocket(token);
    if (!socket) return;

    // Join course room for real-time updates
    const joinCourse = () => {
      if (selectedCourseId) {
        console.log('[Assignments] Joining course room:', selectedCourseId);
        socket.emit('join:course', selectedCourseId);
      }
    };

    if (socket.connected) {
      joinCourse();
    } else {
      socket.on('connect', joinCourse);
    }

    // Listen for new assignments
    socket.on('assignment:created', (assignment) => {
      console.log('[Assignments] New assignment created:', assignment);
      queryClient.invalidateQueries({ queryKey: ['assignments', selectedCourseId] });
    });

    // Listen for submission updates
    socket.on('submission:updated', (data) => {
      console.log('[Assignments] Submission updated:', data);
      queryClient.invalidateQueries({ queryKey: ['assignments', selectedCourseId] });
    });

    return () => {
      if (socket && selectedCourseId) {
        socket.emit('leave:course', selectedCourseId);
      }
      socket.off('connect', joinCourse);
    };
  }, [user, selectedCourseId, queryClient]);

  // Deadline countdown timer
  useEffect(() => {
    if (assignments.length === 0) return;

    const interval = setInterval(() => {
      const timers = {};
      assignments.forEach(asg => {
        const due = new Date(asg.dueDate || asg.deadline);
        const diff = due - new Date();

        if (diff <= 0) {
          timers[asg.id] = 'Expired';
          return;
        }

        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);

        if (days > 0) {
          timers[asg.id] = `${days}d ${hours}h left`;
        } else {
          timers[asg.id] = `${hours}h ${mins}m left`;
        }
      });
      setCountdownMap(timers);
    }, 1000);

    return () => clearInterval(interval);
  }, [assignments]);

  const isLoading = coursesLoading || assignmentsLoading || loadingSubmissions;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-650 dark:border-indigo-400" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Assembling worksheets...</p>
      </div>
    );
  }

  // Stats computation for Student
  const totalAssigned = assignments.length;
  const submittedCount = Object.keys(submissionsMap).length;
  const gradedCount = Object.values(submissionsMap).filter(s => s.grade !== null && s.grade !== undefined).length;

  const getStatusBadge = (asgId) => {
    if (user?.role !== 'STUDENT') {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-450 border border-slate-100 dark:border-slate-800">
          Teacher Access
        </span>
      );
    }

    const sub = submissionsMap[asgId];
    if (!sub) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-350 border border-amber-100 dark:border-amber-900/30">
          <AlertCircle className="w-3.5 h-3.5" />
          Not Submitted
        </span>
      );
    }

    if (sub.grade !== null && sub.grade !== undefined) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
          <CheckCircle className="w-3.5 h-3.5" />
          Graded: {sub.grade}/{assignments.find(a => a.id === asgId)?.maxMarks || 100}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
        <Clock className="w-3.5 h-3.5" />
        Submitted
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Worksheets & Assignments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Complete assignments, view marks breakdowns, and review AI and instructor feedback.</p>
        </div>
      </div>

      {/* Select Course dropdown / Selector row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-xs font-extrabold text-slate-450 uppercase select-none">Active Course:</span>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="bg-slate-50 dark:bg-slate-855 p-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold dark:text-white"
        >
          {availableCourses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Stats row for Student */}
      {user?.role === 'STUDENT' && totalAssigned > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Assigned</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{totalAssigned}</span>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-650 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Submitted</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{submittedCount}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Graded</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{gradedCount}</span>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-500">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Assignment lists */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
            <h3 className="font-bold text-slate-850 dark:text-slate-200 text-base">No Assignments Posted</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              The teacher has not added worksheets for this course syllabus yet.
            </p>
          </div>
        ) : (
          assignments.map(asg => (
            <div 
              key={asg.id}
              onClick={() => {
                const courseIdForAssignment = asg.courseId?._id || asg.courseId;
                if (courseIdForAssignment) {
                  navigate(`/courses/${courseIdForAssignment}/assignments/${asg.id}`);
                }
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-indigo-50 dark:bg-indigo-950/40 rounded text-indigo-650 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider">
                    Worksheet
                  </span>
                  {getStatusBadge(asg.id)}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base hover:text-indigo-600 transition-colors leading-snug">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl truncate">
                    {asg.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {new Date(asg.dueDate || asg.deadline).toLocaleDateString()}
                  </span>
                  {countdownMap[asg.id] && (
                    <span className="flex items-center gap-1 text-rose-500">
                      <Clock className="w-3.5 h-3.5" />
                      {countdownMap[asg.id]}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-450 hover:text-indigo-600 transition-colors self-end md:self-center shrink-0">
                <span>View Worksheet</span>
                <ChevronRight className="w-4 h-4" />
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
