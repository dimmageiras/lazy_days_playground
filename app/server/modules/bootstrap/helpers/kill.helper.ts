import type { Signals } from "close-with-grace";
import type { FastifyBaseLogger } from "fastify";
import type { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { join } from "node:path";

import type {
  KillPortOwnerResult,
  ListeningRow,
  PidLookupResult,
} from "../types";

const isListeningRow = (cols: readonly string[]): cols is ListeningRow =>
  cols.length >= 5 && cols[3] === "LISTENING";

// Hardcoded path closes a SystemRoot-redirect attack — env-var resolution
// would let an attacker who controls the environment point the lookup at
// an arbitrary binary.
const NETSTAT_BIN = join(String.raw`C:\Windows`, "System32", "netstat.exe");

const findPidOnPort = (
  port: number,
  log: FastifyBaseLogger,
): Promise<PidLookupResult> =>
  new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve({ found: false, reason: "unsupported-platform" });

      return;
    }

    let stdout = "";
    const netstat = spawn(NETSTAT_BIN, ["-ano"]);

    netstat.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    netstat.on("error", (error) => {
      log.warn({ err: error, port }, "netstat spawn failed.");
      resolve({ found: false, reason: "no-pid" });
    });

    netstat.on("close", (code) => {
      if (code !== 0) {
        log.warn({ code, port }, "netstat exited non-zero.");
        resolve({ found: false, reason: "no-pid" });

        return;
      }

      const match = stdout.split("\n").find((row) => {
        const cols = row.trim().split(/\s+/);

        if (!isListeningRow(cols)) {
          return false;
        }

        return cols[1].endsWith(`:${port}`);
      });

      const pid = match ? Number(match.trim().split(/\s+/).pop()) : Number.NaN;

      if (Number.isFinite(pid) && pid > 0) {
        resolve({ found: true, pid });

        return;
      }

      resolve({ found: false, reason: "no-pid" });
    });
  });

const killPortOwner = async (
  port: number,
  signal: Signals,
  log: FastifyBaseLogger,
): Promise<KillPortOwnerResult> => {
  const lookup = await findPidOnPort(port, log);

  if (!lookup.found) {
    return { ok: false, reason: lookup.reason };
  }

  log.warn({ pid: lookup.pid, port, signal }, "Signalling port owner.");

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
