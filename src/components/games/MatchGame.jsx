import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '../shared/Button';
import { useGamification } from '../../contexts/GamificationContext';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchGame({ cards, onComplete }) {
  const { addXP, updateStats } = useGamification();

  const pairs = useMemo(() => cards.slice(0, 8), [cards]);

  const [shuffledTerms] = useState(() =>
    shuffle(pairs.map((c, i) => ({ id: i, text: c.front, type: 'term' })))
  );
  const [shuffledDefs] = useState(() =>
    shuffle(pairs.map((c, i) => ({ id: i, text: c.back, type: 'def' })))
  );

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(interval);
  }, [startTime, completed]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTermClick = useCallback(
    (item) => {
      if (matchedIds.has(item.id) || wrongPair) return;
      setSelectedTerm(item);
      if (selectedDef) {
        checkMatch(item, selectedDef);
      }
    },
    [selectedDef, matchedIds, wrongPair]
  );

  const handleDefClick = useCallback(
    (item) => {
      if (matchedIds.has(item.id) || wrongPair) return;
      setSelectedDef(item);
      if (selectedTerm) {
        checkMatch(selectedTerm, item);
      }
    },
    [selectedTerm, matchedIds, wrongPair]
  );

  const checkMatch = (term, def) => {
    setAttempts((a) => a + 1);
    if (term.id === def.id) {
      // Correct match
      setScore((s) => s + 1);
      const newMatched = new Set(matchedIds);
      newMatched.add(term.id);
      setMatchedIds(newMatched);
      setSelectedTerm(null);
      setSelectedDef(null);

      if (newMatched.size === pairs.length) {
        setCompleted(true);
        const timeMs = Date.now() - startTime;
        const accuracy = Math.round(((newMatched.size) / (attempts + 1)) * 100);
        const xpEarned = Math.round(pairs.length * 10 * (accuracy / 100));
        addXP(xpEarned, 'Match Madness');
        updateStats({ totalGames: 1 });
        onComplete({
          score: newMatched.size,
          total: pairs.length,
          accuracy,
          timeMs,
          xpEarned,
        });
      }
    } else {
      // Wrong match
      setWrongPair({ termId: term.id, defId: def.id });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 600);
    }
  };

  const getTermStyle = (item) => {
    if (matchedIds.has(item.id))
      return 'bg-emerald-100 border-emerald-400 text-emerald-700 opacity-50 scale-95';
    if (wrongPair?.termId === item.id)
      return 'bg-orange-100 border-orange-400 text-orange-700 animate-[shake_0.4s_ease-in-out]';
    if (selectedTerm?.id === item.id)
      return 'bg-violet-100 border-violet-500 text-violet-800 ring-2 ring-violet-400';
    return 'bg-white border-gray-200 text-gray-800 hover:border-violet-400 hover:shadow-md';
  };

  const getDefStyle = (item) => {
    if (matchedIds.has(item.id))
      return 'bg-emerald-100 border-emerald-400 text-emerald-700 opacity-50 scale-95';
    if (wrongPair?.defId === item.id)
      return 'bg-orange-100 border-orange-400 text-orange-700 animate-[shake_0.4s_ease-in-out]';
    if (selectedDef?.id === item.id)
      return 'bg-blue-100 border-blue-500 text-blue-800 ring-2 ring-blue-400';
    return 'bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:shadow-md';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)]">
            Match Madness
          </h2>
          <p className="text-sm text-[var(--text-secondary,#6b7280)]">
            Click a term, then click its matching definition
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700">
            {score}/{pairs.length} matched
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-2 gap-6">
        {/* Terms Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-2">
            Terms
          </h3>
          {shuffledTerms.map((item) => (
            <button
              key={`term-${item.id}`}
              onClick={() => handleTermClick(item)}
              disabled={matchedIds.has(item.id)}
              className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all duration-200 cursor-pointer ${getTermStyle(item)}`}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Definitions Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
            Definitions
          </h3>
          {shuffledDefs.map((item) => (
            <button
              key={`def-${item.id}`}
              onClick={() => handleDefClick(item)}
              disabled={matchedIds.has(item.id)}
              className={`w-full p-3 rounded-xl border-2 text-left text-sm transition-all duration-200 cursor-pointer ${getDefStyle(item)}`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
