import type { AnyUseQueryOptions } from "@tanstack/react-query";
import { describe } from "vitest";

import { QueriesHelper } from "./queries.helper";

const { fetchServerData, isDehydratedState } = QueriesHelper;

// Test data constants
const TEST_DATA = {
  QUERY_KEY: ["profile"],
  QUERY_VALUE: { name: "Ava" },
} as const;

// Factory function to create query options
const createQueryOptions = (): AnyUseQueryOptions => ({
  queryKey: TEST_DATA.QUERY_KEY,
  queryFn: async () => TEST_DATA.QUERY_VALUE,
});

describe("QueriesHelper", () => {
  describe("fetchServerData", (it) => {
    it("should fetch server data and return a hydrated client", async ({
      expect,
    }) => {
      const queryClient = await fetchServerData([createQueryOptions()]);

      const result = queryClient.getQueryData(TEST_DATA.QUERY_KEY);

      expect(result).toStrictEqual(TEST_DATA.QUERY_VALUE);
    });
  });

  describe("isDehydratedState", (it) => {
    it("should return true for a dehydrated state shape", ({ expect }) => {
      const result = isDehydratedState({ queries: [], mutations: [] });

      expect(result).toBe(true);
    });

    it("should return false for non-dehydrated shapes", ({ expect }) => {
      expect(isDehydratedState(null)).toBe(false);
      expect(isDehydratedState({ queries: {}, mutations: [] })).toBe(false);
    });
  });
});
