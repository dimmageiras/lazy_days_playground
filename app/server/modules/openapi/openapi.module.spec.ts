import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { API_DOCS_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_METHODS, HTTP_STATUS } from "@shared/constants/http.constant";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { AppEnv } from "@shared/types/app-env.type";
import { zObject, zString } from "@shared/wrappers/zod.wrapper";

import { OPENAPI_OPTIONS } from "./constants/openapi.constant";
import { OpenApiModule } from "./openapi.module";
import type { OpenApiSchema } from "./types/openapi.type";

const {
  createTestApp,
  sharedTestData: { BOOLEAN_FALSE, COMMON_STRING, NUMBER_1 },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("openapi.module");

const { castAsType } = TypeHelper;

const { setupDocs, setupValidation } = OpenApiModule;

const { API_DOCS } = BASE_URLS;
const { SWAGGER } = API_DOCS_ENDPOINTS;

const { GET } = HTTP_METHODS.SAFE;
const { POST } = HTTP_METHODS.UNSAFE;
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = HTTP_STATUS;

const { registerDriftingRoute, registerEchoRoute, ...TEST_DATA } = {
  DOCS_JSON_PATH: `${API_DOCS}/${SWAGGER}/json`,
  DRIFT_PATH: "/drift",
  ECHO_PATH: "/echo",
  INVALID_BODY: { name: NUMBER_1 },
  VALID_BODY: { name: COMMON_STRING },
  get registerDriftingRoute() {
    return (instance: AppInstance): void => {
      const driftResponseSchema = zObject({ name: zString() });

      instance.post(
        this.DRIFT_PATH,
        {
          schema: {
            response: {
              [OK]: {
                content: {
                  "application/json": { schema: driftResponseSchema },
                },
              },
            },
          } satisfies OpenApiSchema,
        },
        () => castAsType<{ name: string }>(this.INVALID_BODY),
      );
    };
  },
  get registerEchoRoute() {
    return (instance: AppInstance): void => {
      const echoBodySchema = zObject({ name: zString() });

      instance.post(
        this.ECHO_PATH,
        {
          schema: {
            body: echoBodySchema,
            response: {
              [OK]: {
                content: { "application/json": { schema: echoBodySchema } },
              },
            },
          } satisfies OpenApiSchema,
        },
        (request) => request.body,
      );
    };
  },
} as const;

describe("OpenApiModule", () => {
  describe("setupValidation", (it) => {
    it("should reject a body that fails the zod schema", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      await setupValidation(app);

      registerEchoRoute(app);

      await app.ready();

      const response = await app.inject({
        body: TEST_DATA.INVALID_BODY,
        method: `${POST}`,
        url: TEST_DATA.ECHO_PATH,
      });

      expect(response.statusCode).toBe(BAD_REQUEST);
    });

    it("should echo a body that passes the zod schema", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      await setupValidation(app);

      registerEchoRoute(app);

      await app.ready();

      const response = await app.inject({
        body: TEST_DATA.VALID_BODY,
        method: `${POST}`,
        url: TEST_DATA.ECHO_PATH,
      });

      expect(response.statusCode).toBe(OK);
      expect(response.json()).toStrictEqual(TEST_DATA.VALID_BODY);
    });

    it("should reject a response that fails the zod schema", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      await setupValidation(app);

      registerDriftingRoute(app);

      await app.ready();

      const response = await app.inject({
        method: `${POST}`,
        url: TEST_DATA.DRIFT_PATH,
      });

      expect(response.statusCode).toBe(INTERNAL_SERVER_ERROR);
    });
  });

  describe("setupDocs", (it) => {
    it("should serve the OpenAPI document built from the registered routes", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      await setupValidation(app);
      await setupDocs(app);

      registerEchoRoute(app);

      await app.ready();

      const response = await app.inject({
        method: `${GET}`,
        url: TEST_DATA.DOCS_JSON_PATH,
      });

      const document = castAsType<{ info: { title: string }; openapi: string }>(
        response.json(),
      );

      expect(response.statusCode).toBe(OK);
      expect(document.openapi).toBe(OPENAPI_OPTIONS.openapi);
      expect(document.info.title).toBe(OPENAPI_OPTIONS.info.title);
    });

    it("should not serve the docs when not in development", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        appEnv: {
          isDevelopment: castAsType<AppEnv["isDevelopment"]>(BOOLEAN_FALSE),
        },
      });

      await setupDocs(app);

      await app.ready();

      const response = await app.inject({
        method: `${GET}`,
        url: TEST_DATA.DOCS_JSON_PATH,
      });

      expect(response.statusCode).toBe(NOT_FOUND);
    });
  });
});
