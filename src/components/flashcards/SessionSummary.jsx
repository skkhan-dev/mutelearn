import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import EncouragingMessage from '../shared/EncouragingMessage';
import { difficultyLabels } from '../../config/modeDefaults';
import { useMode } from '../../contexts/ModeContext';

export default function SessionSummary({ results, onStudyAgain, onFinish }) {
  const { modeConfig } = useMode();
  const { cardsReviewed = 0, ratings = [], xpEarned = 0 } = results;
  const levels = modeConfig.flashcards?.difficultyLevels || 5;
  const labels = difficultyLabels[levels] || difficultyLabels[5];

  // Count ratings per difficulty
  const ratingCounts = labels.map((_, idx) =>
    ratings.filter((r) => r === idx).length
  );

  // "Correct" = anything above the first difficulty bucket
  const incorrect = ratingCounts[0] || 0;
  const correct = cardsReviewed - incorrect;
  const accuracy = cardsReviewed > 0 ? Math.round((correct / cardsReviewed) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 animate-[fadeIn_500ms_ease-out] max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
        Session Complete!
      </h2>

      <EncouragingMessage />

      <Card className="w-full">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div>
            <p className="text-3xl font-bold text-[var(--accent,#6366f1)]">{cardsReviewed}</p>
            <p className="text-xs text-[var(--text-secondary,#6b7280)] mt-1">Cards Reviewed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-500">{accuracy}%</p>
            <p className="text-xs text-[var(--text-secondary,#6b7280)] mt-1">Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-500">+{xpEarned}</p>
            <p className="text-xs text-[var(--text-secondary,#6b7280)] mt-1">XP Earned</p>
          </div>
        </div>

        {/* Correct / Incorrect */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            {correct} correct
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            {incorrect} needs review
          </span>
        </div>

        {/* Difficulty breakdown */}
        <div className="border-t border-[var(--border,#e5e7eb)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#6b7280)] mb-3">
            Performance Breakdown
          </p>
          <div className="space-y-2">
            {labels.map((label, idx) => {
              const count = ratingCounts[idx];
              const pct = cardsReviewed > 0 ? (count / cardsReviewed) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm w-20 text-right text-[var(--text-secondary,#6b7280)]">
                    {label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: 'var(--accent, #6366f1)',
                        opacity: 0.4 + (idx / (labels.length - 1)) * 0.6,
                      }}
                    />
                  </div>
                  <span className="text-sm tabular-nums w-6 text-[var(--text-secondary,#6b7280)]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1" onClick={onStudyAgain}>
          Study Again
        </Button>
        <Button variant="primary" className="flex-1" onClick={onFinish}>
          Back to Decks
        </Button>
      </div>
    </div>
  );
}
