import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "@client/configs/react-query.config";
import {
  HAS_DEV_TOOLS,
  IS_DEVELOPMENT,
} from "@shared/constants/root-env.constant";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}
      {IS_DEVELOPMENT && HAS_DEV_TOOLS ? <ReactQueryDevtools /> : null}
    </QueryClientProvider>
  );
};

export { AppProviders };
