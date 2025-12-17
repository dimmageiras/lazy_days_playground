import { describe, it } from "vitest";

import type { MODES } from "@shared/constants/root-env.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

import { EnvVarHelper } from "./env-var.helper";

describe("EnvVarHelper", () => {
  const { validateEnv } = EnvVarHelper;
  const { getObjectKeys } = ObjectUtilsHelper;

  const mockEnvValid = {
    AUTH_TAG_LENGTH: "16",
    COOKIE_SECRET: "12345678901234567890123456789012",
    GEL_AUTH_BASE_URL: "https://auth.example.com",
    GEL_DSN: "postgres://user:password@localhost:5432/database",
    IV_LENGTH: "16",
    KEY_LENGTH: "32",
    LOG_LEVEL: "info",
    SALT_LENGTH: "16",
    TOKEN_ENCRYPTION_METHOD: "aes-256-gcm",
    VITE_APP_ALL_DEV_TOOLS: "true",
    VITE_APP_HOST: "localhost",
    VITE_APP_IS_DEVELOPMENT: "true",
    VITE_APP_PORT: "3000",
    VITE_APP_RQDT: "true",
    VITE_APP_RRDT: "true",
    VITE_APP_TYPE_GENERATOR_MODE: "type_generator",
  } as const;

  const mockEnvInvalid = {
    AUTH_TAG_LENGTH: "-1",
    COOKIE_SECRET: "short",
    GEL_AUTH_BASE_URL: "",
    GEL_DSN: "",
    IV_LENGTH: "-1",
    KEY_LENGTH: "-1",
    LOG_LEVEL: "invalid",
    SALT_LENGTH: "-1",
    TOKEN_ENCRYPTION_METHOD: "",
    VITE_APP_ALL_DEV_TOOLS: "invalid" as `${boolean}`,
    VITE_APP_HOST: "",
    VITE_APP_IS_DEVELOPMENT: "invalid" as `${boolean}`,
    VITE_APP_PORT: "-1",
    VITE_APP_RQDT: "invalid" as `${boolean}`,
    VITE_APP_RRDT: "invalid" as `${boolean}`,
    VITE_APP_TYPE_GENERATOR_MODE: "invalid" as typeof MODES.TYPE_GENERATOR,
  } as const;

  const testInvalidEnvVar = (key: string) => {
    it(`should throw an error if ${key} is invalid`, ({ expect }) => {
      const testEnv = {
        ...mockEnvValid,
        [key]: Reflect.get(mockEnvInvalid, key),
      };

      expect(() => validateEnv(testEnv)).toThrow();
    });
  };

  describe("validateEnv", (it) => {
    it("should validate environment variables", ({ expect }) => {
      expect(() => validateEnv(mockEnvValid)).not.toThrow();
    });

    getObjectKeys(mockEnvInvalid).forEach(testInvalidEnvVar);
  });
});
