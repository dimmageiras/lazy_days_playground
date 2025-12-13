import expressFastify from "@fastify/express";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import getPort, { portNumbers } from "get-port";
import path from "node:path";
import process from "node:process";
import type { AppLoadContext, ServerBuild } from "react-router";
import { RouterContextProvider } from "react-router";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";

import type { GetLoadContextFunction } from "@server/plugins/react-router-fastify/index";
import type { CSPNonceType } from "@shared/types/csp.type";

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
import { inits } from "./inits/inits.ts";
import { createRequestHandler } from "./plugins/react-router-fastify/index.ts";

const { TYPE_GENERATOR } = MODES;
const { SECONDS_TEN_IN_MS } = TIMING;

const { log } = PinoLogHelper;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
  requestTimeout: SECONDS_TEN_IN_MS,
}) as unknown as FastifyInstance;

await inits(app);

if (MODE === TYPE_GENERATOR) {
  process.exit(0);
}

let viteDevServer: ViteDevServer | null = null;

if (IS_DEVELOPMENT) {
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

// Serve static files in production BEFORE registering React Router
if (!IS_DEVELOPMENT) {
  try {
    const buildDir = path.join(process.cwd(), "dist", "client");

    await app.register(fastifyStatic, {
      root: buildDir,
      prefix: "/", // Serve all files from root
      decorateReply: false, // Don't decorate the reply with sendFile
      setHeaders: (res, path) => {
        if (path.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year for assets
        } else {
          res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour for other files
        }
      },
      wildcard: false, // Don't use wildcard matching to avoid conflicts
    });

    log.info("✅ Static file serving registered for production");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register static file serving"
    );

    process.exit(1);
  }
}

try {
  await app.register(
    createRequestHandler({
      build: async () => {
        let build: ServerBuild | null = null;

        try {
          if (IS_DEVELOPMENT) {
            build = await viteDevServer!.ssrLoadModule(
              "virtual:react-router/server-build"
            );
          } else {
            build = (await import(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - File exists at runtime after build
              "../../server/index.js"
            )) as ServerBuild;
          }

          return build;
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
      },
      getLoadContext: (
        _request,
        response
      ): ReturnType<GetLoadContextFunction> => {
        const context =
          new RouterContextProvider() as unknown as AppLoadContext;

        // Get CSP nonces from response.locals (bridged from Fastify in onRequest hook)
        const cspNonce: CSPNonceType = response.cspNonce || {
          script: "",
          style: "",
        };

        // Store nonces as a property on context for middleware to access
        context._cspNonce = cspNonce;

        return context as unknown as ReturnType<GetLoadContextFunction>;
      },
      mode: MODE,
    })
  );

  log.info("✅ React Router Fastify plugin registered");
} catch (error) {
  log.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "💥 Failed to register React Router Fastify plugin"
  );
  process.exit(1);
}

const startServer = async (): Promise<void> => {
  const desiredPort = Number(PORT);
  const portToUse = await getPort({
    port: portNumbers(desiredPort, desiredPort + 100),
  });

  // Graceful shutdown handler for Gel client connection pool
  const shutdown = async (signal: string): Promise<void> => {
    log.info(`Received ${signal}, closing Gel client connection pool...`);

    try {
      await app.gelClient.close();
      log.info("✅ Gel client connection pool closed gracefully");
    } catch (closeError) {
      log.error(
        {
          error:
            closeError instanceof Error
              ? closeError.message
              : String(closeError),
          stack: closeError instanceof Error ? closeError.stack : undefined,
        },
        "💥 Failed to close Gel client"
      );
    }
  };

  // Register shutdown handlers
  process.on("SIGTERM", () => {
    shutdown("SIGTERM").finally(() => {
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    shutdown("SIGINT").finally(() => {
      process.exit(0);
    });
  });

  try {
    // Ensure the connection pool is ready before starting the server
    await app.gelClient.ensureConnected();
    log.info("✅ Gel database connection pool initialized");

    const address = await app.listen({ port: portToUse, host: HOST });

    log.info(`🚀 Server started in ${MODE} mode at ${address}`);
    log.info(`🤖 Log level: "${LOG_LEVEL}"`);

    if (portToUse !== desiredPort) {
      log.warn(
        `! Port ${desiredPort} is not available, using ${portToUse} instead.`
      );
    }
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to start server"
    );

    // Close the Gel client connection pool on error
    await app.gelClient.close().catch((closeError) => {
      log.error(
        {
          error:
            closeError instanceof Error
              ? closeError.message
              : String(closeError),
          stack: closeError instanceof Error ? closeError.stack : undefined,
        },
        "💥 Failed to close Gel client"
      );
    });

    process.exit(1);
  }
};

await startServer();
