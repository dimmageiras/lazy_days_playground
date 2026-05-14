type PidLookupResult =
  | { found: true; pid: number }
  | { found: false; reason: "unsupported-platform" | "no-pid" };

type KillPortOwnerResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unsupported-platform" | "no-pid" | "kill-threw";
    };

export type { KillPortOwnerResult, PidLookupResult };
