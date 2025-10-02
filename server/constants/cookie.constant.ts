import { IS_DEVELOPMENT } from "../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../shared/constants/timing.constant.ts";

const { DAYS_SEVEN_IN_S } = TIMING;

const AUTH_COOKIE_CONFIG = {
  httpOnly: true,
  maxAge: DAYS_SEVEN_IN_S,
  path: "/",
  sameSite: "strict" as const,
  secure: !IS_DEVELOPMENT,
};

export { AUTH_COOKIE_CONFIG };
