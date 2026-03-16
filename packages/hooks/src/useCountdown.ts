import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UseCountdownConfigs = {
  seconds: number;
  onCompleted?: VoidFunction;
};

const useCountdown = ({ seconds, onCompleted }: UseCountdownConfigs) => {
  const id = useRef<number | any>(0);
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [isCounting, setIsCounting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isCountingRef = useRef(isCounting);

  const configRef = useRef({
    seconds,
    onCompleted,
  });

  useEffect(() => {
    isCountingRef.current = isCounting;
  }, [isCounting]);

  useEffect(() => {
    configRef.current = {
      seconds,
      onCompleted,
    };
  }, [seconds, onCompleted]);

  const calculateRemainingTime = useCallback(() => {
    setRemainingSeconds((prevSeconds) => {
      if (prevSeconds - 1 <= 0) {
        clearInterval(id.current);
        configRef.current.onCompleted?.();
        setIsCounting(false);
        setIsPaused(false);
        return 0;
      }
      return prevSeconds - 1;
    });
  }, [setIsCounting, setIsPaused]);

  const start = useCallback(() => {
    if (isCountingRef.current) return;
    id.current = setInterval(calculateRemainingTime, 1000);
    setIsCounting(true);
    setIsPaused(false);
  }, [setIsCounting, setIsPaused, calculateRemainingTime]);

  const pause = () => {
    if (isPaused) return;
    clearInterval(id.current);
    setIsPaused(true);
  };

  const reset = useCallback(
    (config: Partial<UseCountdownConfigs> | undefined = {}) => {
      clearInterval(id.current);
      setIsCounting(false);
      setIsPaused(false);
      if (typeof config.seconds === "number") {
        setRemainingSeconds(config.seconds);
        configRef.current.seconds = config.seconds;
      } else {
        setRemainingSeconds(configRef.current.seconds);
      }
      if (typeof config.onCompleted === "function")
        configRef.current.onCompleted = config.onCompleted;
    },
    [setIsCounting, setIsPaused, setRemainingSeconds],
  );

  const formatted = useMemo(
    () => new Date(remainingSeconds * 1000).toISOString().slice(14, 19),
    [remainingSeconds],
  );

  useEffect(() => () => clearInterval(id.current), []);

  return {
    remainingSeconds,
    formatted,
    isCounting,
    isPaused,
    start,
    pause,
    resume: start,
    reset,
  };
};

export default useCountdown;
