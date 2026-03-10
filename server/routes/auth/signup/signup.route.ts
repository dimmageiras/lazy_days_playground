import type { SignupResponse } from "@gel/auth-core";
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
} from "@shared/types/generated/server/auth.type";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/auth.constant.ts";
import { AUTH_BASE_URL } from "../../../../shared/constants/base-urls.constant.ts";
import { TIMING } from "../../../../shared/constants/timing.constant.ts";
import { TypeHelper } from "../../../../shared/helpers/type.helper.ts";
import {
  signupErrorSchema,
  signupRateLimitErrorSchema,
  signupRequestSchema,
  signupSuccessSchema,
} from "../../../../shared/schemas/auth/signup-route.schema.ts";
import {
  AUTH_COOKIE_NAMES,
  GEL_PKCE_VERIFIER_COOKIE_CONFIG,
} from "../../../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";
import { UPDATE_OTP_QUERY } from "./constants/update-otp-query.constant.ts";

const { PKCE_VERIFIER } = AUTH_COOKIE_NAMES;
const { SIGNUP, VERIFY } = AUTH_ENDPOINTS;
const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
  HTTP_STATUS;
const { MINUTES_TEN_IN_S } = TIMING;

const {
  createAuth,
  fastIdGen,
  getBaseUrl,
  getClient,
  getCurrentISOTimestamp,
  getFutureUTCDate,
  handleAuthError,
  log,
  sixDigitCodeGenOnServer,
} = RoutesHelper;
const { castAsType } = TypeHelper;

const signupRoute = async (fastify: FastifyInstance): Promise<void> => {
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
      async (request, response) => {
        const requestId = fastIdGen();
        const { code: _code, hash } = await sixDigitCodeGenOnServer();

        try {
          const { email, password } = request.body;

          const client = getClient(fastify);
          const { emailPasswordHandlers } = createAuth(client);
          const baseUrl = getBaseUrl();

          const verifyUrl = `${baseUrl}/${AUTH_BASE_URL}/${VERIFY}`;

          const { signup } = emailPasswordHandlers;

          const result = castAsType<
            Extract<SignupResponse, { status: "verificationRequired" }>
          >(await signup(email, password, verifyUrl));

          const identity_id = result.identity_id;
          const expiresAt = getFutureUTCDate(MINUTES_TEN_IN_S);

          await client.execute(UPDATE_OTP_QUERY, {
            expiresAt,
            hash,
            identity_id,
          });

          response.setCookie(
            PKCE_VERIFIER,
            result.verifier,
            GEL_PKCE_VERIFIER_COOKIE_CONFIG,
          );

          const dbResponse: SignupCreateData = {
            status: result.status,
            timestamp: getCurrentISOTimestamp(),
          };

          return response.status(OK).send(dbResponse);
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
            "💥 Signup request failed with error",
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
              invalidReferenceError: signupValidationError,
              queryError: signupValidationError,
              userAlreadyRegisteredError: {
                details: "Email already registered",
                errorMessageResponse: "Signup failed",
                statusCode: BAD_REQUEST,
              },
              userError: signupValidationError,
            },
          );

          const errorResponse: SignupCreateError = {
            details,
            error: errorMessageResponse,
            timestamp: getCurrentISOTimestamp(),
          };

          return response.status(statusCode).send(errorResponse);
        }
      },
    );
};

export { signupRoute };
