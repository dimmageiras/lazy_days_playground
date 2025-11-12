import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type {
  LogoutCreateData,
  LogoutCreateError,
} from "@shared/types/generated/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import {
  logoutErrorSchema,
  logoutRateLimitErrorSchema,
  logoutRequestSchema,
  logoutSuccessSchema,
} from "../../../../shared/schemas/auth/logout-route.schema.ts";
import { AUTH_COOKIE_NAMES } from "../../../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";

const logoutRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;
  const { LOGOUT } = AUTH_ENDPOINTS;
  const { MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } = HTTP_STATUS;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    `/${LOGOUT}`,
    {
      config: {
        rateLimit: AUTH_RATE_LIMIT,
      },
      schema: {
        description: "Sign out user and clear authentication cookies",
        summary: "Sign out user",
        tags: ["Authentication"],
        body: logoutRequestSchema,
        response: {
          [OK]: {
            content: { "application/json": { schema: logoutSuccessSchema } },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: logoutRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: { "application/json": { schema: logoutErrorSchema } },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, reply) => {
      const { ACCESS_TOKEN } = AUTH_COOKIE_NAMES;
      const requestId = fastIdGen();

      try {
        const { cookieName } = request.body;

        reply.clearCookie(ACCESS_TOKEN);
        reply.clearCookie(cookieName);

        const response: LogoutCreateData = {
          message: "Logout successful",
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(OK).send(response);
      } catch (rawError) {
        const error =
          rawError instanceof Error ? rawError : new Error(`${rawError}`);

        log.error(
          {
            error: error.message,
            requestId,
            stack: error.stack,
          },
          "💥 Logout request failed with error"
        );

        const errorResponse: LogoutCreateError = {
          details: "An unexpected error occurred during logout",
          error: "Logout failed",
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { logoutRoute };
