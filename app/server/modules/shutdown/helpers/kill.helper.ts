import type { Signals } from "close-with-grace";
import { portToPid } from "pid-port";

import type { AppInstance } from "@server/types/instance.type";

import type { KillPortOwnerResult, PidLookupResult } from "../types/kill.type";

const findPidOnPort = async (
  instance: AppInstance,
): Promise<PidLookupResult> => {
  const port = instance.appEnv.port;

  try {
    const pid = await portToPid(port);

    if (typeof pid === "number" && Number.isInteger(pid) && pid > 0) {
      return { found: true, pid };
    }

    return { found: false, reason: "no-pid" };
  } catch (error) {
    instance.log.warn(
      { err: error, port },
      "🚧 Port-owner lookup found no process.",
    );

    return { found: false, reason: "no-pid" };
  }
};

const killPortOwner = async (
  instance: AppInstance,
  signal: Signals,
): Promise<KillPortOwnerResult> => {
  const port = instance.appEnv.port;

  const lookup = await findPidOnPort(instance);

  if (!lookup.found) {
    return { ok: false, reason: lookup.reason };
  }

  instance.log.warn(
    { pid: lookup.pid, port, signal },
    "🚧 Signalling port owner.",
  );

  try {
    process.kill(lookup.pid, signal);

    return { ok: true };
  } catch {
    return { ok: false, reason: "kill-threw" };
  }
};

const KillHelper = Object.freeze({
  killPortOwner,
} as const);

export { KillHelper };
