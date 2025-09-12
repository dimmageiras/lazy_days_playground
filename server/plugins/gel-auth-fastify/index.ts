import { createGelAuth } from "./gel-auth-fastify.plugin.ts";
import type { GelAuthInstance } from "./types/auth-core.type";
import type {
  SigninRequestBody,
  SignupRequestBody,
  VerifyRequestBody,
} from "./types/request-body.type";

export type {
  GelAuthInstance,
  SigninRequestBody,
  SignupRequestBody,
  VerifyRequestBody,
};
export { createGelAuth };
