import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  useCourse, 
  useAssignments, 
  useSubmissions, 
  useSubmitAssignment, 
  useGradeSubmission,
  useGenerateAIFeedback
} from '../hooks/useLms';
import { Skeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import DragDropUpload from '../components/ui/DragDropUpload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, 
  FileText, 
  Send, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Award,
  ChevronRight,
  Sparkles,
  Bot,
  AlertTriangle
} from 'lucide-react';

const gradeSchema = z.object({
  grade: z.number().min(0, 'Min score is 0').max(100, 'Max score is 100'),
  feedback: z.string().min(5, 'Feedback must be at least 5 characters')
});

export default function AssignmentDetail() {
  const { id: courseId, assignmentId } = useParams();
  const { user } = useAuthStore();
  
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments(courseId);
  const { data: submissionsResponse, isLoading: submissionsLoading } = useSubmissions(assignmentId);
  
  // Handle both array and { submissions: [] } responses
  const submissions = Array.isArray(submissionsResponse) 
    ? submissionsResponse 
    : submissionsResponse?.submissions || [];

  const submitMutation = useSubmitAssignment();
  const gradeMutation = useGradeSubmission();
  const aiFeedbackMutation = useGenerateAIFeedback();

  const [isResubmitting, setIsResubmitting] = useState(false);
  const [submissionToGrade, setSubmissionToGrade] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [countdownText, setCountdownText] = useState('');

  // AI Feedback card states
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Forms
  const {
    register: registerGrade,
    handleSubmit: handleSubmitGrade,
    reset: resetGrade,
    formState: { errors: gradeErrors }
  } = useForm({
    resolver: zodResolver(gradeSchema),
    defaultValues: { grade: 100, feedback: '' }
  });

  const assignment = assignments?.find(a => a.id === assignmentId);

  // Countdown timer for assignment deadline
  useEffect(() => {
    if (!assignment) return;
    const interval = setInterval(() => {
      const due = new Date(assignment.dueDate);
      const diff = due - new Date();

      if (diff <= 0) {
        setCountdownText('Deadline Expired');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setCountdownText(`${days} days, ${hours} hours, ${mins} minutes, ${secs} seconds remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [assignment]);

  // Simulate AI code evaluation when student submits or opens graded submission
  const triggerAiEvaluation = (contentString) => {
    setAnalyzing(true);
    setAiAnalysisResult('');
    
    setTimeout(() => {
      let analysisText = '';
      if (contentString.includes('.pdf')) {
        analysisText = "💡 **AI Document Critique:**\n- **Document Integrity**: Structured correctly with academic margins.\n- **Depth of Content**: The document references standard security criteria.\n- **Recommendation**: Add a code demonstration segment to support your theoretical claims.";
      } else if (contentString.includes('github.com')) {
        analysisText = "💡 **AI Repository Inspection:**\n- **Code Quality**: Identified robust utilization of React 19 concurrent features.\n- **Security Check**: Verified token parsing is safe from client side exposure.\n- **Optimization**: Use React.memo or compile checks for large listings.";
      } else {
        analysisText = "💡 **AI Answer Analysis:**\n- **Accuracy**: Highly detailed answer. Concepts correspond to course objectives.\n- **Clarity**: Solid logical paragraph progression.\n- **Enhancement**: Elaborate more on edge-cases and error handling routes.";
      }
      setAiAnalysisResult(analysisText);
      setAnalyzing(false);
    }, 2000);
  };

  const isStudent = user?.role === 'STUDENT';
  const studentSubmission = isStudent 
    ? submissions?.find(s => s.studentId === user.id) 
    : null;

  // Removed automatic AI evaluation

  if (courseLoading || assignmentsLoading || submissionsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 bg-white dark:bg-slate-900 border rounded-2xl" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assignment Not Found</h2>
        <Link to={`/courses/${courseId}`} className="text-indigo-650 dark:text-indigo-400 hover:underline mt-4 inline-block">&larr; Back to Course</Link>
      </div>
    );
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    const hasContent = textResponse.trim().length > 0;
    const hasFile = selectedFile !== null;

    if (!hasContent && !hasFile) {
      alert('Please provide a text answer or upload a worksheet file.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        assignmentId,
        content: textResponse.trim(),
        file: selectedFile
      });
      setIsResubmitting(false);
      setSelectedFile(null);
      setTextResponse('');
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  const onSubmitGrade = async (data) => {
    if (!submissionToGrade) return;
    try {
      await gradeMutation.mutateAsync({
        submissionId: submissionToGrade.id,
        gradeData: data
      });
      setSubmissionToGrade(null);
      resetGrade();
    } catch (e) {
      // Handled by hook
    }
  };

  const openGradingModal = (sub) => {
    setSubmissionToGrade(sub);
    resetGrade({
      grade: sub.grade !== null ? sub.grade : 100,
      feedback: sub.feedback || ''
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Back Button */}
      <Link 
        to={`/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-650 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course Syllabus
      </Link>

      {/* Assignment Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Assignment Sheet</span>
          </div>

          {countdownText && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-[10px] font-bold border border-rose-100 dark:border-rose-900/30 rounded-xl">
              <Clock className="w-3.5 h-3.5" />
              <span>{countdownText}</span>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
          {assignment.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line mb-4">
          {assignment.description}
        </p>
        <div className="text-xs font-semibold text-slate-450 border-t border-slate-100 dark:border-slate-850 pt-4">
          Due: {new Date(assignment.dueDate).toLocaleDateString()}
        </div>
      </div>

      {/* Student Submission Flow */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Submission Panel */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submission Panel</h3>

            {studentSubmission && !isResubmitting ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-bold text-sm">Submission Completed</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Submitted: {new Date(studentSubmission.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs overflow-x-auto">
                  {studentSubmission.content}
                </div>

                {studentSubmission.content.startsWith('http') && (
                  <a 
                    href={studentSubmission.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
                  >
                    <span>Open Submission Link</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-855">
                  <button
                    onClick={() => {
                      setIsResubmitting(true);
                      setTextResponse(studentSubmission.content);
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-650 hover:text-indigo-600 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
                  >
                    Resubmit Assignment
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  
                  {/* File Upload component */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Upload Worksheet Files
                    </label>
                    <DragDropUpload
                      onFileSelect={setSelectedFile}
                      accept=".pdf,.doc,.docx,.png,.zip"
                      maxSizeMb={10}
                    />
                  </div>

                  {/* Text area response alternative */}
                  {!selectedFile && (
                    <div className="space-y-1">
                      <label htmlFor="text-response" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                        Or Provide Web Link / Text Answer
                      </label>
                      <textarea
                        id="text-response"
                        rows={5}
                        placeholder="e.g. https://github.com/myusername/my-assignment-repo"
                        value={textResponse}
                        onChange={(e) => setTextResponse(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-mono"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{submitMutation.isPending ? 'Submitting...' : 'Send Submission'}</span>
                    </button>

                    {isResubmitting && (
                      <button
                        type="button"
                        onClick={() => setIsResubmitting(false)}
                        className="px-4 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Columns: Grade Evaluation status & AI Feedback */}
          <div className="space-y-6">
            
            {/* Grade summary */}
            {studentSubmission && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                  <Award className="h-5 w-5 text-indigo-500" />
                  <span>Grading Status</span>
                </div>

                {studentSubmission.grade !== null ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-350 block uppercase">Grade Scored</span>
                      <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-450">{studentSubmission.grade} / 100</span>
                    </div>

                    <div className="text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-350 block">Instructor Feedback:</span>
                      <p className="text-slate-500 dark:text-slate-400 italic mt-1 leading-relaxed bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        "{studentSubmission.feedback}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-xl text-center flex flex-col items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Clock className="h-7 w-7 text-amber-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Awaiting Evaluation</span>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">Your instructor has not graded this worksheet yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Feedback Card */}
            {studentSubmission?.aiFeedback && (
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-850 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 mb-3 select-none">
                  <Bot className="w-5 h-5" />
                  AI Evaluation Feedback
                </h4>
                <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                  {studentSubmission.aiFeedback}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Teacher Grading View */}
      {!isStudent && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Student Submissions ({submissions?.length || 0})</h3>
          
          {submissions?.length === 0 ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center bg-white dark:bg-slate-900 shadow-sm">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-650 dark:text-slate-300 text-sm">No submissions yet</h4>
              <p className="text-xs text-slate-450 max-w-xs mx-auto mt-1">Enrolled students have not submitted worksheets for this assignment yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
              {submissions?.map((sub) => (
                <div key={sub.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{sub.studentName}</span>
                      <span className="text-[10px] text-slate-450">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-xs truncate max-w-xl">
                      {sub.content}
                    </div>

                    {sub.aiFeedback && (
                      <div className="mt-3 bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-xl p-4 border border-indigo-850">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-indigo-300" />
                          <span className="font-bold text-xs uppercase tracking-wider text-indigo-300">AI Feedback</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                          {sub.aiFeedback}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    {sub.grade !== null ? (
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30">
                          Graded: {sub.grade} / 100
                        </span>
                      </div>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                        Pending Grade
                      </span>
                    )}

                    <button
                      onClick={async () => {
                        try {
                          await aiFeedbackMutation.mutateAsync({
                            submissionId: sub.id,
                            textContent: sub.content
                          });
                        } catch (err) {
                          console.error('AI feedback error:', err);
                        }
                      }}
                      disabled={aiFeedbackMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{aiFeedbackMutation.isPending ? 'Generating...' : 'AI Feedback'}</span>
                    </button>

                    <button
                      onClick={() => openGradingModal(sub)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                    >
                      <span>{sub.grade !== null ? 'Re-grade' : 'Grade'}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grading Modal */}
      <Modal
        isOpen={!!submissionToGrade}
        onClose={() => setSubmissionToGrade(null)}
        title={`Grade Submission - ${submissionToGrade?.studentName}`}
      >
        <form onSubmit={handleSubmitGrade(onSubmitGrade)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="grade" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block">
              Score (0 - 100)
            </label>
            <input
              id="grade"
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 95"
              {...registerGrade('grade', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-xs
                ${gradeErrors.grade ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800' }
              `}
            />
            {gradeErrors.grade && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{gradeErrors.grade.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="feedback" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block">
              Grading Feedback
            </label>
            <textarea
              id="feedback"
              rows={4}
              placeholder="Write constructive evaluation notes for the student..."
              {...registerGrade('feedback')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-xs resize-none
                ${gradeErrors.feedback ? 'border-rose-350' : 'border-slate-200 dark:border-slate-800'}
              `}
            />
            {gradeErrors.feedback && (
              <p className="text-rose-500 text-xs font-medium" role="alert">{gradeErrors.feedback.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setSubmissionToGrade(null)}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gradeMutation.isPending}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {gradeMutation.isPending ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
