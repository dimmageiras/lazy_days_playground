import type { Mock, Procedure } from "@vitest/spy";
import type { UnknownArray } from "type-fest";
import { vi } from "vitest";

const ServerMock = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
  mockCloseWithGrace: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    post: (...args: UnknownArray): ReturnType<Mock<Procedure>> =>
      ServerMock.mockAxiosPost(...args),
  },
}));

vi.mock("close-with-grace", () => ({
  default: (...args: UnknownArray): ReturnType<Mock<Procedure>> =>
    ServerMock.mockCloseWithGrace(...args),
}));

export { ServerMock };
