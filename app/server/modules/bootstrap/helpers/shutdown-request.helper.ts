import { INTERNAL_PATHS } from "../../../constants/paths.constant";
import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";
import type { ShutdownRequestConfig } from "../types/bootstrap.type";

import { METHODS, PROTOCOLS } from "@shared/constants/network.constant";

const { SHUTDOWN_REQUEST_TIMEOUT_MS } = BOOTSTRAP_TIMING;
const { POST } = METHODS;
const { HTTP } = PROTOCOLS;
const { SHUTDOWN } = INTERNAL_PATHS;

const requestCooperativeShutdown = async ({
  hostLoopback,
  port,
  token,
}: ShutdownRequestConfig): Promise<boolean> => {
  try {
    const response = await fetch(
      `${HTTP}://${hostLoopback}:${port}${SHUTDOWN}`,
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

export const ShutdownRequestHelper = {
  requestCooperativeShutdown,
};
