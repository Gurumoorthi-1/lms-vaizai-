import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { GraduationCap, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export default function Login() {
  const { login, isLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      addToast('Login successful! Welcome back.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      addToast(err.message || 'Login failed. Please check credentials.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to your account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Access courses, assignments, and grades
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          
          {/* Email field */}
          <div className="space-y-1">
            <label 
              htmlFor="email" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.email 
                    ? 'border-rose-300 dark:border-rose-800/50 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500'
                  }
                `}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-rose-500 text-xs font-medium mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label 
              htmlFor="password" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
                {...register('password')}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.password 
                    ? 'border-rose-300 dark:border-rose-800/50 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-rose-500 text-xs font-medium mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs space-y-1 text-slate-400">
          <p className="font-semibold text-slate-500 dark:text-slate-400">Demo Credentials (Password: Password123!)</p>
          <div className="grid grid-cols-3 gap-1 pt-1 font-mono">
            <div>
              <span className="font-bold text-slate-500">Student:</span>
              <p className="truncate">student@vaizai.com</p>
            </div>
            <div>
              <span className="font-bold text-slate-500">Teacher:</span>
              <p className="truncate">teacher@vaizai.com</p>
            </div>
            <div>
              <span className="font-bold text-slate-500">Admin:</span>
              <p className="truncate">admin@vaizai.com</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Don't have an account? </span>
          <Link 
            to="/register" 
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
}
