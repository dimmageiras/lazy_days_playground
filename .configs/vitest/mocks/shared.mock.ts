import type { Mock, Procedure } from "@vitest/spy";
import { vi } from "vitest";

const { mockAxiosPost } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
}));

vi.mock(
  "axios",
  (): ReturnType<Mock<Procedure>> => ({
    default: { post: mockAxiosPost },
  }),
);

const SHARED_MOCK = Object.freeze({
  mockAxiosPost,
} as const);

export { SHARED_MOCK };
