import { useEffect, useRef } from "react";

const usePrevious = <TValue>(value: TValue): TValue | null => {
  const ref = useRef<TValue | null>(null);

  useEffect(() => {
    ref.current = value ?? null;

    return () => {
      ref.current = null;
    };
  }, [value]);

  return ref.current;
};

export { usePrevious };
