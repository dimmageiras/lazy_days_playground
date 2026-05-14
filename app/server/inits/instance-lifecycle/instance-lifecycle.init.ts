import { BootstrapModule } from "@server/modules/bootstrap";

const { createBootstrapLifecycleBus, registerCurrent, retirePrior } =
  BootstrapModule;

const initInstanceLifecycle = (): void => {
  const { bus: instanceLifecycleBus, registerController } =
    createBootstrapLifecycleBus();

  const registerSignal = registerController(
    "bootstrap:register-current",
  ).signal;
  const retireSignal = registerController("bootstrap:retire-prior").signal;

  instanceLifecycleBus.on("register", registerCurrent, {
    signal: registerSignal,
  });
  instanceLifecycleBus.on("retire", retirePrior, { signal: retireSignal });
};

const InstanceLifecycleInit = Object.freeze({
  initInstanceLifecycle,
} as const);

export { InstanceLifecycleInit };
