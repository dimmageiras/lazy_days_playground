import type { FastifyReply } from "fastify";

declare global {
  namespace Express {
    interface Locals {
      cspNonce: FastifyReply["cspNonce"] | null;
    }
  }
}
