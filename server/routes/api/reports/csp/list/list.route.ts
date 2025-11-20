import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { CspReport } from "@shared/types/generated/db/database.type";
import type {
  ReportsCspListListData,
  ReportsCspListListError,
} from "@shared/types/generated/server/api-reports.type";

import { API_REPORTS_ENDPOINTS } from "../../../../../../shared/constants/api.constant.ts";
import { CSP_URL } from "../../../../../../shared/constants/base-urls.constant.ts";
import {
  cspListErrorSchema,
  cspListRateLimitErrorSchema,
  cspListSuccessSchema,
} from "../../../../../../shared/schemas/api-health/csp-list-route.schema.ts";
import { HTTP_STATUS } from "../../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../../../helpers/routes.helper.ts";
import { LIST_CSP_REPORTS_QUERY } from "./constants/list-csp-reports-query.constant.ts";

const listRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { GET_CSP_REPORTS } = API_REPORTS_ENDPOINTS;
  const { MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } = HTTP_STATUS;

  const { fastIdGen, getClient, getCurrentISOTimestamp, log, toISOTimestamp } =
    RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${CSP_URL}/${GET_CSP_REPORTS}`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      schema: {
        description:
          "Retrieves a list of all Content Security Policy (CSP) violation reports " +
          "that have been logged by the browser. These reports help identify potential " +
          "security issues or misconfigurations in the CSP directives.",
        summary: "List CSP violations",
        tags: ["API Monitoring"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: cspListSuccessSchema },
            },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: cspListRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: {
              "application/json": { schema: cspListErrorSchema },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, response) => {
      const requestId = fastIdGen();

      try {
        // Get Gel client
        const client = getClient(fastify);

        // Fetch all CSP reports from database
        const reports = await client.query<CspReport>(LIST_CSP_REPORTS_QUERY);

        // Transform reports to match response type (convert Date to ISO string)
        const transformedReports = reports.map((report) => ({
          ...report,
          created_at: toISOTimestamp(report.created_at),
        }));

        // Success response
        const dbResponse: ReportsCspListListData = {
          count: transformedReports.length,
          data: transformedReports,
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
            requestId,
            stack: error.stack,
          },
          "💥 CSP report list retrieval failed with error"
        );

        // Error response
        const errorResponse: ReportsCspListListError = {
          details: error.message,
          error: "Failed to retrieve CSP reports",
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { listRoute };
