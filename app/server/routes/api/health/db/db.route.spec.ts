import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { DbClient } from "@server/modules/db";

import { HTTP_METHODS, HTTP_STATUS } from "@shared/constants/http.constant";
import { TypeHelper } from "@shared/helpers/type.helper";

import { dbRoute } from "./db.route";

const {
  createTestApp,
  sharedTestData: { VALID_DEV_APP_ENV },
  trackLeaksInSpec,
} = VitestSetup();

const { castAsType } = TypeHelper;

trackLeaksInSpec("db.route");

const { DB } = API_HEALTH_ENDPOINTS;
const { GET } = HTTP_METHODS.SAFE;
const { OK } = HTTP_STATUS;

const TEST_DATA = {
  DB_CLIENT: "dbClient",
  DB_PATH: `/${DB}`,
} as const;

describe("dbRoute", () => {
  describe(`${GET} ${TEST_DATA.DB_PATH}`, (it) => {
    it("should report the DB name and an ISO timestamp when the client connects", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      app.decorate(
        TEST_DATA.DB_CLIENT,
        castAsType<DbClient>({
          ensureConnected: () => Promise.resolve(),
        }),
      );

      await app.register(dbRoute);
      await app.ready();

      const response = await app.inject({
        method: `${GET}`,
        url: TEST_DATA.DB_PATH,
      });

      expect(response.statusCode).toBe(OK);
      expect(response.json()).toStrictEqual({
        db: VALID_DEV_APP_ENV.dbName,
        timestamp: expect.any(String),
      });
    });
  });
});
