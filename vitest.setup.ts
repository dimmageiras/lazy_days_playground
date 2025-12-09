import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";

// Global test cleanup
afterEach(() => {
  // Clean up DOM after each test to prevent test pollution
  cleanup();
});
