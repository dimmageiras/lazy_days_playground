import { BOOTSTRAP_TIMING, SIGNALS } from "./constants/bootstrap.constant";
import { CloseHelper } from "./helpers/close.helper";
import { KillHelper } from "./helpers/kill.helper";
import { ListenHelper } from "./helpers/listen.helper";
import { ShutdownRequestHelper } from "./helpers/shutdown-request.helper";
import { ShutdownRoute } from "./routes/shutdown.route";
import type {
  BootstrapConfig,
  BootstrapServerReturn,
} from "./types/bootstrap.type";

const { COOPERATIVE_HANDOVER_TIMEOUT_MS, FORCE_SHUTDOWN_TIMEOUT_MS } =
  BOOTSTRAP_TIMING;
const { SIGTERM } = SIGNALS;

const { setupCloseListeners } = CloseHelper;
const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { requestCooperativeShutdown } = ShutdownRequestHelper;
const { createShutdownRoute } = ShutdownRoute;

const bootstrapServer = ({
  app,
  options: { port, token },
}: BootstrapConfig): BootstrapServerReturn => {
  const closeListeners = setupCloseListeners(app);

  const shutdownRoute = createShutdownRoute({ token });

  const claimPort = async (): Promise<void> => {
    try {
      if (await tryListen(app, port)) {
        return;
      }

      app.log.warn({ port }, "Port in use — requesting cooperative shutdown.");

      const cooperative = await requestCooperativeShutdown({ port, token });

      if (cooperative) {
        if (await tryListenUntil(app, port, COOPERATIVE_HANDOVER_TIMEOUT_MS)) {
          return;
        }

        app.log.warn(
          { port, timeoutMs: COOPERATIVE_HANDOVER_TIMEOUT_MS, signal: SIGTERM },
          "Cooperative shutdown accepted but port not released in time — sending signal.",
        );
      } else {
        app.log.warn(
          { port, signal: SIGTERM },
          "Cooperative shutdown request failed — sending signal.",
        );
      }

      const killResult = await killPortOwner(port, SIGTERM);

      if (!killResult.ok) {
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
              "No listening process found owning port — aborting.",
            );
            break;
          case "kill-threw":
            app.log.error(
              { port },
              "Failed to signal port owner — aborting.",
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

  return {
    claimPort,
    shutdownRoute,
    shutdownRouteOptions: { closeListeners },
  };
};

export { bootstrapServer };
