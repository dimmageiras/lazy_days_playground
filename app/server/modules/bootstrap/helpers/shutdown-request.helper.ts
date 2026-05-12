import { HOSTS, METHODS, PROTOCOLS } from "@shared/constants/network.constant";

import { INTERNAL_PATHS } from "../../../constants/paths.constant";
import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";
import type { ShutdownRequestConfig } from "../types/bootstrap.type";

const { SHUTDOWN_REQUEST_TIMEOUT_MS } = BOOTSTRAP_TIMING;
const { LOOPBACK_HOSTS } = HOSTS;
const { SHUTDOWN } = INTERNAL_PATHS;
const { POST } = METHODS;
const { HTTP } = PROTOCOLS;

const requestCooperativeShutdown = async ({
  port,
  token,
}: ShutdownRequestConfig): Promise<boolean> => {
  try {
    const response = await fetch(
      `${HTTP}://${[...LOOPBACK_HOSTS][0]}:${port}${SHUTDOWN}`,
      {
        method: POST,
        headers: { "x-shutdown-token": token },
        signal: AbortSignal.timeout(SHUTDOWN_REQUEST_TIMEOUT_MS),
      },
    );

    return response.ok;
  } catch {
    return false;
  }
};

const ShutdownRequestHelper = Object.freeze({
  requestCooperativeShutdown,
} as const);

export { ShutdownRequestHelper };
