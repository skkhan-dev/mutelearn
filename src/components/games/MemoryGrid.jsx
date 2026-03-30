import React, { useState, useMemo, useEffect, useRef } from 'react';
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

export default function MemoryGrid({ cards, onComplete }) {
  const { addXP, updateStats } = useGamification();
  const lockRef = useRef(false);

  // Take up to 6 cards for 12 tiles
  const pairs = useMemo(() => cards.slice(0, 6), [cards]);

  const gridCards = useMemo(() => {
    const tiles = [];
    pairs.forEach((card, idx) => {
      tiles.push({ pairId: idx, text: card.front, type: 'term', uid: `t-${idx}` });
      tiles.push({ pairId: idx, text: card.back, type: 'def', uid: `d-${idx}` });
    });
    return shuffle(tiles);
  }, [pairs]);

  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [firstPick, setFirstPick] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [wrongPair, setWrongPair] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const completed = matchCount === pairs.length;

  // Timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime, completed]);

  useEffect(() => {
    if (completed) {
      const timeMs = Date.now() - startTime;
      const accuracy = Math.round((pairs.length / attempts) * 100);
      const xpEarned = Math.round(pairs.length * 15 * Math.min(accuracy / 100, 1));
      addXP(xpEarned, 'Memory Grid');
      updateStats({ totalGames: 1 });
      onComplete({
        score: pairs.length,
        total: pairs.length,
        accuracy: Math.min(accuracy, 100),
        timeMs,
        xpEarned,
        attempts,
      });
    }
  }, [completed]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (card, index) => {
    if (lockRef.current || flipped.has(index) || matched.has(card.pairId)) return;

    const newFlipped = new Set(flipped);
    newFlipped.add(index);
    setFlipped(newFlipped);

    if (firstPick === null) {
      setFirstPick({ card, index });
    } else {
      setAttempts((a) => a + 1);
      lockRef.current = true;

      if (
        firstPick.card.pairId === card.pairId &&
        firstPick.card.type !== card.type
      ) {
        // Match found
        const newMatched = new Set(matched);
        newMatched.add(card.pairId);
        setMatched(newMatched);
        setMatchCount((c) => c + 1);
        setFirstPick(null);
        lockRef.current = false;
      } else {
        // No match
        setWrongPair({ a: firstPick.index, b: index });
        setTimeout(() => {
          const revertFlipped = new Set(newFlipped);
          revertFlipped.delete(firstPick.index);
          revertFlipped.delete(index);
          setFlipped(revertFlipped);
          setFirstPick(null);
          setWrongPair(null);
          lockRef.current = false;
        }, 1000);
      }
    }
  };

  const cols = gridCards.length <= 8 ? 4 : gridCards.length <= 12 ? 4 : 4;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
          Memory Grid
        </h2>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-pink-100 text-pink-700 text-sm font-medium">
            {matchCount}/{pairs.length} pairs
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium tabular-nums">
            {formatTime(elapsed)}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium">
            {attempts} tries
          </span>
        </div>
      </div>

      <ProgressBar
        value={(matchCount / pairs.length) * 100}
        color="#ec4899"
        height={6}
      />

      {/* Grid */}
      <div className={`mt-8 grid grid-cols-${cols} gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {gridCards.map((card, index) => {
          const isFlipped = flipped.has(index) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);
          const isWrong =
            wrongPair && (wrongPair.a === index || wrongPair.b === index);

          return (
            <button
              key={card.uid}
              onClick={() => handleCardClick(card, index)}
              className={`relative aspect-[3/4] rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer overflow-hidden ${
                isMatched
                  ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700 scale-95 opacity-70'
                  : isWrong
                    ? 'bg-orange-100 border-2 border-orange-400 text-orange-700'
                    : isFlipped
                      ? 'bg-white border-2 border-pink-400 text-gray-800 shadow-md'
                      : 'bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-pink-300 text-transparent hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center p-2">
                {isFlipped ? (
                  <div className="text-center">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${
                        isMatched ? 'text-emerald-500' : 'text-pink-400'
                      }`}
                    >
                      {card.type === 'term' ? 'Term' : 'Def'}
                    </span>
                    <span className="text-xs leading-snug">{card.text}</span>
                  </div>
                ) : (
                  <span className="text-3xl text-white">?</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {completed && (
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <p className="text-lg font-bold">All pairs matched!</p>
            <p className="text-sm">
              Completed in {attempts} attempts and {formatTime(elapsed)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
