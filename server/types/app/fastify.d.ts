import type { Client } from "gel";

import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    gelClient: Client;
  }

  interface FastifyReply {
    cspNonce: {
      script: string;
      style: string;
    };
  }

  interface FastifyRequest {
    user?: {
      expiresAt: Date | null;
      identity_id: string | null;
    };
  }
}
