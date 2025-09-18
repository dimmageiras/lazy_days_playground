import { useCallback, useEffect, useRef } from "react";

import type { TIMING } from "@shared/constants/timing.constant";

const useDebounce = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void | Promise<void>,
  delay: (typeof TIMING)[keyof typeof TIMING]
): ((...args: TArgs) => void) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return useCallback(
    (...args: TArgs): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const currentCallback = Reflect.get(callbackRef, "current");

        if (typeof currentCallback === "function") {
          Reflect.apply(currentCallback, undefined, args);
        }
      }, delay);
    },
    [delay]
  );
};

export { useDebounce };
