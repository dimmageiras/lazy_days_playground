import type { FastifyInstance } from "fastify";

interface BootstrapConfig {
  app: FastifyInstance;
  port: number;
  token: string;
}

export type { BootstrapConfig };
