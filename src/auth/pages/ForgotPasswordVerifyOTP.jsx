/**
 * Forgot Password OTP Verification — Verify OTP then navigate to reset password.
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

export default function ForgotPasswordVerifyOTP() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') || '';
  const { addToast } = useToastStore();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Resend callback
  const onResend = useCallback(async () => {
    if (!email) throw new Error('Email address is required to resend OTP.');
    await authService.sendForgotPasswordOTP({ email });
  }, [email]);

  const {
    timeLeft, canResend, isResending, resendError, resendSuccess, handleResend, formatTime } = useOTP({ onResend });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setApiError('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    setApiError('');
    authService.verifyForgotPasswordOTP({ email, otp })
      .then(() => {
        addToast('OTP verified successfully!', 'success');
        navigate(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      })
      .catch((err) => {
        setApiError(err.message || 'Verification failed. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!email) {
    return (
      <AuthLayout
        title="OTP Verification"
        subtitle="No email address was provided."
        backTo="/auth/forgot-password"
        backLabel="Back to forgot password"
      >
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please enter your email again.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={
        <>
          Enter the 6-digit code sent to{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {email}
          </span>
        </>
      }
      backTo="/auth/forgot-password"
      backLabel="Back to forgot password"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
            <Shield className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center">
            Enter 6-digit OTP
          </label>
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            hasError={Boolean(apiError)}
          />
        </div>

        {apiError && (
          <p role="alert" className="text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {apiError}
          </p>
        )}

        {resendSuccess && (
          <p className="text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ✓ New OTP sent to {email}
          </p>
        )}

        {resendError && (
          <p role="alert" className="text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {resendError}
          </p>
        )}

        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={otp.length !== 6}
        >
          Verify OTP
        </AuthButton>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Didn't receive the code?
          </p>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
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
      </form>
    </AuthLayout>
  );
}
