import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { PassThrough } from "node:stream";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import type { KeyAsString } from "type-fest";

import { TIMING } from "@shared/constants/timing.constant";
import type { CSPNonceType } from "@shared/types/csp.type";

const { SECONDS_FIVE_IN_MS, SECONDS_ONE_IN_MS } = TIMING;

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    let responseStatusCodeNew = responseStatusCode;
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    const { script: scriptNonce } = (loadContext as { _cspNonce: CSPNonceType })
      ._cspNonce;

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: KeyAsString<RenderToPipeableStreamOptions> =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={routerContext}
        nonce={scriptNonce}
        url={request.url}
      />,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCodeNew,
            })
          );

          pipe(body);
        },
        nonce: scriptNonce,
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCodeNew = 500;

          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, SECONDS_FIVE_IN_MS + SECONDS_ONE_IN_MS);
  });
};

export { handleRequest as default, SECONDS_FIVE_IN_MS as streamTimeout };
