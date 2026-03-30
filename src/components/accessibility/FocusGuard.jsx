import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMode } from '../../contexts/ModeContext';
import Button from '../shared/Button';

// Context so AppShell can read whether focus mode is active
const FocusGuardContext = createContext({
  focusMode: false,
  setFocusMode: () => {},
});

export function useFocusGuard() {
  return useContext(FocusGuardContext);
}

export function FocusGuardProvider({ children }) {
  const { mode, modeConfig } = useMode();
  const defaultOn = mode === 'adhd' && (modeConfig.ui?.singleTaskView ?? false);
  const [focusMode, setFocusMode] = useState(defaultOn);

  // Sync with mode changes
  useEffect(() => {
    if (mode === 'adhd' && modeConfig.ui?.singleTaskView) {
      setFocusMode(true);
    } else {
      setFocusMode(false);
    }
  }, [mode, modeConfig.ui?.singleTaskView]);

  return (
    <FocusGuardContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </FocusGuardContext.Provider>
  );
}

// Wrapper that renders its children in a clean, focused layout
export default function FocusGuard({ children, progress }) {
  const { focusMode, setFocusMode } = useFocusGuard();

  if (!focusMode) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-[var(--bg-main,#f9fafb)]">
      {/* Progress bar - always visible at top */}
      {progress != null && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-[var(--accent,#6366f1)] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Session progress"
          />
        </div>
      )}

      {/* Exit Focus Mode button */}
      <button
        type="button"
        onClick={() => setFocusMode(false)}
        className={[
          'fixed top-3 right-3 z-[101]',
          'px-2.5 py-1 rounded-lg text-xs font-medium',
          'bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm',
          'text-gray-500 dark:text-gray-400',
          'hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200',
          'transition-colors duration-150',
          'border border-gray-200 dark:border-gray-600',
        ].join(' ')}
        aria-label="Exit focus mode"
      >
        Exit Focus Mode
      </button>

      {/* Centered single-task content */}
      <div className="flex items-start justify-center pt-12 px-4 pb-8">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
