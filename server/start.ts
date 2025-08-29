import authFastify from "@fastify/auth";
import cookieFastify from "@fastify/cookie";
import jwtFastify from "@fastify/jwt";
import { reactRouterFastify } from "@mcansh/remix-fastify/react-router";
import { reactRouter } from "@react-router/dev/vite";
import fastify from "fastify";
import getPort, { portNumbers } from "get-port";
import { reactRouterDevTools } from "react-router-devtools";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

import {
  COOKIE_SECRET,
  HAS_DEV_TOOLS,
  HAS_RRDT,
  HOST,
  IS_DEVELOPMENT,
  JWT_SECRET,
  LOG_LEVEL,
  MODE,
  PORT,
} from "../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";

const { log } = PinoLogHelper;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
});

await app.register(cookieFastify, {
  parseOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: !IS_DEVELOPMENT,
  },
  secret: COOKIE_SECRET,
});
log.info("✅ Cookie plugin registered");

await app.register(jwtFastify, {
  cookie: {
    cookieName: "accessToken",
    signed: true,
  },
  secret: JWT_SECRET,
});
log.info("✅ JWT plugin registered");

await app.register(authFastify);
log.info("✅ Auth plugin registered");

await app.register(async (fastify) => {
  const { userRoutes } = await import("./routes/user.routes.ts");

  await fastify.register(userRoutes, { prefix: "/api/user" });
});
log.info("✅ User API routes registered");

await app.register(reactRouterFastify, {
  buildDirectory: "dist",
  serverBuildFile: "index.js",
  viteOptions: {
    mode: MODE,
    plugins: [
      HAS_DEV_TOOLS && HAS_RRDT && reactRouterDevTools(),
      reactRouter(),
      tsConfigPaths(),
      IS_DEVELOPMENT &&
        pluginChecker({
          eslint: {
            dev: {
              logLevel: ["error"],
            },
            lintCommand: `eslint . \
    --report-unused-disable-directives \
    --max-warnings 0 \
    --rule "no-console: ['error', { allow: ['error', 'info', 'warn'] }]" \
    --rule "react-hooks/exhaustive-deps: off"`,
            useFlatConfig: true,
          },
          // TODO: Enable overlay when an update that fixes the issue is released
          overlay: false,
          typescript: true,
        }),
    ],
  },
});
log.info("✅ React Router SSR plugin registered");

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
