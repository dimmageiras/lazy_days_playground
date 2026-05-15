import "@testing-library/jest-dom/vitest";

import { sharedMocks } from "./mocks/shared";

const vitestHelpers = () => {
  return {
    ...sharedMocks,
  };
};

export { vitestHelpers };
