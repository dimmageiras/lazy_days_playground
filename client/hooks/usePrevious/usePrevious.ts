import { useRef, useSyncExternalStore } from "react";

/**
 * usePrevious – returns the previous value of a state or prop.
 *
 * Why:
 * •  Track the previous value of a prop or state across renders
 * •  Useful for comparing current vs previous values in effects or callbacks
 *
 * @param {TValue} value
 * The current value to track.
 *
 * @returns {TValue | null}
 * The previous value, or `null` if there is no previous value.
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * useEffect(() => {
 *   if (prevCount !== null && count > prevCount) {
 *     console.log("Count increased");
 *   }
 * }, [count, prevCount]);
 * ```
 */
const usePrevious = <TValue>(value: TValue): TValue | null => {
  const previousRef = useRef<TValue | null>(null);
  const currentRef = useRef<TValue | null>(value ?? null);

  // Create a store that tracks the previous value
  const subscribe = () => {
    // No-op: our "store" never notifies about changes
    // because we derive the value during render
    return () => {};
  };

  const getSnapshot = () => {
    const current = value ?? null;

    // If value changed, update refs to track new previous value
    if (currentRef.current !== current) {
      currentRef.current = current;
      previousRef.current = currentRef.current;
    }

    return previousRef.current;
  };

  const getServerSnapshot = () => {
    // On server, there's no previous value yet
    return null;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export { usePrevious };
