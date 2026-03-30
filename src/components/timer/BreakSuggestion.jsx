import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { modeDefaults } from '../../config/modeDefaults';

const genericTips = [
  'Close your eyes and take 5 slow, deep breaths.',
  'Stand up and gently stretch your neck and shoulders.',
  'Look at something 20 feet away for 20 seconds (the 20-20-20 rule).',
  'Grab a glass of water -- hydration helps focus!',
  'Roll your wrists and flex your fingers to loosen up.',
  'Take a short walk around the room.',
  'Do a quick body scan: unclench your jaw, drop your shoulders, relax your hands.',
  'Look out the window and let your mind wander for a moment.',
];

export default function BreakSuggestion({ mode, onSkipBreak }) {
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * 100)
  );

  const tips = useMemo(() => {
    if (mode === 'adhd' && modeDefaults.adhd?.breaks) {
      return modeDefaults.adhd.breaks;
    }
    return genericTips;
  }, [mode]);

  const currentTip = tips[tipIndex % tips.length];

  const nextTip = () => setTipIndex((i) => i + 1);

  return (
    <div className="w-full max-w-sm animate-break-enter">
      <Card padding="md" className="text-center">
        {/* Header */}
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary,#6b7280)] mb-3">
          {mode === 'adhd' ? 'Movement Break' : 'Break Activity'}
        </p>

        {/* Suggestion */}
        <p className="text-lg font-medium text-[var(--text-primary,#111827)] mb-4 leading-relaxed">
          {currentTip}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={nextTip}>
            Something else
          </Button>
          <Button size="sm" onClick={onSkipBreak}>
            I'm ready!
          </Button>
        </div>
      </Card>

      <style>{`
        @keyframes break-enter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-break-enter {
          animation: break-enter 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
}
