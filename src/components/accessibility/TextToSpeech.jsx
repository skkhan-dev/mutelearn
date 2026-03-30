import React, { useState } from 'react';
import { useMode } from '../../contexts/ModeContext';
import { useSpeech } from '../../hooks/useSpeech';
import Button from '../shared/Button';

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5];

export default function TextToSpeech({ text = '', compact = false }) {
  const { mode, modeConfig } = useMode();
  const { speak, stop, isSpeaking, isSupported } = useSpeech();
  const [enabled, setEnabled] = useState(
    modeConfig.accessibility?.ttsEnabled ?? false,
  );
  const [rate, setRate] = useState(1);

  if (!isSupported) return null;

  const autoEnabled = mode === 'dyslexia';
  const isActive = enabled || autoEnabled;

  const handleToggle = () => {
    if (isSpeaking) stop();
    setEnabled((prev) => !prev);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else if (text) {
      speak(text, rate);
    }
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5">
        {isActive && (
          <button
            type="button"
            onClick={handleSpeak}
            className={[
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/10',
              isSpeaking
                ? 'text-[var(--accent,#6366f1)]'
                : 'text-gray-500 dark:text-gray-400',
            ].join(' ')}
            aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
          >
            <span className={isSpeaking ? 'animate-pulse' : ''}>
              {isSpeaking ? '🔊' : '🔈'}
            </span>
            {isSpeaking ? 'Stop' : 'Read'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Toggle TTS on/off */}
      <Button
        variant={isActive ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleToggle}
        aria-pressed={isActive}
        aria-label={isActive ? 'Disable text-to-speech' : 'Enable text-to-speech'}
      >
        {isActive ? '🔊 TTS On' : '🔇 TTS Off'}
      </Button>

      {isActive && (
        <>
          {/* Read Aloud / Stop button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeak}
            disabled={!text}
            aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
          >
            <span className={isSpeaking ? 'animate-pulse' : ''}>
              {isSpeaking ? '⏹️ Stop' : '▶️ Read Aloud'}
            </span>
          </Button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="mr-1">Speed:</span>
            {speedOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRate(s)}
                className={[
                  'px-1.5 py-0.5 rounded text-xs font-medium transition-colors',
                  s === rate
                    ? 'bg-[var(--accent,#6366f1)] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
                ].join(' ')}
                aria-label={`Set speed to ${s}x`}
                aria-pressed={s === rate}
              >
                {s}x
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
