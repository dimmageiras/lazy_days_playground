import type { KeyAsString } from "type-fest";
import type { TestAPI } from "vitest";
import { describe, vi } from "vitest";

import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

import { PinoLogHelper } from "./pino-log.helper";

const { getObjectKeys } = ObjectUtilsHelper;
const { log } = PinoLogHelper;

// Test data constants
const TEST_DATA = {
  INFO: { level: "info" as const },
  ERROR: { level: "error" as const },
  WARN: { level: "warn" as const },
  DEBUG: { level: "debug" as const },
} as const;

const CONTEXT_DATA = {
  OBJECT_MESSAGE: { key: "value", action: "test" },
  OBJECT_WITH_MESSAGE: { correlationId: "12345", userId: "user-1" },
  COMPLEX_MESSAGE: "Processing request",
} as const;

// Test helper function to test log levels
const testLogLevel = (key: KeyAsString<typeof TEST_DATA>, it: TestAPI) => {
  const testCase = Reflect.get(TEST_DATA, key);
  const { level } = testCase;

  it(`should log ${level} messages with context`, ({ expect }) => {
    const spy = vi.spyOn(log, level);

    try {
      Reflect.get(log, level).call(
        log,
        CONTEXT_DATA.OBJECT_WITH_MESSAGE,
        CONTEXT_DATA.COMPLEX_MESSAGE,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        CONTEXT_DATA.OBJECT_WITH_MESSAGE,
        CONTEXT_DATA.COMPLEX_MESSAGE,
      );
    } finally {
      spy.mockRestore();
    }
  });
};

describe("PinoLogHelper", () => {
  describe("log levels", (it) => {
    getObjectKeys(TEST_DATA).forEach((key) => testLogLevel(key, it));
  });
});
