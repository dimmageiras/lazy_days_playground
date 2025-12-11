import expressFastify from "@fastify/express";
import { createRequestHandler } from "@react-router/express";
import fastify from "fastify";
import getPort, { portNumbers } from "get-port";
import process from "node:process";
import type { ServerBuild } from "react-router";
import type { InlineConfig } from "vite";

import {
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  PORT,
} from "../shared/constants/root-env.constants.ts";
import { log } from "./helpers/log.helper.ts";

const app = fastify({
  loggerInstance: log,
  disableRequestLogging: IS_DEVELOPMENT,
});

await app.register(expressFastify);

const reactRouterHandler = createRequestHandler({
  build: IS_DEVELOPMENT
    ? async () => {
        const { createServer } = await import("vite");
        const viteDevServer = await createServer({
          mode: MODE,
          server: { middlewareMode: true },
        } satisfies InlineConfig);

        app.use(viteDevServer.middlewares);

        const build = (await viteDevServer.ssrLoadModule(
          "virtual:react-router/server-build"
        )) as ServerBuild;

        return build;
      }
    : async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - File exists at runtime after build
        const build = (await import("../../server/index.js")) as ServerBuild;

        return build;
      },
  mode: MODE,
});

app.use(reactRouterHandler);

log.info("✅ React Router SSR handler registered");

const startServer = async (): Promise<void> => {
  const desiredPort = Number(PORT);
  const portToUse = await getPort({
    port: portNumbers(desiredPort, desiredPort + 100),
  });

  try {
    const address = await app.listen({ port: portToUse, host: HOST });

    log.info(`🚀 Server started in ${MODE} mode at ${address}`);
    log.info(`🤖 Log level: "${LOG_LEVEL}"`);

    if (portToUse !== desiredPort) {
      log.warn(
        `! Port ${desiredPort} is not available, using ${portToUse} instead.`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    }

    process.exit(1);
  }
};

await startServer();
