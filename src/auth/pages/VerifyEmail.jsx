/**
 * Verify Email — Landing page for email verification link clicks.
 * Reads ?token= from URL and calls verifyEmailToken().
 */
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import AuthButton from '../components/AuthButton';
import { authService } from '../services/authService';

const STATUS = { VERIFYING: 'verifying', SUCCESS: 'success', ERROR: 'error', NO_TOKEN: 'no_token' };

export default function VerifyEmail() {
  const [params]  = useSearchParams();
  const token     = params.get('token') || '';
  const email     = params.get('email') || '';

  const [status, setStatus]   = useState(token ? STATUS.VERIFYING : STATUS.NO_TOKEN);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    authService.verifyEmailToken({ token })
      .then(res => {
        if (!cancelled) {
          setStatus(STATUS.SUCCESS);
          setMessage(res.message);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setStatus(STATUS.ERROR);
          setMessage(err.message || 'Verification failed.');
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  // ── Verifying spinner ─────────────────────────────────────────────────────
  if (status === STATUS.VERIFYING) {
    return (
      <AuthLayout title="Verifying your email…" subtitle="Please wait while we confirm your account.">
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Validating your verification link…
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === STATUS.SUCCESS) {
    return (
      <AuthLayout
        title="Email verified!"
        subtitle="Your account is now active. Welcome to Vaizai LMS."
        backTo="/auth/login"
        backLabel="Go to sign in"
      >
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            {/* Ripple rings */}
            <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {message || 'Your email has been verified.'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can now access all features of Vaizai LMS.
            </p>
          </div>

          <Link to="/auth/login" className="w-full">
            <AuthButton>Continue to sign in</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === STATUS.ERROR) {
    return (
      <AuthLayout
        title="Verification failed"
        subtitle="The link may have expired or already been used."
        backTo="/auth/login"
        backLabel="Back to sign in"
      >
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>
          <Link
            to={`/auth/otp-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="w-full"
          >
            <AuthButton>Verify with OTP instead</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── No token ─────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a verification link to your registered email address."
      backTo="/auth/login"
      backLabel="Back to sign in"
    >
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Mail className="h-8 w-8 text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Check your inbox
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Click the link in the email to verify your account. Prefer a code instead?
          </p>
        </div>
        <Link
          to={`/auth/otp-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`}
          className="w-full"
        >
          <AuthButton variant="outline">Verify with OTP code</AuthButton>
        </Link>
      </div>
    </AuthLayout>
  );
}
