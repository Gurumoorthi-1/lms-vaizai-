/**
 * Forgot Password — Sends OTP to email, then navigates to verify OTP.
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';
import { forgotPasswordSchema } from '../hooks/useAuthForm';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    setApiError('');
    try {
      await authService.sendForgotPasswordOTP({ email });
      setSentEmail(email);
      setSubmitted(true);
    } catch (err) {
      setApiError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`We've sent a 6-digit OTP to ${sentEmail}.`}
        backTo="/auth/login"
        backLabel="Back to sign in"
      >
        <div className="space-y-6">
          {/* Success card */}
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                OTP sent successfully!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Didn't receive it? Check your spam folder or request a new one.
              </p>
            </div>
          </div>

          <AuthButton onClick={() => navigate(`/auth/forgot-password/verify-otp?email=${encodeURIComponent(sentEmail)}`)}>
            Verify OTP
          </AuthButton>

          <AuthButton
            variant="outline"
            onClick={() => setSubmitted(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            Try a different email
          </AuthButton>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Remembered your password?{' '}
            <Link
              to="/auth/login"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries! Enter your email and we'll send you an OTP."
      backTo="/auth/login"
      backLabel="Back to sign in"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormInput
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email?.message}
          disabled={isSubmitting}
          autoComplete="email"
          hint="Enter the email address associated with your account."
          {...register('email')}
        />

        {apiError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{apiError}</p>
          </div>
        )}

        <AuthButton type="submit" isLoading={isSubmitting}>
          Send OTP
        </AuthButton>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered your password?{' '}
          <Link
            to="/auth/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
