import React from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getGrade(accuracy) {
  if (accuracy >= 95) return { label: 'S', color: 'text-amber-500', bg: 'bg-amber-50' };
  if (accuracy >= 85) return { label: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (accuracy >= 70) return { label: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (accuracy >= 55) return { label: 'C', color: 'text-violet-600', bg: 'bg-violet-50' };
  return { label: 'D', color: 'text-gray-500', bg: 'bg-gray-50' };
}

function getMessage(accuracy) {
  if (accuracy >= 95) return 'Absolutely flawless! You crushed it!';
  if (accuracy >= 85) return 'Amazing job! You really know your stuff!';
  if (accuracy >= 70) return 'Great work! Keep it up!';
  if (accuracy >= 55) return 'Nice effort! A little more practice and you\'ll nail it!';
  return 'Good try! Every attempt helps you learn. Keep going!';
}

export default function GameResults({
  results,
  gameName,
  onPlayAgain,
  onBack,
}) {
  const { score, total, accuracy, timeMs, xpEarned, victory } = results;
  const grade = getGrade(accuracy);
  const message = getMessage(accuracy);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        {/* Celebration */}
        <div className="text-5xl mb-3">
          {accuracy >= 85 ? '🎉' : accuracy >= 55 ? '👏' : '💪'}
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)] mb-1">
          {gameName} Complete!
        </h2>
        <p className="text-[var(--text-secondary,#6b7280)]">{message}</p>
      </div>

      {/* Grade */}
      <div className="flex justify-center mb-6">
        <div
          className={`w-24 h-24 rounded-2xl ${grade.bg} flex items-center justify-center shadow-lg`}
        >
          <span className={`text-5xl font-black ${grade.color}`}>
            {grade.label}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Card padding="sm" className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Score
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary,#111827)]">
            {score}
            <span className="text-sm font-normal text-gray-400">/{total}</span>
          </p>
        </Card>

        <Card padding="sm" className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Accuracy
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary,#111827)]">
            {accuracy}%
          </p>
        </Card>

        <Card padding="sm" className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Time
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary,#111827)]">
            {formatTime(timeMs)}
          </p>
        </Card>

        <Card padding="sm" className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            XP Earned
          </p>
          <p className="text-2xl font-bold text-amber-500">+{xpEarned}</p>
        </Card>
      </div>

      {/* Boss Battle specific */}
      {victory !== undefined && (
        <div
          className={`text-center mb-6 px-4 py-3 rounded-xl ${
            victory
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-violet-50 text-violet-700'
          }`}
        >
          <p className="font-semibold">
            {victory
              ? 'Boss Defeated! You are the champion!'
              : 'The boss won this round, but you\'ll come back stronger!'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onPlayAgain} className="flex-1">
          Play Again
        </Button>
        <Button variant="outline" onClick={onBack} className="flex-1">
          Try Another Game
        </Button>
      </div>
    </div>
  );
}
