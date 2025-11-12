import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import {
  meErrorSchema,
  meSuccessSchema,
} from "../../../../shared/schemas/auth/me-route.schema.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { authMiddleware } from "../../../middleware/auth.middleware.ts";

const verifyAuthRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { VERIFY_AUTH } = AUTH_ENDPOINTS;
  const { OK, UNAUTHORIZED } = HTTP_STATUS;

  const { getCurrentISOTimestamp } = DateHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${VERIFY_AUTH}`,
    {
      preHandler: [authMiddleware],
      schema: {
        description: "Get current authenticated user information",
        response: {
          [OK]: {
            content: { "application/json": { schema: meSuccessSchema } },
          },
          [UNAUTHORIZED]: {
            content: { "application/json": { schema: meErrorSchema } },
          },
        },
        summary: "Get current user",
        tags: ["Authentication"],
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, reply) => {
      return reply.status(OK).send({
        identity_id: request.user?.identity_id || null,
        timestamp: getCurrentISOTimestamp(),
      });
    }
  );
};

export { verifyAuthRoute };
