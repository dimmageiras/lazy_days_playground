import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import "iconify-icon";

import { AppProviders } from "./AppProviders";

async function hydrate() {
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
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
