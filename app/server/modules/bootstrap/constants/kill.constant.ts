import type { KillFailureReason } from "../types";

const KILL_FAILURE_MESSAGES = new Map<KillFailureReason, string>([
  [
    "unsupported-platform",
    "Cooperative path exhausted and force-kill is unsupported on this platform — aborting.",
  ],
  [
    "no-pid",
    "No listening process found owning port and port still in use — aborting.",
  ],
  [
    "kill-threw",
    "Failed to signal port owner and port still in use — aborting.",
  ],
]);

export { KILL_FAILURE_MESSAGES };
