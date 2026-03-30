import React, { useState, useEffect, useCallback, useRef } from 'react';
import CircularProgress from '../shared/CircularProgress';
import { useTimer } from '../../hooks/useTimer';
import { useMode } from '../../contexts/ModeContext';
import { useGamification } from '../../contexts/GamificationContext';
import TimerControls from './TimerControls';
import BreakSuggestion from './BreakSuggestion';

const PHASES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

const phaseLabels = {
  [PHASES.FOCUS]: 'Focus Time',
  [PHASES.SHORT_BREAK]: 'Short Break',
  [PHASES.LONG_BREAK]: 'Long Break',
};

const phaseColors = {
  [PHASES.FOCUS]: 'var(--accent, #6366f1)',
  [PHASES.SHORT_BREAK]: '#10b981',
  [PHASES.LONG_BREAK]: '#f59e0b',
};

export default function PomodoroTimer({ onSessionComplete }) {
  const { mode, modeConfig } = useMode();
  const { addXP, updateStreak, updateStats, checkBadges, addSessionHistory } =
    useGamification();

  const timerSettings = modeConfig.timer;
  const [phase, setPhase] = useState(PHASES.FOCUS);
  const [currentSession, setCurrentSession] = useState(1);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [flash, setFlash] = useState(false);
  const sessionStartRef = useRef(null);

  const phaseDuration =
    phase === PHASES.FOCUS
      ? timerSettings.focus
      : phase === PHASES.SHORT_BREAK
        ? timerSettings.shortBreak
        : timerSettings.longBreak;

  const timer = useTimer(phaseDuration);

  // Sync timer duration when phase or settings change (only when not running)
  useEffect(() => {
    if (!timer.isRunning) {
      timer.setDuration(phaseDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, phaseDuration]);

  // Handle timer completion and auto-transition
  useEffect(() => {
    if (!timer.isComplete) return;

    // Flash effect
    setFlash(true);
    const flashTimeout = setTimeout(() => setFlash(false), 1200);

    if (phase === PHASES.FOCUS) {
      // Focus session completed
      const elapsed = phaseDuration;
      const sessionData = {
        type: 'focus',
        duration: elapsed,
        session: currentSession,
        mode,
      };

      addXP(modeConfig.gamification.xpPerSession, 'Focus session');
      updateStreak();
      updateStats({ totalSessions: 1 });
      addSessionHistory(sessionData);
      checkBadges();
      onSessionComplete?.(sessionData);

      // Transition to break
      if (currentSession >= timerSettings.sessionsBeforeLong) {
        setPhase(PHASES.LONG_BREAK);
      } else {
        setPhase(PHASES.SHORT_BREAK);
      }
    } else {
      // Break completed, transition to next focus session
      if (phase === PHASES.LONG_BREAK) {
        setCurrentSession(1);
      } else {
        setCurrentSession((prev) => prev + 1);
      }
      setPhase(PHASES.FOCUS);
    }

    return () => clearTimeout(flashTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isComplete]);

  const handleStart = useCallback(() => {
    setHasStartedOnce(true);
    sessionStartRef.current = Date.now();
    timer.start();
  }, [timer]);

  const handlePause = useCallback(() => {
    timer.pause();
  }, [timer]);

  const handleResume = useCallback(() => {
    timer.resume();
  }, [timer]);

  const handleReset = useCallback(() => {
    timer.reset(phaseDuration);
    setPhase(PHASES.FOCUS);
    setCurrentSession(1);
    setHasStartedOnce(false);
  }, [timer, phaseDuration]);

  const handleSkip = useCallback(() => {
    timer.pause();
    if (phase === PHASES.FOCUS) {
      // Skip to break
      if (currentSession >= timerSettings.sessionsBeforeLong) {
        setPhase(PHASES.LONG_BREAK);
      } else {
        setPhase(PHASES.SHORT_BREAK);
      }
    } else {
      // Skip break
      if (phase === PHASES.LONG_BREAK) {
        setCurrentSession(1);
      } else {
        setCurrentSession((prev) => prev + 1);
      }
      setPhase(PHASES.FOCUS);
    }
  }, [phase, currentSession, timerSettings.sessionsBeforeLong, timer]);

  const isBreak = phase !== PHASES.FOCUS;
  const activeColor = phaseColors[phase];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Phase label */}
      <div
        className="text-sm font-semibold tracking-wider uppercase transition-colors duration-300"
        style={{ color: activeColor }}
      >
        {phaseLabels[phase]}
      </div>

      {/* Timer ring */}
      <div
        className={[
          'relative transition-all duration-300',
          flash ? 'animate-timer-flash' : '',
        ].join(' ')}
      >
        <div
          className={[
            'absolute inset-0 rounded-full transition-opacity duration-700',
            flash ? 'opacity-60' : 'opacity-0',
          ].join(' ')}
          style={{
            background: `radial-gradient(circle, ${activeColor}22, transparent 70%)`,
          }}
        />

        <CircularProgress
          value={timer.progress}
          size={240}
          strokeWidth={10}
        >
          <div className="flex flex-col items-center gap-1">
            {/* Time display */}
            <span
              className="font-mono text-5xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary, #111827)' }}
            >
              {timer.formattedTime}
            </span>

            {/* Session counter */}
            <span className="text-xs text-[var(--text-secondary,#6b7280)]">
              Session {currentSession} of {timerSettings.sessionsBeforeLong}
            </span>
          </div>
        </CircularProgress>
      </div>

      {/* Controls */}
      <TimerControls
        isRunning={timer.isRunning}
        hasStarted={hasStartedOnce && timer.remainingSeconds < timer.totalSeconds}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onSkip={handleSkip}
        isBreak={isBreak}
      />

      {/* Break suggestion */}
      {isBreak && (
        <BreakSuggestion mode={mode} onSkipBreak={handleSkip} />
      )}

      {/* Flash overlay keyframes */}
      <style>{`
        @keyframes timer-flash {
          0% { transform: scale(1); }
          25% { transform: scale(1.05); }
          50% { transform: scale(1); }
          75% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .animate-timer-flash {
          animation: timer-flash 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
}
