import type { CipherGCMTypes } from "crypto";
import type { TlsSecurity } from "gel/dist/conUtils";
import type { LevelWithSilentOrString } from "pino";

type ServerSecurity = "insecure_dev_mode" | "strict";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AUTH_TAG_LENGTH: `${number}`;
      COOKIE_SECRET: string;
      GEL_BRANCH: string;
      GEL_CLIENT_TLS_SECURITY: TlsSecurity;
      GEL_HOST: string;
      GEL_PASSWORD: string;
      GEL_PORT: `${number}`;
      GEL_SERVER_SECURITY: ServerSecurity;
      IV_LENGTH: `${number}`;
      KEY_LENGTH: `${number}`;
      LOG_LEVEL: LevelWithSilentOrString;
      RESEND_API_KEY: string;
      RESEND_FROM_EMAIL: string;
      SALT_LENGTH: `${number}`;
      TOKEN_ENCRYPTION_METHOD: CipherGCMTypes;
    }
  }
}
