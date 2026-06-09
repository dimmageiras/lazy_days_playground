type KillPortOwnerResult =
  | { ok: true }
  | { ok: false; reason: "no-pid" | "kill-threw" };

type KillFailureReason = Exclude<KillPortOwnerResult, { ok: true }>["reason"];

type PidLookupResult =
  | { found: true; pid: number }
  | { found: false; reason: "no-pid" };

export type { KillFailureReason, KillPortOwnerResult, PidLookupResult };
