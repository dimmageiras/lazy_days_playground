import { useSyncExternalStore } from "react";

/**
 * useMounted – returns `true` after the component has mounted on the client.
 *
 * Why:
 * •  Prevents hydration-mismatch errors by letting you defer browser-only code
 * •  Useful for conditionally rendering elements that rely on `window`/`document`
 *
 * @returns {boolean}
 * `false` on the first (SSR) render, then `true` after the initial client mount.
 *
 * @example
 * ```tsx
 * const isMounted = useMounted();
 *
 * return isMounted ? <ClientOnlyChart /> : null;
 * ```
 */
const useMounted = (): boolean => {
  return useSyncExternalStore(
    () => () => {}, // subscribe: no-op (mounting state never changes)
    () => !import.meta.env.SSR, // getSnapshot: true on client (!false = true)
    () => !import.meta.env.SSR, // getServerSnapshot: false during SSR (!true = false)
  );
};

export { useMounted };
