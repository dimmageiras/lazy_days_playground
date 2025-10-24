import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      expiresAt: Date | null;
      identity_id: string | null;
    };
  }
}
