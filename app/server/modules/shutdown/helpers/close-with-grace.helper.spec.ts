import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { SIGNALS } from "@server/constants/signals.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import {
  SHUTDOWN_PHRASES,
  SIGNAL_MESSAGES,
} from "@server/modules/shutdown/constants/messages.constant";
import { TIMING_IN_MS } from "@server/modules/shutdown/constants/timing.constant";
import type { AppInstance } from "@server/types/instance.type";

import { MapHelper } from "@shared/helpers/map.helper";

import { CloseWithGraceHelper } from "./close-with-grace.helper";

const {
  createMockInstance,
  sharedTestData: { BOOLEAN_TRUE, EMPTY_STRING, UNDEFINED_VALUE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("close-with-grace.helper");

const { SHUTTING_DOWN } = SHUTDOWN_PHRASES;
const { SHUTDOWN_TIMEOUT } = TIMING_IN_MS;
const { SIGTERM } = SIGNALS;

const { normalizeError } = ErrorHelper;
const { getMapValue } = MapHelper;

const { buildShutdownHandler, buildShutdownOptions } = CloseWithGraceHelper;

const { makeInstance, ...TEST_DATA } = {
  ERROR: new Error("unhandled boom"),
  ERROR_MESSAGE: "💥 Shutting down after an unhandled error",
  INFO_CASES: [
    {
      context: { manual: BOOLEAN_TRUE },
      message: `Manual shutdown requested, ${SHUTTING_DOWN}`,
      name: "should log the manual-shutdown message and close on a manual shutdown",
    },
    {
      context: { signal: SIGTERM },
      message: getMapValue(SIGNAL_MESSAGES, SIGTERM, EMPTY_STRING),
      name: "should log the signal-specific message and close on a known signal",
    },
    {
      context: {},
      message: `Received a shutdown signal, ${SHUTTING_DOWN}`,
      name: "should log the fallback message and close when no error, manual flag, or signal is given",
    },
  ],
  get makeInstance() {
    return (): AppInstance => {
      const instance = createMockInstance();

      Reflect.set(
        instance,
        "close",
        vi.fn().mockResolvedValue(UNDEFINED_VALUE),
      );

      return instance;
    };
  },
} as const;

describe("CloseWithGraceHelper", () => {
  describe("buildShutdownHandler", (it) => {
    it("should log a fatal error and close when shutting down after an unhandled error", async ({
      expect,
    }) => {
      const instance = makeInstance();

      await buildShutdownHandler(instance)({ err: TEST_DATA.ERROR });

      expect(instance.log.fatal).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.ERROR),
        TEST_DATA.ERROR_MESSAGE,
      );
      expect(instance.log.info).not.toHaveBeenCalled();
      expect(instance.close).toHaveBeenCalledTimes(1);
    });

    TEST_DATA.INFO_CASES.forEach(({ context, message, name }) => {
      it(name, async ({ expect }) => {
        const instance = makeInstance();

        await buildShutdownHandler(instance)(context);

        expect(instance.log.info).toHaveBeenNthCalledWith(1, message);
        expect(instance.log.fatal).not.toHaveBeenCalled();
        expect(instance.close).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("buildShutdownOptions", (it) => {
    it("should pair the shutdown timeout with the provided logger", ({
      expect,
    }) => {
      const instance = makeInstance();

      expect(buildShutdownOptions(instance.log)).toStrictEqual({
        delay: SHUTDOWN_TIMEOUT,
        logger: instance.log,
      });
    });
  });
});
