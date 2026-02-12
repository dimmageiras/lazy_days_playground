import expressFastify from "@fastify/express";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import process from "node:process";
import type { ServerBuild } from "react-router";
import { RouterContextProvider } from "react-router";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";

import type { GetLoadContextFunction } from "@server/plugins/react-router-fastify/index";
import type { ServerInstance } from "@server/types/instance.type";
import type { CSPNonceType } from "@shared/types/csp.type";

import {
  IS_DEVELOPMENT,
  MODE,
  MODES,
} from "../../../shared/constants/root-env.constant.ts";
import { TypeHelper } from "../../../shared/helpers/type.helper.ts";
import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";
import { createRequestHandler } from "../../plugins/react-router-fastify/index.ts";

const { TYPE_GENERATOR } = MODES;

const { log } = PinoLogHelper;
const { castAsType } = TypeHelper;

const createViteDevServer = async (
  app: ServerInstance,
  viteDevServerRef: { current: ViteDevServer | null },
): Promise<void> => {
  try {
    viteDevServerRef.current = await createServer({
      mode: MODE,
      server: { middlewareMode: true },
    });

    app.use(viteDevServerRef.current.middlewares);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to create Vite dev server",
    );
    process.exit(1);
  }
};

const registerExpressCompatibility = async (
  app: ServerInstance,
): Promise<void> => {
  try {
    await app.register(expressFastify);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Express compatibility plugin",
    );
    process.exit(1);
  }
};

const serveStaticFiles = async (app: ServerInstance): Promise<void> => {
  try {
    const buildDir = path.join(process.cwd(), "dist", "client");

    await app.register(fastifyStatic, {
      root: buildDir,
      prefix: "/", // Serve all files from root
      decorateReply: false, // Don't decorate the reply with sendFile
      setHeaders: (reply, path) => {
        if (path.includes("/assets/")) {
          reply.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          ); // 1 year for assets
        } else {
          reply.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour for other files
        }
      },
      wildcard: false, // Don't use wildcard matching to avoid conflicts
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register static file serving",
    );

    process.exit(1);
  }
};

const registerReactRouterForDevelopment = async (
  app: ServerInstance,
  viteDevServerRef: { current: ViteDevServer | null },
): Promise<void> => {
  await registerExpressCompatibility(app);
  await createViteDevServer(app, viteDevServerRef);
};

const registerReactRouterForProduction = async (
  app: ServerInstance,
): Promise<void> => {
  await serveStaticFiles(app);
};

const registerReactRouter = async (app: ServerInstance): Promise<void> => {
  if (MODE === TYPE_GENERATOR) {
    // React Router Fastify plugin not registered in generator mode
    process.exit(0);
  }

  const viteDevServerRef: { current: ViteDevServer | null } = { current: null };

  if (IS_DEVELOPMENT) {
    await registerReactRouterForDevelopment(app, viteDevServerRef);
  } else {
    await registerReactRouterForProduction(app);
  }

  try {
    await app.register(
      createRequestHandler({
        build: async () => {
          let build: ServerBuild | null = null;

          try {
            if (IS_DEVELOPMENT) {
              build = await viteDevServerRef.current!.ssrLoadModule(
                "virtual:react-router/server-build",
              );
            } else {
              const importedBuild: ServerBuild =
                await import("../../../../server/index.js");

              build = importedBuild;
            }

            return build;
          } catch (error) {
            log.error(
              {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
              "💥 Failed to load React Router server build",
            );
            throw error;
          }
        },
        getLoadContext: (
          _request,
          response,
        ): ReturnType<GetLoadContextFunction> => {
          const context = new RouterContextProvider();

          // Get CSP nonces from response.locals (bridged from Fastify in onRequest hook)
          const cspNonce: CSPNonceType = response.cspNonce || {
            script: "",
            style: "",
          };

          // Store nonces as a property on context for middleware to access
          Reflect.set(context, "_cspNonce", cspNonce);

          return castAsType<ReturnType<GetLoadContextFunction>>(context);
        },
        mode: MODE,
      }),
    );
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register React Router Fastify plugin",
    );
    process.exit(1);
  }
};

const initReactRouterPlugins = async (app: ServerInstance): Promise<void> => {
  await registerReactRouter(app);
};

export const ReactRouterInit = {
  initReactRouterPlugins,
};
