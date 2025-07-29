import { QueryClientProvider } from "@tanstack/react-query";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "~/configs/react-query.config";

import { TanstackQueryDevTools } from "./root/components/TanstackQueryDevTools";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}

      <TanstackQueryDevTools />
    </QueryClientProvider>
  );
};

export { AppProviders };
