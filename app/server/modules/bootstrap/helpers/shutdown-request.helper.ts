import axios from "axios";

import { INTERNAL_PATHS } from "@server/constants/paths.constant";
import {
  HOSTS,
  PROTOCOLS as NETWORK_PROTOCOLS,
} from "@shared/constants/network.constant";

import { PROTOCOLS, TIMING } from "../constants";
import type { ShutdownRequestConfig } from "../types";

const { SHUTDOWN_TOKEN_HEADER } = PROTOCOLS;
const { SHUTDOWN_REQUEST_TIMEOUT_MS } = TIMING;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { SHUTDOWN } = INTERNAL_PATHS;
const { HTTP } = NETWORK_PROTOCOLS;

/** POSTs to a sibling instance's cooperative-shutdown route; resolves true on 2xx, false on any failure or timeout. */
const requestCooperativeShutdown = async ({
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
  } catch {
    return false;
  }
};

const ShutdownRequestHelper = Object.freeze({
  requestCooperativeShutdown,
} as const);

export { ShutdownRequestHelper };
