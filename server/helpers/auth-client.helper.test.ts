import type { FastifyInstance } from "fastify";
import type { Client } from "gel";
import { beforeEach, describe, vi } from "vitest";

import * as RootEnvModule from "@shared/constants/root-env.constant";
import { TypeHelper } from "@shared/helpers/type.helper";

import { AuthClientHelper } from "./auth-client.helper";
import { GelDbHelper } from "./gel-db.helper";

const { createAuth, getBaseUrl, getClient, handleAuthError } = AuthClientHelper;
const { castAsType } = TypeHelper;

// Mock GelDbHelper to avoid circular dependencies
vi.mock("./gel-db.helper", () => ({
  GelDbHelper: {
    handleAuthError: vi.fn(),
  },
}));

// Mock the gel module to avoid initialization errors while preserving exports
vi.mock("gel", async (importOriginal) => {
  const { castAsType } = TypeHelper;

  const actual = await importOriginal();

  return {
    ...castAsType<Record<PropertyKey, unknown>>(actual),
    Client: vi.fn(),
  };
});

// Mock @gel/auth-core to prevent Auth.create from failing while preserving exports
vi.mock("@gel/auth-core", async (importOriginal) => {
  const { castAsType } = TypeHelper;

  const actual = await importOriginal();

  return {
    ...castAsType<Record<PropertyKey, unknown>>(actual),
    Auth: {
      create: vi.fn(() => ({
        emailPasswordHandlers: vi.fn(),
        otpHandlers: vi.fn(),
      })),
    },
  };
});

// Test data constants
const TEST_DATA = {
  CLIENT_CONFIG: {
    _getNormalizedConnectConfig: vi.fn(() => ({})),
  },
  HOST: "localhost",
  PORT: "3000",
  BASE_URL_DEV: "http://localhost:3000",
  BASE_URL_PROD: "https://example.com:8080",
} as const;

// Factory function to create a mock client
const createMockClient = () =>
  castAsType<Client>({
    ...TEST_DATA.CLIENT_CONFIG,
  });

// Factory function to create a mock Fastify instance
const createMockFastify = () =>
  castAsType<FastifyInstance>({
    gelClient: createMockClient(),
  });

describe("AuthClientHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAuth", (it) => {
    it("should create an auth client", ({ expect }) => {
      const mockClient = createMockClient();
      const result = createAuth(mockClient);

      expect(result).toBeDefined();
    });
  });

  describe("getBaseUrl", (it) => {
    it("should return http URL in development mode", ({ expect }) => {
      vi.spyOn(RootEnvModule, "IS_DEVELOPMENT", "get").mockReturnValue(true);
      vi.spyOn(RootEnvModule, "HOST", "get").mockReturnValue(TEST_DATA.HOST);
      vi.spyOn(RootEnvModule, "PORT", "get").mockReturnValue(TEST_DATA.PORT);

      const result = getBaseUrl();

      expect(result).toBe(TEST_DATA.BASE_URL_DEV);
    });

    it("should return https URL in production mode", ({ expect }) => {
      vi.spyOn(RootEnvModule, "IS_DEVELOPMENT", "get").mockReturnValue(false);
      vi.spyOn(RootEnvModule, "HOST", "get").mockReturnValue("example.com");
      vi.spyOn(RootEnvModule, "PORT", "get").mockReturnValue("8080");

      const result = getBaseUrl();

      expect(result).toBe(TEST_DATA.BASE_URL_PROD);
    });
  });

  describe("getClient", (it) => {
    it("should retrieve the gel client from fastify instance", ({ expect }) => {
      const mockFastify = createMockFastify();
      const result = getClient(mockFastify);

      expect(result).toBe(mockFastify.gelClient);
    });

    it("should return the same client instance", ({ expect }) => {
      const mockClient = createMockClient();
      const mockFastify = castAsType<FastifyInstance>({
        gelClient: mockClient,
      });

      const result = getClient(mockFastify);

      expect(result).toBe(mockClient);
    });
  });

  describe("handleAuthError", (it) => {
    it("should be defined", ({ expect }) => {
      expect(handleAuthError).toBeDefined();
      expect(GelDbHelper.handleAuthError).toBeDefined();
    });

    it("should be a reference to GelDbHelper.handleAuthError", ({ expect }) => {
      expect(handleAuthError).toBe(GelDbHelper.handleAuthError);
    });
  });
});
