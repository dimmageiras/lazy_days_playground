import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable,
} from "@react-router/node";
import type { FastifyReply, FastifyRequest } from "fastify";

const createRemixHeaders = (
  requestHeaders: FastifyRequest["headers"]
): Headers => {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
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
  req: FastifyRequest,
  res: FastifyReply
): Request => {
  // req.hostname doesn't include port information so grab that from
  // `X-Forwarded-Host` or `Host`
  const xForwardedHost = req.headers["x-forwarded-host"];
  const host = req.headers.host;
  const xForwardedHostStr = Array.isArray(xForwardedHost)
    ? xForwardedHost[0]
    : xForwardedHost;
  const hostStr = Array.isArray(host) ? host[0] : host;
  const [, hostnamePortStr] = (xForwardedHostStr as string)?.split(":") ?? [];
  const [, hostPortStr] = (hostStr as string)?.split(":") ?? [];
  const hostnamePort = Number.parseInt(hostnamePortStr ?? "", 10);
  const hostPort = Number.parseInt(hostPortStr ?? "", 10);
  const port =
    Number.isSafeInteger(hostnamePort) || Number.isSafeInteger(hostPort)
      ? hostnamePort || hostPort || ""
      : "";
  // Use req.hostname here as it respects the "trust proxy" setting
  const resolvedHost = `${req.hostname}${port ? ":" + port : ""}`;
  // Use `req.url` so Remix is aware of the full path
  const url = new URL(`${req.protocol}://${resolvedHost}${req.url}`);

  // Abort action/loaders once we can no longer write a response
  let controller: AbortController | null = new AbortController();
  const init: RequestInit = {
    method: req.method,
    headers: createRemixHeaders(req.headers),
    signal: controller.signal,
  };

  // Abort action/loaders once we can no longer write a response iff we have
  // not yet sent a response (i.e., `close` without `finish`)
  // `finish` -> done rendering the response
  // `close` -> response can no longer be written to
  res.raw.on("finish", () => (controller = null));
  res.raw.on("close", () => controller?.abort());

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = createReadableStreamFromReadable(req.raw);
    (init as { duplex: "half" }).duplex = "half";
  }

  return new Request(url.href, init);
};

const sendRemixResponse = async (
  res: FastifyReply,
  nodeResponse: Response
): Promise<void> => {
  res.status(nodeResponse.status);

  // Set Content-Type directly on the raw response to ensure it's not overridden
  const contentType = nodeResponse.headers.get("Content-Type");

  if (contentType) {
    res.raw.setHeader("Content-Type", contentType);
  }

  for (const [key, value] of nodeResponse.headers.entries()) {
    if (key.toLowerCase() !== "content-type") {
      res.header(key, value);
    }
  }

  if (nodeResponse.headers.get("Content-Type")?.match(/text\/event-stream/i)) {
    res.raw.flushHeaders();
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res.raw);
  } else {
    res.raw.end();
  }
};

export const RequestHelpers = {
  createRemixHeaders,
  createRemixRequest,
  sendRemixResponse,
};
