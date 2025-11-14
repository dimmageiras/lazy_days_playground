import { UserError } from "@gel/auth-core";
import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { SignupRequestBody } from "@server/plugins/gel-auth-fastify";
import type {
  SignupCreateData,
  SignupCreateError,
} from "@shared/types/generated/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import { AUTH_BASE_URL } from "../../../../shared/constants/base-urls.constant.ts";
import {
  signupErrorSchema,
  signupRateLimitErrorSchema,
  signupRequestSchema,
  signupSuccessSchema,
} from "../../../../shared/schemas/auth/signup-route.schema.ts";
import {
  ACCESS_TOKEN_COOKIE_CONFIG,
  AUTH_COOKIE_NAMES,
  GEL_PKCE_VERIFIER_COOKIE_CONFIG,
} from "../../../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";

const signupRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { ACCESS_TOKEN, PKCE_VERIFIER } = AUTH_COOKIE_NAMES;
  const { SIGNUP, VERIFY } = AUTH_ENDPOINTS;
  const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  const {
    createAuth,
    encryptData,
    fastIdGen,
    getBaseUrl,
    getClient,
    getCurrentISOTimestamp,
    handleAuthError,
    log,
  } = RoutesHelper;

  fastify
    .withTypeProvider<FastifyZodOpenApiTypeProvider>()
    .post<SignupRequestBody>(
      `/${SIGNUP}`,
      {
        config: {
          rateLimit: AUTH_RATE_LIMIT,
        },
        schema: {
          body: signupRequestSchema,
          description:
            "Create a new user account with email and password. May require email verification depending on configuration",
          summary: "Register a new user",
          tags: ["Authentication"],
          response: {
            [OK]: {
              content: { "application/json": { schema: signupSuccessSchema } },
            },
            [BAD_REQUEST]: {
              content: { "application/json": { schema: signupErrorSchema } },
            },
            [MANY_REQUESTS_ERROR]: {
              content: {
                "application/json": { schema: signupRateLimitErrorSchema },
              },
            },
            [SERVICE_UNAVAILABLE]: {
              content: { "application/json": { schema: signupErrorSchema } },
            },
          },
        } satisfies FastifyZodOpenApiSchema,
      },
      async (request, reply) => {
        const requestId = fastIdGen();

        try {
          const { email, password } = request.body;

          const client = getClient(fastify);
          const { emailPasswordHandlers } = createAuth(client);
          const baseUrl = getBaseUrl();

          const verifyUrl = `${baseUrl}/${AUTH_BASE_URL}/${VERIFY}`;

          const { signup } = emailPasswordHandlers;

          const result = await signup(email, password, verifyUrl);

          if (result.status === "complete") {
            // Encrypt the token before storing in cookie
            const encryptedToken = await encryptData(
              result.tokenData.auth_token
            );

            reply.setCookie(
              ACCESS_TOKEN,
              encryptedToken,
              ACCESS_TOKEN_COOKIE_CONFIG
            );

            const response: SignupCreateData = {
              identity_id: result.tokenData.identity_id,
              status: result.status,
              timestamp: getCurrentISOTimestamp(),
            };

            return reply.status(OK).send(response);
          } else {
            reply.setCookie(
              PKCE_VERIFIER,
              result.verifier,
              GEL_PKCE_VERIFIER_COOKIE_CONFIG
            );

            const response: SignupCreateData = {
              identity_id: null,
              status: result.status,
              timestamp: getCurrentISOTimestamp(),
              verifier: result.verifier,
            };

            return reply.status(OK).send(response);
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
            "💥 Signup request failed with error"
          );

          const signupValidationError = {
            details: "Invalid signup details",
            errorMessageResponse: "Signup validation failed",
            statusCode: BAD_REQUEST,
          };

          const { details, errorMessageResponse, statusCode } = handleAuthError(
            {
              error,
              invalidDataError: signupValidationError,
              userAlreadyRegisteredError: {
                details: "Email already registered",
                errorMessageResponse: "Signup failed",
                statusCode: BAD_REQUEST,
              },
              userError: signupValidationError,
            }
          );

          const errorResponse: SignupCreateError = {
            details,
            error: errorMessageResponse,
            timestamp: getCurrentISOTimestamp(),
          };

          return reply.status(statusCode).send(errorResponse);
        }
      }
    );
};

export { signupRoute };
