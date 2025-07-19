import type { HtmlLinkDescriptor } from "react-router";

import { ErrorBoundary } from "~/components/ErrorBoundary";
import { HydrateFallback } from "~/components/HydrateFallback";
import RootLayout from "~/layouts/RootLayout";

import { App } from "./App";

export const links = (): HtmlLinkDescriptor[] => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Forum&family=Lato&display=swap",
  },
];

export { RootLayout as Layout };

export default App;

export { ErrorBoundary };

export { HydrateFallback };
