import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

const fields = [
  {
    key: 'focus',
    label: 'Focus Duration',
    unit: 'min',
    min: 5,
    max: 60,
    step: 1,
  },
  {
    key: 'shortBreak',
    label: 'Short Break',
    unit: 'min',
    min: 1,
    max: 15,
    step: 1,
  },
  {
    key: 'longBreak',
    label: 'Long Break',
    unit: 'min',
    min: 5,
    max: 30,
    step: 1,
  },
  {
    key: 'sessionsBeforeLong',
    label: 'Sessions Before Long Break',
    unit: '',
    min: 2,
    max: 6,
    step: 1,
  },
];

export default function TimerSettings({ settings, onSave, onReset }) {
  const [local, setLocal] = useState(settings);

  // Sync when external settings change (e.g., mode switch)
  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  const handleChange = (key, raw) => {
    const field = fields.find((f) => f.key === key);
    let value = parseInt(raw, 10);
    if (Number.isNaN(value)) value = field.min;
    value = Math.max(field.min, Math.min(field.max, value));
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const isDirty =
    JSON.stringify(local) !== JSON.stringify(settings);

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary,#6b7280)] mb-4">
        Timer Settings
      </h3>

      <div className="flex flex-col gap-5">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            {/* Label row */}
            <div className="flex items-center justify-between">
              <label
                htmlFor={`timer-${field.key}`}
                className="text-sm font-medium text-[var(--text-primary,#111827)]"
              >
                {field.label}
              </label>
              <span className="text-sm font-mono tabular-nums text-[var(--text-primary,#111827)]">
                {local[field.key]}{field.unit && ` ${field.unit}`}
              </span>
            </div>

            {/* Slider */}
            <input
              id={`timer-${field.key}`}
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={local[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="timer-slider w-full h-2 rounded-full appearance-none cursor-pointer
                bg-gray-200 dark:bg-gray-700
                accent-[var(--accent,#6366f1)]"
            />

            {/* Range hints */}
            <div className="flex justify-between text-[10px] text-[var(--text-secondary,#6b7280)]">
              <span>{field.min}{field.unit && ` ${field.unit}`}</span>
              <span>{field.max}{field.unit && ` ${field.unit}`}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[var(--border,#e5e7eb)]">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset to Defaults
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(local)}
          disabled={!isDirty}
        >
          Save
        </Button>
      </div>

      <style>{`
        .timer-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent, #6366f1);
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .timer-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .timer-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent, #6366f1);
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
        }
      `}</style>
    </Card>
  );
}
