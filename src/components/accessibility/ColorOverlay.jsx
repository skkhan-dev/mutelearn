import React from 'react';
import { useMode } from '../../contexts/ModeContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Button from '../shared/Button';

const colorOptions = [
  { label: 'None', value: 'none', color: 'transparent' },
  { label: 'Warm Yellow', value: 'yellow', color: '#fef3c7' },
  { label: 'Light Blue', value: 'blue', color: '#dbeafe' },
  { label: 'Light Green', value: 'green', color: '#d1fae5' },
  { label: 'Light Pink', value: 'pink', color: '#fce7f3' },
];

export default function ColorOverlay() {
  const { mode } = useMode();
  const [enabled, setEnabled] = useLocalStorage('mutelearn-color-overlay-enabled', false);
  const [selectedColor, setSelectedColor] = useLocalStorage('mutelearn-color-overlay-color', 'none');
  const [opacity, setOpacity] = useLocalStorage('mutelearn-color-overlay-opacity', 20);

  const activeColor = colorOptions.find((c) => c.value === selectedColor);
  const showOverlay = enabled && selectedColor !== 'none' && activeColor;

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={enabled ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setEnabled((prev) => !prev)}
          aria-pressed={enabled}
          aria-label={enabled ? 'Disable color overlay' : 'Enable color overlay'}
        >
          {enabled ? '🎨 Overlay On' : '🎨 Overlay Off'}
        </Button>

        {enabled && (
          <>
            {/* Color choices */}
            <div className="flex items-center gap-1">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedColor(opt.value)}
                  className={[
                    'w-6 h-6 rounded-full border-2 transition-transform',
                    opt.value === selectedColor
                      ? 'border-[var(--accent,#6366f1)] scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105',
                  ].join(' ')}
                  style={{
                    backgroundColor:
                      opt.value === 'none' ? 'transparent' : opt.color,
                  }}
                  aria-label={opt.label}
                  aria-pressed={opt.value === selectedColor}
                  title={opt.label}
                />
              ))}
            </div>

            {/* Opacity slider */}
            {selectedColor !== 'none' && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Opacity:</span>
                <input
                  type="range"
                  min={10}
                  max={40}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-20 accent-[var(--accent,#6366f1)]"
                  aria-label="Overlay opacity"
                />
                <span className="w-8 text-right">{opacity}%</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full-page overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-[9998] transition-opacity duration-300"
          style={{
            backgroundColor: activeColor.color,
            opacity: opacity / 100,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
