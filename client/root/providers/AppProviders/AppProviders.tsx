import { QueryClientProvider } from "@tanstack/react-query";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "@client/configs/react-query.config";
import { DevTools } from "@client/root/components/DevTools";
import { IS_DEVELOPMENT } from "@shared/constants/root-env.constants";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}
      {IS_DEVELOPMENT ? <DevTools /> : null}
    </QueryClientProvider>
  );
};

export { AppProviders };
