import React, { useState } from 'react';
import { useGamification } from '../../contexts/GamificationContext';
import { badges } from '../../config/badges';
import Card from '../shared/Card';

export default function BadgeGrid() {
  const { unlockedBadges } = useGamification();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const unlockedCount = unlockedBadges.length;
  const totalCount = badges.length;

  return (
    <div>
      {/* Badge count header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--text-primary,#111827)]">
          Badge Collection
        </h3>
        <div className="flex items-center gap-1.5 bg-[var(--accent,#6366f1)]/10 px-3 py-1 rounded-full">
          <span className="text-sm font-semibold text-[var(--accent,#6366f1)]">
            {unlockedCount} / {totalCount}
          </span>
          <span className="text-xs text-[var(--text-secondary,#6b7280)]">
            unlocked
          </span>
        </div>
      </div>

      {/* Progress bar for badges */}
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${(unlockedCount / totalCount) * 100}%`,
            background: 'linear-gradient(90deg, #f59e0b, #f97316)',
          }}
        />
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {badges.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const isSelected = selectedBadge === badge.id;

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(isSelected ? null : badge.id)}
              className={[
                'relative rounded-xl border-2 p-3 text-center cursor-pointer transition-all duration-300',
                isUnlocked
                  ? 'border-[var(--accent,#6366f1)]/30 bg-[var(--bg-card,#ffffff)] hover:border-[var(--accent,#6366f1)] hover:shadow-lg hover:-translate-y-0.5'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 hover:opacity-80',
                isSelected && isUnlocked && 'ring-2 ring-[var(--accent,#6366f1)] shadow-lg border-[var(--accent,#6366f1)]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Unlocked sparkle indicator */}
              {isUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div
                className={[
                  'text-3xl mb-1.5 transition-transform duration-300',
                  isUnlocked && 'hover:scale-110',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.7)',
                }}
              >
                {isUnlocked ? badge.icon : '???'}
              </div>

              {/* Name */}
              <p
                className={[
                  'text-xs font-semibold truncate',
                  isUnlocked
                    ? 'text-[var(--text-primary,#111827)]'
                    : 'text-[var(--text-secondary,#6b7280)]',
                ].join(' ')}
              >
                {badge.name}
              </p>

              {/* Expanded description on select */}
              {isSelected && (
                <div
                  className="mt-2 text-xs leading-relaxed"
                  style={{ animation: 'badgeExpand 0.2s ease-out' }}
                >
                  <p
                    className={
                      isUnlocked
                        ? 'text-[var(--text-secondary,#6b7280)]'
                        : 'text-[var(--text-secondary,#6b7280)] italic'
                    }
                  >
                    {isUnlocked ? badge.description : 'Keep studying to unlock!'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes badgeExpand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 60px; }
        }
      `}</style>
    </div>
  );
}
