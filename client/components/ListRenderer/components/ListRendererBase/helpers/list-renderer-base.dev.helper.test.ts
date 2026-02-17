import { beforeAll, describe, vi } from "vitest";

import type * as RootEnvModule from "@shared/constants/root-env.constant";

import type { ListRendererBaseHelper } from "./list-renderer-base.helper";

// Mock with IS_DEVELOPMENT: true BEFORE importing the helper
vi.mock("@shared/constants/root-env.constant", async (importOriginal) => {
  const original = await importOriginal<typeof RootEnvModule>();

  return {
    ...original,
    IS_DEVELOPMENT: true,
  };
});

describe("ListRendererBaseHelper (development mode)", (it) => {
  let generateStableKey: typeof ListRendererBaseHelper.generateStableKey;

  beforeAll(async () => {
    const { ListRendererBaseHelper: helper } =
      await import("./list-renderer-base.helper");

    generateStableKey = helper.generateStableKey;
  });

  it("should log warning in development mode when no getKey provided", ({
    expect,
  }) => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const keyMap = new WeakMap();
    const object = { id: 1, name: "test" };

    generateStableKey(object, 0, keyMap);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Performance warning: No getKey function provided. Generating UUID or stringified item as key for item:",
      object,
      "Consider providing a getKey function for better performance.",
    );

    consoleWarnSpy.mockRestore();
  });

  it("should log warning for arrays in development mode", ({ expect }) => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const keyMap = new WeakMap();
    const array = [1, 2, 3];

    generateStableKey(array, 0, keyMap);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Performance warning: No getKey function provided. Generating UUID or stringified item as key for item:",
      array,
      "Consider providing a getKey function for better performance.",
    );

    consoleWarnSpy.mockRestore();
  });

  it("should log warning for primitives in development mode", ({ expect }) => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const keyMap = new WeakMap();
    const primitiveValue = "test-string";

    generateStableKey(primitiveValue, 0, keyMap);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Performance warning: No getKey function provided. Generating UUID or stringified item as key for item:",
      primitiveValue,
      "Consider providing a getKey function for better performance.",
    );

    consoleWarnSpy.mockRestore();
  });
});
