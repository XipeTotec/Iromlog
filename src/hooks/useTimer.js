import { useState, useEffect, useRef, useCallback } from 'react';

export function formatTime(seconds) {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useStopwatch() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  return { seconds, isRunning, start, stop, reset };
}

export function useRestTimer(onFinish) {
  const [duration, setDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const start = useCallback((dur) => {
    const d = dur !== undefined ? dur : duration;
    setDuration(d);
    setTimeLeft(d);
    setIsRunning(true);
  }, [duration]);

  const skip = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(0);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (onFinishRef.current) onFinishRef.current();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  return { timeLeft, isRunning, start, skip, duration, setDuration };
}
