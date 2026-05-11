import type { FastifyInstance } from "fastify";

import { TimingHelper } from "#shared/helpers/timing.helper.ts";

const { delay } = TimingHelper;

const tryListen = async (
  app: FastifyInstance,
  port: number,
): Promise<boolean> => {
  try {
    await app.listen({ port, host: "0.0.0.0" });

    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      return false;
    }

    throw error;
  }
};

const tryListenUntil = async (
  app: FastifyInstance,
  port: number,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await tryListen(app, port)) {
      return true;
    }

    await delay(100);
  }

  return false;
};

export const ListenHelper = {
  tryListen,
  tryListenUntil,
};
