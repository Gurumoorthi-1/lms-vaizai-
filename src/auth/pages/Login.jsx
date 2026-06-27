/**
 * Login Page — Email + password with Remember Me and social auth.
 */
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';
import { loginSchema } from '../hooks/useAuthForm';
import { authService } from '../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export default function Login() {
  const { login, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email:      authService.getRememberedEmail(),
      password:   '',
      rememberMe: Boolean(authService.getRememberedEmail()),
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      if (data.rememberMe) {
        localStorage.setItem('vaizai_remember_me', data.email);
      } else {
        localStorage.removeItem('vaizai_remember_me');
      }
      addToast('Welcome back! Login successful.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      addToast(err.message || 'Login failed. Please try again.', 'error');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Vaizai LMS account to continue learning."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <FormInput
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email?.message}
          disabled={isSubmitting}
          autoComplete="email"
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-1.5">
          <FormInput
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            disabled={isSubmitting}
            autoComplete="current-password"
            {...register('password')}
          />

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                {...register('rememberMe')}
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Remember me
              </span>
            </label>

            <Link
              to="/auth/forgot-password"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <AuthButton type="submit" isLoading={isSubmitting}>
          Sign in to account
        </AuthButton>

        {/* Sign up link */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Create one free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
