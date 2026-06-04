import type { TransportSingleOptions } from "pino";

const PRETTY_TRANSPORT: TransportSingleOptions = Object.freeze({
  options: {
    ignore: "pid,hostname",
    translateTime: "HH:MM:ss",
  },
  target: "pino-pretty",
} as const);

export { PRETTY_TRANSPORT };
