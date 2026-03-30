import React from 'react';

export default function ProgressBar({
  value = 0,
  color,
  height = 8,
  showLabel = false,
  label,
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const fillColor = color || 'var(--accent, #6366f1)';

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          {label && (
            <span className="font-medium text-[var(--text-primary,#111827)]">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-[var(--text-secondary,#6b7280)] tabular-nums">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      <div
        className="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={Math.round(clampedValue)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  );
}
