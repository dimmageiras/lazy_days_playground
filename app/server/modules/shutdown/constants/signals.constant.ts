import type { Signals } from "close-with-grace";

const SIGNALS: Readonly<Record<Signals, Signals>> = Object.freeze({
  SIGABRT: "SIGABRT",
  SIGBUS: "SIGBUS",
  SIGFPE: "SIGFPE",
  SIGHUP: "SIGHUP",
  SIGILL: "SIGILL",
  SIGINT: "SIGINT",
  SIGQUIT: "SIGQUIT",
  SIGSEGV: "SIGSEGV",
  SIGTERM: "SIGTERM",
  SIGTRAP: "SIGTRAP",
  SIGUSR2: "SIGUSR2",
} as const);

export { SIGNALS };
