import { UserError } from "@gel/auth-core";
import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { VerifyRequestBody } from "@server/plugins/gel-auth-fastify";
import type {
  VerifyCreateData,
  VerifyCreateError,
} from "@shared/types/generated/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import {
  verifyErrorSchema,
  verifyRateLimitErrorSchema,
  verifyRequestSchema,
  verifySuccessSchema,
} from "../../../../shared/schemas/auth/verify-route.schema.ts";
import {
  ACCESS_TOKEN_COOKIE_CONFIG,
  AUTH_COOKIE_NAMES,
  BASE_COOKIE_CONFIG,
} from "../../../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { EncryptionHelper } from "../../../helpers/encryption.helper.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";

const verifyRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { ACCESS_TOKEN } = AUTH_COOKIE_NAMES;
  const { VERIFY } = AUTH_ENDPOINTS;
  const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  const { createAuth, createClient, handleAuthError } = AuthClientHelper;
  const { encryptData } = EncryptionHelper;
  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;

  fastify
    .withTypeProvider<FastifyZodOpenApiTypeProvider>()
    .post<VerifyRequestBody>(
      `/${VERIFY}`,
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

            // Encrypt the token before storing in cookie
            const encryptedToken = await encryptData(tokenData.auth_token);

            reply.setCookie(
              ACCESS_TOKEN,
              encryptedToken,
              ACCESS_TOKEN_COOKIE_CONFIG
            );

            reply.clearCookie("gel-pkce-verifier", BASE_COOKIE_CONFIG);

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
