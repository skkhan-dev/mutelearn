import React, { useMemo } from 'react';
import { encouragingMessages } from '../../config/modeDefaults';

export default function EncouragingMessage() {
  const message = useMemo(
    () => encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)],
    [],
  );

  return (
    <p className="text-sm text-[var(--text-secondary,#6b7280)] italic text-center animate-[fadeIn_600ms_ease-out]">
      {message}
    </p>
  );
}
