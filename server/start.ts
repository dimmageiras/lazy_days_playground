import expressFastify from "@fastify/express";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import getPort, { portNumbers } from "get-port";
import path from "node:path";
import process from "node:process";
import type { ServerBuild } from "react-router";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";

import {
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  PORT,
} from "../shared/constants/root-env.constants.ts";
import { log } from "./helpers/log.helper.ts";
import { createRequestHandler } from "./plugin/react-router-fastify/index.ts";

const app = fastify({
  loggerInstance: log,
  disableRequestLogging: IS_DEVELOPMENT,
});

await app.register(expressFastify);

let viteDevServer: ViteDevServer | null = null;

if (IS_DEVELOPMENT) {
  viteDevServer = await createServer({
    mode: MODE,
    server: { middlewareMode: true },
  });

  // In development, Vite middleware handles static assets first
  app.use(viteDevServer.middlewares);
}

// Serve static files in production BEFORE registering React Router
if (MODE === "production") {
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
}

if (IS_DEVELOPMENT) {
  await app.register(
    createRequestHandler({
      build: async () => {
        const build = (await viteDevServer!.ssrLoadModule(
          "virtual:react-router/server-build"
        )) as ServerBuild;

        return build;
      },
    })
  );
} else {
  await app.register(
    createRequestHandler({
      build: async () => {
        const build = (await import(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - File exists at runtime after build
          "../../server/index.js"
        )) as ServerBuild;

        return build;
      },
      mode: MODE,
    })
  );
}

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
