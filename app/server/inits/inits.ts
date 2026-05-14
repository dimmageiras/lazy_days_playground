import { InstanceLifecycleInit } from "./instance-lifecycle";

const { initInstanceLifecycle } = InstanceLifecycleInit;

const inits = async (): Promise<void> => {
  initInstanceLifecycle();
};

export { inits };
