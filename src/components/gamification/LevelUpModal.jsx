import React from 'react';
import { useGamification } from '../../contexts/GamificationContext';
import { levelNames } from '../../config/modeDefaults';
import Button from '../shared/Button';

const CONFETTI_PIECES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 0.8}s`,
  duration: `${1.5 + Math.random() * 1.5}s`,
  color: ['#6366f1', '#a78bfa', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'][
    Math.floor(Math.random() * 6)
  ],
  size: 6 + Math.random() * 6,
  rotation: Math.random() * 360,
  drift: (Math.random() - 0.5) * 120,
}));

export default function LevelUpModal() {
  const { level, showLevelUp, dismissLevelUp } = useGamification();
  const levelName = levelNames[level - 1] || levelNames[levelNames.length - 1];

  if (!showLevelUp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={dismissLevelUp}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CONFETTI_PIECES.map((piece) => (
          <div
            key={piece.id}
            className="absolute"
            style={{
              left: piece.left,
              top: '-10px',
              width: `${piece.size}px`,
              height: `${piece.size * 1.4}px`,
              backgroundColor: piece.color,
              borderRadius: piece.size > 9 ? '50%' : '2px',
              animation: `confettiFall ${piece.duration} ${piece.delay} ease-in forwards`,
              transform: `rotate(${piece.rotation}deg)`,
              '--drift': `${piece.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Modal card */}
      <div
        className="relative z-10 bg-[var(--bg-card,#ffffff)] rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-level-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring behind level */}
        <div className="relative mx-auto mb-4 w-28 h-28">
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background:
                'radial-gradient(circle, var(--accent, #6366f1), transparent 70%)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[var(--accent,#6366f1)] to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-extrabold text-white drop-shadow-md">
              {level}
            </span>
          </div>
        </div>

        {/* Sparkle accents */}
        <div className="flex justify-center gap-1 mb-2">
          {['delay-0', 'delay-150', 'delay-300'].map((d, i) => (
            <span
              key={i}
              className="text-2xl"
              style={{
                animation: `sparkle 1.2s ease-in-out infinite`,
                animationDelay: `${i * 150}ms`,
              }}
            >
              &#10024;
            </span>
          ))}
        </div>

        <h2 className="text-2xl font-extrabold text-[var(--text-primary,#111827)] mb-1">
          Level Up!
        </h2>
        <p className="text-lg font-semibold text-[var(--accent,#6366f1)] mb-1">
          {levelName}
        </p>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mb-6">
          You reached Level {level}. Keep studying to grow even stronger!
        </p>

        <Button onClick={dismissLevelUp} size="lg" className="w-full text-lg">
          Awesome!
        </Button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift, 0px)) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
