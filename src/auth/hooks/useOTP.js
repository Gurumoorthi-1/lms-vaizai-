/**
 * useOTP — Manages OTP state, countdown timer, and resend throttling.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const RESEND_COOLDOWN = 60; // seconds

export function useOTP({ onResend }) {
  const [timeLeft, setTimeLeft]   = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    setTimeLeft(RESEND_COOLDOWN);
    setCanResend(false);
    setResendSuccess(false);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const handleResend = useCallback(async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setResendError(null);
    try {
      await onResend();
      setResendSuccess(true);
      startTimer();
    } catch (err) {
      setResendError(err.message || 'Failed to resend. Try again.');
    } finally {
      setIsResending(false);
    }
  }, [canResend, isResending, onResend, startTimer]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    canResend,
    isResending,
    resendError,
    resendSuccess,
    handleResend,
    formatTime,
  };
}
