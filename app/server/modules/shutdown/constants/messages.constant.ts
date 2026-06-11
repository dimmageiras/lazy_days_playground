import type { Signals } from "close-with-grace";
import { Map } from "immutable";

import type { KillFailureReason } from "../types/kill.type";
import { SIGNALS } from "./signals.constant";

const KILL_FAILURE_MESSAGES = Map<KillFailureReason, string>([
  [
    "no-pid",
    "No listening process found owning the port and the port is still in use — aborting.",
  ],
  [
    "kill-threw",
    "Failed to signal the port owner and the port is still in use — aborting.",
  ],
]);

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

export { KILL_FAILURE_MESSAGES, SHUTDOWN_PHRASES, SIGNAL_MESSAGES };
