import { useState } from 'react';
import { useMode } from '../../contexts/ModeContext';
import { useGamification } from '../../contexts/GamificationContext';
import { xpPerLevel, levelNames } from '../../config/modeDefaults';
import ModeSwitcher from '../mode/ModeSwitcher';

export default function TopBar({ onToggleSidebar }) {
  const { mode, modeConfig } = useMode();
  const { xp, level, streak } = useGamification();
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);

  const xpNeeded = xpPerLevel(level);
  const xpPercent = Math.min((xp / xpNeeded) * 100, 100);
  const levelName = levelNames[level - 1] || `Level ${level}`;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-md transition-colors hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span
          className="hidden sm:inline text-lg font-bold tracking-tight"
          style={{ color: 'var(--accent)' }}
        >
          🔇 MuteLearn
        </span>

        {/* Mode badge */}
        <span
          className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
          }}
        >
          {modeConfig.icon} {modeConfig.label}
        </span>
      </div>

      {/* Center: XP bar */}
      <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs mx-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Lv.{level}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {xp}/{xpNeeded} XP
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${xpPercent}%`,
                backgroundColor: 'var(--accent)',
              }}
            />
          </div>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
            {levelName}
          </p>
        </div>
      </div>

      {/* Right: streak + mode switcher */}
      <div className="flex items-center gap-2">
        {/* Streak */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold"
          style={{
            backgroundColor: streak.current > 0 ? 'var(--bg-primary)' : 'transparent',
            color: streak.current > 0 ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title={`Current streak: ${streak.current} day${streak.current !== 1 ? 's' : ''}`}
        >
          <span role="img" aria-label="streak">🔥</span>
          <span>{streak.current}</span>
        </div>

        {/* Mode switcher toggle */}
        <div className="relative">
          <button
            onClick={() => setShowModeSwitcher((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
            aria-label="Switch study mode"
          >
            <span>{modeConfig.icon}</span>
            <span className="hidden md:inline">{modeConfig.label}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showModeSwitcher && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowModeSwitcher(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 z-50">
                <ModeSwitcher onClose={() => setShowModeSwitcher(false)} />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
