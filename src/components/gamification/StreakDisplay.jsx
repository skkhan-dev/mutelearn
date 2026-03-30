import React from 'react';
import { useGamification } from '../../contexts/GamificationContext';

function getStreakMessage(current) {
  if (current === 0) return 'Start a new streak today!';
  if (current === 1) return 'Great start! Come back tomorrow!';
  if (current < 3) return 'Building momentum!';
  if (current < 7) return "You're on fire! Keep it going!";
  if (current < 14) return 'Incredible consistency!';
  if (current < 30) return 'Unstoppable learner!';
  return 'Legendary dedication!';
}

function getFireIntensity(current) {
  if (current === 0) return 'opacity-30 grayscale';
  if (current < 3) return '';
  if (current < 7) return 'scale-110';
  return 'scale-125';
}

export default function StreakDisplay({ compact = false }) {
  const { streak } = useGamification();
  const { current, longest } = streak;
  const message = getStreakMessage(current);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 group relative">
        <span
          className={`text-lg transition-transform duration-300 ${getFireIntensity(current)}`}
          style={
            current >= 3
              ? { animation: 'fireFlicker 0.6s ease-in-out infinite alternate' }
              : undefined
          }
        >
          {current > 0 ? '\uD83D\uDD25' : '\u2744\uFE0F'}
        </span>
        <span className="text-sm font-bold text-[var(--text-primary,#111827)] tabular-nums">
          {current}
        </span>

        {/* Hover tooltip */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {current} day streak &middot; Best: {longest}
        </div>

        <style>{`
          @keyframes fireFlicker {
            0% { transform: scale(1) rotate(-3deg); }
            100% { transform: scale(1.1) rotate(3deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Fire icon */}
      <div className="mb-2">
        <span
          className={`text-5xl inline-block transition-transform duration-300 ${getFireIntensity(current)}`}
          style={
            current >= 3
              ? { animation: 'fireFlicker 0.6s ease-in-out infinite alternate' }
              : undefined
          }
        >
          {current > 0 ? '\uD83D\uDD25' : '\u2744\uFE0F'}
        </span>
      </div>

      {/* Streak number */}
      <div className="mb-1">
        <span className="text-4xl font-extrabold text-[var(--text-primary,#111827)] tabular-nums">
          {current}
        </span>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary,#6b7280)] mb-3">
        day streak
      </p>

      {/* Message */}
      <p
        className="text-sm font-medium mb-4"
        style={{
          color: current > 0 ? 'var(--accent, #6366f1)' : 'var(--text-secondary, #6b7280)',
        }}
      >
        {message}
      </p>

      {/* Longest streak */}
      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold">
        <span>{'\uD83C\uDFC6'}</span>
        <span>Longest: {longest} {longest === 1 ? 'day' : 'days'}</span>
      </div>

      <style>{`
        @keyframes fireFlicker {
          0% { transform: scale(1) rotate(-3deg); }
          100% { transform: scale(1.15) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
