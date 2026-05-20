import axios from "axios";

import { HTTP_PROTOCOLS } from "@shared/constants/network.constant";

import { HEADERS, INTERNAL_PATHS, SERVER_HOSTS, TIMING } from "../constants";
import type { ShutdownRequestConfig } from "../types";

const { SHUTDOWN_TOKEN_HEADER } = HEADERS;
const { HTTP } = HTTP_PROTOCOLS;
const { SHUTDOWN } = INTERNAL_PATHS;
const { LOOPBACK_HOST_V4 } = SERVER_HOSTS;
const { SHUTDOWN_REQUEST_TIMEOUT_MS } = TIMING;

const requestCooperativeShutdown = async ({
  app,
  port,
  token,
}: ShutdownRequestConfig): Promise<boolean> => {
  try {
    const url = `${HTTP}://${LOOPBACK_HOST_V4}:${port}${SHUTDOWN}` as const;

    await axios.post(
      url,
      {},
      {
        headers: {
          "content-type": "application/json",
          [SHUTDOWN_TOKEN_HEADER]: token,
        },
        signal: AbortSignal.timeout(SHUTDOWN_REQUEST_TIMEOUT_MS),
      },
    );

    return true;
  } catch (error) {
    app.log.warn({ err: error, port }, "Cooperative shutdown request failed.");

    return false;
  }
};

const ShutdownRequestHelper = Object.freeze({
  requestCooperativeShutdown,
} as const);

export { ShutdownRequestHelper };
