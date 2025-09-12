import type { FastifyInstance } from "fastify";

import type { SigninRequestBody } from "@server/plugins/gel-auth-fastify";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { IS_DEVELOPMENT } from "../../../../shared/constants/root-env.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import { zToJSONSchema } from "../../../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";
import {
  signinRequestSchema,
  signinResponseSchema,
} from "./signin-route.schema.ts";

const signinRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { SIGNIN } = AUTH_ENDPOINTS;
  const { BAD_REQUEST, OK, UNAUTHORIZED } = HTTP_STATUS;

  const { createAuth, createClient } = AuthClientHelper;
  const { getCurrentISOTimestamp } = DateHelper;

  const signinRouteSchema = {
    body: zToJSONSchema(signinRequestSchema, {
      target: "openapi-3.0",
    }),
    description: "Authenticate an existing user with email and password.",
    response: {
      200: zToJSONSchema(signinResponseSchema),
      401: zToJSONSchema(signinResponseSchema),
    },
    summary: "Sign in user",
    tags: ["Authentication"],
  } as const;

  fastify.post<SigninRequestBody>(
    `/${SIGNIN}`,
    { schema: signinRouteSchema },
    async (request, reply) => {
      try {
        const { email, password } = request.body;

        if (!email || !password) {
          return reply.status(BAD_REQUEST).send({
            error: "Email and password are required",
            timestamp: DateHelper.getCurrentISOTimestamp(),
          });
        }

        const client = createClient();
        const { emailPasswordHandlers } = createAuth(client);

        const { signin } = emailPasswordHandlers;

        try {
          const tokenData = await signin(email, password);

          reply.setCookie("gel-session", tokenData.auth_token, {
            httpOnly: true,
            secure: !IS_DEVELOPMENT,
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
          });

          return reply.status(OK).send({
            ...tokenData,
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
            error:
              error instanceof Error ? error.message : "Invalid credentials",
            requestId,
            stack: error instanceof Error ? error.stack : undefined,
          },
          "💥 Signin request failed with error"
        );

        return reply.status(UNAUTHORIZED).send({
          details:
            error instanceof Error ? error.message : "Invalid credentials",
          error: "Authentication failed",
          timestamp: getCurrentISOTimestamp(),
        });
      }
    }
  );
};

export { signinRoute };
