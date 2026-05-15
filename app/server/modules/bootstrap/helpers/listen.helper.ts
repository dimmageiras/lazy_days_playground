import type { FastifyInstance } from "fastify";

import { HOSTS } from "@shared/constants/network.constant";
import { TimingHelper } from "@shared/helpers/timing.helper";

import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";

const { LISTEN_POLL_INITIAL_INTERVAL_MS, LISTEN_POLL_MAX_INTERVAL_MS } =
  BOOTSTRAP_TIMING;
const { BIND_ALL_IPV4 } = HOSTS;

const { delay } = TimingHelper;

/* Type guard for NodeJS.ErrnoException */
const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

/** Single Fastify listen attempt on the IPv4 bind-all host; returns false for EADDRINUSE, rethrows other errors. */
const tryListen = async (
  app: FastifyInstance,
  port: number,
): Promise<boolean> => {
  try {
    await app.listen({ port, host: BIND_ALL_IPV4 });

    return true;
  } catch (error) {
    if (isErrnoException(error) && error.code === "EADDRINUSE") {
      return false;
    }

    throw error;
  }
};

/** Polls `tryListen` with exponential backoff (capped) until success or `timeoutMs` elapses; returns false on timeout. */
const tryListenUntil = async (
  app: FastifyInstance,
  port: number,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  let interval: number = LISTEN_POLL_INITIAL_INTERVAL_MS;

  while (Date.now() < deadline) {
    if (await tryListen(app, port)) {
      return true;
    }

    await delay(interval);
    interval = Math.min(
      Math.round(interval * 2.5),
      LISTEN_POLL_MAX_INTERVAL_MS,
    );
  }

  return false;
};

const ListenHelper = Object.freeze({
  tryListen,
  tryListenUntil,
} as const);

export { ListenHelper };
