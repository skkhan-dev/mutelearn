import { useState, useEffect, useCallback, useRef } from 'react';

export function useIdleDetection(timeoutSeconds = 120) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    if (timeoutSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, timeoutSeconds * 1000);
    }
  }, [timeoutSeconds]);

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (timeoutSeconds <= 0) return;

    const events = ['mousemove', 'click', 'scroll', 'keypress', 'touchstart'];

    const handleActivity = () => resetIdle();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    startTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(timerRef.current);
    };
  }, [timeoutSeconds, resetIdle, startTimer]);

  return { isIdle, resetIdle };
}
