import { INTERNAL_PATHS } from "@server/constants/paths.constant";
import axios from "axios";

import { HOSTS, HTTP_PROTOCOLS } from "@shared/constants/network.constant";

import {
  BOOTSTRAP_PROTOCOL,
  BOOTSTRAP_TIMING,
} from "../constants/bootstrap.constant";
import type { ShutdownRequestConfig } from "../types/bootstrap.type";

const { SHUTDOWN_TOKEN_HEADER } = BOOTSTRAP_PROTOCOL;
const { SHUTDOWN_REQUEST_TIMEOUT_MS } = BOOTSTRAP_TIMING;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { HTTP } = HTTP_PROTOCOLS;
const { SHUTDOWN } = INTERNAL_PATHS;

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
