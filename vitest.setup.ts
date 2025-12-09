import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Extends Vitest matchers with DOM-specific assertions from jest-dom
// Enables assertions like: expect(element).toHaveTextContent(/react/i)
// See: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";

// Clean up DOM after each test to prevent test pollution
// Removes mounted components and event listeners from the DOM
afterEach(() => {
  cleanup();
});
