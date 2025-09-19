import type { FastifyInstance } from "fastify";
import { createClient } from "gel";

import { USER_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { GEL_DSN } from "../../../../shared/constants/root-env.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import {
  checkEmailRequestSchema,
  checkEmailResponseSchema,
} from "../../../../shared/schemas/user/check-email-route.schema.ts";
import { zToJSONSchema } from "../../../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";

interface CheckEmailRequestBody {
  Body: {
    email: string;
  };
}

const checkEmailRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { CHECK_EMAIL } = USER_ENDPOINTS;
  const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR } = HTTP_STATUS;

  const { getCurrentISOTimestamp } = DateHelper;

  const checkEmailRouteSchema = {
    body: zToJSONSchema(checkEmailRequestSchema, {
      target: "openapi-3.0",
    }),
    description: "Check if an email address exists in the user database.",
    response: {
      200: zToJSONSchema(checkEmailResponseSchema),
      400: zToJSONSchema(checkEmailResponseSchema),
      500: zToJSONSchema(checkEmailResponseSchema),
    },
    summary: "Check email existence",
    tags: ["User"],
  } as const;

  fastify.post<CheckEmailRequestBody>(
    `/${CHECK_EMAIL}`,
    { schema: checkEmailRouteSchema },
    async (request, reply) => {
      try {
        const { email } = request.body;

        if (!email) {
          return reply.status(BAD_REQUEST).send({
            email: email || "",
            error: "Email is required",
            exists: false,
            timestamp: getCurrentISOTimestamp(),
          });
        }

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

        return reply.status(OK).send({
          email,
          exists: emailExists,
          timestamp: getCurrentISOTimestamp(),
        });
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
          "💥 Check email request failed with error"
        );

        return reply.status(INTERNAL_SERVER_ERROR).send({
          details: error instanceof Error ? error.message : "Unknown error",
          email: request.body?.email || "",
          error: "Failed to check email existence",
          exists: false,
          timestamp: getCurrentISOTimestamp(),
        });
      }
    }
  );
};

export { checkEmailRoute };
