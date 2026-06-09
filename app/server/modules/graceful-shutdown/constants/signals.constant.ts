import type { Signals } from "close-with-grace";
import { Map } from "immutable";

import { SHUTTING_DOWN } from "./graceful-shutdown.constant";

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

const SIGNAL_MESSAGES = Map<Signals, string>([
  [SIGNALS.SIGABRT, `Received SIGABRT (aborted), ${SHUTTING_DOWN}`],
  [SIGNALS.SIGBUS, `Received SIGBUS (bus error), ${SHUTTING_DOWN}`],
  [SIGNALS.SIGFPE, `Received SIGFPE (arithmetic exception), ${SHUTTING_DOWN}`],
  [SIGNALS.SIGHUP, `Received SIGHUP (terminal disconnected), ${SHUTTING_DOWN}`],
  [SIGNALS.SIGILL, `Received SIGILL (illegal instruction), ${SHUTTING_DOWN}`],
  [
    SIGNALS.SIGINT,
    `Received SIGINT (interrupted with Ctrl+C), ${SHUTTING_DOWN}`,
  ],
  [SIGNALS.SIGQUIT, `Received SIGQUIT (quit requested), ${SHUTTING_DOWN}`],
  [SIGNALS.SIGSEGV, `Received SIGSEGV (segmentation fault), ${SHUTTING_DOWN}`],
  [
    SIGNALS.SIGTERM,
    `Received SIGTERM (termination requested), ${SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGTRAP,
    `Received SIGTRAP (trace/breakpoint trap), ${SHUTTING_DOWN}`,
  ],
  [SIGNALS.SIGUSR2, `Received SIGUSR2 (user-defined signal), ${SHUTTING_DOWN}`],
]);

export { SIGNAL_MESSAGES };
