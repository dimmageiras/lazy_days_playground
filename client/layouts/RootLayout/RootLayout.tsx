import type { Route } from "@rr/types/client/+types/root";
import type { JSX, PropsWithChildren } from "react";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import {
  HAS_DEV_TOOLS,
  IS_DEVELOPMENT,
} from "@shared/constants/root-env.constant";

import { DevTools } from "./components/DevTools";

const RootLayout = ({ children }: PropsWithChildren): JSX.Element => {
  const loaderData = useLoaderData<Route.ComponentProps["loaderData"]>();

  const {
    cspNonce: { script: scriptNonce, style: styleNonce },
  } = loaderData;

  return (
    <html
      data-script-nonce={scriptNonce}
      data-style-nonce={styleNonce}
      lang="en"
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="csp-nonce" nonce={styleNonce} />
        <Meta />
        <Links nonce={scriptNonce} />
      </head>
      <body>
        <div id="app">{children}</div>
        {IS_DEVELOPMENT && HAS_DEV_TOOLS ? <DevTools /> : null}
        {IS_DEVELOPMENT ? (
          <script src="/@vite-plugin-checker-runtime-entry" type="module" />
        ) : null}
        <ScrollRestoration nonce={scriptNonce} />
        <Scripts nonce={scriptNonce} />
      </body>
    </html>
  );
};

export { RootLayout };
