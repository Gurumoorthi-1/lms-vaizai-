/**
 * OTP Verification — 6-box OTP entry with countdown timer and resend.
 */
import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import OTPInput from '../components/OTPInput';
import AuthButton from '../components/AuthButton';
import { useOTP } from '../hooks/useOTP';
import { authService } from '../services/authService';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export default function OTPVerification() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const email      = params.get('email') || '';
  const { addToast } = useToastStore();
  const { login } = useAuthStore();

  const [otp, setOtp]           = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError]   = useState('');

  // Resend callback
  const onResend = useCallback(async () => {
    if (!email) throw new Error('Email address is required to resend OTP.');
    await authService.sendVerificationOTP(email);
  }, [email]);

  const {
    timeLeft, canResend, isResending,
    resendError, resendSuccess, handleResend, formatTime,
  } = useOTP({ onResend });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setApiError('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    setApiError('');
    try {
      await authService.verifyOTP({ email, otp });
      // Auto login after verification
      await login(email, 'password');
      addToast('Email verified successfully! Welcome aboard.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── No email provided ─────────────────────────────────────────────────────
  if (!email) {
    return (
      <AuthLayout
        title="OTP Verification"
        subtitle="No email address was provided."
        backTo="/auth/register"
        backLabel="Back to register"
      >
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please register or use a valid verification link.
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ── OTP form ──────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {email}
          </span>
        </>
      }
      backTo="/auth/register"
      backLabel="Back to register"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
            <Shield className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* OTP input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center">
            Enter verification code
          </label>
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            hasError={Boolean(apiError)}
          />
        </div>

        {/* Error */}
        {apiError && (
          <p role="alert" className="text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {apiError}
          </p>
        )}

        {/* Resend success */}
        {resendSuccess && (
          <p className="text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
             New OTP sent to {email}
          </p>
        )}

        {/* Resend error */}
        {resendError && (
          <p role="alert" className="text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {resendError}
          </p>
        )}

        {/* Submit */}
        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={otp.length !== 6}
        >
          Verify code
        </AuthButton>

        {/* Resend / Timer */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Didn't receive the code?
          </p>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400
                         hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors
                         disabled:opacity-50"
            >
              {isResending ? 'Resending…' : 'Resend OTP'}
            </button>
          ) : (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Resend in{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </p>
          )}
        </div>

        {/* Dev hint */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 text-center">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            🛠 Dev: Check browser console for the OTP code
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
