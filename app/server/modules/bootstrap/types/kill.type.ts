type PidLookupResult =
  | { found: true; pid: number }
  | { found: false; reason: "unsupported-platform" | "no-pid" };

type KillPortOwnerResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unsupported-platform" | "no-pid" | "kill-threw";
    };

type KillFailureReason = Exclude<KillPortOwnerResult, { ok: true }>["reason"];

// Windows netstat -ano LISTENING row: [proto, localAddr, foreignAddr, "LISTENING", pid].
type ListeningRow = readonly [
  string,
  string,
  string,
  "LISTENING",
  string,
  ...string[],
];

export type {
  KillFailureReason,
  KillPortOwnerResult,
  ListeningRow,
  PidLookupResult,
};
