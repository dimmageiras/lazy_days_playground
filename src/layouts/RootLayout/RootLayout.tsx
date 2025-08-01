import type { JSX, PropsWithChildren } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";

import { IS_DEVELOPMENT } from "~/constants/env.constants";

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
        {IS_DEVELOPMENT ? <DevTools /> : null}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export { RootLayout };
