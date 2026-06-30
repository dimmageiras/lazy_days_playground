import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ClaimPortHelper } from "./helpers/claim-port";
import { StartupModule } from "./startup.module";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("startup.module");

const TEST_DATA = {
  ENTRY_POINT_KEYS: ["claimPort"],
} as const;

describe("StartupModule", () => {
  describe("claimPort", (it) => {
    it("should re-export the claim-port helper as its claimPort entry point", ({
      expect,
    }) => {
      expect(StartupModule.claimPort).toBe(ClaimPortHelper.claimPort);
    });

    it("should expose only the claim-port entry point", ({ expect }) => {
      expect(Object.keys(StartupModule)).toStrictEqual(
        TEST_DATA.ENTRY_POINT_KEYS,
      );
    });
  });
});
