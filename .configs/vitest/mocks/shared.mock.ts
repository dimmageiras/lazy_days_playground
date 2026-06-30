import type * as Axios from "axios";
import { vi } from "vitest";

const { mockAxiosPost } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof Axios>();

  return {
    ...actual,
    default: Object.assign(actual.default, { post: mockAxiosPost }),
  };
});

const SHARED_MOCK = Object.freeze({
  mockAxiosPost,
} as const);

export { SHARED_MOCK };
