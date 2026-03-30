import { useState, useEffect, useCallback, useRef } from 'react';

export function useIdleDetection(timeoutSeconds = 120) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef(null);

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    clearTimeout(timerRef.current);
    if (timeoutSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, timeoutSeconds * 1000);
    }
  }, [timeoutSeconds]);

  useEffect(() => {
    if (timeoutSeconds <= 0) return;

    const events = ['mousemove', 'click', 'scroll', 'keypress', 'touchstart'];

    const handleActivity = () => resetIdle();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    // Start the initial timer
    resetIdle();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(timerRef.current);
    };
  }, [timeoutSeconds, resetIdle]);

  return { isIdle, resetIdle };
}
