import React from 'react';
import { useGamification } from '../../contexts/GamificationContext';
import { xpPerLevel, levelNames } from '../../config/modeDefaults';

export default function XPBar({ compact = false }) {
  const { xp, level, xpPopup } = useGamification();
  const needed = xpPerLevel(level);
  const percent = Math.min(100, (xp / needed) * 100);
  const levelName = levelNames[level - 1] || levelNames[levelNames.length - 1];

  if (compact) {
    return (
      <div className="relative flex items-center gap-2">
        {/* Level badge */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent,#6366f1)] text-white flex items-center justify-center text-xs font-bold shadow-sm">
          {level}
        </div>

        {/* XP bar */}
        <div className="relative w-28 group">
          <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, var(--accent, #6366f1), #a78bfa)',
              }}
            />
          </div>
          {/* Tooltip on hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {xp} / {needed} XP &middot; {levelName}
          </div>
        </div>

        {/* XP popup */}
        {xpPopup && (
          <div
            className="absolute -top-6 right-0 text-sm font-bold text-[var(--accent,#6366f1)] animate-bounce pointer-events-none"
            style={{
              animation: 'xpFloat 1.5s ease-out forwards',
            }}
          >
            +{xpPopup.amount} XP
          </div>
        )}

        <style>{`
          @keyframes xpFloat {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-24px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent,#6366f1)] to-purple-500 text-white flex items-center justify-center text-lg font-bold shadow-md">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary,#111827)]">
              Level {level}
            </p>
            <p className="text-xs text-[var(--text-secondary,#6b7280)]">
              {levelName}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-[var(--text-secondary,#6b7280)] tabular-nums">
          {xp} / {needed} XP
        </span>
      </div>

      {/* Full progress bar */}
      <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, var(--accent, #6366f1), #a78bfa, #c4b5fd)',
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* XP popup */}
      {xpPopup && (
        <div
          className="absolute top-0 right-0 text-base font-bold text-[var(--accent,#6366f1)] pointer-events-none"
          style={{
            animation: 'xpFloat 1.5s ease-out forwards',
          }}
        >
          +{xpPopup.amount} XP
          {xpPopup.reason && (
            <span className="text-xs font-normal ml-1 opacity-70">
              {xpPopup.reason}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes xpFloat {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-28px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
