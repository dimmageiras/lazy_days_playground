import { RouterContextProvider } from "react-router";
import { describe } from "vitest";

import { authRouteContext } from "./auth-route.context";

// Test data constants
const TEST_DATA = {
  identity_id: "123",
  timestamp: "2021-01-01",
} as const;

describe("AuthRouteContext", (it) => {
  it("should set and get value into context", ({ expect }) => {
    const context = new RouterContextProvider();

    context.set(authRouteContext, TEST_DATA);

    expect(context.get(authRouteContext)).toBe(TEST_DATA);
  });
});
