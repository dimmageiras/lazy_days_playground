import type { FastifyInstance } from "fastify";

interface BootstrapConfig {
  readonly app: FastifyInstance;
  readonly port: number;
  readonly token: string;
}

export type { BootstrapConfig };
