import type { FastifyReply, FastifyRequest } from "fastify";

import { USER_ROLES } from "../../shared/constants/user.constant.ts";
import {
  AUTH_ERROR_MESSAGES,
  HTTP_STATUS,
} from "../constants/http-status.constant.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const { log } = PinoLogHelper;

/**
 * Middleware function to verify JWT token from cookie
 * Throws error if token is invalid or missing
 * After successful verification, request.user will contain JWTPayload
 * @param request - Fastify request object
 * @param _reply - Fastify reply object (unused)
 * @throws {Object} HTTP 401 error if authentication fails
 */
const verifyJWT = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const requestId = request.id;

  try {
    await request.jwtVerify();

    log.info({
      msg: "JWT verification successful",
      requestId,
      userEmail: request.user.email,
      userId: request.user.userId,
      userRole: request.user.role,
    });
  } catch (error) {
    log.warn({
      error: error instanceof Error ? error.message : error,
      msg: "JWT verification failed - authentication required",
      requestId,
    });

    throw {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: AUTH_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
    };
  }
};

/**
 * Middleware function to verify user has admin role
 * Must be used after verifyJWT middleware
 * @param request - Fastify request object (must contain user from JWT verification)
 * @param _reply - Fastify reply object (unused)
 * @throws {Object} HTTP 500 error if JWT verification was not called first
 * @throws {Object} HTTP 403 error if user is not admin
 */
const verifyAdmin = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const requestId = request.id;

  if (!request.user) {
    log.error({
      msg: AUTH_ERROR_MESSAGES.MISSING_JWT_VERIFICATION,
      requestId,
    });

    throw {
      message: AUTH_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  if (request.user.role !== USER_ROLES.ADMIN) {
    log.warn({
      msg: "Access denied - admin role required",
      requestId,
      userRole: request.user.role,
      userId: request.user.userId,
    });

    throw {
      message: AUTH_ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED,
      statusCode: HTTP_STATUS.FORBIDDEN,
    };
  }

  log.info({
    msg: "Admin verification successful",
    requestId,
    userId: request.user.userId,
  });
};

export const AuthHelper = {
  verifyAdmin,
  verifyJWT,
};
