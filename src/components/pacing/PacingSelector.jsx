import React from 'react';
import Card from '../shared/Card';

const PACING_OPTIONS = [
  {
    id: 'regular',
    title: 'Regular',
    description: 'Standard study session',
    detail: 'Uses your normal timer and card limits. Great for daily practice.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    color: 'var(--accent, #6366f1)',
  },
  {
    id: 'overload',
    title: 'Overload',
    description: 'Cram everything in one session',
    detail: 'No limits, no timer. Power through all your cards until you decide to stop.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    color: '#f59e0b',
  },
  {
    id: 'pacing',
    title: 'Pacing',
    description: 'Spread study over multiple days',
    detail: 'Creates a personalized study plan leading up to your exam or test date.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    color: '#10b981',
  },
];

export default function PacingSelector({ selected, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary,#111827)]">
          Choose Your Study Style
        </h2>
        <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
          Pick the approach that fits your schedule
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PACING_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#6366f1)] focus-visible:ring-offset-2 rounded-[var(--radius,0.75rem)]"
            >
              <Card
                hover
                className={[
                  'h-full transition-all duration-200',
                  isSelected
                    ? 'ring-2 shadow-lg'
                    : 'opacity-80 hover:opacity-100',
                ].join(' ')}
                style={
                  isSelected
                    ? { '--tw-ring-color': option.color, borderColor: option.color }
                    : undefined
                }
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="p-3 rounded-xl transition-colors duration-200"
                    style={{
                      color: isSelected ? '#fff' : option.color,
                      backgroundColor: isSelected ? option.color : `${option.color}18`,
                    }}
                  >
                    {option.icon}
                  </div>

                  <div>
                    <h3
                      className="font-semibold text-lg"
                      style={{ color: isSelected ? option.color : 'var(--text-primary, #111827)' }}
                    >
                      {option.title}
                    </h3>
                    <p className="text-sm font-medium text-[var(--text-secondary,#6b7280)] mt-0.5">
                      {option.description}
                    </p>
                  </div>

                  <p className="text-xs text-[var(--text-secondary,#6b7280)] leading-relaxed">
                    {option.detail}
                  </p>

                  {isSelected && (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: option.color }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Selected
                    </span>
                  )}
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
