import closeWithGrace from "close-with-grace";

import { SIGNALS_ERROR_MESSAGES } from "./constants/bootstrap.constant.ts";
import { KillHelper } from "./helpers/kill.helper.ts";
import { ListenHelper } from "./helpers/listen.helper.ts";
import { ShutdownRoute } from "./routes/shutdown.route.ts";
import type {
  BootstrapConfig,
  BootstrapServerReturn,
  CloseWithGraceReturn,
} from "./types/bootstrap.type.ts";

const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { createShutdownRoute } = ShutdownRoute;

const bootstrapServer = ({
  app,
  port,
  shutdownPath,
  shutdownToken,
}: BootstrapConfig): BootstrapServerReturn => {
  const setupCloseListeners = (): CloseWithGraceReturn =>
    closeWithGrace(
      { delay: 10_000 },
      async ({ signal, manual, err: error }) => {
        if (error) {
          app.log.error({ error }, "server closing with error");
        } else if (manual) {
          app.log.info(
            "Another instance started (manual). Shutting down gracefully.",
          );
        } else {
          app.log.info(
            (signal && SIGNALS_ERROR_MESSAGES.get(signal)) ||
              `Received ${signal} signal. Shutting down gracefully.`,
          );
        }

        await app.close();
      },
    );

  const shutdownRoute = createShutdownRoute({
    path: shutdownPath,
    token: shutdownToken,
  });

  const requestCooperativeShutdown = async (): Promise<boolean> => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${shutdownPath}`, {
        method: "POST",
        headers: { "x-shutdown-token": shutdownToken },
        signal: AbortSignal.timeout(2_000),
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const claimPort = async (): Promise<void> => {
    if (await tryListen(app, port)) {
      return;
    }

    app.log.warn(`Port ${port} in use — requesting cooperative shutdown.`);

    if (await requestCooperativeShutdown()) {
      if (await tryListenUntil(app, port, 5_000)) {
        return;
      }
    }

    app.log.warn(`Cooperative shutdown failed — sending SIGTERM.`);

    if (!(await killPortOwner(port, "SIGTERM"))) {
      app.log.error(`Failed to free port ${port} — aborting.`);
      process.exit(1);
    }

    if (await tryListenUntil(app, port, 3_000)) {
      return;
    }

    app.log.error(`Port ${port} still in use — aborting.`);
    process.exit(1);
  };

  const closeListeners = setupCloseListeners();
  const shutdownRouteWithListeners = [
    shutdownRoute,
    { closeListeners },
  ] as const;

  return { shutdownRouteWithListeners, claimPort };
};

export const BootstrapModule = { bootstrapServer };
