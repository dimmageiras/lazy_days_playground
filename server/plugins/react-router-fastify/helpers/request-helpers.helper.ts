import {
  createReadableStreamFromReadable,
  writeReadableStreamToWritable,
} from "@react-router/node";
import type { FastifyReply, FastifyRequest } from "fastify";

const createRemixHeaders = (
  requestHeaders: FastifyRequest["headers"],
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
  res: FastifyReply,
): Request => {
  // req.hostname doesn't include port information so grab that from
  // `X-Forwarded-Host` or `Host`
  const xForwardedHost = req.headers["x-forwarded-host"];
  const host = req.headers.host;
  const xForwardedHostStr = Array.isArray(xForwardedHost)
    ? xForwardedHost[0]
    : xForwardedHost;
  const hostStr: string | undefined = Array.isArray(host) ? host[0] : host;
  const [, hostnamePortStr] = xForwardedHostStr?.split(":") ?? [];
  const [, hostPortStr] = hostStr?.split(":") ?? [];
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
    Reflect.set(init, "duplex", "half");
  }

  return new Request(url.href, init);
};

const sendRemixResponse = async (
  res: FastifyReply,
  nodeResponse: Response,
): Promise<void> => {
  res.raw.statusMessage = nodeResponse.statusText;
  res.raw.statusCode = nodeResponse.status;

  for (const [key, value] of nodeResponse.headers.entries()) {
    res.raw.setHeader(key, value);
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
