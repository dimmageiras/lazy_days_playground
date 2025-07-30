import type { JSX, PropsWithChildren } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";

import { DevTools } from "./components/DevTools";

const RootLayout = ({ children }: PropsWithChildren): JSX.Element => {
  const isDevMode = import.meta.env.DEV;

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
        {isDevMode ? <DevTools /> : null}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export { RootLayout };
