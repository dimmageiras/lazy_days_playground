import type * as Axios from "axios";
import type * as Fastify from "fastify";
import type * as Gel from "gel";
import { vi } from "vitest";

const { mockAxiosPost, mockFastify, mockGelCreateClient } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
  mockFastify: vi.fn(),
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

vi.mock("fastify", async (importOriginal) => {
  const actual = await importOriginal<typeof Fastify>();

  mockFastify.mockImplementation(actual.default);

  return {
    ...actual,
    default: mockFastify,
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
  mockFastify,
  mockGelCreateClient,
} as const);

export { SHARED_MOCK };
