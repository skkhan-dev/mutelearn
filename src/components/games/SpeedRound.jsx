import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import { useGamification } from '../../contexts/GamificationContext';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards) {
  const questions = [];
  const shuffled = shuffle(cards);
  shuffled.forEach((card, idx) => {
    // True pair
    if (Math.random() > 0.4) {
      questions.push({
        term: card.front,
        definition: card.back,
        isCorrect: true,
      });
    } else {
      // False pair - pick a random different definition
      const others = cards.filter((_, i) => i !== idx);
      const wrong = others[Math.floor(Math.random() * others.length)];
      questions.push({
        term: card.front,
        definition: wrong.back,
        isCorrect: false,
      });
    }
  });
  return shuffle(questions);
}

const SECONDS_PER_QUESTION = 5;

export default function SpeedRound({ cards, onComplete }) {
  const { addXP, updateStats } = useGamification();

  const questions = useMemo(() => buildQuestions(cards), [cards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [flash, setFlash] = useState(null); // 'correct' | 'wrong'
  const [answered, setAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progress = (currentIndex / questions.length) * 100;

  // Countdown timer
  useEffect(() => {
    if (answered) return;
    if (timeLeft <= 0) {
      handleAnswer(null); // Time's up = wrong
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, answered]);

  const handleAnswer = useCallback(
    (userAnswer) => {
      if (answered) return;
      setAnswered(true);

      const correct = userAnswer === currentQ.isCorrect;
      if (correct) {
        setScore((s) => s + 1);
        setFlash('correct');
      } else {
        setFlash('wrong');
      }

      setTimeout(() => {
        if (isLast) {
          const finalScore = correct ? score + 1 : score;
          const timeMs = Date.now() - startTime;
          const accuracy = Math.round((finalScore / questions.length) * 100);
          const xpEarned = Math.round(questions.length * 10 * (accuracy / 100));
          addXP(xpEarned, 'Speed Round');
          updateStats({ totalGames: 1 });
          onComplete({
            score: finalScore,
            total: questions.length,
            accuracy,
            timeMs,
            xpEarned,
          });
        } else {
          setCurrentIndex((i) => i + 1);
          setTimeLeft(SECONDS_PER_QUESTION);
          setFlash(null);
          setAnswered(false);
        }
      }, 800);
    },
    [answered, currentQ, isLast, score, questions.length, startTime]
  );

  const timerColor =
    timeLeft <= 1 ? '#f97316' : timeLeft <= 2 ? '#eab308' : '#06b6d4';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Flash overlay */}
      {flash && (
        <div
          className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${
            flash === 'correct'
              ? 'bg-emerald-400/20'
              : 'bg-orange-400/20'
          }`}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
          Speed Round
        </h2>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-sm font-medium">
            Score: {score}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <ProgressBar value={progress} color="#f59e0b" height={6} />

      {/* Timer */}
      <div className="mt-6 flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-colors duration-300"
          style={{ backgroundColor: timerColor }}
        >
          {timeLeft}
        </div>
      </div>

      {/* Question Card */}
      <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">
          Term
        </p>
        <p className="text-2xl font-bold text-gray-900 mb-4">{currentQ.term}</p>

        <div className="w-16 h-0.5 bg-amber-300 mx-auto mb-4" />

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Definition
        </p>
        <p className="text-lg text-gray-700">{currentQ.definition}</p>
      </div>

      {/* True / False Buttons */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(true)}
          disabled={answered}
          className="py-6 rounded-2xl text-2xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
        >
          TRUE
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={answered}
          className="py-6 rounded-2xl text-2xl font-bold bg-orange-400 text-white hover:bg-orange-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
        >
          FALSE
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--text-secondary,#6b7280)]">
        Does the definition match the term?
      </p>
    </div>
  );
}
