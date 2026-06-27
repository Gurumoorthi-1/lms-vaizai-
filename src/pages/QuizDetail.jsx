import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  useCourse, 
  useQuiz, 
  useQuizAttempts, 
  useSubmitQuiz 
} from '../hooks/useLms';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  ArrowLeft, 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function QuizDetail() {
  const { id: courseId, quizId } = useParams();
  const { user } = useAuthStore();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId);
  const { data: attempts, isLoading: attemptsLoading } = useQuizAttempts(quizId);
  
  const submitQuizMutation = useSubmitQuiz();

  // Active quiz state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [result, setResult] = useState(null);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      handleAutoSubmit();
    }

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  if (courseLoading || quizLoading || attemptsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 bg-white dark:bg-slate-900 border rounded-2xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Not Found</h2>
        <Link to={`/courses/${courseId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 inline-block">&larr; Back to Course</Link>
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';

  const startQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(120); // 2 minutes (120 seconds) for testing
    setResult(null);
    setIsPlaying(true);
  };

  const selectOption = (qId, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleQuizSubmit = async () => {
    setIsPlaying(false);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));

      const res = await submitQuizMutation.mutateAsync({
        quizId,
        answers: formattedAnswers
      });
      setResult(res);
    } catch (e) {
      // Handled by hook
    }
  };

  function handleAutoSubmit() {
    handleQuizSubmit();
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Student Main Dashboard (Not Playing)
  if (isStudent && !isPlaying) {
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

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
              <HelpCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Checkpoint Quiz</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{quiz.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Test your understanding of the course syllabus. This quiz contains {quiz.questions.length} questions and has a 2-minute time limit.
            </p>
          </div>

          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-indigo-500/10 shrink-0 self-start md:self-center"
          >
            Start Quiz Checkpoint
          </button>
        </div>

        {/* Results Screen if just finished */}
        {result && (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle className="h-5 w-5" />
              <span>Quiz Completed Successfully</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-slate-400 block uppercase">Final Score</span>
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{result.score}%</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-slate-400 block uppercase">Correct Questions</span>
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{result.correctCount} / {result.totalQuestions}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Attempts logs */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Attempt History</h3>
          {attempts.length === 0 ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-white dark:bg-slate-900">
              <Award className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">You have not attempted this quiz yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
              {attempts.map((attempt, index) => (
                <div key={attempt.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Attempt #{attempts.length - index}</span>
                    <p className="text-[10px] text-slate-450">Submitted: {new Date(attempt.submittedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{attempt.score}%</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border
                      ${attempt.score >= 60 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                      }
                    `}>
                      {attempt.score >= 60 ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // Student playing mode
  if (isStudent && isPlaying) {
    const currentQ = quiz.questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const hasSelected = answers[currentQ.id] !== undefined;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Timer header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <HelpCircle className="h-4 w-4 text-indigo-500" />
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shrink-0
            ${timeLeft < 30 
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 animate-pulse' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
            }
          `}>
            <Clock className="h-4 w-4" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-650 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {currentQ.text}
          </h2>

          <div className="flex flex-col gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(currentQ.id, idx)}
                  className={`w-full text-left px-5 py-4 rounded-xl border font-medium text-xs md:text-sm transition-all focus:outline-none flex items-center justify-between
                    ${isSelected 
                      ? 'border-indigo-650 bg-indigo-50/40 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/25 dark:text-indigo-300 font-bold' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                    }
                  `}
                >
                  <span>{option}</span>
                  <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0
                    ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400' : 'border-slate-300 dark:border-slate-650'}
                  `}>
                    {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={!hasSelected}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              <span>Next Question</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleQuizSubmit}
              disabled={submitQuizMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{submitQuizMutation.isPending ? 'Submitting...' : 'Finish Checkpoint'}</span>
            </button>
          )}
        </div>

      </div>
    );
  }

  // Teacher Syllabus Key View
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

      {/* Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Quiz Blueprint</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">{quiz.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This quiz contains {quiz.questions.length} multiple choice questions. Showing answer keys.
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Questions & Answer Keys</h3>
        <div className="space-y-4">
          {quiz.questions.map((q, qIdx) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Q{qIdx + 1}. {q.text}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {q.options.map((option, optIdx) => {
                  const isCorrect = q.correctOption === optIdx;
                  return (
                    <div 
                      key={optIdx} 
                      className={`p-3 rounded-lg border flex items-center justify-between
                        ${isCorrect 
                          ? 'border-emerald-250 bg-emerald-50 text-emerald-800 font-bold dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-450' 
                          : 'border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-850 dark:bg-slate-850 dark:text-slate-400'
                        }
                      `}
                    >
                      <span>{option}</span>
                      {isCorrect && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wide">
                          Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
