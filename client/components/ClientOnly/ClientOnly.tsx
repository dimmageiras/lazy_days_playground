import type { JSX, PropsWithChildren } from "react";

import { useMounted } from "@client/hooks/useMounted";

/**
 * A utility component that renders its children only after the component has mounted on the client.
 * This component is useful for deferring browser-only code (e.g., chart libraries, window/document access)
 * until after hydration to avoid SSR mismatch errors.
 *
 * Internally, it uses the `useMounted` hook which sets to `true` in a `useEffect`,
 * ensuring no content is rendered during server-side rendering or the initial client render.
 *
 * @example
 * ```tsx
 * import { ClientOnly } from '@client/components/ClientOnly';
 * import { HeavyChart } from '@client/components/HeavyChart';
 *
 * const MyComponent = () => {
 *   const data = { labels: ['A', 'B'], values: [1, 2] };
 *
 *   return (
 *     <ClientOnly>
 *       <HeavyChart libraryData={data} />
 *     </ClientOnly>
 *   );
 * };
 * ```
 *
 * @param props - The ClientOnly component props
 * @param props.children - The content to be rendered after client-side mounting
 * @returns JSX.Element | null - Returns the children wrapped in a fragment when mounted, null otherwise
 */
const ClientOnly = ({ children }: PropsWithChildren): JSX.Element | null => {
  const isMounted = useMounted();

  return isMounted ? <>{children}</> : null;
};

export { ClientOnly };
