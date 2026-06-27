/**
 * FormInput — Reusable input field with icon, error message,
 * optional password visibility toggle, and ARIA accessibility.
 */
import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = forwardRef(function FormInput(
  {
    id,
    label,
    type = 'text',
    placeholder,
    error,
    icon: Icon,
    hint,
    disabled,
    className = '',
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasError = Boolean(error);
  const errorId = `${id}-error`;
  const hintId  = `${id}-hint`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div className="relative">
        {/* Leading icon */}
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Icon
              className={`h-4.5 w-4.5 transition-colors
                ${hasError
                  ? 'text-rose-400'
                  : 'text-slate-400 dark:text-slate-500'
                }`}
              aria-hidden="true"
            />
          </div>
        )}

        <input
          ref={ref}
          id={id}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            [hasError && errorId, hint && hintId].filter(Boolean).join(' ') || undefined
          }
          className={`
            w-full rounded-xl border bg-white dark:bg-slate-800/60 py-2.5 text-sm text-slate-900
            dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:opacity-50
            ${Icon ? 'pl-10' : 'pl-4'}
            ${isPassword ? 'pr-10' : 'pr-4'}
            ${hasError
              ? 'border-rose-300 dark:border-rose-700/60 focus:ring-rose-400/40 focus:border-rose-400'
              : 'border-slate-200 dark:border-slate-700/60 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400'
            }
          `}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400
                       hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword
              ? <EyeOff className="h-4 w-4" aria-hidden="true" />
              : <Eye    className="h-4 w-4" aria-hidden="true" />
            }
          </button>
        )}
      </div>

      {/* Hint text */}
      {hint && !hasError && (
        <p id={hintId} className="text-[11px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-[11px] font-medium text-rose-500 dark:text-rose-400"
        >
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

export default FormInput;
