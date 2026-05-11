import type { Signals } from "close-with-grace";
import type { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

const findPidOnPort = (port: number): Promise<number | null> =>
  new Promise((resolve) => {
    const ps = spawn("netstat", ["-ano"]);
    let stdout = "";

    ps.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    ps.on("error", () => {
      resolve(null);
    });

    ps.on("close", () => {
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

export const KillHelper = {
  killPortOwner,
};
