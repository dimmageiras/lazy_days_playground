import type { FastifyReply } from "fastify";

type CSPNonceType = FastifyReply["cspNonce"];

interface CSPNonceContextValue {
  cspNonce: CSPNonceType;
}

export type { CSPNonceContextValue, CSPNonceType };
