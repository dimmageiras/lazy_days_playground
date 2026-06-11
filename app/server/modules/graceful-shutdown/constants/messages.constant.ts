import type { Signals } from "close-with-grace";
import { Map } from "immutable";

import { SIGNALS } from "./signals.constant";

const SHUTDOWN_PHRASES = Object.freeze({
  SHUTTING_DOWN: "shutting down…",
} as const);

const SIGNAL_MESSAGES = Map<Signals, string>([
  [
    SIGNALS.SIGABRT,
    `Received SIGABRT (aborted), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGBUS,
    `Received SIGBUS (bus error), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGFPE,
    `Received SIGFPE (arithmetic exception), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGHUP,
    `Received SIGHUP (terminal disconnected), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGILL,
    `Received SIGILL (illegal instruction), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGINT,
    `Received SIGINT (interrupted with Ctrl+C), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGQUIT,
    `Received SIGQUIT (quit requested), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGSEGV,
    `Received SIGSEGV (segmentation fault), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGTERM,
    `Received SIGTERM (termination requested), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGTRAP,
    `Received SIGTRAP (trace/breakpoint trap), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
  [
    SIGNALS.SIGUSR2,
    `Received SIGUSR2 (user-defined signal), ${SHUTDOWN_PHRASES.SHUTTING_DOWN}`,
  ],
]);

export { SHUTDOWN_PHRASES, SIGNAL_MESSAGES };
