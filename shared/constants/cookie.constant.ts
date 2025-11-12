import { IS_DEVELOPMENT } from "./root-env.constant.ts";

/**
 * Base cookie configuration (shared settings)
 */
const BASE_COOKIE_CONFIG = Object.freeze({
  httpOnly: true,
  path: "/",
  sameSite: "strict" as const,
  secure: !IS_DEVELOPMENT,
  signed: true,
} as const);

export { BASE_COOKIE_CONFIG };
