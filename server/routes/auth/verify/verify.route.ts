import { UserError } from "@gel/auth-core";
import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { VerifyRequestBody } from "@server/plugins/gel-auth-fastify/index";
import type {
  VerifyCreateData,
  VerifyCreateError,
} from "@shared/types/generated/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import {
  verifyErrorSchema,
  verifyRateLimitErrorSchema,
  verifyRequestSchema,
  verifySuccessSchema,
} from "../../../../shared/schemas/auth/verify-route.schema.ts";
import { AUTH_COOKIE_CONFIG } from "../../../constants/cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { GelDbHelper } from "../../../helpers/gel-db.helper.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";

const verifyRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;
  const { handleAuthError } = GelDbHelper;
  const { fastIdGen } = IdUtilsHelper;
  const { log } = PinoLogHelper;
  const { createAuth, createClient } = AuthClientHelper;

  const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  fastify
    .withTypeProvider<FastifyZodOpenApiTypeProvider>()
    .post<VerifyRequestBody>(
      `/${AUTH_ENDPOINTS.VERIFY}`,
      {
        config: {
          rateLimit: AUTH_RATE_LIMIT,
        },
        schema: {
          body: verifyRequestSchema,
          description:
            "Complete email verification process and activate user account",
          summary: "Verify email address",
          tags: ["Authentication"],
          response: {
            [OK]: {
              content: { "application/json": { schema: verifySuccessSchema } },
            },
            [BAD_REQUEST]: {
              content: { "application/json": { schema: verifyErrorSchema } },
            },
            [MANY_REQUESTS_ERROR]: {
              content: {
                "application/json": { schema: verifyRateLimitErrorSchema },
              },
            },
            [SERVICE_UNAVAILABLE]: {
              content: { "application/json": { schema: verifyErrorSchema } },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (request, reply) => {
        const requestId = fastIdGen();

        try {
          const { verificationToken, verifier } = request.body;

          const client = createClient();

          try {
            const { emailPasswordHandlers } = createAuth(client);

            const { verifyRegistration } = emailPasswordHandlers;

            const tokenData = await verifyRegistration(
              verificationToken,
              verifier
            );

            reply.setCookie(
              "gel-session",
              tokenData.auth_token,
              AUTH_COOKIE_CONFIG
            );

            const { httpOnly, path, sameSite, secure } = AUTH_COOKIE_CONFIG;

            reply.clearCookie("gel-pkce-verifier", {
              httpOnly,
              path,
              sameSite,
              secure,
            });

            const response: VerifyCreateData = {
              identity_id: tokenData.identity_id,
              timestamp: getCurrentISOTimestamp(),
            };

            return reply.status(OK).send(response);
          } finally {
            await client.close();
          }
        } catch (rawError) {
          const error =
            rawError instanceof Error ? rawError : new Error(`${rawError}`);

          log.error(
            {
              error: error.message,
              errorType: error instanceof UserError ? error.type : "unknown",
              hasVerifier: !!request.body?.verifier,
              hasVerificationToken: !!request.body?.verificationToken,
              requestId,
              stack: error.stack,
            },
            "💥 Verify request failed with error"
          );

          const verificationFailedError = {
            details: "Invalid verification credentials",
            errorMessageResponse: "Verification failed",
            statusCode: BAD_REQUEST,
          };

          const { details, errorMessageResponse, statusCode } = handleAuthError(
            {
              error,
              invalidDataError: verificationFailedError,
              pkceVerificationFailedError: verificationFailedError,
              userError: verificationFailedError,
              verificationError: verificationFailedError,
              verificationTokenExpiredError: {
                details: "Verification token has expired",
                errorMessageResponse: "Verification failed",
                statusCode: BAD_REQUEST,
              },
            }
          );

          const errorResponse: VerifyCreateError = {
            details,
            error: errorMessageResponse,
            timestamp: getCurrentISOTimestamp(),
          };

          return reply.status(statusCode).send(errorResponse);
        }
      }
    );
};

export { verifyRoute };
