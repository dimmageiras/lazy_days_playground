import type { GelAuthInstance } from "@server/plugins/gel-auth-fastify/types/auth-core.type";
import type {
  SigninRequestBody,
  SignupRequestBody,
  VerifyRequestBody,
} from "@server/plugins/gel-auth-fastify/types/request-body.type";

import { createGelAuth } from "./gel-auth-fastify.plugin.ts";

export type {
  GelAuthInstance,
  SigninRequestBody,
  SignupRequestBody,
  VerifyRequestBody,
};
export { createGelAuth };
