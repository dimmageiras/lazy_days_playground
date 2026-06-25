import type { Mock, Procedure } from "@vitest/spy";
import { vi } from "vitest";

const { mockAxiosPost, mockPortToPid } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
  mockPortToPid: vi.fn(),
}));

vi.mock(
  "axios",
  (): ReturnType<Mock<Procedure>> => ({
    default: { post: mockAxiosPost },
  }),
);

vi.mock(
  "pid-port",
  (): ReturnType<Mock<Procedure>> => ({
    portToPid: mockPortToPid,
  }),
);

const SHARED_MOCK = Object.freeze({
  mockAxiosPost,
  mockPortToPid,
} as const);

export { SHARED_MOCK };
