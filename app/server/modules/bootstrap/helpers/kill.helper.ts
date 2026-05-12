import type { Signals } from "close-with-grace";
import type { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

/**
 * Resolves the PID of whichever process is listening on the given TCP port; `null` if none found.
 *
 * `netstat -ano` and the trailing-PID column parsed below are Windows-specific.
 * POSIX hosts short-circuit to `null` — the cooperative HTTP shutdown route is
 * the cross-platform graceful path; this force-kill fallback works only on Windows.
 */
const findPidOnPort = (port: number): Promise<number | null> =>
  new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve(null);
      return;
    }

    const netstat = spawn("netstat", ["-ano"]);
    let stdout = "";

    netstat.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    netstat.on("error", () => {
      resolve(null);
    });

    netstat.on("close", () => {
      const line = stdout
        .split("\n")
        .find((row) => row.includes(`:${port} `) && row.includes("LISTENING"));
      const pid = line ? Number(line.trim().split(/\s+/).pop()) : NaN;

      resolve(Number.isFinite(pid) && pid > 0 ? pid : null);
    });
  });

/** Sends the given signal to whichever process owns the port; returns whether a target was found and signalled. */
const killPortOwner = async (
  port: number,
  signal: Signals,
): Promise<boolean> => {
  const pid = await findPidOnPort(port);

  if (pid === null) {
    return false;
  }

  try {
    process.kill(pid, signal);

    return true;
  } catch {
    return false;
  }
};

const KillHelper = Object.freeze({
  killPortOwner,
} as const);

export { KillHelper };
