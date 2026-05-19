import { KILL_FAILURE_MESSAGES, SIGNALS, TIMING } from "../constants";
import type { BootstrapConfig } from "../types";
import { KillHelper } from "./kill.helper";
import { ListenHelper } from "./listen.helper";
import { ShutdownRequestHelper } from "./shutdown-request.helper";

const { SIGTERM } = SIGNALS;
const { COOPERATIVE_HANDOVER_TIMEOUT_MS, FORCE_SHUTDOWN_TIMEOUT_MS } = TIMING;

const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { requestCooperativeShutdown } = ShutdownRequestHelper;

const claimPort = async ({
  app,
  port,
  token,
}: BootstrapConfig): Promise<void> => {
  if (await tryListen(app, port)) {
    return;
  }

  app.log.warn({ port }, "Port in use — requesting cooperative shutdown.");

  const cooperative = await requestCooperativeShutdown({
    log: app.log,
    port,
    token,
  });

  if (
    cooperative &&
    (await tryListenUntil(app, port, COOPERATIVE_HANDOVER_TIMEOUT_MS))
  ) {
    return;
  }

  app.log.warn(
    {
      port,
      signal: SIGTERM,
      timeoutMs: cooperative ? COOPERATIVE_HANDOVER_TIMEOUT_MS : undefined,
    },
    cooperative
      ? "Cooperative shutdown accepted but port not released in time — escalating to signal."
      : "Cooperative shutdown request failed — escalating to signal.",
  );

  // Retry the cooperative request before force-killing. If a now-listening
  // peer accepts it, the port belongs to a sibling new instance — force-
  // killing would stomp the legitimate winner of the handover race.
  const siblingClaim = await requestCooperativeShutdown({
    log: app.log,
    port,
    token,
  });

  if (siblingClaim) {
    const message =
      "Cooperative shutdown accepted by a sibling new instance — aborting to avoid stomping the handover winner.";

    app.log.error({ port }, message);

    throw new Error(message);
  }

  // On win32 process.kill(pid, signal) is always a hard kill — cooperative
  // HTTP shutdown above is the only graceful path on this platform.
  const killResult = await killPortOwner(port, SIGTERM, app.log);

  if (!killResult.ok) {
    // Port may have freed during the cooperative wait or between the kill
    // attempt and now — try one last listen before aborting.
    if (await tryListen(app, port)) {
      return;
    }

    const message = KILL_FAILURE_MESSAGES.get(killResult.reason);

    if (message) {
      app.log.error({ port }, message);
      throw new Error(message);
    }

    app.log.error(
      { port, reason: killResult.reason },
      "Unknown kill failure reason — aborting.",
    );

    throw new Error(`Unknown kill failure reason: ${killResult.reason}`);
  }

  if (await tryListenUntil(app, port, FORCE_SHUTDOWN_TIMEOUT_MS)) {
    return;
  }

  app.log.error({ port }, "Port still in use after signal — aborting.");

  throw new Error("Port still in use after signal");
};

const ClaimPortHelper = Object.freeze({
  claimPort,
} as const);

export { ClaimPortHelper };
