import React, { useState, useMemo } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressBar from '../shared/ProgressBar';

function getDaysBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getPaceInfo(daysRemaining, totalCards) {
  const cardsPerDay = Math.ceil(totalCards / Math.max(1, Math.floor(daysRemaining * 0.5)));

  if (daysRemaining <= 2) {
    return {
      level: 'intense',
      label: 'Intense',
      color: '#ef4444',
      emoji: '!!',
      description: 'Very little time left. All-out cramming required.',
      cardsPerDay,
    };
  }
  if (cardsPerDay > 30) {
    return {
      level: 'intense',
      label: 'Intense',
      color: '#ef4444',
      emoji: '!!',
      description: 'High daily workload. Consider pushing your exam date if possible.',
      cardsPerDay,
    };
  }
  if (cardsPerDay > 15) {
    return {
      level: 'moderate',
      label: 'Moderate',
      color: '#f59e0b',
      emoji: '!',
      description: 'A solid pace. Stay consistent and you\'ll be well prepared.',
      cardsPerDay,
    };
  }
  return {
    level: 'relaxed',
    label: 'Relaxed',
    color: '#10b981',
    emoji: '',
    description: 'Comfortable pace with plenty of time for review and reinforcement.',
    cardsPerDay,
  };
}

export default function PaceAdjuster({ currentPlan, onAdjust }) {
  const today = new Date().toISOString().split('T')[0];
  const [newExamDate, setNewExamDate] = useState(currentPlan?.examDate || '');
  const [confirmed, setConfirmed] = useState(false);

  const totalCards = useMemo(() => {
    return (currentPlan?.days || []).reduce((max, d) => Math.max(max, d.cardCount || 0), 0)
      || (currentPlan?.days || []).length * 10; // rough fallback
  }, [currentPlan]);

  // Count total cards across the plan more accurately
  const planTotalCards = useMemo(() => {
    if (!currentPlan?.days) return 0;
    const learnDays = currentPlan.days.filter((d) =>
      d.activities?.some((a) => a.type === 'learn')
    );
    return learnDays.reduce((sum, d) => sum + (d.cardCount || 0), 0) || totalCards;
  }, [currentPlan, totalCards]);

  const currentDaysRemaining = getDaysBetween(today, currentPlan?.examDate || today);
  const newDaysRemaining = getDaysBetween(today, newExamDate || today);

  const currentPace = getPaceInfo(currentDaysRemaining, planTotalCards);
  const newPace = newExamDate && newExamDate !== currentPlan?.examDate
    ? getPaceInfo(newDaysRemaining, planTotalCards)
    : null;

  const dateChanged = newExamDate && newExamDate !== currentPlan?.examDate;

  const handleConfirm = () => {
    setConfirmed(true);
    onAdjust(newExamDate);
  };

  if (!currentPlan) {
    return (
      <Card className="text-center">
        <p className="text-[var(--text-secondary,#6b7280)]">
          No active study plan to adjust. Create one first!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary,#111827)]">
          Adjust Your Pace
        </h2>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
          Change your exam date to see how the plan adjusts
        </p>
      </div>

      {/* Current pace */}
      <Card>
        <h3 className="text-sm font-semibold text-[var(--text-secondary,#6b7280)] uppercase mb-3">
          Current Pace
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="px-3 py-1.5 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: currentPace.color }}
          >
            {currentPace.label}
          </div>
          <div className="text-sm text-[var(--text-primary,#111827)]">
            ~{currentPace.cardsPerDay} cards/day &middot; {currentDaysRemaining} days left
          </div>
        </div>
        <PaceBar pace={currentPace} />
        <p className="text-xs text-[var(--text-secondary,#6b7280)] mt-2">
          Exam: {formatDate(currentPlan.examDate)}
        </p>
      </Card>

      {/* Date adjustment */}
      <Card>
        <label className="block text-sm font-medium text-[var(--text-primary,#111827)] mb-2">
          New Exam Date
        </label>
        <input
          type="date"
          value={newExamDate}
          min={today}
          onChange={(e) => {
            setNewExamDate(e.target.value);
            setConfirmed(false);
          }}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] text-[var(--text-primary,#111827)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Card>

      {/* Preview of new pace */}
      {dateChanged && newPace && (
        <Card className="border-2" style={{ borderColor: newPace.color + '60' }}>
          <h3 className="text-sm font-semibold text-[var(--text-secondary,#6b7280)] uppercase mb-3">
            New Pace Preview
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="px-3 py-1.5 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: newPace.color }}
            >
              {newPace.label}
            </div>
            <div className="text-sm text-[var(--text-primary,#111827)]">
              ~{newPace.cardsPerDay} cards/day &middot; {newDaysRemaining} days left
            </div>
          </div>
          <PaceBar pace={newPace} />
          <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-3">
            {newPace.description}
          </p>

          {/* Comparison */}
          <div className="mt-4 pt-3 border-t border-[var(--border,#e5e7eb)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary,#6b7280)]">Cards per day change</span>
              <span
                className="font-semibold"
                style={{
                  color: newPace.cardsPerDay <= currentPace.cardsPerDay ? '#10b981' : '#ef4444',
                }}
              >
                {currentPace.cardsPerDay} &rarr; {newPace.cardsPerDay}
                {newPace.cardsPerDay < currentPace.cardsPerDay && ' (easier)'}
                {newPace.cardsPerDay > currentPace.cardsPerDay && ' (harder)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-[var(--text-secondary,#6b7280)]">Days</span>
              <span className="font-semibold text-[var(--text-primary,#111827)]">
                {currentDaysRemaining} &rarr; {newDaysRemaining}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Confirm button */}
      {dateChanged && !confirmed && (
        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          size="lg"
          onClick={handleConfirm}
        >
          Recalculate Plan
        </Button>
      )}

      {confirmed && (
        <Card padding="sm" className="text-center bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Plan updated! Your new study schedule is ready.
          </p>
        </Card>
      )}
    </div>
  );
}

/* Visual pace indicator bar */
function PaceBar({ pace }) {
  const paceValues = { relaxed: 30, moderate: 60, intense: 90 };
  const value = paceValues[pace.level] || 50;

  return (
    <div className="space-y-1">
      <ProgressBar value={value} color={pace.color} height={8} />
      <div className="flex justify-between text-[10px] text-[var(--text-secondary,#6b7280)]">
        <span>Relaxed</span>
        <span>Moderate</span>
        <span>Intense</span>
      </div>
    </div>
  );
}
