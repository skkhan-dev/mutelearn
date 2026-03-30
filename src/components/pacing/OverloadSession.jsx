import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ProgressBar from '../shared/ProgressBar';
import EncouragingMessage from '../shared/EncouragingMessage';
import { useGamification } from '../../contexts/GamificationContext';

const MILESTONES = [
  { minutes: 10, xp: 20, message: '10 minutes in! Keep it up!' },
  { minutes: 30, xp: 50, message: '30 minutes straight! +50 bonus XP!' },
  { minutes: 60, xp: 100, message: '1 hour of focus! You\'re on fire!' },
  { minutes: 90, xp: 150, message: '90 minutes! Legendary endurance!' },
  { minutes: 120, xp: 200, message: '2 HOURS! Absolute champion!' },
];

function formatElapsed(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

export default function OverloadSession({ deck, onComplete }) {
  const cards = deck?.cards || [];
  const { addXP, updateStats } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState({ known: [], unknown: [] });
  const [loop, setLoop] = useState(0);
  const [milestonePopup, setMilestonePopup] = useState(null);
  const [reachedMilestones, setReachedMilestones] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef(null);

  // Cards for the current loop (first loop = all, subsequent = missed only)
  const activeCards = useMemo(() => {
    if (loop === 0) return cards;
    return results.unknown.length > 0
      ? cards.filter((c) => results.unknown.includes(c.id ?? cards.indexOf(c)))
      : cards;
  }, [cards, loop, results.unknown]);

  const currentCard = activeCards[currentIndex];

  // Elapsed time counter
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Milestone checks
  useEffect(() => {
    const elapsedMinutes = Math.floor(elapsed / 60);
    const milestone = MILESTONES.find(
      (m) => m.minutes === elapsedMinutes && !reachedMilestones.includes(m.minutes)
    );
    if (milestone) {
      setReachedMilestones((prev) => [...prev, milestone.minutes]);
      addXP(milestone.xp);
      setMilestonePopup(milestone);
      setTimeout(() => setMilestonePopup(null), 3000);
    }
  }, [elapsed, reachedMilestones, addXP]);

  const totalReviewed = results.known.length + results.unknown.length;
  const percentDone = cards.length > 0 ? Math.round((totalReviewed / cards.length) * 100) : 0;

  const handleAnswer = useCallback((known) => {
    const cardId = currentCard?.id ?? currentIndex;
    setResults((prev) => {
      const key = known ? 'known' : 'unknown';
      const otherKey = known ? 'unknown' : 'known';
      return {
        ...prev,
        [key]: prev[key].includes(cardId) ? prev[key] : [...prev[key], cardId],
        [otherKey]: prev[otherKey].filter((id) => id !== cardId),
      };
    });
    setShowAnswer(false);

    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // End of current loop
      setCurrentIndex(0);
    }
  }, [currentIndex, currentCard, activeCards.length]);

  const handleLoopMissed = () => {
    setLoop((l) => l + 1);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const handleFinish = () => {
    clearInterval(timerRef.current);
    const milestoneXP = reachedMilestones.reduce((sum, m) => {
      const milestone = MILESTONES.find((ms) => ms.minutes === m);
      return sum + (milestone?.xp || 0);
    }, 0);
    const cardXP = results.known.length * 5 + results.unknown.length * 2;
    const totalXP = cardXP + milestoneXP;

    addXP(cardXP);
    updateStats({ totalSessions: 1, totalCardsReviewed: totalReviewed, overloadSessions: 1 });

    const sessionResults = {
      mode: 'overload',
      deckName: deck?.name || 'Unknown',
      totalCards: cards.length,
      known: results.known.length,
      unknown: results.unknown.length,
      loops: loop + 1,
      timeSpent: elapsed,
      xpEarned: totalXP,
      milestones: reachedMilestones,
      weakCards: cards.filter((c) => results.unknown.includes(c.id ?? cards.indexOf(c))),
    };
    setIsFinished(true);
    onComplete(sessionResults);
  };

  // End-of-loop screen
  const allReviewedThisLoop =
    currentIndex === 0 && totalReviewed > 0 && currentIndex === 0 && loop >= 0 && results.unknown.length > 0;
  const showLoopComplete = currentIndex >= activeCards.length - 1 && showAnswer === false && totalReviewed >= activeCards.length && loop >= 0;

  if (isFinished) return null;

  // Summary before finishing
  if (cards.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-[var(--text-secondary,#6b7280)]">This deck has no cards to study.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Milestone popup */}
      {milestonePopup && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_300ms_ease-out]">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-center">
            <span className="text-xl mr-2">&#9889;</span>
            {milestonePopup.message}
          </div>
        </div>
      )}

      {/* Header bar — intense amber gradient */}
      <div
        className="rounded-xl p-4 text-white"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
            <span className="font-bold text-lg">Overload Mode</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold tabular-nums">
              {formatElapsed(elapsed)}
            </div>
            <div className="text-xs opacity-80">elapsed</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1 opacity-90">
            <span>
              Covered {totalReviewed} of {cards.length} cards ({percentDone}%)
            </span>
            {loop > 0 && <span>Loop {loop + 1}</span>}
          </div>
          <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-[width] duration-300"
              style={{ width: `${percentDone}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestone trail */}
      {reachedMilestones.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {reachedMilestones.map((m) => (
            <span
              key={m}
              className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium"
            >
              &#9889; {m}min
            </span>
          ))}
        </div>
      )}

      {/* Card */}
      {currentCard && (
        <Card className="min-h-[240px] flex flex-col items-center justify-center text-center relative">
          <span className="absolute top-3 right-3 text-xs text-[var(--text-secondary,#6b7280)]">
            {currentIndex + 1} / {activeCards.length}
          </span>

          <p className="text-lg font-semibold text-[var(--text-primary,#111827)] mb-4 px-4">
            {currentCard.front}
          </p>

          {showAnswer ? (
            <>
              <div className="w-16 h-px bg-[var(--border,#e5e7eb)] mb-4" />
              <p className="text-base text-[var(--text-secondary,#6b7280)] px-4 mb-6">
                {currentCard.back}
              </p>

              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleAnswer(false)}
                >
                  Don't Know
                </Button>
                <Button
                  size="lg"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => handleAnswer(true)}
                >
                  Know It
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAnswer(true)}
            >
              Show Answer
            </Button>
          )}
        </Card>
      )}

      {/* Loop through missed */}
      {totalReviewed >= cards.length && results.unknown.length > 0 && (
        <Card className="text-center space-y-3 border-amber-300 dark:border-amber-700">
          <p className="font-semibold text-[var(--text-primary,#111827)]">
            You've been through all cards!
          </p>
          <p className="text-sm text-[var(--text-secondary,#6b7280)]">
            {results.unknown.length} card{results.unknown.length !== 1 ? 's' : ''} marked
            as unsure. Want to loop through them again?
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleFinish}>
              I'm Done
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              onClick={handleLoopMissed}
            >
              Loop Missed Cards
            </Button>
          </div>
        </Card>
      )}

      {/* Encouraging message */}
      <EncouragingMessage />

      {/* Always-visible done button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--text-secondary,#6b7280)]"
          onClick={handleFinish}
        >
          I'm Done
        </Button>
      </div>
    </div>
  );
}
