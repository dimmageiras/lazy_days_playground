import type { Signals } from "close-with-grace";
import type { FastifyBaseLogger } from "fastify";
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
const findPidOnPort = (
  port: number,
  log: FastifyBaseLogger,
): Promise<PidLookupResult> =>
  new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve({ found: false, reason: "unsupported-platform" });

      return;
    }

    let stderr = "";
    let stdout = "";
    const netstat = spawn("netstat", ["-ano"]);

    netstat.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    netstat.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    netstat.on("error", (error) => {
      log.warn({ err: error, port }, "netstat spawn failed.");
      resolve({ found: false, reason: "no-pid" });
    });

    netstat.on("close", (code) => {
      if (code !== 0) {
        log.warn(
          { code, port, stderr: stderr.trim() },
          "netstat exited non-zero.",
        );
        resolve({ found: false, reason: "no-pid" });

        return;
      }

      const match = stdout.split("\n").find((row) => {
        const cols = row.trim().split(/\s+/);

        // Windows netstat -ano LISTENING row: [proto, localAddr, foreignAddr, "LISTENING", pid]
        if (cols.length < 5 || cols[3] !== "LISTENING") {
          return false;
        }

        return cols[1]?.endsWith(`:${port}`) ?? false;
      });

      const pid = match ? Number(match.trim().split(/\s+/).pop()) : Number.NaN;

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
  log: FastifyBaseLogger,
): Promise<KillPortOwnerResult> => {
  const lookup = await findPidOnPort(port, log);

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
