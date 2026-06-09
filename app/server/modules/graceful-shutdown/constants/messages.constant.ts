import type { Signals } from "close-with-grace";
import { Map } from "immutable";

import { SIGNALS } from "./signals.constant";

const MESSAGES = Object.freeze({
  SHUTTING_DOWN: "shutting down…",
} as const);

const SIGNAL_MESSAGES = Map<Signals, string>([
  [SIGNALS.SIGABRT, `Received SIGABRT (aborted), ${MESSAGES.SHUTTING_DOWN}`],
  [SIGNALS.SIGBUS, `Received SIGBUS (bus error), ${MESSAGES.SHUTTING_DOWN}`],
  [
    SIGNALS.SIGFPE,
    `Received SIGFPE (arithmetic exception), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGHUP,
    `Received SIGHUP (terminal disconnected), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGILL,
    `Received SIGILL (illegal instruction), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGINT,
    `Received SIGINT (interrupted with Ctrl+C), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGQUIT,
    `Received SIGQUIT (quit requested), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGSEGV,
    `Received SIGSEGV (segmentation fault), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGTERM,
    `Received SIGTERM (termination requested), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGTRAP,
    `Received SIGTRAP (trace/breakpoint trap), ${MESSAGES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGUSR2,
    `Received SIGUSR2 (user-defined signal), ${MESSAGES.SHUTTING_DOWN}`,
  ],
]);

export { MESSAGES, SIGNAL_MESSAGES };
