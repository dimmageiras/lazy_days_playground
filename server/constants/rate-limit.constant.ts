import type { RateLimitPluginOptions } from "@fastify/rate-limit";
import type { FastifyRequest } from "fastify";
import crypto from "node:crypto";

import { IS_DEVELOPMENT } from "../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../shared/constants/timing.constant.ts";
import { ObjectUtilsHelper } from "../../shared/helpers/object-utils.helper.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";
import { HTTP_STATUS } from "./http-status.constant.ts";

const { MANY_REQUESTS_ERROR } = HTTP_STATUS;
const {
  MINUTES_FIFTEEN_IN_MS,
  MINUTES_FIVE_IN_MS,
  MINUTES_ONE_IN_MS,
  SECONDS_ONE_IN_MS,
} = TIMING;

const { log } = PinoLogHelper;

/**
 * Formats time remaining in a user-friendly way
 * Returns "X minutes" if >= 1 minute, otherwise "X seconds"
 */
const formatRetryTime = (seconds: number): string => {
  const secondsInOneMinute = MINUTES_ONE_IN_MS / SECONDS_ONE_IN_MS;

  if (seconds >= secondsInOneMinute) {
    const minutes = Math.ceil(seconds / secondsInOneMinute);

    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  return seconds === 1 ? "1 second" : `${seconds} seconds`;
};

const createOnExceededHandler = (bucket: string) => {
  return (request: FastifyRequest): void => {
    log.warn(
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
  allowList: (request) => {
    // Allow localhost IPs in development
    if (IS_DEVELOPMENT && ["127.0.0.1", "::1"].includes(request.ip)) {
      return true;
    }

    // Exclude static assets from rate limiting
    if (request.url.startsWith("/assets/")) {
      return true;
    }

    return false;
  },
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
  timeWindow: MINUTES_FIFTEEN_IN_MS,
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
    const retryAfterSeconds = Math.ceil(context.ttl / SECONDS_ONE_IN_MS);
    const retryTimeFormatted = formatRetryTime(retryAfterSeconds);

    return {
      error: "Too Many Requests",
      message: `Too many authentication attempts. Please wait ${retryTimeFormatted} before trying again.`,
      retryAfter: retryAfterSeconds,
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
  timeWindow: MINUTES_FIFTEEN_IN_MS,
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
    const retryAfterSeconds = Math.ceil(context.ttl / SECONDS_ONE_IN_MS);
    const retryTimeFormatted = formatRetryTime(retryAfterSeconds);

    return {
      error: "Too Many Requests",
      message: `Too many requests. Please wait ${retryTimeFormatted} before trying again.`,
      retryAfter: retryAfterSeconds,
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
  timeWindow: MINUTES_FIVE_IN_MS,
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
  errorResponseBuilder: (_request, context) => {
    const retryAfterSeconds = Math.ceil(context.ttl / SECONDS_ONE_IN_MS);

    return {
      error: "Too Many Requests",
      message: `Too many health check requests. Please wait ${formatRetryTime(
        retryAfterSeconds
      )} before trying again.`,
      retryAfter: retryAfterSeconds,
      statusCode: MANY_REQUESTS_ERROR,
    };
  },
  keyGenerator: (request: FastifyRequest) => {
    const rawKey = request.ip;

    return crypto.createHash("sha256").update(rawKey).digest("hex");
  },
  max: IS_DEVELOPMENT ? 1000 : 60,
  onExceeded: createOnExceededHandler("health"),
  skipOnError: false,
  timeWindow: MINUTES_ONE_IN_MS,
};

export {
  AUTH_RATE_LIMIT,
  GLOBAL_RATE_LIMIT,
  HEALTH_RATE_LIMIT,
  USER_RATE_LIMIT,
};
