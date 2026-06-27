/**
 * OTPInput — 6-box auto-advancing OTP input.
 * Handles paste, backspace-navigation, and keyboard-only usage.
 */
import React, { useRef, useState, useCallback } from 'react';

const OTP_LENGTH = 6;

export default function OTPInput({ value = '', onChange, disabled = false, hasError = false }) {
  const inputsRef = useRef([]);

  // Split the controlled value into individual chars
  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const updateValue = useCallback((newDigits) => {
    onChange(newDigits.join(''));
  }, [onChange]);

  const handleChange = (e, idx) => {
    const raw = e.target.value.replace(/\D/g, '');          // digits only
    if (!raw) return;
    const char = raw[raw.length - 1];                        // take last typed char

    const newDigits = [...digits];
    newDigits[idx] = char;
    updateValue(newDigits);

    // Advance focus
    if (idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[idx]) {
        newDigits[idx] = '';
        updateValue(newDigits);
      } else if (idx > 0) {
        newDigits[idx - 1] = '';
        updateValue(newDigits);
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newDigits = [...digits];
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
    updateValue(newDigits);

    // Focus the next empty box or the last one
    const nextEmpty = newDigits.findIndex((d, i) => i >= pasted.length && !d);
    const focusIdx  = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
    inputsRef.current[focusIdx]?.focus();
  };

  const handleFocus = (e) => e.target.select();

  return (
    <div
      role="group"
      aria-label="One-time password"
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          id={`otp-${idx}`}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          aria-label={`Digit ${idx + 1} of ${OTP_LENGTH}`}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          className={`
            h-12 w-12 sm:h-14 sm:w-14 flex-1 rounded-xl border text-center text-lg font-bold
            bg-white dark:bg-slate-800 text-slate-900 dark:text-white
            transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed caret-transparent
            ${digit ? 'border-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700'}
            ${hasError
              ? 'border-rose-400 focus:ring-rose-400/40 dark:border-rose-600'
              : 'focus:border-indigo-500 focus:ring-indigo-500/30 dark:focus:border-indigo-400'
            }
          `}
        />
      ))}
    </div>
  );
}
