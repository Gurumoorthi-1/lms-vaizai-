/**
 * Register Page — Full registration with role picker,
 * live password strength meter, and terms agreement.
 */
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { registerSchema } from '../hooks/useAuthForm';
import { authService } from '../services/authService';
import { useToastStore } from '../../store/toastStore';

export default function Register() {
  const { addToast } = useToastStore();
  const navigate     = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  // Watch password for live strength meter
  const password = useWatch({ control, name: 'password' });

  const onSubmit = async (data) => {
    try {
      // Only send fields that backend expects
      await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: 'STUDENT'
      });
      addToast('Account created successfully! Please sign in.', 'success');
      navigate('/auth/login');
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join 12,000+ learners on Vaizai LMS. It's completely free."
      backTo="/auth/login"
      backLabel="Back to sign in"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            id="firstName"
            label="First name"
            placeholder="Jane"
            icon={User}
            error={errors.firstName?.message}
            disabled={isSubmitting}
            autoComplete="given-name"
            {...register('firstName')}
          />
          <FormInput
            id="lastName"
            label="Last name"
            placeholder="Smith"
            error={errors.lastName?.message}
            disabled={isSubmitting}
            autoComplete="family-name"
            {...register('lastName')}
          />
        </div>

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
        <div className="space-y-0">
          <FormInput
            id="password"
            label="Password"
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

        {/* Confirm password */}
        <FormInput
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          icon={Lock}
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        {/* Terms */}
        <div className="space-y-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              id="agreeToTerms"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              {...register('agreeToTerms')}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              I agree to the{' '}
              <a href="#" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p role="alert" className="text-[11px] font-medium text-rose-500 pl-6">
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <AuthButton type="submit" isLoading={isSubmitting}>
          Create my account
        </AuthButton>

        {/* Sign in link */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
