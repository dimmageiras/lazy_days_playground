import { UserError } from "@gel/auth-core";
import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { SigninRequestBody } from "@server/plugins/gel-auth-fastify";
import type {
  SigninCreateData,
  SigninCreateError,
} from "@shared/types/generated/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import {
  signinErrorSchema,
  signinRateLimitErrorSchema,
  signinRequestSchema,
  signinSuccessSchema,
} from "../../../../shared/schemas/auth/signin-route.schema.ts";
import {
  ACCESS_TOKEN_COOKIE_CONFIG,
  AUTH_COOKIE_NAMES,
} from "../../../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { EncryptionHelper } from "../../../helpers/encryption.helper.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";

const signinRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { SIGNIN } = AUTH_ENDPOINTS;

  const { createAuth, createClient, handleAuthError } = AuthClientHelper;
  const { encryptData } = EncryptionHelper;
  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;

  const { ACCESS_TOKEN } = AUTH_COOKIE_NAMES;
  const {
    BAD_REQUEST,
    MANY_REQUESTS_ERROR,
    OK,
    SERVICE_UNAVAILABLE,
    UNAUTHORIZED,
  } = HTTP_STATUS;

  fastify
    .withTypeProvider<FastifyZodOpenApiTypeProvider>()
    .post<SigninRequestBody>(
      `/${SIGNIN}`,
      {
        config: {
          rateLimit: AUTH_RATE_LIMIT,
        },
        schema: {
          body: signinRequestSchema,
          description: "Authenticate an existing user with email and password",
          summary: "Sign in user",
          tags: ["Authentication"],
          response: {
            [OK]: {
              content: { "application/json": { schema: signinSuccessSchema } },
            },
            [BAD_REQUEST]: {
              content: { "application/json": { schema: signinErrorSchema } },
            },
            [UNAUTHORIZED]: {
              content: { "application/json": { schema: signinErrorSchema } },
            },
            [MANY_REQUESTS_ERROR]: {
              content: {
                "application/json": { schema: signinRateLimitErrorSchema },
              },
            },
            [SERVICE_UNAVAILABLE]: {
              content: { "application/json": { schema: signinErrorSchema } },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (request, reply) => {
        const requestId = fastIdGen();

        try {
          const { email, password } = request.body;

          const client = createClient();

          try {
            const { emailPasswordHandlers } = createAuth(client);
            const { signin } = emailPasswordHandlers;

            const tokenData = await signin(email, password);

            // Encrypt the token before storing in cookie
            const encryptedToken = await encryptData(tokenData.auth_token);

            reply.setCookie(
              ACCESS_TOKEN,
              encryptedToken,
              ACCESS_TOKEN_COOKIE_CONFIG
            );

            const response: SigninCreateData = {
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
              email: request.body?.email,
              error: error.message,
              errorType: error instanceof UserError ? error.type : "unknown",
              requestId,
              stack: error instanceof Error ? error.stack : undefined,
            },
            "💥 Signin request failed with error"
          );

          const signinValidationError = {
            details: "Invalid credentials",
            errorMessageResponse: "Authentication failed",
            statusCode: UNAUTHORIZED,
          };

          const { details, errorMessageResponse, statusCode } = handleAuthError(
            {
              error,
              invalidDataError: {
                details: "Invalid sign in details",
                errorMessageResponse: "Signin validation failed",
                statusCode: BAD_REQUEST,
              },
              noIdentityFoundError: signinValidationError,
              userError: signinValidationError,
            }
          );

          const errorResponse: SigninCreateError = {
            details,
            error: errorMessageResponse,
            timestamp: getCurrentISOTimestamp(),
          };

          return reply.status(statusCode).send(errorResponse);
        }
      }
    );
};

export { signinRoute };
