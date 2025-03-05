import { useState, useEffect, useCallback } from "react";

type PomodoroMode = "work" | "break";

interface PomodoroReturn {
  minutes: number;
  seconds: number;
  isActive: boolean;
  mode: PomodoroMode;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: () => void;
}

export const usePomodoro = (
  onTimerComplete?: (mode: PomodoroMode) => void
): PomodoroReturn => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<PomodoroMode>("work");

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer complete
            setIsActive(false);

            // Call callback if provided
            if (onTimerComplete) {
              onTimerComplete(mode);
            }

            // Switch modes
            if (mode === "work") {
              // Switch to break
              setMode("break");
              setMinutes(5);
            } else {
              // Switch to work
              setMode("work");
              setMinutes(25);
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, mode, onTimerComplete]);

  const startTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    if (mode === "work") {
      setMinutes(25);
    } else {
      setMinutes(5);
    }
    setSeconds(0);
  }, [mode]);

  const switchMode = useCallback(() => {
    setIsActive(false);
    if (mode === "work") {
      setMode("break");
      setMinutes(5);
    } else {
      setMode("work");
      setMinutes(25);
    }
    setSeconds(0);
  }, [mode]);

  return {
    minutes,
    seconds,
    isActive,
    mode,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
  };
};
