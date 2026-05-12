import type { FastifyInstance } from "fastify";

import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";

import { HOSTS } from "@shared/constants/network.constant";
import { TimingHelper } from "@shared/helpers/timing.helper";

const { LISTEN_POLL_INTERVAL_MS } = BOOTSTRAP_TIMING;
const { BIND_ALL_IPV4 } = HOSTS;

const { delay } = TimingHelper;

/** Single Fastify listen attempt on the IPv4 bind-all host; returns false for EADDRINUSE, rethrows other errors. */
const tryListen = async (
  app: FastifyInstance,
  port: number,
): Promise<boolean> => {
  try {
    await app.listen({ port, host: BIND_ALL_IPV4 });

    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      return false;
    }

    throw error;
  }
};

/** Polls `tryListen` on a fixed interval until success or `timeoutMs` elapses; returns false on timeout. */
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
