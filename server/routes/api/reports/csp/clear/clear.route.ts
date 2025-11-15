import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type {
  ReportsCspClearDeleteData,
  ReportsCspClearDeleteError,
} from "@shared/types/generated/server/api-reports.type";

import { API_REPORTS_ENDPOINTS } from "../../../../../../shared/constants/api.constant.ts";
import {
  cspClearErrorSchema,
  cspClearRateLimitErrorSchema,
  cspClearSuccessSchema,
} from "../../../../../../shared/schemas/api-health/csp-clear-route.schema.ts";
import { HTTP_STATUS } from "../../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../../../helpers/routes.helper.ts";
import { CLEAR_CSP_REPORTS_QUERY } from "./constants/clear-csp-reports-query.constant.ts";

const clearRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { CLEAR_CSP_REPORTS } = API_REPORTS_ENDPOINTS;
  const { MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } = HTTP_STATUS;

  const { fastIdGen, getClient, getCurrentISOTimestamp, log } = RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().delete(
    `/${CLEAR_CSP_REPORTS}`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      schema: {
        description:
          "Deletes all Content Security Policy (CSP) violation reports from the database. " +
          "This endpoint allows for bulk cleanup of all CSP reports at once. Use with caution " +
          "as this action cannot be undone.",
        summary: "Clear all CSP reports",
        tags: ["API Monitoring"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: cspClearSuccessSchema },
            },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: cspClearRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: {
              "application/json": { schema: cspClearErrorSchema },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, reply) => {
      const requestId = fastIdGen();

      try {
        // Get Gel client
        const client = getClient(fastify);

        // Delete all CSP reports from database
        const result = await client.query(CLEAR_CSP_REPORTS_QUERY);

        // Count the number of deleted reports
        const deletedCount = result?.length ?? 0;

        // Success response
        const response: ReportsCspClearDeleteData = {
          success: true,
          count: deletedCount,
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(OK).send(response);
      } catch (rawError) {
        // Normalize error
        const error =
          rawError instanceof Error ? rawError : new Error(`${rawError}`);

        // Log error with context
        log.error(
          {
            error: error.message,
            requestId,
            stack: error.stack,
          },
          "💥 CSP reports clear failed with error"
        );

        // Error response
        const errorResponse: ReportsCspClearDeleteError = {
          error: "Failed to clear CSP reports",
          details: error.message,
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { clearRoute };
