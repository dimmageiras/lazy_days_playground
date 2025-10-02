import type { RateLimitPluginOptions } from "@fastify/rate-limit";
import type { FastifyRequest } from "fastify";
import crypto from "node:crypto";

import { IS_DEVELOPMENT } from "../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../shared/constants/timing.constant.ts";
import { ObjectUtilsHelper } from "../../shared/helpers/object-utils.helper.ts";
import { HTTP_STATUS } from "./http-status.constant.ts";

const { MANY_REQUESTS_ERROR } = HTTP_STATUS;

const createOnExceededHandler = (bucket: string) => {
  return (request: FastifyRequest): void => {
    request.log.warn(
      {
        bucket,
        ip: request.ip,
        route: request.url,
      },
      `Rate limit exceeded for "${bucket}" bucket`
    );
  };
};

/**
 * Global rate limit configuration
 * Applies to all routes unless overridden
 */
const GLOBAL_RATE_LIMIT: RateLimitPluginOptions = {
  addHeaders: {
    "retry-after": true,
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  addHeadersOnExceeding: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  allowList: IS_DEVELOPMENT ? ["127.0.0.1", "::1"] : [],
  cache: 10000, // Maximum number of keys to store
  continueExceeding: true, // Continue to track requests after limit
  enableDraftSpec: true, // Add RateLimit-* headers
  keyGenerator: (request: FastifyRequest) => {
    const rawKey = request.ip;

    return crypto.createHash("sha256").update(rawKey).digest("hex");
  },
  max: IS_DEVELOPMENT ? 1000 : 100,
  onExceeded: createOnExceededHandler("global"),
  skipOnError: false, // Don't skip rate limiting on errors
  timeWindow: TIMING.MINUTES_FIFTEEN_IN_MS,
};

/**
 * Strict rate limit for authentication routes (signin, signup, verify)
 * Protects against brute force attacks
 */
const AUTH_RATE_LIMIT: RateLimitPluginOptions = {
  addHeaders: {
    "retry-after": true,
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  addHeadersOnExceeding: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  continueExceeding: true,
  enableDraftSpec: true,
  errorResponseBuilder: (_request, context) => {
    return {
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please try again in ${Math.ceil(
        context.ttl / TIMING.SECONDS_ONE_IN_MS
      )} seconds.`,
      retryAfter: Math.ceil(context.ttl / TIMING.SECONDS_ONE_IN_MS),
      statusCode: MANY_REQUESTS_ERROR,
    };
  },
  keyGenerator: (request: FastifyRequest) => {
    const { isPlainObject } = ObjectUtilsHelper;

    const body = request.body;
    const email =
      (isPlainObject(body) &&
        "email" in body &&
        typeof body.email === "string" &&
        body.email.toLowerCase()) ||
      "anonymous";

    const rawKey = `${request.ip}-${email}`;

    return crypto.createHash("sha256").update(rawKey).digest("hex");
  },
  max: IS_DEVELOPMENT ? 100 : 5,
  onExceeded: createOnExceededHandler("auth"),
  skipOnError: false,
  timeWindow: TIMING.MINUTES_FIFTEEN_IN_MS,
};

/**
 * Moderate rate limit for user operations (like check-email)
 * Prevents email enumeration attacks while allowing legitimate use
 */
const USER_RATE_LIMIT: RateLimitPluginOptions = {
  addHeaders: {
    "retry-after": true,
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  addHeadersOnExceeding: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  continueExceeding: true,
  enableDraftSpec: true,
  errorResponseBuilder: (_request, context) => {
    return {
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please try again in ${Math.ceil(
        context.ttl / TIMING.SECONDS_ONE_IN_MS
      )} seconds.`,
      retryAfter: Math.ceil(context.ttl / TIMING.SECONDS_ONE_IN_MS),
      statusCode: MANY_REQUESTS_ERROR,
    };
  },
  keyGenerator: (request: FastifyRequest) => {
    const { isPlainObject } = ObjectUtilsHelper;

    const body = request.body;
    const email =
      (isPlainObject(body) &&
        "email" in body &&
        typeof body.email === "string" &&
        body.email.toLowerCase()) ||
      "anonymous";

    const rawKey = `${request.ip}-${email}`;

    return crypto.createHash("sha256").update(rawKey).digest("hex");
  },
  max: IS_DEVELOPMENT ? 100 : 10,
  onExceeded: createOnExceededHandler("user"),
  skipOnError: false,
  timeWindow: TIMING.MINUTES_FIVE_IN_MS,
};

/**
 * Relaxed rate limit for health check endpoints
 * Allows frequent monitoring without blocking
 */
const HEALTH_RATE_LIMIT: RateLimitPluginOptions = {
  addHeaders: {
    "retry-after": true,
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  addHeadersOnExceeding: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  continueExceeding: true,
  enableDraftSpec: true,
  keyGenerator: (request: FastifyRequest) => {
    const rawKey = request.ip;

    return crypto.createHash("sha256").update(rawKey).digest("hex");
  },
  max: IS_DEVELOPMENT ? 1000 : 60,
  onExceeded: createOnExceededHandler("health"),
  skipOnError: false,
  timeWindow: TIMING.MINUTES_ONE_IN_MS,
};

export {
  AUTH_RATE_LIMIT,
  GLOBAL_RATE_LIMIT,
  HEALTH_RATE_LIMIT,
  USER_RATE_LIMIT,
};
