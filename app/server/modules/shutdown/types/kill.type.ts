type KillPortOwnerResult =
  | { ok: true }
  | { ok: false; reason: "kill-threw" | "no-pid" | "self-pid" };

type KillFailureReason = Exclude<KillPortOwnerResult, { ok: true }>["reason"];

type PidLookupResult =
  | { found: true; pid: number }
  | { found: false; reason: "no-pid" };

export type { KillFailureReason, KillPortOwnerResult, PidLookupResult };
