import type { Signals } from "close-with-grace";

const SIGNALS_ERROR_MESSAGES = new Map<Signals, string>([
  ["SIGABRT", "Process aborted (SIGABRT). Shutting down."],
  ["SIGBUS", "Bus error — invalid memory access (SIGBUS). Shutting down."],
  ["SIGFPE", "Arithmetic exception (SIGFPE). Shutting down."],
  ["SIGHUP", "Controlling terminal disconnected (SIGHUP). Shutting down."],
  ["SIGILL", "Illegal instruction (SIGILL). Shutting down."],
  ["SIGINT", "Interrupted by user — Ctrl+C (SIGINT). Shutting down."],
  ["SIGQUIT", "Quit requested (SIGQUIT). Shutting down."],
  ["SIGSEGV", "Segmentation fault (SIGSEGV). Shutting down."],
  ["SIGTERM", "Termination requested (SIGTERM). Shutting down gracefully."],
  ["SIGTRAP", "Trace / breakpoint trap (SIGTRAP). Shutting down."],
  ["SIGUSR2", "User-defined signal received (SIGUSR2). Shutting down."],
]);

export { SIGNALS_ERROR_MESSAGES };
