import "@testing-library/jest-dom/vitest";

import { sharedMocks } from "./mocks";

const vitestHelpers = (): typeof sharedMocks => {
  return {
    ...sharedMocks,
  };
};

export { vitestHelpers };
