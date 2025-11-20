import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type {
  ReportsCspDeleteDeleteData,
  ReportsCspDeleteDeleteError,
} from "@shared/types/generated/server/api-reports.type";

import { API_REPORTS_ENDPOINTS } from "../../../../../../shared/constants/api.constant.ts";
import { CSP_URL } from "../../../../../../shared/constants/base-urls.constant.ts";
import {
  cspDeleteErrorSchema,
  cspDeleteRateLimitErrorSchema,
  cspDeleteRequestSchema,
  cspDeleteSuccessSchema,
} from "../../../../../../shared/schemas/api-health/csp-delete-route.schema.ts";
import { HTTP_STATUS } from "../../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../../../helpers/routes.helper.ts";
import { DELETE_CSP_REPORT_QUERY } from "./constants/delete-csp-report-query.constant.ts";

const deleteRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { DELETE_CSP_REPORT } = API_REPORTS_ENDPOINTS;
  const {
    BAD_REQUEST,
    MANY_REQUESTS_ERROR,
    NOT_FOUND,
    OK,
    SERVICE_UNAVAILABLE,
  } = HTTP_STATUS;

  const { fastIdGen, getClient, getCurrentISOTimestamp, log } = RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().delete(
    `/${CSP_URL}/${DELETE_CSP_REPORT}/:id`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      schema: {
        description:
          "Deletes a specific Content Security Policy (CSP) violation report by its unique identifier. " +
          "This endpoint allows for cleanup of individual CSP reports from the database.",
        summary: "Delete CSP report",
        tags: ["API Monitoring"],
        params: cspDeleteRequestSchema,
        response: {
          [OK]: {
            content: {
              "application/json": { schema: cspDeleteSuccessSchema },
            },
          },
          [BAD_REQUEST]: {
            content: { "application/json": { schema: cspDeleteErrorSchema } },
          },
          [NOT_FOUND]: {
            content: { "application/json": { schema: cspDeleteErrorSchema } },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: cspDeleteRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: { "application/json": { schema: cspDeleteErrorSchema } },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, response) => {
      const requestId = fastIdGen();

      try {
        // Extract report ID from request params
        const { id } = request.params;

        // Get Gel client
        const client = getClient(fastify);

        // Delete the CSP report from database
        const result = await client.query(DELETE_CSP_REPORT_QUERY, { id });

        // Check if report was found and deleted
        if (!result || result.length === 0) {
          log.warn(
            {
              id,
              requestId,
            },
            "⚠️ CSP report not found for deletion"
          );

          const notFoundError: ReportsCspDeleteDeleteError = {
            error: "CSP report not found",
            details: `No report found with ID: ${id}`,
            timestamp: getCurrentISOTimestamp(),
          };

          return response.status(NOT_FOUND).send(notFoundError);
        }

        // Success response
        const dbResponse: ReportsCspDeleteDeleteData = {
          success: true,
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(OK).send(dbResponse);
      } catch (rawError) {
        // Normalize error
        const error =
          rawError instanceof Error ? rawError : new Error(`${rawError}`);

        // Log error with context
        log.error(
          {
            error: error.message,
            id: request.params?.id,
            requestId,
            stack: error.stack,
          },
          "💥 CSP report deletion failed with error"
        );

        // Error response
        const errorResponse: ReportsCspDeleteDeleteError = {
          error: "Failed to delete CSP report",
          details: error.message,
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { deleteRoute };
