import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { AppProviders } from "./AppProviders";

startTransition(() => {
  hydrateRoot(
    document,
    <AppProviders>
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    </AppProviders>
  );
});
