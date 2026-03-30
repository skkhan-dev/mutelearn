import React, { useState, useEffect, useCallback } from 'react';
import { useMode } from '../../contexts/ModeContext';
import Button from '../shared/Button';

const LINE_HEIGHT_PX = { 1: 32, 2: 56, 3: 80 };

export default function ReadingRuler() {
  const { mode, modeConfig } = useMode();
  const [enabled, setEnabled] = useState(
    modeConfig.accessibility?.readingRuler ?? false,
  );
  const [rulerLines, setRulerLines] = useState(1);
  const [mouseY, setMouseY] = useState(-999);

  const isDyslexia = mode === 'dyslexia';

  const handleMouseMove = useCallback((e) => {
    setMouseY(e.clientY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length > 0) {
      setMouseY(e.touches[0].clientY);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enabled, handleMouseMove, handleTouchMove]);

  const rulerHeight = LINE_HEIGHT_PX[rulerLines] || LINE_HEIGHT_PX[1];
  const topEdge = mouseY - rulerHeight / 2;

  return (
    <>
      {/* Control bar */}
      <div className="flex items-center gap-2">
        <Button
          variant={enabled ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setEnabled((prev) => !prev)}
          aria-pressed={enabled}
          aria-label={enabled ? 'Disable reading ruler' : 'Enable reading ruler'}
        >
          {enabled ? '📏 Ruler On' : '📏 Ruler Off'}
        </Button>

        {enabled && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Lines:</span>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRulerLines(n)}
                className={[
                  'px-1.5 py-0.5 rounded text-xs font-medium transition-colors',
                  n === rulerLines
                    ? 'bg-[var(--accent,#6366f1)] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
                ].join(' ')}
                aria-label={`Set ruler to ${n} line${n > 1 ? 's' : ''}`}
                aria-pressed={n === rulerLines}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay - pointer-events: none so clicks pass through */}
      {enabled && mouseY > 0 && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{ pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {/* Darkened area above the ruler */}
          <div
            className="absolute left-0 right-0 top-0 bg-black/30 transition-[height] duration-75"
            style={{ height: Math.max(0, topEdge) }}
          />
          {/* Darkened area below the ruler */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-black/30 transition-[top] duration-75"
            style={{ top: Math.max(0, topEdge + rulerHeight) }}
          />
          {/* Optional subtle border lines at ruler edges */}
          <div
            className="absolute left-0 right-0 h-px bg-[var(--accent,#6366f1)]/40 transition-[top] duration-75"
            style={{ top: Math.max(0, topEdge) }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-[var(--accent,#6366f1)]/40 transition-[top] duration-75"
            style={{ top: Math.max(0, topEdge + rulerHeight) }}
          />
        </div>
      )}
    </>
  );
}
