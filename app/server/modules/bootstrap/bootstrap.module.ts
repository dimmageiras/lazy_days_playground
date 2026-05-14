import { TIMING, SIGNALS } from "./constants";
import { CloseHelper } from "./helpers/close.helper";
import { KillHelper } from "./helpers/kill.helper";
import { ListenHelper } from "./helpers/listen.helper";
import { ShutdownRequestHelper } from "./helpers/shutdown-request.helper";
import { ShutdownRoute } from "./routes/shutdown.route";
import type { BootstrapConfig } from "./types";

const { COOPERATIVE_HANDOVER_TIMEOUT_MS, FORCE_SHUTDOWN_TIMEOUT_MS } = TIMING;
const { SIGTERM } = SIGNALS;

const { setupCloseListeners } = CloseHelper;
const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { requestCooperativeShutdown } = ShutdownRequestHelper;
const { createShutdownRoute } = ShutdownRoute;

const bootstrapServer = async ({
  app,
  port,
  token,
}: BootstrapConfig): Promise<void> => {
  const closeListeners = await setupCloseListeners(app);

  const shutdownRoute = createShutdownRoute({ token });

  const claimPort = async (): Promise<void> => {
    try {
      if (await tryListen(app, port)) {
        return;
      }

      app.log.warn({ port }, "Port in use — requesting cooperative shutdown.");

      const cooperative = await requestCooperativeShutdown({ port, token });

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

      const killResult = await killPortOwner(port, SIGTERM, app.log);

      if (!killResult.ok) {
        // Port may have freed during the cooperative wait or between the kill
        // attempt and now — try one last listen before aborting.
        if (await tryListen(app, port)) {
          return;
        }

        switch (killResult.reason) {
          case "unsupported-platform":
            app.log.error(
              { port },
              "Cooperative path exhausted and force-kill is unsupported on this platform — aborting.",
            );
            break;
          case "no-pid":
            app.log.error(
              { port },
              "No listening process found owning port and port still in use — aborting.",
            );
            break;
          case "kill-threw":
            app.log.error(
              { port },
              "Failed to signal port owner and port still in use — aborting.",
            );
            break;
        }

        process.exit(1);
      }

      if (await tryListenUntil(app, port, FORCE_SHUTDOWN_TIMEOUT_MS)) {
        return;
      }

      app.log.error({ port }, "Port still in use after signal — aborting.");
      process.exit(1);
    } catch (error) {
      app.log.error({ err: error, port }, "Listen failed — aborting.");
      process.exit(1);
    }
  };

  await app.register(shutdownRoute, { closeListeners });
  await claimPort();
};

export { bootstrapServer };
