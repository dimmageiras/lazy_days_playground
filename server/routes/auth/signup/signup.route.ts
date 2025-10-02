import { UserError } from "@gel/auth-core";
import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { SignupRequestBody } from "@server/plugins/gel-auth-fastify/index";
import type {
  SignupCreateData,
  SignupCreateError,
} from "@shared/types/generated/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import { AUTH_BASE_URL } from "../../../../shared/constants/base-urls.const.ts";
import { TIMING } from "../../../../shared/constants/timing.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import { AUTH_COOKIE_CONFIG } from "../../../constants/cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { GelDbHelper } from "../../../helpers/gel-db.helper.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";
import {
  signupErrorSchema,
  signupRateLimitErrorSchema,
  signupRequestSchema,
  signupSuccessSchema,
} from "../../../schemas/auth/signup-route.schema.ts";

const signupRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;
  const { handleAuthError } = GelDbHelper;
  const { fastIdGen } = IdUtilsHelper;
  const { log } = PinoLogHelper;
  const { createAuth, createClient, getBaseUrl } = AuthClientHelper;

  const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  fastify
    .withTypeProvider<FastifyZodOpenApiTypeProvider>()
    .post<SignupRequestBody>(
      `/${AUTH_ENDPOINTS.SIGNUP}`,
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

          const client = createClient();

          try {
            const { emailPasswordHandlers } = createAuth(client);
            const baseUrl = getBaseUrl();

            const verifyUrl = `${baseUrl}/${AUTH_BASE_URL}/${AUTH_ENDPOINTS.VERIFY}`;

            const { signup } = emailPasswordHandlers;

            const result = await signup(email, password, verifyUrl);

            if (result.status === "complete") {
              reply.setCookie(
                "gel-session",
                result.tokenData.auth_token,
                AUTH_COOKIE_CONFIG
              );

              const response: SignupCreateData = {
                identity_id: result.tokenData.identity_id,
                status: result.status,
                timestamp: getCurrentISOTimestamp(),
              };

              return reply.status(OK).send(response);
            } else {
              reply.setCookie("gel-pkce-verifier", result.verifier, {
                ...AUTH_COOKIE_CONFIG,
                maxAge: TIMING.MINUTES_FIFTEEN_IN_S,
              });

              const response: SignupCreateData = {
                identity_id: null,
                status: result.status,
                timestamp: getCurrentISOTimestamp(),
                verifier: result.verifier,
              };

              return reply.status(OK).send(response);
            }
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
