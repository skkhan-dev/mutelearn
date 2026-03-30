import React, { useEffect, useState } from 'react';
import { useMode } from '../../contexts/ModeContext';
import { useIdleDetection } from '../../hooks/useIdleDetection';

const nudgeMessages = [
  "Still working? Take your time \u{1F4AD}",
  "No rush \u2014 you're doing great \u{1F331}",
  "Whenever you're ready, you've got this \u{2728}",
  "A small step still counts \u{1F43E}",
  "It's okay to pause and think \u{1F30A}",
];

function pickMessage() {
  return nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];
}

export default function IdleNudge() {
  const { mode, modeConfig } = useMode();
  const timeout = modeConfig.ui?.idleTimeout ?? 120;
  const nudgeEnabled = modeConfig.accessibility?.idleNudge ?? false;

  const isActive = mode === 'add' && nudgeEnabled && timeout > 0;

  const { isIdle, resetIdle } = useIdleDetection(isActive ? timeout : 0);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(nudgeMessages[0]);

  useEffect(() => {
    if (isIdle && isActive) {
      setMessage(pickMessage());
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isIdle, isActive]);

  const dismiss = () => {
    setVisible(false);
    resetIdle();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={dismiss}
        className={[
          'px-5 py-3 rounded-2xl shadow-lg',
          'bg-amber-50 dark:bg-amber-900/80 border border-amber-200 dark:border-amber-700',
          'text-amber-800 dark:text-amber-100 text-sm font-medium',
          'hover:shadow-xl hover:scale-[1.02] active:scale-100',
          'transition-all duration-300 cursor-pointer',
          'backdrop-blur-sm',
        ].join(' ')}
        aria-label="Dismiss nudge"
      >
        {message}
      </button>

      {/* Inline keyframe for the entrance animation */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
