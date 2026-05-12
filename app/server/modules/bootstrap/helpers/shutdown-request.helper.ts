import axios from "axios";

import { HOSTS, PROTOCOLS } from "@shared/constants/network.constant";

import { INTERNAL_PATHS } from "../../../constants/paths.constant";
import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";
import type { ShutdownRequestConfig } from "../types/bootstrap.type";

const { SHUTDOWN_REQUEST_TIMEOUT_MS } = BOOTSTRAP_TIMING;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { SHUTDOWN } = INTERNAL_PATHS;
const { HTTP } = PROTOCOLS;

/** POSTs to a sibling instance's cooperative-shutdown route; resolves true on 2xx, false on any failure or timeout. */
const requestCooperativeShutdown = async ({
  port,
  token,
}: ShutdownRequestConfig): Promise<boolean> => {
  try {
    const url = `${HTTP}://${LOOPBACK_HOST_V4}:${port}${SHUTDOWN}` as const;

    await axios.post(
      url,
      // Empty JSON body keeps axios on Content-Type: application/json, which
      // Fastify parses by default. axios's default x-www-form-urlencoded for
      // bodyless POSTs gets rejected by Fastify with 415.
      {},
      {
        headers: { "x-shutdown-token": token },
        signal: AbortSignal.timeout(SHUTDOWN_REQUEST_TIMEOUT_MS),
      },
    );

    return true;
  } catch {
    return false;
  }
};

const ShutdownRequestHelper = Object.freeze({
  requestCooperativeShutdown,
} as const);

export { ShutdownRequestHelper };
