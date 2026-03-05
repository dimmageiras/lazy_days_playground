import type { FastifyReply } from "fastify";

type CSPNonceType = FastifyReply["cspNonce"];

interface ApiSecurityContextValue {
  cspNonce: CSPNonceType;
  csrfToken: string;
}

export type { ApiSecurityContextValue, CSPNonceType };
