import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerMode = 'rastreador' | 'temporizador' | 'pomodoro';

/** Hook para cuenta atrás (temporizador y pomodoro). */
export function useCountdownTimer() {
  const [targetSeconds, setTargetSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const setOnComplete = useCallback((fn: () => void) => {
    onCompleteRef.current = fn;
  }, []);

  const start = useCallback((seconds?: number) => {
    if (seconds !== undefined && seconds > 0) {
      setTargetSeconds(seconds);
      setRemaining(seconds);
    }
    setRunning(true);
  }, []);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(targetSeconds);
  }, [targetSeconds]);

  const setTarget = useCallback((minutes: number) => {
    const sec = minutes * 60;
    setTargetSeconds(sec);
    setRemaining(sec);
    setRunning(false);
  }, []);

  return {
    targetSeconds,
    remaining,
    running,
    start,
    pause,
    resume,
    reset,
    setTarget,
    setOnComplete,
  };
}
