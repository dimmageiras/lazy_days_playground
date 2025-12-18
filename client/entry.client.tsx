import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const hydrate = async (): Promise<void> => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter
          onError={(error, errorInfo) => {
            // Log client-side errors for monitoring/debugging
            console.error("Client-side error:", error, errorInfo);

            // You can send this to your error reporting service
            // Example: Sentry.captureException(error, { contexts: { errorInfo } });
          }}
        />
      </StrictMode>
    );
  });
};

if (globalThis.requestIdleCallback) {
  globalThis.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  globalThis.setTimeout(hydrate, 1);
}
