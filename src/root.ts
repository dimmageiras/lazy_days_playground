import type { HtmlLinkDescriptor } from "react-router";

import { ErrorBoundary } from "~/components/ErrorBoundary";
import { HydrateFallback } from "~/components/HydrateFallback";
import RootLayout from "~/layouts/RootLayout";

import { AppProviders } from "./AppProviders";

export const links = (): HtmlLinkDescriptor[] => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export { RootLayout as Layout };

export default AppProviders;

export { ErrorBoundary };

export { HydrateFallback };
