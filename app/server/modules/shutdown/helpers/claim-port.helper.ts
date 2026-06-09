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

const { getMapValue } = MapHelper;
const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { requestCooperativeShutdown } = ShutdownHelper;

const claimPort = async (instance: AppInstance): Promise<void> => {
  const port = instance.appEnv.port;

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
      : "🚧 Cooperative shutdown request failed — escalating to signal.",
  );

  // Retry cooperative first: if a sibling new instance now owns the port,
  // force-killing would stomp the legitimate handover winner.
  const siblingClaim = await requestCooperativeShutdown(instance);

  if (siblingClaim) {
    const message =
      "Cooperative shutdown accepted by a sibling new instance — aborting to avoid stomping the handover winner.";

    instance.log.error({ port }, `💥 ${message}`);

    throw new Error(message);
  }

  const killResult = await killPortOwner(instance, SIGTERM);

  if (!killResult.ok) {
    // Port may have freed between the kill attempt and now — try one last listen.
    if (await tryListen(instance)) {
      return;
    }

    const message = getMapValue(
      KILL_FAILURE_MESSAGES,
      killResult.reason,
      `Port still in use after a failed force-kill (${killResult.reason}) — aborting.`,
    );

    instance.log.error({ port, reason: killResult.reason }, `💥 ${message}`);

    throw new Error(message);
  }

  if (await tryListenUntil(instance, FORCE_SHUTDOWN_TIMEOUT)) {
    instance.log.warn(
      { port, signal: SIGTERM },
      "🚧 Port reclaimed after signal.",
    );

    return;
  }

  const message = "Port still in use after signal — aborting.";

  instance.log.error({ port }, `💥 ${message}`);

  throw new Error(message);
};

const ClaimPortHelper = Object.freeze({
  claimPort,
} as const);

export { ClaimPortHelper };
