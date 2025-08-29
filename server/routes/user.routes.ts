import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { EditableUserProfile } from "../../shared/types/auth.type.ts";
import { AuthHelper } from "../helpers/auth.helper.ts";

const { verifyJWT } = AuthHelper;

/**
 * User profile routes
 * All routes in this plugin require authentication
 * @param fastify - Fastify instance
 */
const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  /**
   * GET /api/user/profile
   * Retrieves the current user's profile information
   * @requires Authentication (JWT token in cookie)
   * @returns {Object} User profile data
   */
  fastify.get(
    "/profile",
    { preHandler: fastify.auth([verifyJWT]) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, email, role } = request.user;

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

      return reply.code(200).send({
        data: userProfile,
        success: true,
      });
    }
  );

  /**
   * PUT /api/user/profile
   * Updates the current user's profile information
   * @requires Authentication (JWT token in cookie)
   * @param {EditableUserProfile} request.body - Updated profile data
   * @returns {Object} Updated user profile data
   */
  fastify.put(
    "/profile",
    { preHandler: fastify.auth([verifyJWT]) },
    async (
      request: FastifyRequest<{ Body: EditableUserProfile }>,
      reply: FastifyReply
    ) => {
      const { userId } = request.user;
      const { address, email, name, phone } = request.body;

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
        role: request.user.role,
        updatedAt: new Date().toISOString(),
      };

      return reply.code(200).send({
        data: updatedProfile,
        message: "Profile updated successfully",
        success: true,
      });
    }
  );
};

export { userRoutes };
