/**
 * TypeScript module augmentation for Fastify
 * Extends Fastify types to include our custom user authentication
 */

import type { JWTPayload } from "../../shared/types/auth.type.ts";

declare module "fastify" {
  interface FastifyRequest {
    /**
     * User data populated by JWT verification
     * Available after successful authentication middleware
     */
    user: JWTPayload;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    /**
     * JWT payload structure for our application
     */
    payload: JWTPayload;
    /**
     * JWT user data (same as payload for our use case)
     */
    user: JWTPayload;
  }
}
