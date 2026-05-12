import type { FastifyInstance } from "fastify";

import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";

import { HOSTS } from "@shared/constants/network.constant";
import { TimingHelper } from "@shared/helpers/timing.helper";

const { LISTEN_POLL_INTERVAL_MS } = BOOTSTRAP_TIMING;
const { APP_HOST } = HOSTS;

const { delay } = TimingHelper;

const tryListen = async (
  app: FastifyInstance,
  port: number,
): Promise<boolean> => {
  try {
    await app.listen({ port, host: APP_HOST });

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

    await delay(LISTEN_POLL_INTERVAL_MS);
  }

  return false;
};

const ListenHelper = Object.freeze({
  tryListen,
  tryListenUntil,
} as const);

export { ListenHelper };
