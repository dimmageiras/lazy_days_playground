import { BOOTSTRAP_TIMING, SIGNALS } from "./constants/bootstrap.constant";
import { BootstrapHelper } from "./helpers/bootstrap.helper";
import type {
  BootstrapConfig,
  BootstrapServerReturn,
} from "./types/bootstrap.type";

const { COOPERATIVE_HANDOVER_TIMEOUT_MS, FORCE_SHUTDOWN_TIMEOUT_MS } =
  BOOTSTRAP_TIMING;
const { SIGTERM } = SIGNALS;

const {
  createShutdownRoute,
  killPortOwner,
  requestCooperativeShutdown,
  setupCloseListeners,
  tryListen,
  tryListenUntil,
} = BootstrapHelper;

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

      app.log.warn(`Port ${port} in use — requesting cooperative shutdown.`);

      if (await requestCooperativeShutdown({ port, token })) {
        if (await tryListenUntil(app, port, COOPERATIVE_HANDOVER_TIMEOUT_MS)) {
          return;
        }
      }

      app.log.warn(`Cooperative shutdown failed — sending ${SIGTERM}.`);

      if (!(await killPortOwner(port, SIGTERM))) {
        app.log.error(`Failed to free port ${port} — aborting.`);
        process.exit(1);
      }

      if (await tryListenUntil(app, port, FORCE_SHUTDOWN_TIMEOUT_MS)) {
        return;
      }

      app.log.error(`Port ${port} still in use — aborting.`);
      process.exit(1);
    } catch (error) {
      app.log.error(
        { err: error },
        `Listen failed on port ${port} — aborting.`,
      );
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
