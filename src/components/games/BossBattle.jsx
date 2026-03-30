import React, { useState, useMemo, useEffect } from 'react';
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

function buildChoices(cards, correctIndex) {
  const correct = cards[correctIndex];
  const others = cards.filter((_, i) => i !== correctIndex);
  const wrongChoices = shuffle(others).slice(0, 3);
  return shuffle([
    { text: correct.back, isCorrect: true },
    ...wrongChoices.map((c) => ({ text: c.back, isCorrect: false })),
  ]);
}

const BOSS_NAMES = ['The Forgetter', 'Professor Procrastination', 'Captain Confusion', 'The Exam Dragon'];
const BOSS_EMOJIS = ['👾', '🐉', '👹', '🤖'];

const BOSS_DAMAGE = 20;
const PLAYER_DAMAGE = 15;

export default function BossBattle({ cards, onComplete }) {
  const { addXP, updateStats } = useGamification();

  const shuffledCards = useMemo(() => shuffle(cards), [cards]);
  const bossIndex = useMemo(() => Math.floor(Math.random() * BOSS_NAMES.length), []);
  const bossName = BOSS_NAMES[bossIndex];
  const bossEmoji = BOSS_EMOJIS[bossIndex];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState(() =>
    buildChoices(shuffledCards, 0)
  );
  const [bossHP, setBossHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(100);
  const [selected, setSelected] = useState(null);
  const [animation, setAnimation] = useState(null); // 'attack-boss' | 'attack-player'
  const [gameOver, setGameOver] = useState(null); // 'victory' | 'defeat'
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [startTime] = useState(Date.now());
  const [shakeTarget, setShakeTarget] = useState(null); // 'boss' | 'player'

  const currentCard = shuffledCards[currentIndex % shuffledCards.length];

  const handleChoice = (choice, index) => {
    if (selected !== null || gameOver) return;
    setSelected(index);
    setQuestionsAnswered((q) => q + 1);

    if (choice.isCorrect) {
      setScore((s) => s + 1);
      setAnimation('attack-boss');
      setShakeTarget('boss');

      setTimeout(() => {
        const newBossHP = Math.max(0, bossHP - BOSS_DAMAGE);
        setBossHP(newBossHP);
        setShakeTarget(null);

        if (newBossHP <= 0) {
          setGameOver('victory');
          const timeMs = Date.now() - startTime;
          const accuracy = Math.round(((score + 1) / (questionsAnswered + 1)) * 100);
          const xpEarned = Math.round(50 + score * 15);
          addXP(xpEarned, 'Boss Battle Victory');
          updateStats({ totalGames: 1 });
          onComplete({
            score: score + 1,
            total: questionsAnswered + 1,
            accuracy,
            timeMs,
            xpEarned,
            victory: true,
          });
        } else {
          advanceQuestion();
        }
      }, 600);
    } else {
      setAnimation('attack-player');
      setShakeTarget('player');

      setTimeout(() => {
        const newPlayerHP = Math.max(0, playerHP - PLAYER_DAMAGE);
        setPlayerHP(newPlayerHP);
        setShakeTarget(null);

        if (newPlayerHP <= 0) {
          setGameOver('defeat');
          const timeMs = Date.now() - startTime;
          const accuracy = Math.round((score / (questionsAnswered + 1)) * 100);
          const xpEarned = Math.round(10 + score * 5);
          addXP(xpEarned, 'Boss Battle Attempt');
          updateStats({ totalGames: 1 });
          onComplete({
            score,
            total: questionsAnswered + 1,
            accuracy,
            timeMs,
            xpEarned,
            victory: false,
          });
        } else {
          advanceQuestion();
        }
      }, 600);
    }
  };

  const advanceQuestion = () => {
    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % shuffledCards.length;
      setCurrentIndex(nextIndex);
      setChoices(buildChoices(shuffledCards, nextIndex));
      setSelected(null);
      setAnimation(null);
    }, 400);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <style>{`
        @keyframes attack-boss {
          0% { transform: translateX(0) scale(1); }
          30% { transform: translateX(60px) scale(1.1); }
          60% { transform: translateX(0) scale(1); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes attack-player {
          0% { transform: translateX(0) scale(1); }
          30% { transform: translateX(-60px) scale(1.1); }
          60% { transform: translateX(0) scale(1); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes boss-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes victory-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      {/* Header */}
      <h2 className="text-2xl font-bold text-[var(--text-primary,#111827)] text-center mb-6">
        Boss Battle
      </h2>

      {/* Battle Arena */}
      <div className="grid grid-cols-3 items-center gap-4 mb-8">
        {/* Player */}
        <div className="text-center">
          <div
            className={`text-5xl mb-2 transition-all duration-300 ${
              animation === 'attack-boss' ? 'animate-[attack-boss_0.6s_ease-out]' : ''
            } ${shakeTarget === 'player' ? 'animate-[boss-shake_0.4s_ease-in-out]' : ''}`}
          >
            🧑‍🎓
          </div>
          <p className="text-sm font-bold text-[var(--text-primary,#111827)] mb-1">
            You
          </p>
          <ProgressBar
            value={playerHP}
            color={playerHP > 50 ? '#10b981' : playerHP > 25 ? '#eab308' : '#f97316'}
            height={10}
          />
          <p className="text-xs font-medium text-gray-500 mt-1">{playerHP} HP</p>
        </div>

        {/* VS */}
        <div className="text-center">
          <span className="text-2xl font-black text-gray-300">VS</span>
        </div>

        {/* Boss */}
        <div className="text-center">
          <div
            className={`text-5xl mb-2 transition-all duration-300 ${
              animation === 'attack-player' ? 'animate-[attack-player_0.6s_ease-out]' : ''
            } ${shakeTarget === 'boss' ? 'animate-[boss-shake_0.4s_ease-in-out]' : ''}`}
          >
            {bossEmoji}
          </div>
          <p className="text-sm font-bold text-[var(--text-primary,#111827)] mb-1">
            {bossName}
          </p>
          <ProgressBar
            value={bossHP}
            color={bossHP > 50 ? '#ef4444' : bossHP > 25 ? '#f97316' : '#eab308'}
            height={10}
          />
          <p className="text-xs font-medium text-gray-500 mt-1">{bossHP} HP</p>
        </div>
      </div>

      {/* Game Over States */}
      {gameOver === 'victory' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4 animate-[victory-bounce_0.6s_ease-in-out_infinite]">
            🏆
          </div>
          <h3 className="text-3xl font-black text-emerald-600 mb-2">Victory!</h3>
          <p className="text-gray-600">
            You defeated {bossName}! Incredible work!
          </p>
        </div>
      )}

      {gameOver === 'defeat' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-3xl font-black text-violet-600 mb-2">
            Great Effort!
          </h3>
          <p className="text-gray-600">
            {bossName} was tough, but you'll get them next time! Every attempt
            makes you stronger.
          </p>
        </div>
      )}

      {/* Question Area */}
      {!gameOver && (
        <>
          <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-2xl p-6 border border-fuchsia-200 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-600 mb-2">
              What does this term mean?
            </p>
            <p className="text-xl font-bold text-gray-900">{currentCard.front}</p>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-1 gap-3">
            {choices.map((choice, i) => {
              let style =
                'bg-white border-2 border-gray-200 text-gray-800 hover:border-fuchsia-400 hover:shadow-md';
              if (selected !== null) {
                if (i === selected && choice.isCorrect) {
                  style =
                    'bg-emerald-100 border-2 border-emerald-400 text-emerald-800';
                } else if (i === selected && !choice.isCorrect) {
                  style =
                    'bg-orange-50 border-2 border-orange-300 text-orange-800';
                } else if (choice.isCorrect) {
                  style =
                    'bg-emerald-50 border-2 border-emerald-300 text-emerald-700';
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleChoice(choice, i)}
                  disabled={selected !== null}
                  className={`p-4 rounded-xl text-left text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-default ${style}`}
                >
                  <span className="inline-block w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold text-center leading-6 mr-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice.text}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
