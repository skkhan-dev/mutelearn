import React, { useState } from 'react';
import { encouragingMessages } from '../../config/modeDefaults';
import { stablePick } from '../../lib/textUtils';

export default function EncouragingMessage() {
  const [message] = useState(() =>
    stablePick(encouragingMessages, 'shared-encouragement-message')
  );

  return (
    <p className="text-sm text-[var(--text-secondary,#6b7280)] italic text-center animate-[fadeIn_600ms_ease-out]">
      {message}
    </p>
  );
}
