import type { TransportSingleOptions } from "pino";

const PRETTY_TRANSPORT: Readonly<TransportSingleOptions> = Object.freeze({
  options: {
    ignore: "pid,hostname",
    translateTime: "HH:MM:ss",
  },
  target: "pino-pretty",
} as const satisfies TransportSingleOptions);

export { PRETTY_TRANSPORT };
