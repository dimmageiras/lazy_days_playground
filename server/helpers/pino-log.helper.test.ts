import { describe } from "vitest";

import { PinoLogHelper } from "./pino-log.helper";

describe("PinoLogHelper", () => {
  const { log } = PinoLogHelper;

  describe("exports", (it) => {
    it("exports a log property", ({ expect }) => {
      expect(PinoLogHelper).toHaveProperty("log");
      expect(typeof PinoLogHelper.log).toBe("object");
    });

    it("log property is a pino logger instance", ({ expect }) => {
      expect(log).toBeDefined();
      expect(typeof log).toBe("object");

      // Pino logger should have standard logging methods
      expect(typeof log.info).toBe("function");
      expect(typeof log.error).toBe("function");
      expect(typeof log.warn).toBe("function");
      expect(typeof log.debug).toBe("function");
    });
  });

  describe("logger configuration", (it) => {
    it("logger has expected configuration properties", ({ expect }) => {
      expect(log).toHaveProperty("level");
      expect(log).toHaveProperty("child");
      expect(log).toHaveProperty("isLevelEnabled");
    });

    it("logger level matches expected log level", ({ expect }) => {
      // The logger level should be set based on LOG_LEVEL environment variable
      // or default to "info" if not set
      expect(typeof log.level).toBe("string");
      expect(["trace", "debug", "info", "warn", "error", "fatal"]).toContain(
        log.level
      );
    });

    it("logger supports different log levels", ({ expect }) => {
      expect(log.isLevelEnabled("info")).toBe(true);
      expect(log.isLevelEnabled("error")).toBe(true);
      expect(log.isLevelEnabled("debug")).toBe(
        typeof log.level === "string" && ["trace", "debug"].includes(log.level)
      );
    });
  });

  describe("logging functionality", (it) => {
    it("can log info messages", ({ expect }) => {
      expect(() => {
        log.info("Test info message");
        log.info({ key: "value" }, "Test info with object");
        log.info("Test info with multiple args", undefined, "arg2");
      }).not.toThrow();
    });

    it("can log error messages", ({ expect }) => {
      expect(() => {
        log.error("Test error message");
        log.error(new Error("Test error object"));
        log.error({ error: "object" }, "Test error with object");
      }).not.toThrow();
    });

    it("can log warning messages", ({ expect }) => {
      expect(() => {
        log.warn("Test warning message");
        log.warn({ warning: "data" }, "Test warning with object");
      }).not.toThrow();
    });

    it("can log debug messages", ({ expect }) => {
      expect(() => {
        log.debug("Test debug message");
        log.debug({ debug: "info" }, "Test debug with object");
      }).not.toThrow();
    });

    it("can create child loggers", ({ expect }) => {
      const childLogger = log.child({ component: "test" });

      expect(childLogger).toBeDefined();
      expect(typeof childLogger).toBe("object");
      expect(typeof childLogger.info).toBe("function");
      expect(typeof childLogger.error).toBe("function");

      expect(() => {
        childLogger.info("Test child logger message");
      }).not.toThrow();
    });

    it("child loggers inherit parent configuration", ({ expect }) => {
      const childLogger = log.child({ component: "test" });

      expect(childLogger.level).toBe(log.level);
    });
  });

  describe("log serialization", (it) => {
    it("handles object serialization", ({ expect }) => {
      const testObject = {
        string: "value",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: "nestedValue" },
      };

      expect(() => {
        log.info(testObject, "Test object logging");
        log.info({ message: "Test with object", data: testObject });
      }).not.toThrow();
    });

    it("handles error objects", ({ expect }) => {
      const testError = new Error("Test error");

      testError.stack = "Error: Test error\n    at test location";

      expect(() => {
        log.error(testError);
        log.error({ error: testError }, "Error with context");
      }).not.toThrow();
    });

    it("handles primitive values", ({ expect }) => {
      expect(() => {
        log.info("string message");
        log.info(42);
        log.info(true);
        log.info(null);
        log.info(undefined);
      }).not.toThrow();
    });

    it("handles array values", ({ expect }) => {
      const testArray = [1, "string", { key: "value" }, [1, 2, 3]];

      expect(() => {
        log.info(testArray);
        log.info({ array: testArray }, "Array in object");
      }).not.toThrow();
    });
  });

  describe("logger instance consistency", (it) => {
    it("maintains logger state across calls", ({ expect }) => {
      const initialLevel = log.level;

      expect(() => {
        log.info("First call");
        log.error("Second call");
        log.debug("Third call");
      }).not.toThrow();

      // Level should remain consistent
      expect(log.level).toBe(initialLevel);
    });
  });
});
