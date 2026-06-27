/**
 * usePasswordStrength — Analyses password entropy and returns a score 0–4.
 * Criteria: length, uppercase, lowercase, number, special char.
 */
import { useMemo } from 'react';

const rules = [
  { test: (p) => p.length >= 8,            label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),          label: 'Uppercase letter' },
  { test: (p) => /[a-z]/.test(p),          label: 'Lowercase letter' },
  { test: (p) => /[0-9]/.test(p),          label: 'Number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p),  label: 'Special character (!@#$…)' },
];

const LEVELS = [
  { label: 'Very Weak', color: 'bg-rose-500',   textColor: 'text-rose-500'   },
  { label: 'Weak',      color: 'bg-orange-500',  textColor: 'text-orange-500' },
  { label: 'Fair',      color: 'bg-amber-400',   textColor: 'text-amber-500'  },
  { label: 'Strong',    color: 'bg-lime-500',    textColor: 'text-lime-600'   },
  { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
];

export function usePasswordStrength(password = '') {
  return useMemo(() => {
    if (!password) return { score: 0, level: null, passed: [], failed: rules };

    const passed = rules.filter(r => r.test(password));
    const score  = passed.length; // 0–5, map to 0–4 for 5 levels
    const levelIndex = Math.min(score - 1, 4);
    const level = score === 0 ? null : LEVELS[levelIndex];

    return {
      score,
      maxScore: rules.length,
      level,
      passed,
      failed: rules.filter(r => !r.test(password)),
    };
  }, [password]);
}
