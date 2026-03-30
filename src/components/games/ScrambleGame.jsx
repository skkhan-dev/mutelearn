import React, { useState, useMemo, useEffect } from 'react';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import { useGamification } from '../../contexts/GamificationContext';

function scrambleWord(word) {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Make sure it's actually scrambled
  if (letters.join('') === word && word.length > 1) {
    [letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]];
  }
  return letters;
}

export default function ScrambleGame({ cards, onComplete }) {
  const { addXP, updateStats } = useGamification();

  const shuffledCards = useMemo(() => {
    const arr = [...cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [cards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambled, setScrambled] = useState(() =>
    scrambleWord(shuffledCards[0].front).map((letter, i) => ({
      id: i,
      letter,
      used: false,
    }))
  );
  const [built, setBuilt] = useState([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(null);
  const [startTime] = useState(Date.now());
  const [wordStartTime, setWordStartTime] = useState(Date.now());
  const [wordElapsed, setWordElapsed] = useState(0);

  const currentCard = shuffledCards[currentIndex];
  const isLast = currentIndex === shuffledCards.length - 1;
  const progress = (currentIndex / shuffledCards.length) * 100;
  const builtWord = built.map((t) => t.letter).join('');

  // Word timer
  useEffect(() => {
    if (showResult) return;
    const interval = setInterval(
      () => setWordElapsed(Math.floor((Date.now() - wordStartTime) / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [wordStartTime, showResult]);

  const handleTileClick = (tile) => {
    if (tile.used || showResult) return;
    setScrambled((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t))
    );
    setBuilt((prev) => [...prev, tile]);
  };

  const handleBuiltClick = (tile, index) => {
    if (showResult) return;
    setScrambled((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, used: false } : t))
    );
    setBuilt((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setScrambled((prev) => prev.map((t) => ({ ...t, used: false })));
    setBuilt([]);
  };

  const handleSubmit = () => {
    const correct =
      builtWord.toLowerCase() === currentCard.front.toLowerCase();
    if (correct) {
      setScore((s) => s + 1);
      setShowResult('correct');
    } else {
      setShowResult('wrong');
    }
  };

  const handleNext = () => {
    if (isLast) {
      const timeMs = Date.now() - startTime;
      const accuracy = Math.round((score / shuffledCards.length) * 100);
      const xpEarned = Math.round(shuffledCards.length * 12 * (accuracy / 100));
      addXP(xpEarned, 'Term Scramble');
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
    const nextIndex = currentIndex + 1;
    const nextCard = shuffledCards[nextIndex];
    setCurrentIndex(nextIndex);
    setScrambled(
      scrambleWord(nextCard.front).map((letter, i) => ({
        id: i,
        letter,
        used: false,
      }))
    );
    setBuilt([]);
    setShowResult(null);
    setWordStartTime(Date.now());
    setWordElapsed(0);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
          Term Scramble
        </h2>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium tabular-nums">
            {wordElapsed}s
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">
            {currentIndex + 1} / {shuffledCards.length}
          </span>
        </div>
      </div>

      <ProgressBar value={progress} color="#10b981" height={6} />

      {/* Hint */}
      <div className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
          Hint: Definition
        </p>
        <p className="text-lg text-gray-800 leading-relaxed">
          {currentCard.back}
        </p>
      </div>

      {/* Built Answer Area */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Your Answer
        </p>
        <div className="min-h-[56px] flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-white">
          {built.length === 0 && (
            <span className="text-gray-400 text-sm">
              Click letters below to build the word...
            </span>
          )}
          {built.map((tile, i) => (
            <button
              key={`built-${tile.id}-${i}`}
              onClick={() => handleBuiltClick(tile, i)}
              className="w-10 h-10 rounded-lg bg-emerald-500 text-white font-bold text-lg flex items-center justify-center shadow-sm hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              {tile.letter}
            </button>
          ))}
        </div>
      </div>

      {/* Scrambled Letters */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Available Letters
        </p>
        <div className="flex flex-wrap gap-2">
          {scrambled.map((tile) => (
            <button
              key={`tile-${tile.id}`}
              onClick={() => handleTileClick(tile)}
              disabled={tile.used}
              className={`w-10 h-10 rounded-lg font-bold text-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                tile.used
                  ? 'bg-gray-100 text-gray-300 scale-90'
                  : 'bg-white border-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 shadow-sm'
              }`}
            >
              {tile.letter}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        {!showResult && (
          <>
            <Button variant="outline" onClick={handleClear} disabled={built.length === 0}>
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={built.length !== currentCard.front.length}
            >
              Submit
            </Button>
          </>
        )}
      </div>

      {/* Feedback */}
      {showResult === 'correct' && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-100 text-emerald-700">
          <span className="text-xl">&#10003;</span>
          <span className="font-semibold">Correct! Nice work!</span>
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
            {isLast ? 'See Results' : 'Next Word'}
          </Button>
        </div>
      )}

      {/* Score */}
      <div className="mt-6 text-center">
        <span className="text-sm text-[var(--text-secondary,#6b7280)]">
          Score: <span className="font-bold text-emerald-600">{score}</span>
        </span>
      </div>
    </div>
  );
}
