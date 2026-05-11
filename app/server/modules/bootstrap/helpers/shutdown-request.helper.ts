import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant.ts";
import type { ShutdownRequestConfig } from "../types/bootstrap.type.ts";

const { SHUTDOWN_REQUEST_TIMEOUT_MS } = BOOTSTRAP_TIMING;

const requestCooperativeShutdown = async ({
  path,
  port,
  token,
}: ShutdownRequestConfig): Promise<boolean> => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "x-shutdown-token": token },
      signal: AbortSignal.timeout(SHUTDOWN_REQUEST_TIMEOUT_MS),
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const ShutdownRequestHelper = {
  requestCooperativeShutdown,
};
