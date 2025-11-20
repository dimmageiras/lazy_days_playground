import type { FastifyReply } from "fastify";

declare module "http" {
  interface ServerResponse {
    locals?: {
      cspNonce: FastifyReply["cspNonce"];
    };
  }
}
