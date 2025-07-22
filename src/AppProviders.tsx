import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "./configs/react-query.config";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  const hasReactQueryDevTools =
    import.meta.env.VITE_HAS_REACT_QUERY_DEV_TOOLS === "true";

  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}
      {hasReactQueryDevTools ? <ReactQueryDevtools /> : null}
    </QueryClientProvider>
  );
};

export { AppProviders };
