/**
 * PasswordStrengthMeter — Visual strength bar + per-rule checklist.
 */
import React from 'react';
import { Check, X } from 'lucide-react';
import { usePasswordStrength } from '../hooks/usePasswordStrength';

export default function PasswordStrengthMeter({ password }) {
  const { score, maxScore, level, passed, failed } = usePasswordStrength(password);

  if (!password) return null;

  // Build 5 segment bars
  const segments = Array.from({ length: maxScore }, (_, i) => i < score);

  return (
    <div className="space-y-3 mt-2">
      {/* Segmented bar */}
      <div className="flex items-center gap-1.5">
        {segments.map((filled, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300
              ${filled && level ? level.color : 'bg-slate-200 dark:bg-slate-700'}
            `}
          />
        ))}
        {level && (
          <span className={`ml-2 text-[11px] font-bold shrink-0 ${level.textColor}`}>
            {level.label}
          </span>
        )}
      </div>

      {/* Rule checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {[...passed, ...failed].map((rule) => {
          const ok = passed.includes(rule);
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors
                ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
              `}
            >
              {ok
                ? <Check className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden="true" />
                : <X    className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
              }
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
