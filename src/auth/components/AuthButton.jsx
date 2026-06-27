/**
 * AuthButton — Primary CTA button with spinner loading state,
 * full-width layout, and variant support.
 */
import React from 'react';

export default function AuthButton({
  children,
  type = 'button',
  isLoading = false,
  disabled = false,
  variant = 'primary',   // 'primary' | 'outline' | 'ghost'
  className = '',
  ...props
}) {
  const base = `
    w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5
    font-semibold text-sm transition-all duration-150 focus:outline-none
    focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed select-none
  `;

  const variants = {
    primary: `
      bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
      text-white shadow-md hover:shadow-indigo-500/25
      focus:ring-indigo-500 disabled:bg-indigo-400 disabled:shadow-none
    `,
    outline: `
      border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900
      text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800
      focus:ring-slate-400 disabled:opacity-50
    `,
    ghost: `
      text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30
      focus:ring-indigo-400 disabled:opacity-50
    `,
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
