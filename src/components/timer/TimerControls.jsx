import React from 'react';
import Button from '../shared/Button';

export default function TimerControls({
  isRunning,
  hasStarted = false,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  isBreak = false,
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Primary action row */}
      <div className="flex items-center gap-3">
        {!hasStarted && !isRunning ? (
          /* Start button - large and inviting */
          <Button size="lg" onClick={onStart} className="min-w-[160px]">
            <PlayIcon />
            Start
          </Button>
        ) : (
          <>
            {/* Pause / Resume toggle */}
            <Button
              size="lg"
              onClick={isRunning ? onPause : onResume}
              className="min-w-[140px]"
            >
              {isRunning ? (
                <>
                  <PauseIcon />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon />
                  Resume
                </>
              )}
            </Button>

            {/* Reset button */}
            <Button
              variant="outline"
              size="lg"
              onClick={onReset}
              aria-label="Reset timer"
            >
              <ResetIcon />
            </Button>
          </>
        )}
      </div>

      {/* Skip action */}
      {hasStarted && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-[var(--text-secondary,#6b7280)]"
        >
          <SkipIcon />
          {isBreak ? 'Skip Break' : 'Skip to Break'}
        </Button>
      )}
    </div>
  );
}

/* Inline SVG icons for self-contained component */

function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.5 4.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="3.5" height="12" rx="1" />
      <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10a6 6 0 1 1 1.76 4.24" />
      <polyline points="4 6 4 10 8 10" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 3v10l6-5-6-5z" />
      <rect x="11" y="3" width="2" height="10" rx="0.5" />
    </svg>
  );
}
