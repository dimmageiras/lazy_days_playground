import type { FastifyPluginCallback } from "fastify";
import { createRequestHandler as createRemixRequestHandler } from "react-router";

import type {
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
} from "@server/plugins/react-router-fastify/types/plugin-factory.type";

import { MODES } from "../../../shared/constants/root-env.constant.ts";
import { RequestHelpers } from "./helpers/request-helpers.helper.ts";

/**
 * Returns a Fastify plugin that serves the response using React Router.
 */
const createRequestHandler: CreateRequestHandlerFactory = ({
  build,
  getLoadContext,
  mode = MODES.DEVELOPMENT,
}: CreateRequestHandlerOptions): FastifyPluginCallback => {
  const { createRemixRequest, sendRemixResponse } = RequestHelpers;

  const handleRequest = createRemixRequestHandler(build, mode);

  return (fastify, _opts, done) => {
    fastify.all(
      "*",
      {
        config: {
          rateLimit: false, // Exclude React Router routes from rate limiting
        },
      },
      async (request, reply) => {
        const remixRequest = createRemixRequest(request, reply);
        const loadContext = await getLoadContext?.(request, reply);

        const response = await handleRequest(remixRequest, loadContext);

        await sendRemixResponse(reply, response);
      },
    );

    done();
  };
};

export { createRequestHandler };
