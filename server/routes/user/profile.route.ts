import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Logger } from "pino";

import type { EditableUserProfile } from "@shared/types/auth.type";

import { USER_BASE_URL } from "../../../shared/constants/base-urls.const.ts";
import { AuthHelper } from "../../helpers/auth.helper.ts";

/**
 * User profile management routes - requires authentication
 *
 * @param {FastifyInstance} fastify - Fastify instance to register routes on
 * @param {Logger} log - Pino logger instance for structured logging
 * @returns {Promise<void>} Promise that resolves when routes are registered
 */
const profileRoute = async (
  fastify: FastifyInstance,
  log: Logger
): Promise<void> => {
  const { verifyJWT } = AuthHelper;

  /**
   * Get current user's profile information
   *
   * @route GET /user/profile
   * @requires Authentication (JWT token)
   * @returns User profile data with success flag
   *
   * @example Success: { "success": true, "data": { "id": "123", "name": "John", ... } }
   *
   * @note This route is registered with prefix ${USER_BASE_URL} in server/start.ts
   */
  fastify.get(
    "/profile",
    { preHandler: fastify.auth([verifyJWT]) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = request.id;
      const startTime = Date.now();
      const { userId, email, role } = request.user;

      try {
        // TODO: Later we'll fetch full user data from Gel database
        // For now, return mock data with all user fields
        const userProfile = {
          address: "123 Spa Street, Relaxation City, RC 12345",
          createdAt: new Date().toISOString(),
          email,
          id: userId,
          name: "John Doe",
          phone: "+1 (555) 123-4567",
          role,
          updatedAt: new Date().toISOString(),
        };

        const duration = Date.now() - startTime;

        log.info({
          msg: "User profile retrieved successfully",
          requestId,
          userId,
          userEmail: email,
          duration,
          endpoint: `${USER_BASE_URL}/profile`,
        });

        return reply.code(200).send({
          data: userProfile,
          success: true,
        });
      } catch (error) {
        const duration = Date.now() - startTime;

        log.error({
          msg: "Failed to retrieve user profile",
          requestId,
          userId,
          userEmail: email,
          duration,
          endpoint: `${USER_BASE_URL}/profile`,
          error: error instanceof Error ? error.message : error,
        });

        return reply.code(500).send({
          success: false,
          error: "Failed to retrieve profile",
        });
      }
    }
  );

  /**
   * Update current user's profile information
   *
   * @route PUT /user/profile
   * @requires Authentication (JWT token)
   * @param {EditableUserProfile} Body - Profile data to update
   * @returns Updated user profile data with success message
   *
   * @example Success: { "success": true, "data": {...}, "message": "Profile updated successfully" }
   *
   * @note This route is registered with prefix ${USER_BASE_URL} in server/start.ts
   */
  fastify.put(
    "/profile",
    { preHandler: fastify.auth([verifyJWT]) },
    async (
      request: FastifyRequest<{ Body: EditableUserProfile }>,
      reply: FastifyReply
    ) => {
      const requestId = request.id;
      const startTime = Date.now();
      const { userId, email, role } = request.user;
      const { address, name, phone } = request.body;

      try {
        // TODO: Validate input data with Zod schema
        // TODO: Update user in Gel database

        // For now, return the updated data (mock)
        const updatedProfile = {
          address,
          createdAt: new Date().toISOString(),
          email,
          id: userId,
          name,
          phone,
          role,
          updatedAt: new Date().toISOString(),
        };

        const duration = Date.now() - startTime;

        log.info({
          msg: "User profile updated successfully",
          requestId,
          userId,
          userEmail: email,
          duration,
          endpoint: `${USER_BASE_URL}/profile`,
          updatedFields: Object.keys(request.body),
        });

        return reply.code(200).send({
          data: updatedProfile,
          message: "Profile updated successfully",
          success: true,
        });
      } catch (error) {
        const duration = Date.now() - startTime;

        log.error({
          msg: "Failed to update user profile",
          requestId,
          userId,
          userEmail: email,
          duration,
          endpoint: `${USER_BASE_URL}/profile`,
          error: error instanceof Error ? error.message : error,
        });

        return reply.code(500).send({
          success: false,
          error: "Failed to update profile",
        });
      }
    }
  );
};

export { profileRoute };
