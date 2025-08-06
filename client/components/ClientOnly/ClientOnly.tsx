import type { JSX, PropsWithChildren } from "react";

import { useMounted } from "@client/hooks/useMounted";

/**
 * ClientOnly – renders its children only after the component has mounted
 * on the client.  Useful for deferring browser-only code (e.g. chart
 * libraries, `window` / `document` access) until after hydration so you
 * avoid SSR mismatch errors.
 *
 * @example
 * ```tsx
 * <ClientOnly>
 *   <HeavyChart libraryData={data} />
 * </ClientOnly>
 * ```
 *
 * Internally it relies on the `useMounted` hook which flips to `true` in
 * a `useEffect`, so nothing is rendered during the server pass or the
 * very first client render.
 */
const ClientOnly = ({ children }: PropsWithChildren): JSX.Element | null => {
  const isMounted = useMounted();

  return isMounted ? <>{children}</> : null;
};

export { ClientOnly };
