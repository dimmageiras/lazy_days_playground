import { useCallback, useEffect, useRef } from "react";
import type { ValueOf } from "type-fest";

import type { TIMING } from "@shared/constants/timing.constant";

import { DebounceHelper } from "./helpers/debounce.helper";

const useDebounce = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void | Promise<void>,
  delay: ValueOf<typeof TIMING>,
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
    [],
  );

  return useCallback(
    (...args: TArgs): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const { safeApplyCallback } = DebounceHelper;
        const currentCallback = Reflect.get(callbackRef, "current");

        safeApplyCallback(currentCallback, args);
      }, delay);
    },
    [delay],
  );
};

export { useDebounce };
