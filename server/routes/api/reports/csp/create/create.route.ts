import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { CspReport } from "@shared/types/generated/db/database.type";
import type {
  ReportsCspReportCreateData,
  ReportsCspReportCreateError,
} from "@shared/types/generated/server/api-reports.type";

import { API_REPORTS_ENDPOINTS } from "../../../../../../shared/constants/api.constant.ts";
import {
  cspReportErrorSchema,
  cspReportRateLimitErrorSchema,
  cspReportRequestSchema,
  cspReportSuccessSchema,
} from "../../../../../../shared/schemas/api-health/csp-report-route.schema.ts";
import { HTTP_STATUS } from "../../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../../constants/rate-limit.constant.ts";
import { AuthClientHelper } from "../../../../../helpers/auth-client.helper.ts";
import { RoutesHelper } from "../../../../../helpers/routes.helper.ts";
import { optionalAuthMiddleware } from "../../../../../middleware/optional-auth.middleware.ts";
import { INSERT_CSP_REPORT_QUERY } from "./constants/insert-csp-report-query.constant.ts";

const createRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { CREATE_CSP_REPORT } = API_REPORTS_ENDPOINTS;
  const { BAD_REQUEST, MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  const { getClient } = AuthClientHelper;
  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;

  // Add content type parser for CSP reports
  // Browsers send CSP reports with 'application/csp-report' content type
  fastify.addContentTypeParser(
    "application/csp-report",
    { parseAs: "string" },
    (request, body, done) => {
      try {
        const json = JSON.parse(body as string);

        done(null, json);
      } catch (rawError) {
        const error =
          rawError instanceof Error ? rawError : new Error(String(rawError));

        log.error(
          {
            bodyPreview:
              typeof body === "string" ? body.substring(0, 200) : undefined,
            contentType: request.headers["content-type"],
            error: error.message,
            requestId: request.id,
            stack: error.stack,
          },
          "💥 CSP report body parse failed with error"
        );

        done(error, undefined);
      }
    }
  );

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    `/${CREATE_CSP_REPORT}`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      preHandler: [optionalAuthMiddleware],
      schema: {
        body: cspReportRequestSchema,
        description:
          "Receives Content Security Policy (CSP) violation reports from the browser. " +
          "These reports are automatically sent when the browser detects a CSP policy violation, " +
          "helping identify potential security issues or misconfigurations in the CSP directives.",
        summary: "Report CSP violation",
        tags: ["API Monitoring"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: cspReportSuccessSchema },
            },
          },
          [BAD_REQUEST]: {
            content: { "application/json": { schema: cspReportErrorSchema } },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: cspReportRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: { "application/json": { schema: cspReportErrorSchema } },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, reply) => {
      const requestId = fastIdGen();

      try {
        // Extract CSP report data
        const cspReport = request.body["csp-report"];

        // Get Gel client
        const client = getClient(fastify);

        // Store CSP report in database
        await client.query(INSERT_CSP_REPORT_QUERY, {
          blocked_uri: cspReport["blocked-uri"],
          column_number: cspReport["column-number"],
          disposition: cspReport["disposition"],
          document_uri: cspReport["document-uri"],
          effective_directive: cspReport["effective-directive"],
          identity_id: request.user?.identity_id,
          ip_address: request.ip,
          line_number: cspReport["line-number"],
          original_policy: cspReport["original-policy"],
          referrer: cspReport["referrer"],
          source_file: cspReport["source-file"],
          status_code: cspReport["status-code"],
          user_agent: request.headers["user-agent"],
        } as Omit<CspReport, "created_at" | "id">);

        // Success response
        const response: ReportsCspReportCreateData = {
          success: true,
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
            blockedUri: request.body?.["csp-report"]?.["blocked-uri"],
            documentUri: request.body?.["csp-report"]?.["document-uri"],
            error: error.message,
            requestId,
            stack: error.stack,
          },
          "💥 CSP report processing failed with error"
        );

        // Error response
        const errorResponse: ReportsCspReportCreateError = {
          details: error.message,
          error: "Failed to process CSP report",
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { createRoute };
