import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";
import { createClient, QueryError } from "gel";

import type {
  CheckEmailCreateData,
  CheckEmailCreateError,
} from "@shared/types/generated/user.type";

import { GEL_DSN } from "../../../../shared/constants/root-env.constant.ts";
import { USER_ENDPOINTS } from "../../../../shared/constants/user.constant.ts";
import {
  checkEmailErrorSchema,
  checkEmailRateLimitErrorSchema,
  checkEmailRequestSchema,
  checkEmailSuccessSchema,
} from "../../../../shared/schemas/user/check-email-route.schema.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { USER_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";

const checkEmailRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { handleAuthError } = AuthClientHelper;
  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;

  const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    `/${USER_ENDPOINTS.CHECK_EMAIL}`,
    {
      config: {
        rateLimit: USER_RATE_LIMIT,
      },
      schema: {
        body: checkEmailRequestSchema,
        description: "Check if an email address exists in the user database",
        summary: "Check email existence",
        tags: ["User"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: checkEmailSuccessSchema },
            },
          },
          [BAD_REQUEST]: {
            content: { "application/json": { schema: checkEmailErrorSchema } },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: checkEmailRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: { "application/json": { schema: checkEmailErrorSchema } },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, reply) => {
      const requestId = fastIdGen();

      try {
        const { email } = request.body;

        const client = createClient({
          dsn: GEL_DSN,
        });

        let emailExists: boolean;

        try {
          const result = await client.query<boolean>(
            `
            SELECT EXISTS (
              SELECT ext::auth::EmailPasswordFactor 
              FILTER .email = <str>$email
            )
          `,
            { email }
          );

          const [isEmailInDb = false] = result;

          emailExists = isEmailInDb;
        } finally {
          await client.close();
        }

        const response: CheckEmailCreateData = {
          email,
          exists: emailExists,
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(OK).send(response);
      } catch (rawError) {
        const error =
          rawError instanceof Error ? rawError : new Error(`${rawError}`);

        log.error(
          {
            email: request.body?.email,
            error: error.message,
            errorType:
              error instanceof QueryError ? error.constructor.name : "unknown",
            requestId,
            stack: error.stack,
          },
          "💥 Check email request failed with error"
        );

        const emailCheckError = {
          details: "Invalid email format",
          errorMessageResponse: "Email check failed",
          statusCode: BAD_REQUEST,
        };

        const { details, errorMessageResponse, statusCode } = handleAuthError({
          error,
          invalidReferenceError: emailCheckError,
          queryError: emailCheckError,
        });

        const errorResponse: CheckEmailCreateError = {
          details,
          error: errorMessageResponse,
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(statusCode).send(errorResponse);
      }
    }
  );
};

export { checkEmailRoute };
