import type { FastifyPluginCallback } from "fastify";
import { createRequestHandler as createRemixRequestHandler } from "react-router";

import { MODES } from "../../../shared/constants/root-env.constant.ts";
import { RequestHelpers } from "./helpers/request-helpers.helper.ts";
import type {
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
} from "./types/plugin-factory.type";

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
    fastify.all("*", async (req, res) => {
      const request = createRemixRequest(req, res);
      const loadContext = await getLoadContext?.(req, res);

      const response = await handleRequest(request, loadContext);

      await sendRemixResponse(res, response);
    });

    done();
  };
};

export { createRequestHandler };
