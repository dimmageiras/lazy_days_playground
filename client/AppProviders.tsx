import { QueryClientProvider } from "@tanstack/react-query";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "@Client/configs/react-query.config";

import { IS_DEVELOPMENT } from "./constants/env.constants";
import { DevTools } from "./root/components/DevTools";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}
      {IS_DEVELOPMENT ? <DevTools /> : null}
    </QueryClientProvider>
  );
};

export { AppProviders };
