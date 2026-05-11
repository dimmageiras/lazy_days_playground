import type { FastifyInstance } from "fastify";
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
  signal: NodeJS.Signals,
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

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const tryListen = async (
  app: FastifyInstance,
  port: number,
): Promise<boolean> => {
  try {
    await app.listen({ port, host: "0.0.0.0" });

    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      return false;
    }

    throw error;
  }
};

const tryListenUntil = async (
  app: FastifyInstance,
  port: number,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await tryListen(app, port)) {
      return true;
    }

    await sleep(100);
  }

  return false;
};

export const BootstrapModuleHelper = {
  killPortOwner,
  tryListen,
  tryListenUntil,
};
