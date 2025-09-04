import type { JSX, PropsWithChildren } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";

import {
  HAS_DEV_TOOLS,
  IS_DEVELOPMENT,
} from "@shared/constants/root-env.constant";

import { DevTools } from "./components/DevTools";

const RootLayout = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="app">{children}</div>
        {IS_DEVELOPMENT && HAS_DEV_TOOLS ? <DevTools /> : null}
        {IS_DEVELOPMENT ? (
          <script type="module" src="/@vite-plugin-checker-runtime-entry" />
        ) : null}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export { RootLayout };
