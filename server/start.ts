import expressFastify from "@fastify/express";
import { createRequestHandler } from "@react-router/express";
import fastify from "fastify";
import getPort, { portNumbers } from "get-port";
import process from "node:process";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";

import {
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  MODES,
  PORT,
} from "../shared/constants/root-env.constant.ts";
import { TIMING } from "../shared/constants/timing.constant.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";

const { SECONDS_TEN_IN_MS } = TIMING;

const { log } = PinoLogHelper;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
  requestTimeout: SECONDS_TEN_IN_MS,
});

try {
  await app.register(expressFastify);

  log.info("✅ Express compatibility plugin registered");
} catch (error) {
  log.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "💥 Failed to register Express compatibility plugin"
  );
  process.exit(1);
}

let viteDevServer: ViteDevServer | null = null;

if (MODE === MODES.DEVELOPMENT) {
  try {
    viteDevServer = await createServer({
      mode: MODE,
      server: { middlewareMode: true },
    });

    app.use(viteDevServer.middlewares);

    log.info("✅ Vite dev server middleware registered");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to create Vite dev server"
    );
    process.exit(1);
  }
}

const reactRouterHandler = createRequestHandler({
  build:
    MODE === MODES.DEVELOPMENT
      ? async () => {
          try {
            return await viteDevServer!.ssrLoadModule(
              "virtual:react-router/server-build"
            );
          } catch (error) {
            log.error(
              {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
              "💥 Failed to load React Router server build"
            );
            throw error;
          }
        }
      : async () => {
          try {
            // In production, load the built server build
            // @ts-expect-error - Dynamic import path resolved at runtime
            const build = await import("../../server/index.js");

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return build;
          } catch (error) {
            log.error(
              {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
              "💥 Failed to load production React Router server build"
            );
            throw error;
          }
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

const runTypeGeneration = async (): Promise<void> => {
  log.info("🔧 Starting type generation...");

  // Type generation logic needs to be implemented:
  // 1. Register API routes (if any exist)
  // 2. Generate OpenAPI spec from swagger
  // 3. Extract spec by routes (auth, user, api-health)
  // 4. Generate TypeScript types using TypesHelper.generateContractsForRoute

  log.warn("⚠️  Type generation logic not yet implemented - exiting early");
  log.info("✅ Type generation placeholder completed");
  process.exit(0);
};

// Check if we're in type generator mode
if (MODE === MODES.TYPE_GENERATOR) {
  await runTypeGeneration();
} else {
  await startServer();
}
