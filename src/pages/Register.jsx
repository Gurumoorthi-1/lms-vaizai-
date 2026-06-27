import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { GraduationCap, Lock, Mail, User } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'Too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export default function Register() {
  const { register: registerApi, isLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setAuthLoading(true);
    try {
      await registerApi(
        data.email, 
        data.password, 
        data.firstName, 
        data.lastName, 
        'STUDENT' // Always register as STUDENT
      );
      addToast('Registration successful! Please login with your credentials.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create an account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Join Vaizai LMS today
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label 
                htmlFor="firstName" 
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                First Name
              </label>
              <input
                id="firstName"
                placeholder="Jane"
                disabled={isLoading || authLoading}
                {...register('firstName')}
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.firstName 
                    ? 'border-rose-300 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500'
                  }
                `}
              />
              {errors.firstName && (
                <p className="text-rose-500 text-xs font-medium" role="alert">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label 
                htmlFor="lastName" 
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Last Name
              </label>
              <input
                id="lastName"
                placeholder="Smith"
                disabled={isLoading || authLoading}
                {...register('lastName')}
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.lastName 
                    ? 'border-rose-300 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500'
                  }
                `}
              />
              {errors.lastName && (
                <p className="text-rose-500 text-xs font-medium" role="alert">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
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
                disabled={isLoading || authLoading}
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.email 
                    ? 'border-rose-300 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500'
                  }
                `}
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs font-medium" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
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
                type="password"
                placeholder="Password123!"
                disabled={isLoading || authLoading}
                {...register('password')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.password 
                    ? 'border-rose-300 focus:ring-rose-500' 
                    : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500'
                  }
                `}
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs font-medium max-w-sm" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
          >
            {isLoading || authLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
          <Link 
            to="/login" 
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
