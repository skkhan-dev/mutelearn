import React from 'react';
import { difficultyLabels, difficultyColors } from '../../config/modeDefaults';

export default function DifficultyButtons({ onRate, difficultyLevels = 5 }) {
  const labels = difficultyLabels[difficultyLevels] || difficultyLabels[5];
  const colors = difficultyColors[difficultyLevels] || difficultyColors[5];

  return (
    <div className="w-full animate-[fadeIn_300ms_ease-out]">
      <p className="text-sm font-medium text-[var(--text-secondary,#6b7280)] text-center mb-3">
        How well did you know this?
      </p>
      <div className="flex gap-2 justify-center flex-wrap">
        {labels.map((label, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onRate(index)}
            className={[
              'px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150',
              'hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'cursor-pointer select-none shadow-sm hover:shadow-md',
              colors[index],
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
