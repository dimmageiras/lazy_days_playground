import type { RateLimitPluginOptions } from "@fastify/rate-limit";
import type { FastifyRequest } from "fastify";
import crypto from "node:crypto";

import {
  IS_DEVELOPMENT,
  MODE,
  MODES,
} from "../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../shared/constants/timing.constant.ts";
import { ObjectUtilsHelper } from "../../shared/helpers/object-utils.helper.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";
import { HTTP_STATUS } from "./http-status.constant.ts";

const LOCALHOST_IPS = Object.freeze(["127.0.0.1", "::1"]);

const { DEVELOPMENT } = MODES;
const { MANY_REQUESTS_ERROR } = HTTP_STATUS;
const {
  MINUTES_FIFTEEN_IN_MS,
  MINUTES_FIVE_IN_MS,
  MINUTES_ONE_IN_MS,
  SECONDS_ONE_IN_MS,
} = TIMING;

const { log } = PinoLogHelper;

/**
 * Shared header configurations for rate limiting
 */
const RATE_LIMIT_HEADERS = Object.freeze({
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
});

/**
 * Shared properties for rate limiting configurations
 */
const SHARED_RATE_LIMIT_PROPS = Object.freeze({
  continueExceeding: true,
  enableDraftSpec: true,
  skipOnError: false,
});

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

/**
 * Creates a standardized error response builder for rate limiting
 */
const createErrorResponseBuilder = (message: string) => {
  return (_request: FastifyRequest, context: { ttl: number }) => {
    const retryAfterSeconds = Math.ceil(context.ttl / SECONDS_ONE_IN_MS);
    const retryTimeFormatted = formatRetryTime(retryAfterSeconds);

    return {
      error: "Too Many Requests",
      message: `${message} Please wait ${retryTimeFormatted} before trying again.`,
      retryAfter: retryAfterSeconds,
      statusCode: MANY_REQUESTS_ERROR,
    };
  };
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
 * Creates an IP-based key generator for rate limiting
 */
const createIpKeyGenerator = () => {
  return (request: FastifyRequest) => {
    const rawKey = request.ip;

    return crypto.createHash("sha256").update(rawKey).digest("hex");
  };
};

/**
 * Creates an email-based key generator for rate limiting
 */
const createEmailKeyGenerator = () => {
  return (request: FastifyRequest) => {
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
  };
};

/**
 * Global rate limit configuration
 * Applies to all routes unless overridden
 */
const GLOBAL_RATE_LIMIT: RateLimitPluginOptions = {
  ...RATE_LIMIT_HEADERS,
  ...SHARED_RATE_LIMIT_PROPS,
  allowList: (request) => {
    // Allow localhost IPs in development
    if (MODE === DEVELOPMENT && LOCALHOST_IPS.includes(request.ip)) {
      return true;
    }

    // Disable rate limiting for static React Router assets
    return request.url.startsWith("/assets/");
  },
  cache: 10000, // Maximum number of keys to store
  keyGenerator: createIpKeyGenerator(),
  max: IS_DEVELOPMENT ? 1000 : 100,
  onExceeded: createOnExceededHandler("global"),
  timeWindow: MINUTES_FIFTEEN_IN_MS,
};

/**
 * Strict rate limit for authentication routes (signin, signup, verify)
 * Protects against brute force attacks
 */
const AUTH_RATE_LIMIT: RateLimitPluginOptions = {
  ...RATE_LIMIT_HEADERS,
  ...SHARED_RATE_LIMIT_PROPS,
  errorResponseBuilder: createErrorResponseBuilder("Too many authentication attempts."),
  keyGenerator: createEmailKeyGenerator(),
  max: IS_DEVELOPMENT ? 100 : 5,
  onExceeded: createOnExceededHandler("auth"),
  timeWindow: MINUTES_FIFTEEN_IN_MS,
};

/**
 * Moderate rate limit for user operations (like check-email)
 * Prevents email enumeration attacks while allowing legitimate use
 */
const USER_RATE_LIMIT: RateLimitPluginOptions = {
  ...RATE_LIMIT_HEADERS,
  ...SHARED_RATE_LIMIT_PROPS,
  errorResponseBuilder: createErrorResponseBuilder("Too many requests."),
  keyGenerator: createEmailKeyGenerator(),
  max: IS_DEVELOPMENT ? 100 : 10,
  onExceeded: createOnExceededHandler("user"),
  timeWindow: MINUTES_FIVE_IN_MS,
};

/**
 * Relaxed rate limit for health check endpoints
 * Allows frequent monitoring without blocking
 */
const HEALTH_RATE_LIMIT: RateLimitPluginOptions = {
  ...RATE_LIMIT_HEADERS,
  ...SHARED_RATE_LIMIT_PROPS,
  errorResponseBuilder: createErrorResponseBuilder("Too many health check requests."),
  keyGenerator: createIpKeyGenerator(),
  max: IS_DEVELOPMENT ? 1000 : 60,
  onExceeded: createOnExceededHandler("health"),
  timeWindow: MINUTES_ONE_IN_MS,
};

export {
  AUTH_RATE_LIMIT,
  GLOBAL_RATE_LIMIT,
  HEALTH_RATE_LIMIT,
  USER_RATE_LIMIT,
};
