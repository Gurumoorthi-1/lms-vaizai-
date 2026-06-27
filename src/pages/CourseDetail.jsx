import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  useCourse,
  useEnrollments,
  useEnrollInCourse,
  useAssignments,
  useQuizzes,
  useCreateAssignment,
  useCreateQuiz,
  useMySubmission,
  useQuizAttempts
} from '../hooks/useLms';
import { Skeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Calendar,
  Plus,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(10, 'Description is too short'),
  dueDate: z.string().min(1, 'Due date is required')
});

const quizSchema = z.object({
  title: z.string().min(3, 'Quiz title is too short'),
  questions: z.array(z.object({
    type: z.string().default('mcq'),
    text: z.string().min(1, 'Question text is required'),
    options: z.array(z.string().min(1, 'Option is required')).min(2, 'Must have at least 2 options'),
    correctOption: z.number().int().min(0)
  })).min(1, 'Must have at least 1 question')
});

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  
  const { data: course, isLoading: courseLoading } = useCourse(id);
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments(id);
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes(id);

  const enrollMutation = useEnrollInCourse();
  const createAssignmentMutation = useCreateAssignment();
  const createQuizMutation = useCreateQuiz();

  const [activeTab, setActiveTab] = useState('syllabus');
  const [isAsgModalOpen, setIsAsgModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [aiQuizTopic, setAiQuizTopic] = useState('');
  const [aiQuizNumQuestions, setAiQuizNumQuestions] = useState(5);

  // Forms
  const {
    register: registerAsg,
    handleSubmit: handleSubmitAsg,
    reset: resetAsg,
    formState: { errors: asgErrors }
  } = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { title: '', description: '', dueDate: '' }
  });

  const {
    register: registerQuiz,
    control: quizControl,
    handleSubmit: handleSubmitQuiz,
    reset: resetQuiz,
    setValue,
    formState: { errors: quizErrors }
  } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      questions: [{ type: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0 }]
    }
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion, replace } = useFieldArray({
    control: quizControl,
    name: 'questions'
  });

  if (courseLoading || enrollmentsLoading || assignmentsLoading || quizzesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <Link to="/courses" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 inline-block">&larr; Back to Catalog</Link>
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';
  const isEnrolled = enrollments?.some(e => String(e.courseId) === String(course.id)) || false;
  const enrollmentDetail = enrollments?.find(e => String(e.courseId) === String(course.id));

  // Block students who aren't enrolled
  if (isStudent && !isEnrolled) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <Lock className="h-16 w-16 text-indigo-500 mx-auto mb-2 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Classroom Locked</h2>
        <p className="text-slate-600 dark:text-slate-400">
          You must enroll in <span className="font-bold text-slate-900 dark:text-slate-200">{course.title}</span> before accessing course syllabus, assignments, quizzes, and grading material.
        </p>
        <button
          onClick={() => enrollMutation.mutate(course.id)}
          disabled={enrollMutation.isPending}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
        >
          {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Course'}
        </button>
      </div>
    );
  }

  const onSubmitAsg = async (data) => {
    try {
      await createAssignmentMutation.mutateAsync({
        courseId: course.id,
        assignmentData: data
      });
      setIsAsgModalOpen(false);
      resetAsg();
    } catch (e) {
      // Handled by hook
    }
  };

  const onSubmitQuiz = async (data) => {
    try {
      await createQuizMutation.mutateAsync({
        courseId: course.id,
        quizData: data
      });
      setIsQuizModalOpen(false);
      resetQuiz();
    } catch (e) {
      // Handled by hook
    }
  };

  const handleGenerateQuiz = async () => {
    if (!aiQuizTopic.trim()) return;

    setIsGeneratingQuiz(true);
    try {
      const result = await api.generateQuiz(aiQuizTopic, 'intermediate', aiQuizNumQuestions);
      
      // Determine the quiz array (could be direct or in result.quiz)
      const quizArray = result && Array.isArray(result) ? result : (result && result.quiz ? result.quiz : null);
      
      if (quizArray) {
        // Set the quiz title
        setValue('title', `${aiQuizTopic} Quiz`);
        
        // Clear existing questions and add new ones
        const newQuestions = quizArray.map((q) => {
          // Find the index of the correct option
          const correctOptionIndex = q.options.findIndex(opt => opt === q.correctOption);
          
          return {
            type: 'mcq',
            text: q.question,
            options: q.options,
            correctOption: correctOptionIndex >= 0 ? correctOptionIndex : 0
          };
        });

        // Replace all questions
        replace(newQuestions);
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // ─── Real submission/quiz status helpers ────────────────────────────────────
  // These are rendered as sub-components to allow per-item data fetching
  const AssignmentStatusBadge = ({ assignmentId }) => {
    const { data: submission } = useMySubmission(assignmentId, isStudent);
    if (!submission) return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">Pending</span>
    );
    const status = submission.status === 'graded' ? 'Graded' : 'Submitted';
    const color = submission.status === 'graded'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
      : 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>{status}</span>;
  };

  const QuizStatusBadge = ({ quizId }) => {
    const { data: attempts } = useQuizAttempts(quizId);
    if (!attempts || attempts.length === 0) return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">Not Attempted</span>
    );
    const best = Math.max(...attempts.map(a => a.score || 0));
    const passed = attempts.some(a => a.passed);
    const color = passed
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
      : 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400';
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>{passed ? `Passed (${best}%)` : `Attempted (${best}%)`}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Back Button */}
      <Link 
        to="/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">
            Instructor: {course.teacherName}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {course.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base leading-relaxed">
            {course.description}
          </p>
        </div>

        {isEnrolled && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Classroom Status:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50">
                <CheckCircle2 className="h-3 w-3" /> Enrolled
              </span>
            </div>
            
            {/* Progress bar */}
            {isStudent && (() => {
              const totalItems = (assignments?.length || 0) + (quizzes?.length || 0);
              const pct = enrollmentDetail?.progress || 0;
              return (
                <div className="flex items-center gap-4 w-full sm:w-64 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 shrink-0">Progress: {pct}%</span>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        {[
          { id: 'syllabus', label: 'Syllabus & Modules', icon: BookOpen },
          { id: 'assignments', label: `Assignments (${assignments?.length || 0})`, icon: ClipboardList },
          { id: 'quizzes', label: `Quizzes (${quizzes?.length || 0})`, icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all focus:outline-none shrink-0 whitespace-nowrap
                ${isActive 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* Syllabus / Modules */}
        {activeTab === 'syllabus' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum Map</h3>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                {[
                  { title: 'Module 1: Foundations & Prerequisites', description: 'Core initial concepts, baseline skills assessment, and setup.' },
                  { title: 'Module 2: Mid-Level Topics & Design Patterns', description: 'Exploring intermediate components, design patterns, and structure.' },
                  { title: 'Module 3: Advanced Architectures & Production Tuning', description: 'Deep-dive security reviews, loading optimization, and deployment checks.' }
                ].map((mod, index) => (
                  <div key={index} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-850 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{mod.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus Info widget */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Course Details</h3>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-350 block">Department</span>
                  <span>Computer Science & Security</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-350 block">Est. Effort</span>
                  <span>3-5 hours/week</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-350 block">Course Code</span>
                  <span className="font-mono text-xs uppercase bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{course.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Course Homework & Worksheets</h3>
              {user?.role === 'TEACHER' && course.teacherId === user.id && (
                <button
                  onClick={() => setIsAsgModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Assignment
                </button>
              )}
            </div>

            {!assignments || assignments.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-white dark:bg-slate-900">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No assignments have been assigned yet.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.map(asg => {
                  return (
                    <div key={asg.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{asg.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl">{asg.description}</p>
                        
                        <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            Due: {new Date(asg.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        {isStudent && <AssignmentStatusBadge assignmentId={asg.id} />}

                        <Link
                          to={`/courses/${course.id}/assignments/${asg.id}`}
                          className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-650 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-450 font-semibold rounded-xl text-xs transition-colors bg-white dark:bg-slate-900"
                        >
                          <span>{isStudent ? 'View Worksheet' : 'Manage Submissions'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Syllabus Checkpoint Quizzes</h3>
              {user?.role === 'TEACHER' && course.teacherId === user.id && (
                <button
                  onClick={() => setIsQuizModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Quiz
                </button>
              )}
            </div>

            {!quizzes || quizzes.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-white dark:bg-slate-900">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No quizzes posted yet.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                {quizzes.map(quiz => {
                  return (
                    <div key={quiz.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{quiz.title}</h4>
                        <p className="text-xs text-slate-400 font-semibold">{quiz.questions?.length || 0} Multiple Choice Questions</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        {isStudent && <QuizStatusBadge quizId={quiz.id} />}

                        <Link
                          to={`/courses/${course.id}/quiz/${quiz.id}`}
                          className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-650 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-450 font-semibold rounded-xl text-xs transition-colors bg-white dark:bg-slate-900"
                        >
                          <span>{isStudent ? 'Take/Review Quiz' : 'View Quiz Structure'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={isAsgModalOpen}
        onClose={() => {
          setIsAsgModalOpen(false);
          resetAsg();
        }}
        title="Add Course Assignment"
      >
        <form onSubmit={handleSubmitAsg(onSubmitAsg)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Assignment Title
            </label>
            <input
              id="title"
              placeholder="e.g. Worksheet 1: Implement standard Hooks"
              {...registerAsg('title')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                ${asgErrors.title ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            />
            {asgErrors.title && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{asgErrors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="dueDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              {...registerAsg('dueDate')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                ${asgErrors.dueDate ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            />
            {asgErrors.dueDate && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{asgErrors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Worksheet Description / Prompt
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Describe the instructions for this assignment..."
              {...registerAsg('description')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm resize-none
                ${asgErrors.description ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
              `}
            />
            {asgErrors.description && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{asgErrors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAsgModalOpen(false);
                resetAsg();
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAssignmentMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all disabled:opacity-50"
            >
              {createAssignmentMutation.isPending ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quiz Modal */}
  <Modal
    isOpen={isQuizModalOpen}
    onClose={() => {
      setIsQuizModalOpen(false);
      resetQuiz();
      setAiQuizTopic('');
    }}
    title="Design Course Quiz"
  >
    <form onSubmit={handleSubmitQuiz(onSubmitQuiz)} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2" noValidate>
      {/* AI Quiz Generation Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Generate Quiz with AI</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter topic (e.g., React Hooks, Python basics)"
            value={aiQuizTopic}
            onChange={(e) => setAiQuizTopic(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm border-slate-200 dark:border-slate-700"
          />
          <select
            value={aiQuizNumQuestions}
            onChange={(e) => setAiQuizNumQuestions(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm border-slate-200 dark:border-slate-700"
          >
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
          <button
            type="button"
            onClick={handleGenerateQuiz}
            disabled={isGeneratingQuiz || !aiQuizTopic.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all shadow-sm"
          >
            {isGeneratingQuiz ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <label htmlFor="quizTitle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Quiz Title
        </label>
        <input
          id="quizTitle"
          placeholder="e.g. Module 1: Comprehensive Checkpoint"
          {...registerQuiz('title')}
          className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
            ${quizErrors.title ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'}
          `}
        />
        {quizErrors.title && (
          <p className="text-rose-500 text-xs font-medium" role="alert">{quizErrors.title.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Questions Bank</span>
          <button
            type="button"
            onClick={() => appendQuestion({ type: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0 })}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + Add Question
          </button>
        </div>

            {questionFields.map((field, qIndex) => (
              <div key={field.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Question {qIndex + 1}</span>
                  {questionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    placeholder={`Question text e.g. What is XSS?`}
                    {...registerQuiz(`questions.${qIndex}.text`)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                  {quizErrors.questions?.[qIndex]?.text && (
                    <p className="text-rose-500 text-xs">{quizErrors.questions[qIndex].text.message}</p>
                  )}
                </div>

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((optIndex) => (
                    <div key={optIndex} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Option {optIndex + 1}</label>
                      <input
                        placeholder={`Option ${optIndex + 1}`}
                        {...registerQuiz(`questions.${qIndex}.options.${optIndex}`)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Option selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Correct Answer Option</label>
                  <select
                    {...registerQuiz(`questions.${qIndex}.correctOption`, { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                  >
                    <option value={0}>Option 1</option>
                    <option value={1}>Option 2</option>
                    <option value={2}>Option 3</option>
                    <option value={3}>Option 4</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsQuizModalOpen(false);
                resetQuiz();
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createQuizMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all disabled:opacity-50"
            >
              {createQuizMutation.isPending ? 'Saving Quiz...' : 'Save Quiz'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
