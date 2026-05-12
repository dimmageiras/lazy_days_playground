import type { Signals } from "close-with-grace";

import { TIMING } from "@shared/constants/timing.constant";

const BOOTSTRAP_TIMING = Object.freeze({
  COOPERATIVE_HANDOVER_TIMEOUT_MS: TIMING.SECONDS_FIVE_IN_MS,
  FORCE_SHUTDOWN_TIMEOUT_MS: TIMING.SECONDS_THREE_IN_MS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS: TIMING.SECONDS_TEN_IN_MS,
  LISTEN_POLL_INITIAL_INTERVAL_MS: TIMING.SECONDS_ONE_TENTH_IN_MS,
  LISTEN_POLL_MAX_INTERVAL_MS: TIMING.SECONDS_ONE_HALF_IN_MS,
  SHUTDOWN_REQUEST_TIMEOUT_MS: TIMING.SECONDS_TWO_IN_MS,
} as const);

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

export { BOOTSTRAP_TIMING, SIGNALS, SIGNALS_ERROR_MESSAGES };
