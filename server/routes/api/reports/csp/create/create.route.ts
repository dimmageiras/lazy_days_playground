import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type {
  ReportsCspReportCreateData,
  ReportsCspReportCreateError,
} from "@shared/types/generated/api-reports.type";

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
          "💥 Failed to parse CSP report body"
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
      schema: {
        body: cspReportRequestSchema,
        description:
          "Receives Content Security Policy (CSP) violation reports from the browser. " +
          "These reports are automatically sent when the browser detects a CSP policy violation, " +
          "helping identify potential security issues or misconfigurations in the CSP directives.",
        summary: "Report CSP violation",
        tags: ["Health & Monitoring"],
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
        await client.query(
          `
          INSERT default::CspReport {
            blocked_uri := <str>$blocked_uri,
            document_uri := <str>$document_uri,
            effective_directive := <str>$effective_directive,
            original_policy := <str>$original_policy,
            referrer := <str>$referrer,
            status_code := <int16>$status_code,
            violated_directive := <optional str>$violated_directive,
            disposition := <optional str>$disposition,
            source_file := <optional str>$source_file,
            line_number := <optional int32>$line_number,
            column_number := <optional int32>$column_number,
            user_agent := <optional str>$user_agent,
            ip_address := <optional str>$ip_address
          }
          `,
          {
            blocked_uri: cspReport["blocked-uri"],
            column_number: cspReport["column-number"],
            disposition: cspReport["disposition"],
            document_uri: cspReport["document-uri"],
            effective_directive: cspReport["effective-directive"],
            ip_address: request.ip,
            line_number: cspReport["line-number"],
            original_policy: cspReport["original-policy"],
            referrer: cspReport["referrer"] || "",
            source_file: cspReport["source-file"],
            status_code: cspReport["status-code"] || 0,
            user_agent: request.headers["user-agent"],
            violated_directive: cspReport["violated-directive"],
          }
        );

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
          "💥 CSP report processing failed"
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
