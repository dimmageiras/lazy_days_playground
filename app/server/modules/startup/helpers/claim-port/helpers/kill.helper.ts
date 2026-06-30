import type { Signals } from "close-with-grace";
import { portToPid } from "pid-port";

import { ErrorHelper } from "@server/helpers/error.helper";
import type {
  KillPortOwnerResult,
  PidLookupResult,
} from "@server/modules/startup/types/kill.type";
import type { AppInstance } from "@server/types/instance.type";

import { NumberHelper } from "@shared/helpers/number.helper";

const { normalizeError } = ErrorHelper;
const { isInteger } = NumberHelper;

const findPidOnPort = async (
  instance: AppInstance,
): Promise<PidLookupResult> => {
  const port = instance.appEnv.port;

  try {
    const pid = await portToPid(port);

    if (isInteger(pid) && pid >= 1) {
      return { found: true, pid };
    }

    return { found: false, reason: "no-pid" };
  } catch (error) {
    instance.log.warn(
      { ...normalizeError(error), port },
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

  if (lookup.pid === process.pid || lookup.pid === process.ppid) {
    instance.log.warn(
      { pid: lookup.pid, port },
      "🚧 Port owner resolved to this process — refusing to signal it.",
    );

    return { ok: false, reason: "self-pid" };
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
