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

const SIGNALS_ERROR_MESSAGES = new Map<Signals, string>([
  [SIGNALS.SIGABRT, "Process aborted (SIGABRT). Shutting down."],
  [
    SIGNALS.SIGBUS,
    "Bus error — invalid memory access (SIGBUS). Shutting down.",
  ],
  [SIGNALS.SIGFPE, "Arithmetic exception (SIGFPE). Shutting down."],
  [
    SIGNALS.SIGHUP,
    "Controlling terminal disconnected (SIGHUP). Shutting down.",
  ],
  [SIGNALS.SIGILL, "Illegal instruction (SIGILL). Shutting down."],
  [SIGNALS.SIGINT, "Interrupted by user — Ctrl+C (SIGINT). Shutting down."],
  [SIGNALS.SIGQUIT, "Quit requested (SIGQUIT). Shutting down."],
  [SIGNALS.SIGSEGV, "Segmentation fault (SIGSEGV). Shutting down."],
  [
    SIGNALS.SIGTERM,
    "Termination requested (SIGTERM). Shutting down gracefully.",
  ],
  [SIGNALS.SIGTRAP, "Trace / breakpoint trap (SIGTRAP). Shutting down."],
  [SIGNALS.SIGUSR2, "User-defined signal received (SIGUSR2). Shutting down."],
]);

export { SIGNALS, SIGNALS_ERROR_MESSAGES };
