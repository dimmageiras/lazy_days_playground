import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypeHelper } from "@shared/helpers/type.helper";
import type { DbHost } from "@shared/types/app-env.type";

import { DbModule } from "./db.module";
import type { DbClient } from "./types/db.type";

const {
  createMockInstance,
  sharedMock: { mockGelCreateClient },
  sharedTestData: { UNDEFINED_VALUE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("db.module");

const { castAsType } = TypeHelper;

const { setupDb } = DbModule;

const mockClose = vi.fn();

const TEST_DATA = {
  DB_CLIENT_KEY: "dbClient",
  ON_CLOSE: "onClose",
} as const;

describe("DbModule", () => {
  describe("setupDb", (it) => {
    const { afterAll } = it;

    afterAll(() => {
      mockClose.mockReset();
      mockGelCreateClient.mockReset();
    });

    it("should build a client from the validated env, decorate it, and register an onClose hook that closes it", async ({
      expect,
    }) => {
      const dbHost = castAsType<DbHost>("db-module-spec.local");
      const addHook = vi.fn();
      const decorate = vi.fn();
      const client = castAsType<DbClient>({ close: mockClose });
      const instance = createMockInstance({ appEnv: { dbHost } });

      Reflect.set(instance, "addHook", addHook);
      Reflect.set(instance, "decorate", decorate);

      mockClose.mockResolvedValue(UNDEFINED_VALUE);
      mockGelCreateClient.mockReturnValue(client);

      setupDb(instance);

      const { dbBranch, dbClientTlsSecurity, dbPassword, dbPort } =
        instance.appEnv;

      const createClientCalls = mockGelCreateClient.mock.calls.filter(
        ([options]) => castAsType<{ host: unknown }>(options).host === dbHost,
      );

      expect(createClientCalls).toStrictEqual([
        [
          {
            branch: dbBranch,
            host: dbHost,
            password: dbPassword,
            port: dbPort,
            tlsSecurity: dbClientTlsSecurity,
          },
        ],
      ]);
      expect(decorate).toHaveBeenNthCalledWith(
        1,
        TEST_DATA.DB_CLIENT_KEY,
        client,
      );
      expect(addHook).toHaveBeenNthCalledWith(
        1,
        TEST_DATA.ON_CLOSE,
        expect.any(Function),
      );

      const onCloseHook = castAsType<() => Promise<void>>(
        addHook.mock.calls[0]?.[1],
      );

      await onCloseHook();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
