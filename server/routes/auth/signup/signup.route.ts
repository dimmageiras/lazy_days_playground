import type { FastifyInstance } from "fastify";

import type { SignupRequestBody } from "@server/plugins/gel-auth-fastify";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { AUTH_BASE_URL } from "../../../../shared/constants/base-urls.const.ts";
import { IS_DEVELOPMENT } from "../../../../shared/constants/root-env.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import { zToJSONSchema } from "../../../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";
import {
  signupRequestSchema,
  signupResponseSchema,
} from "./signup-route.schema.ts";

const signupRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { SIGNUP, VERIFY } = AUTH_ENDPOINTS;
  const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR } = HTTP_STATUS;

  const { createAuth, createClient, getBaseUrl } = AuthClientHelper;
  const { getCurrentISOTimestamp } = DateHelper;

  const signupRouteSchema = {
    body: zToJSONSchema(signupRequestSchema, {
      target: "openapi-3.0",
    }),
    description:
      "Create a new user account with email and password. May require email verification depending on configuration.",
    response: {
      200: zToJSONSchema(signupResponseSchema),
      400: zToJSONSchema(signupResponseSchema),
      500: zToJSONSchema(signupResponseSchema),
    },
    summary: "Register a new user",
    tags: ["Authentication"],
  } as const;

  fastify.post<SignupRequestBody>(
    `/${SIGNUP}`,
    { schema: signupRouteSchema },
    async (request, reply) => {
      try {
        const { confirmPassword, email, password } = request.body;

        if (
          !email ||
          !password ||
          !confirmPassword ||
          password !== confirmPassword
        ) {
          return reply.status(BAD_REQUEST).send({
            error: "Email, password and confirm password are required",
            timestamp: DateHelper.getCurrentISOTimestamp(),
          });
        }

        const client = createClient();
        const { emailPasswordHandlers } = createAuth(client);
        const baseUrl = getBaseUrl();

        const verifyUrl = `${baseUrl}/${AUTH_BASE_URL}/${VERIFY}`;

        const { signup } = emailPasswordHandlers;

        try {
          const result = await signup(email, password, verifyUrl);

          if (result.status === "complete") {
            reply.setCookie("gel-session", result.tokenData.auth_token, {
              httpOnly: true,
              secure: !IS_DEVELOPMENT,
              sameSite: "strict",
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: "/",
            });
          } else {
            reply.setCookie("gel-pkce-verifier", result.verifier, {
              httpOnly: true,
              secure: !IS_DEVELOPMENT,
              sameSite: "strict",
              maxAge: 60 * 15, // 15 minutes
              path: "/",
            });
          }

          return reply.status(OK).send({
            ...result,
            timestamp: DateHelper.getCurrentISOTimestamp(),
          });
        } finally {
          await client.close();
        }
      } catch (error) {
        const { fastIdGen } = IdUtilsHelper;
        const { log } = PinoLogHelper;

        const requestId = fastIdGen();

        log.error(
          {
            email: request.body?.email,
            error: error instanceof Error ? error.message : "Unknown error",
            requestId,
            stack: error instanceof Error ? error.stack : undefined,
          },
          "💥 Signup request failed with error"
        );

        return reply.status(INTERNAL_SERVER_ERROR).send({
          details: error instanceof Error ? error.message : "Unknown error",
          error: "Registration failed",
          timestamp: getCurrentISOTimestamp(),
        });
      }
    }
  );
};

export { signupRoute };
