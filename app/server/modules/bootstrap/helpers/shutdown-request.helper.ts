import type { ShutdownRequestConfig } from "../types/bootstrap.type.ts";

const requestCooperativeShutdown = async ({
  path,
  port,
  token,
}: ShutdownRequestConfig): Promise<boolean> => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "x-shutdown-token": token },
      signal: AbortSignal.timeout(2_000),
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const ShutdownRequestHelper = {
  requestCooperativeShutdown,
};
