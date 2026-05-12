import type { Signals } from "close-with-grace";
import type { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

import type {
  KillPortOwnerResult,
  PidLookupResult,
} from "../types/bootstrap.type";

/**
 * Resolves the PID of whichever process is listening on the given TCP port.
 *
 * `netstat -ano` and the column layout parsed below are Windows-specific.
 * POSIX hosts short-circuit — the cooperative HTTP shutdown route is the
 * cross-platform graceful path; this force-kill fallback works only on Windows.
 */
const findPidOnPort = (port: number): Promise<PidLookupResult> =>
  new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve({ found: false, reason: "unsupported-platform" });
      return;
    }

    const netstat = spawn("netstat", ["-ano"]);
    let stdout = "";

    netstat.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    netstat.on("error", () => {
      resolve({ found: false, reason: "no-pid" });
    });

    netstat.on("close", () => {
      const match = stdout.split("\n").find((row) => {
        const cols = row.trim().split(/\s+/);
        // Windows netstat -ano LISTENING row: [proto, localAddr, foreignAddr, "LISTENING", pid]
        if (cols.length < 5 || cols[3] !== "LISTENING") {
          return false;
        }

        return cols[1]?.endsWith(`:${port}`) ?? false;
      });

      const pid = match ? Number(match.trim().split(/\s+/).pop()) : NaN;

      if (Number.isFinite(pid) && pid > 0) {
        resolve({ found: true, pid });
        return;
      }

      resolve({ found: false, reason: "no-pid" });
    });
  });

/** Sends the given signal to whichever process owns the port; result discriminates between unsupported platform, no listener found, and kill error. */
const killPortOwner = async (
  port: number,
  signal: Signals,
): Promise<KillPortOwnerResult> => {
  const lookup = await findPidOnPort(port);

  if (!lookup.found) {
    return { ok: false, reason: lookup.reason };
  }

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
