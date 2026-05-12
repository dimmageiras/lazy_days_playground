import type { Signals } from "close-with-grace";
import type { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

// `netstat -ano` and the trailing-PID column layout parsed below are Windows-specific.
// The cooperative HTTP shutdown route is the cross-platform graceful path; this
// force-kill fallback only works on Windows. POSIX hosts get a fast null return.
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
