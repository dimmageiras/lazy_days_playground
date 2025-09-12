import type { FastifyInstance } from "fastify";

import { AUTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { IS_DEVELOPMENT } from "../../../../shared/constants/root-env.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import { zToJSONSchema } from "../../../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { AuthClientHelper } from "../../../helpers/auth-client.helper.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";
import type { VerifyRequestBody } from "../../../plugins/gel-auth-fastify/types/no-name.type.ts";
import {
  verifyRequestSchema,
  verifyResponseSchema,
} from "./verify-route.schema.ts";

const verifyRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { VERIFY } = AUTH_ENDPOINTS;
  const { BAD_REQUEST, OK } = HTTP_STATUS;

  const { createAuth, createClient } = AuthClientHelper;
  const { getCurrentISOTimestamp } = DateHelper;

  const verifyRouteSchema = {
    body: zToJSONSchema(verifyRequestSchema, {
      target: "openapi-3.0",
    }),
    description:
      "Complete email verification process and activate user account.",
    response: {
      200: zToJSONSchema(verifyResponseSchema),
      400: zToJSONSchema(verifyResponseSchema),
    },
    summary: "Verify email address",
    tags: ["Authentication"],
  } as const;

  fastify.post<VerifyRequestBody>(
    `/${VERIFY}`,
    { schema: verifyRouteSchema },
    async (request, reply) => {
      try {
        const { verificationToken, verifier } = request.body;

        if (!verificationToken || !verifier) {
          return reply.status(BAD_REQUEST).send({
            error: "Verification token and verifier are required",
            timestamp: DateHelper.getCurrentISOTimestamp(),
          });
        }

        const client = createClient();
        const { emailPassword } = createAuth(client);

        const { verifyRegistration } = emailPassword;

        try {
          const tokenData = await verifyRegistration(
            verificationToken,
            verifier
          );

          reply.setCookie("gel-session", tokenData.auth_token, {
            httpOnly: true,
            secure: !IS_DEVELOPMENT,
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
          });

          reply.clearCookie("gel-pkce-verifier", {
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
            error:
              error instanceof Error
                ? error.message
                : "Invalid verification token or verifier",
            hasVerifier: !!request.body?.verifier,
            requestId,
            stack: error instanceof Error ? error.stack : undefined,
            verificationToken: request.body?.verificationToken,
          },
          "💥 Verify request failed with error"
        );

        return reply.status(BAD_REQUEST).send({
          error: "Verification failed",
          details:
            error instanceof Error
              ? error.message
              : "Invalid verification token or verifier",
          timestamp: getCurrentISOTimestamp(),
        });
      }
    }
  );
};

export { verifyRoute };
