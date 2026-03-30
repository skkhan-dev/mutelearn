import React from 'react';

export default function FlashcardCard({ front, back, isFlipped, onFlip }) {
  return (
    <div
      className="flip-card w-full cursor-pointer select-none"
      style={{ minHeight: '280px' }}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onFlip();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? 'Showing answer. Click to show question.' : 'Showing question. Click to show answer.'}
    >
      <div className={`flip-card-inner relative w-full ${isFlipped ? 'flipped' : ''}`} style={{ minHeight: '280px' }}>
        {/* Front */}
        <div
          className="flip-card-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--border,#e5e7eb)] bg-[var(--bg-card,#ffffff)] shadow-lg p-8"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary,#6b7280)] mb-4">
            Front
          </span>
          <p
            className="text-center font-medium leading-relaxed text-[var(--text-primary,#111827)]"
            style={{ fontSize: 'var(--font-size-card, 1.25rem)' }}
          >
            {front}
          </p>
          <span className="absolute bottom-4 text-xs text-[var(--text-secondary,#6b7280)] opacity-60">
            Tap to flip
          </span>
        </div>

        {/* Back */}
        <div
          className="flip-card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--accent,#6366f1)] bg-[var(--bg-card,#ffffff)] shadow-lg p-8"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent,#6366f1)] mb-4">
            Back
          </span>
          <p
            className="text-center font-medium leading-relaxed text-[var(--text-primary,#111827)]"
            style={{ fontSize: 'var(--font-size-card, 1.25rem)' }}
          >
            {back}
          </p>
        </div>
      </div>
    </div>
  );
}
