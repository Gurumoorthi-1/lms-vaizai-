/**
 * Reset Password — Validates OTP from URL, shows new-password form
 * with live strength meter, then redirects to login on success.
 */
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { resetPasswordSchema } from '../hooks/useAuthForm';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const otp = params.get('otp') || '';
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = useWatch({ control, name: 'password' });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await authService.resetPassword({ email, otp, password: data.password });
      setDone(true);
    } catch (err) {
      setApiError(err.message || 'Failed to reset password.');
    }
  };

  // ── No email or otp in URL ──────────────────────────────────────────────────────
  if (!email || !otp) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This link is missing email or OTP."
        backTo="/auth/forgot-password"
        backLabel="Request a new OTP"
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please request a new password reset OTP.
          </p>
          <Link to="/auth/forgot-password">
            <AuthButton variant="outline">Request new OTP</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (done) {
    return (
      <AuthLayout
        title="Password updated!"
        subtitle="Your password has been changed. You can now sign in."
        backTo="/auth/login"
        backLabel="Go to sign in"
      >
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your account is secure and ready to use.
          </p>
          <Link to="/auth/login" className="w-full">
            <AuthButton>Sign in with new password</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Choose a strong password — you'll use it to sign in going forward."
      backTo="/auth/login"
      backLabel="Back to sign in"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* API error banner */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30
                       border border-rose-200 dark:border-rose-900/40 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{apiError}</p>
          </div>
        )}

        {/* New password */}
        <div>
          <FormInput
            id="password"
            label="New password"
            type="password"
            placeholder="Create a strong password"
            icon={Lock}
            error={errors.password?.message}
            disabled={isSubmitting}
            autoComplete="new-password"
            {...register('password')}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Confirm */}
        <FormInput
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          placeholder="Repeat your password"
          icon={Lock}
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        <AuthButton type="submit" isLoading={isSubmitting}>
          Update password
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
