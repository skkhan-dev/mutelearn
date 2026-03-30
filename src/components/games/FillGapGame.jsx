import React, { useState, useMemo, useRef, useEffect } from 'react';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import { useGamification } from '../../contexts/GamificationContext';

export default function FillGapGame({ cards, onComplete }) {
  const { addXP, updateStats } = useGamification();
  const inputRef = useRef(null);

  const shuffledCards = useMemo(() => {
    const arr = [...cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [cards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(null); // 'correct' | 'wrong'
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  const currentCard = shuffledCards[currentIndex];
  const isLast = currentIndex === shuffledCards.length - 1;
  const progress = ((currentIndex) / shuffledCards.length) * 100;

  useEffect(() => {
    if (!showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult]);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    const correct =
      userAnswer.trim().toLowerCase() === currentCard.front.trim().toLowerCase();

    if (correct) {
      setScore((s) => s + 1);
      setShowResult('correct');
    } else {
      setShowResult('wrong');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showResult) {
        handleNext();
      } else {
        checkAnswer();
      }
    }
  };

  const handleNext = () => {
    if (isLast) {
      const finalScore = score + (showResult === 'correct' ? 0 : 0); // score already updated
      const timeMs = Date.now() - startTime;
      const accuracy = Math.round((score / shuffledCards.length) * 100);
      const xpEarned = Math.round(shuffledCards.length * 8 * (accuracy / 100));
      addXP(xpEarned, 'Fill the Gap');
      updateStats({ totalGames: 1 });
      onComplete({
        score,
        total: shuffledCards.length,
        accuracy,
        timeMs,
        xpEarned,
      });
      return;
    }
    setCurrentIndex((i) => i + 1);
    setUserAnswer('');
    setShowResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
          Fill the Gap
        </h2>
        <span className="px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-700 text-sm font-medium">
          {currentIndex + 1} / {shuffledCards.length}
        </span>
      </div>

      <ProgressBar value={progress} color="#06b6d4" height={6} />

      {/* Question Card */}
      <div className="mt-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 mb-3">
          Definition
        </p>
        <p className="text-lg text-gray-800 leading-relaxed mb-6">
          {currentCard.back}
        </p>

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          What is the term?
        </p>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!showResult}
            placeholder="Type your answer..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-800 font-medium focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 disabled:opacity-70 disabled:bg-gray-50"
          />
          {!showResult && (
            <Button onClick={checkAnswer} disabled={!userAnswer.trim()}>
              Check
            </Button>
          )}
        </div>

        {/* Feedback */}
        {showResult === 'correct' && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-100 text-emerald-700">
            <span className="text-xl">&#10003;</span>
            <span className="font-semibold">Correct!</span>
          </div>
        )}
        {showResult === 'wrong' && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200">
            <p className="text-orange-700 font-medium mb-1">
              Not quite! The answer was:
            </p>
            <p className="text-orange-900 font-bold text-lg">{currentCard.front}</p>
          </div>
        )}

        {showResult && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleNext}>
              {isLast ? 'See Results' : 'Next Question'}
            </Button>
          </div>
        )}
      </div>

      {/* Score */}
      <div className="mt-6 text-center">
        <span className="text-sm text-[var(--text-secondary,#6b7280)]">
          Score: <span className="font-bold text-cyan-600">{score}</span>
        </span>
      </div>
    </div>
  );
}
