import type { FastifyInstance } from "fastify";

import { DateHelper } from "@shared/helpers/date.helper";
import { TimingHelper } from "@shared/helpers/timing.helper";

import { SERVER_HOSTS, TIMING } from "../constants";

const { BIND_ALL_IPV4 } = SERVER_HOSTS;
const { LISTEN_POLL_INITIAL_INTERVAL_MS, LISTEN_POLL_MAX_INTERVAL_MS } = TIMING;

const { getCurrentTimestamp } = DateHelper;
const { delay } = TimingHelper;

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

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

const tryListenUntil = async (
  app: FastifyInstance,
  port: number,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = getCurrentTimestamp() + timeoutMs;
  let interval: number = LISTEN_POLL_INITIAL_INTERVAL_MS;

  while (getCurrentTimestamp() < deadline) {
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
