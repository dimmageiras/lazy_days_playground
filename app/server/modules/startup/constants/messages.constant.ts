import { Map } from "immutable";

import type { KillFailureReason } from "../types/kill.type";

const KILL_FAILURE_MESSAGES = Map<KillFailureReason, string>([
  [
    "kill-threw",
    "Failed to signal the port owner and the port is still in use — aborting.",
  ],
  [
    "no-pid",
    "No listening process found owning the port and the port is still in use — aborting.",
  ],
  [
    "self-pid",
    "The port owner resolved to this process — refusing to signal it and aborting.",
  ],
]);

export { KILL_FAILURE_MESSAGES };
