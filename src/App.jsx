import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Layout & Route Guards
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Existing pages (kept for backward compatibility)
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import AssignmentDetail from './pages/AssignmentDetail';
import QuizDetail from './pages/QuizDetail';
import AIGenerator from './pages/AIGenerator';

// New Pages for Student Management & Dashboard
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import MyProgress from './pages/MyProgress';
import LiveClasses from './pages/LiveClasses';
import Assignments from './pages/Assignments';

// Discussion Forum & AI Mentor (lazy-loaded)
const DiscussionForum = lazy(() => import('./pages/DiscussionForum'));
const AIMentor = lazy(() => import('./pages/AIMentor'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Settings = lazy(() => import('./pages/Settings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));


// ── Auth Module (lazy-loaded) ─────────────────────────────────────────────
const AuthLogin          = lazy(() => import('./auth/pages/Login'));
const AuthRegister       = lazy(() => import('./auth/pages/Register'));
const AuthForgotPassword = lazy(() => import('./auth/pages/ForgotPassword'));
const AuthForgotPasswordVerifyOTP = lazy(() => import('./auth/pages/ForgotPasswordVerifyOTP'));
const AuthResetPassword  = lazy(() => import('./auth/pages/ResetPassword'));
const AuthVerifyEmail    = lazy(() => import('./auth/pages/VerifyEmail'));
const AuthOTPVerification = lazy(() => import('./auth/pages/OTPVerification'));

// Shared loading fallback for lazy auth pages
function AuthLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      <p className="mt-4 text-xs font-semibold text-slate-400 tracking-widest uppercase">Loading…</p>
    </div>
  );
}

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        <p className="mt-4 text-xs font-semibold text-slate-400 tracking-widest uppercase">
          Loading Vaizai LMS…
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<AuthLoader />}>
        <Routes>
          {/* ── Auth module routes (/auth/*) ──────────────────────────── */}
          <Route path="/auth/login"            element={<AuthLogin />} />
          <Route path="/auth/register"         element={<AuthRegister />} />
          <Route path="/auth/forgot-password"  element={<AuthForgotPassword />} />
          <Route path="/auth/forgot-password/verify-otp"  element={<AuthForgotPasswordVerifyOTP />} />
          <Route path="/auth/reset-password"   element={<AuthResetPassword />} />
          <Route path="/auth/verify-email"     element={<AuthVerifyEmail />} />
          <Route path="/auth/otp-verification" element={<AuthOTPVerification />} />

          {/* Legacy aliases — redirect old /login and /register paths */}
          <Route path="/login"    element={<Navigate to="/auth/login"    replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />

          {/* ── Protected dashboard routes ─────────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"                                        element={<Dashboard />} />
            <Route path="courses"                                          element={<CourseList />} />
            <Route path="courses/:id"                                      element={<CourseDetail />} />
            <Route path="courses/:id/assignments/:assignmentId"            element={<AssignmentDetail />} />
            <Route path="courses/:id/quiz/:quizId"                         element={<QuizDetail />} />
            <Route path="ai-generator"                                     element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}><AIGenerator /></ProtectedRoute>} />

            {/* Live Classes */}
            <Route path="live-classes"                                     element={<LiveClasses />} />

            {/* Assignments */}
            <Route path="assignments"                                      element={<Assignments />} />

            {/* Student Management (Admin & Teacher only) */}
            <Route path="students"     element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}><StudentList /></ProtectedRoute>} />
            <Route path="students/:id" element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}><StudentProfile /></ProtectedRoute>} />

            {/* Student Progress Dashboard (Student self-service) */}
            <Route path="my-progress"  element={<ProtectedRoute allowedRoles={['STUDENT']}><MyProgress /></ProtectedRoute>} />

            {/* Discussion Forum */}
            <Route path="forum" element={<ProtectedRoute><DiscussionForum /></ProtectedRoute>} />

            {/* AI Mentor Chat */}
            <Route path="ai-mentor" element={<ProtectedRoute><AIMentor /></ProtectedRoute>} />

            {/* Analytics Dashboard (Teachers & Admins only) */}
            <Route path="analytics" element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}><AnalyticsDashboard /></ProtectedRoute>} />

            {/* Certificates Module */}
            <Route path="certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />

            {/* Profile and Settings */}
            <Route path="profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
