import type { JSX, PropsWithChildren } from "react";

import { Links, Meta, Scripts, ScrollRestoration } from "react-router";

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
        {children}
        <div id="dialog-portal" className="dialog-portal" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export { RootLayout };
