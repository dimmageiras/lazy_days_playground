import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { TimingHelper } from "@shared/helpers/timing.helper";
import type { TimingInMilliseconds } from "@shared/types/timing.type";

import { TIMING_IN_MS } from "../constants/timing.constant";

const { LISTEN_POLL_INITIAL_INTERVAL, LISTEN_POLL_MAX_INTERVAL } = TIMING_IN_MS;

const { isErrnoException, normalizeError } = ErrorHelper;
const { delay } = TimingHelper;

const tryListen = async (instance: AppInstance): Promise<boolean> => {
  const { bindAllIpv4, port } = instance.appEnv;

  try {
    await instance.listen({ host: bindAllIpv4, port });

    return true;
  } catch (error) {
    if (isErrnoException(error) && error.code === "EADDRINUSE") {
      return false;
    }

    instance.log.error(
      { ...normalizeError(error), port },
      "💥 Unexpected error while binding the port.",
    );

    throw error;
  }
};

const tryListenUntil = async (
  instance: AppInstance,
  timeoutMs: TimingInMilliseconds,
): Promise<boolean> => {
  const signal = AbortSignal.timeout(timeoutMs);
  let interval: number = LISTEN_POLL_INITIAL_INTERVAL;

  while (!signal.aborted) {
    if (await tryListen(instance)) {
      return true;
    }

    await delay(interval);

    interval = Math.min(Math.round(interval * 2.5), LISTEN_POLL_MAX_INTERVAL);
  }

  return false;
};

const ListenHelper = Object.freeze({
  tryListen,
  tryListenUntil,
} as const);

export { ListenHelper };
