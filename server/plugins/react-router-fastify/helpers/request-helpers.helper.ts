import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable,
} from "@react-router/node";
import type { FastifyReply, FastifyRequest } from "fastify";

import { ArrayUtilsHelper } from "../../../../shared/helpers/array-utils.helper.ts";

const { isArray } = ArrayUtilsHelper;

const createRemixHeaders = (
  requestHeaders: FastifyRequest["headers"],
): Headers => {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
};

const createRemixRequest = (
  request: FastifyRequest,
  reply: FastifyReply,
): Request => {
  // request.hostname doesn't include port information so grab that from
  // `X-Forwarded-Host` or `Host`
  const xForwardedHost = request.headers["x-forwarded-host"];
  const host = request.headers.host;
  const xForwardedHostStr = isArray(xForwardedHost)
    ? xForwardedHost[0]
    : xForwardedHost;
  const hostStr: string | undefined = isArray(host) ? host[0] : host;
  const [, hostnamePortStr] = xForwardedHostStr?.split(":") ?? [];
  const [, hostPortStr] = hostStr?.split(":") ?? [];
  const hostnamePort = Number.parseInt(hostnamePortStr ?? "", 10);
  const hostPort = Number.parseInt(hostPortStr ?? "", 10);
  const port =
    Number.isSafeInteger(hostnamePort) || Number.isSafeInteger(hostPort)
      ? hostnamePort || hostPort || ""
      : "";
  // Use request.hostname here as it respects the "trust proxy" setting
  const resolvedHost = `${request.hostname}${port ? ":" + port : ""}`;
  // Use `request.url` so Remix is aware of the full path
  const url = new URL(`${request.protocol}://${resolvedHost}${request.url}`);

  // Abort action/loaders once we can no longer write a response
  let controller: AbortController | null = new AbortController();
  const init: RequestInit = {
    method: request.method,
    headers: createRemixHeaders(request.headers),
    signal: controller.signal,
  };

  // Abort action/loaders once we can no longer write a response iff we have
  // not yet sent a response (i.e., `close` without `finish`)
  // `finish` -> done rendering the response
  // `close` -> response can no longer be written to
  reply.raw.on("finish", () => (controller = null));
  reply.raw.on("close", () => controller?.abort());

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = createReadableStreamFromReadable(request.raw);
    Reflect.set(init, "duplex", "half");
  }

  return new Request(url.href, init);
};

const sendRemixResponse = async (
  reply: FastifyReply,
  nodeResponse: Response,
): Promise<void> => {
  reply.raw.statusMessage = nodeResponse.statusText;
  reply.raw.statusCode = nodeResponse.status;

  for (const [key, value] of nodeResponse.headers.entries()) {
    reply.raw.appendHeader(key, value);
  }

  if (nodeResponse.headers.get("Content-Type")?.match(/text\/event-stream/i)) {
    reply.raw.flushHeaders();
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, reply.raw);
  } else {
    reply.raw.end();
  }
};

export const RequestHelpers = {
  createRemixHeaders,
  createRemixRequest,
  sendRemixResponse,
};
