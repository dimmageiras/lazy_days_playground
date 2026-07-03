import type * as Axios from "axios";
import type * as Gel from "gel";
import { vi } from "vitest";

const { mockAxiosPost, mockGelCreateClient } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
  mockGelCreateClient: vi.fn(),
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof Axios>();

  return {
    ...actual,
    default: Object.assign(actual.default, {
      post: mockAxiosPost,
    }),
  };
});

vi.mock("gel", async (importOriginal) => {
  const actual = await importOriginal<typeof Gel>();

  return {
    ...actual,
    createClient: mockGelCreateClient,
  };
});

const SHARED_MOCK = Object.freeze({
  mockAxiosPost,
  mockGelCreateClient,
} as const);

export { SHARED_MOCK };
