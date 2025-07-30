import { QueryClientProvider } from "@tanstack/react-query";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "~/configs/react-query.config";

import { DevTools } from "./root/components/DevTools";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  const isDevMode = import.meta.env.DEV;

  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}
      {isDevMode ? <DevTools /> : null}
    </QueryClientProvider>
  );
};

export { AppProviders };
