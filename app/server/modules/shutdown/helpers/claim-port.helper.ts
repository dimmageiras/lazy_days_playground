import type { AppInstance } from "@server/types/instance.type";

import { MapHelper } from "@shared/helpers/map.helper";

import { KILL_FAILURE_MESSAGES } from "../constants/messages.constant";
import { SIGNALS } from "../constants/signals.constant";
import { TIMING_IN_MS } from "../constants/timing.constant";
import { KillHelper } from "./kill.helper";
import { ListenHelper } from "./listen.helper";
import { ShutdownHelper } from "./shutdown.helper";

const { SIGTERM } = SIGNALS;
const { COOPERATIVE_HANDOVER_TIMEOUT, FORCE_SHUTDOWN_TIMEOUT } = TIMING_IN_MS;

const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { getMapValue } = MapHelper;
const { requestCooperativeShutdown } = ShutdownHelper;

const claimPort = async (instance: AppInstance): Promise<void> => {
  const port = instance.appEnv.port;

  const abort = (message: string, extra?: Record<string, unknown>): never => {
    instance.log.error({ port, ...extra }, `💥 ${message}`);

    throw new Error(message);
  };

  if (await tryListen(instance)) {
    return;
  }

  instance.log.warn(
    { port },
    "🚧 Port in use — requesting cooperative shutdown.",
  );

  const cooperative = await requestCooperativeShutdown(instance);

  if (
    cooperative &&
    (await tryListenUntil(instance, COOPERATIVE_HANDOVER_TIMEOUT))
  ) {
    return;
  }

  instance.log.warn(
    {
      port,
      signal: SIGTERM,
      timeoutMs: cooperative ? COOPERATIVE_HANDOVER_TIMEOUT : undefined,
    },
    cooperative
      ? "🚧 Cooperative shutdown accepted but port not released in time — escalating to signal."
      : "🚧 Escalating to signal.",
  );

  const siblingClaim = await requestCooperativeShutdown(instance);

  if (siblingClaim) {
    abort(
      "Cooperative shutdown accepted by a sibling new instance — aborting to avoid stomping the handover winner.",
    );
  }

  const killResult = await killPortOwner(instance, SIGTERM);

  if (!killResult.ok) {
    if (await tryListen(instance)) {
      return;
    }

    abort(
      getMapValue(
        KILL_FAILURE_MESSAGES,
        killResult.reason,
        `Port still in use after a failed force-kill (${killResult.reason}) — aborting.`,
      ),
      { reason: killResult.reason },
    );
  }

  if (await tryListenUntil(instance, FORCE_SHUTDOWN_TIMEOUT)) {
    instance.log.warn(
      { port, signal: SIGTERM },
      "🚧 Port reclaimed after signal.",
    );

    return;
  }

  abort("Port still in use after signal — aborting.");
};

const ClaimPortHelper = Object.freeze({
  claimPort,
} as const);

export { ClaimPortHelper };
