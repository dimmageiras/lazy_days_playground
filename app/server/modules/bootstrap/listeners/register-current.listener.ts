import type { LifecycleRegisterPayload } from "../types";

const registerCurrent = ({ app, handle }: LifecycleRegisterPayload): void => {
  globalThis.__priorInstance = { app, handle };
};

export { registerCurrent };
