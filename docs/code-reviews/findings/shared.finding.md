# Code Review Findings: Shared Utilities

## Summary

- Total findings: 10
- Blockers: 0
- Warnings: 4
- Nits: 4
- Info: 2

Overall verdict: The shared layer is small, disciplined, and almost entirely matches the project's stated conventions: every constants object uses `Object.freeze({...} as const)` correctly, names are concept-led, the timing pattern is followed, and the `TimingHelper` namespace mirrors its filename. The strongest issues are (a) the `TimingHelper` namespace object is not itself frozen or `as const`, leaving the helper surface mutable and untyped at the literal level; (b) several HTTP status names violate the "external spec / platform" rule (`MANY_REQUESTS_ERROR` re-names a standard code, `CSRF_TOKEN_MISMATCH: 419` is a Laravel-specific code, not an IANA-registered status); (c) the `HOSTS` group names IPv4 and IPv6 loopback inconsistently and conflates "bind all" with "IPv4-only bind all" (`0.0.0.0` does not bind on IPv6); and (d) the JSDoc on each `HTTP_STATUS` member paraphrases the key, directly violating the project's code-comments rule. Several constants are unused today, which the plan tolerates for genuine primitive libraries but is worth surfacing. Nothing here is a merge blocker; the warnings should be resolved before the next promotion of a shared constant.

## Findings

### [warning] `TimingHelper` namespace is mutable and lacks literal-type narrowing

**File:** `app/shared/helpers/timing.helper.ts:4-6`
**Skill / criterion:** typescript-magician (`as const` for literal narrowing) + plan focus "Helpers exported via a namespace object" + plan focus "Immutability" (parallel concern for helper namespaces)

The helper export is a plain object literal:

```ts
export const TimingHelper = {
  delay,
};
```

Compared to every constants file in this layer (`HOSTS`, `HTTP_STATUS`, `METHODS`, `PROTOCOLS`, `TIMING`) which all use `Object.freeze({...} as const)`, the helper namespace is:

1. Mutable at runtime — a consumer can do `TimingHelper.delay = () => Promise.resolve()` and silently break callers. Tests can spy by reassignment, which is exactly the footgun the freeze pattern is meant to prevent.
2. Typed as `{ delay: (ms: number) => Promise<void> }` rather than a readonly record. There is no literal narrowing, but more importantly there is no `Readonly<...>`/`as const` to communicate intent.

This is the same convention used by the bootstrap helpers (`ListenHelper`, `ShutdownRequestHelper`, etc.), so fixing it here either sets a new precedent worth propagating or, at minimum, gets the shared layer aligned with the explicit freeze discipline applied to its own constants.

**Suggested fix:**

```ts
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const TimingHelper = Object.freeze({
  delay,
} as const);

export { TimingHelper };
```

(Also switches to a named export at the bottom to match the constants-file pattern and avoid mixing `export const` with the freeze.)

---

### [warning] `MANY_REQUESTS_ERROR` renames the standard "Too Many Requests" status and adds an inconsistent `_ERROR` suffix

**File:** `app/shared/constants/network.constant.ts:26-27`
**Skill / criterion:** plan focus "external spec" test + Naming (concept-led keys, consistent within group)

```ts
/** 429 - Many Requests Error (rate limit exceeded) */
MANY_REQUESTS_ERROR: 429,
```

IANA / RFC 6585 calls HTTP 429 **"Too Many Requests"**. The constant key drops the leading `TOO_` and appends `_ERROR`, which:

- Breaks the plan's "is this defined by an external spec?" test: when the spec name is well-known, the key should match it (`TOO_MANY_REQUESTS`).
- Is inconsistent with the rest of the group — `INTERNAL_SERVER_ERROR` is the only other key carrying `_ERROR`, and that one matches the spec phrase. None of the other 4xx codes (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`) are suffixed with `_ERROR`. The 4xx vs 5xx distinction is already in the numeric value.
- Hurts grep-ability: a developer searching for `TOO_MANY_REQUESTS` (the universally recognised name) finds nothing.

**Suggested fix:**

```ts
/** 429 Too Many Requests */
TOO_MANY_REQUESTS: 429,
```

---

### [warning] `CSRF_TOKEN_MISMATCH: 419` is a Laravel-specific code, not a standard HTTP status

**File:** `app/shared/constants/network.constant.ts:24-25`
**Skill / criterion:** plan focus "is this value defined by an external spec or platform … if yes, shared constant" — and its converse

```ts
/** 419 - CSRF Token Mismatch */
CSRF_TOKEN_MISMATCH: 419,
```

Status code 419 is **not** registered in the IANA HTTP Status Code Registry. It is a non-standard convention used by Laravel (and a few other frameworks) for CSRF token expiry; standard practice in IANA-conformant servers is to use 403 Forbidden or 400 Bad Request for CSRF failures. Including it in a shared `HTTP_STATUS` group:

- Implies it is part of the protocol-level vocabulary, which it is not.
- Sets a precedent for adding other framework-specific codes (e.g. Cloudflare's 520-527) to the same group, eroding the "external spec" boundary.
- Is currently unused anywhere in `app/` (verified via grep), so there is no incumbent consumer that would break on removal.

If/when the application genuinely needs to emit or interpret 419, the constant belongs in a CSRF-specific module's own `constants/` (e.g. a future `csrf.constant.ts`), not in the protocol-primitive group.

**Suggested fix:** Remove the entry from `HTTP_STATUS`. Reintroduce it inside the consumer module if it is ever actually needed.

```ts
const HTTP_STATUS = Object.freeze({
  OK: 200,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const);
```

---

### [warning] `HOSTS.BIND_ALL = "0.0.0.0"` only binds IPv4 — name implies otherwise, and the IPv6 counterpart is missing

**File:** `app/shared/constants/network.constant.ts:1-4`
**Skill / criterion:** Naming (concept-led, accurate) + plan focus "ambiguous names are disambiguated explicitly"

```ts
const HOSTS = Object.freeze({
  BIND_ALL: "0.0.0.0",
  LOOPBACK_IPV6: "::1",
} as const);
```

Two issues:

1. **`BIND_ALL` is misleading.** `"0.0.0.0"` binds all IPv4 interfaces only — it does not bind IPv6. The IPv6 wildcard is `"::"`. A reader who picks `BIND_ALL` and then runs on a dual-stack box gets surprising behaviour.
2. **Asymmetric naming.** `LOOPBACK_IPV6` is explicit about its address family, but its IPv4 sibling (the unspecified `BIND_ALL`) and the missing `LOOPBACK_IPV4` (`"127.0.0.1"`) are not. Either name both with their family or name neither.

Given that the only current consumer (`listen.helper.ts:18`) passes `BIND_ALL` to Fastify's `host` option, the IPv4-only behaviour is probably intentional — but the name should say so.

**Suggested fix:**

```ts
const HOSTS = Object.freeze({
  BIND_ALL_IPV4: "0.0.0.0",
  BIND_ALL_IPV6: "::",
  LOOPBACK_IPV4: "127.0.0.1",
  LOOPBACK_IPV6: "::1",
} as const);
```

Only add the keys that are actually needed today (`BIND_ALL_IPV4` and `LOOPBACK_IPV6`), but rename `BIND_ALL` → `BIND_ALL_IPV4` so the contract matches the value.

---

### [nit] HTTP_STATUS JSDoc comments paraphrase the keys

**File:** `app/shared/constants/network.constant.ts:10-31`
**Skill / criterion:** `.claude/rules/code-comments.md` ("Don't explain WHAT the code does"; "Default: don't write a comment")

Every entry carries a comment of the form `/** 200 - OK */`, `/** 202 - Accepted */`, etc. These add no information beyond the key + value already in the source:

- `OK: 200` plus `/** 200 - OK */` is pure duplication.
- A few entries do add WHY (e.g. `/** 401 - Authentication Required (no valid token) */`, `/** 403 - Forbidden (valid token but insufficient permissions) */`) — those carry real semantic signal and are worth keeping in a slimmed form.

Per the project rule, comments are justified when they convey a non-obvious WHY. Most of these don't.

**Suggested fix:** Drop the duplicative ones; keep the comments that disambiguate semantically overlapping codes.

```ts
const HTTP_STATUS = Object.freeze({
  OK: 200,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  /** No valid credentials. */
  UNAUTHORIZED: 401,
  /** Authenticated but not permitted. */
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const);
```

---

### [nit] Free-floating `/* … */` block above `HTTP_STATUS` describes its own consumers

**File:** `app/shared/constants/network.constant.ts:6-8`
**Skill / criterion:** `.claude/rules/code-comments.md` ("Don't reference the current task or callers") + plan focus "Codebase-agnostic naming … describe what they group, not which module uses them today"

```ts
/*
  HTTP status codes used across the application
*/
```

The phrase "used across the application" is the consumer-led framing the plan warns against, and the comment as a whole adds nothing the identifier `HTTP_STATUS` does not already say. It is also a plain block comment, not a JSDoc — inconsistent with the per-key `/** */` comments below it.

**Suggested fix:** Delete the block. The identifier is self-describing.

---

### [nit] `network.constant.ts` is a broad bucket that mixes four conceptual groups

**File:** `app/shared/constants/network.constant.ts:1-46`
**Skill / criterion:** plan focus "Cohesion — each constants file holds one conceptual group, or several closely-related groups exported from a single file when the boundary is fuzzy"

The file currently exports `HOSTS`, `HTTP_STATUS`, `METHODS`, `PROTOCOLS` — four distinct concepts. The plan explicitly allows "several closely-related groups exported from a single file when the boundary is fuzzy", so this is borderline rather than wrong. Things to watch:

- `HOSTS` is a network-layer / IP-address concept; the other three are application-layer / HTTP concepts. Folding them into the same file means the file name has to be generic ("network") rather than specific ("http").
- As `HTTP_STATUS` grows (every new status added) and `HOSTS` grows (every new address-family constant), the file becomes a junk drawer that is hard to grep by concept.

Not a blocker today — the file is short — but worth flagging that the next addition is a natural split point.

**Suggested fix (when the file next grows):** Split into `http.constant.ts` (statuses, methods, protocols — all HTTP-layer) and `host.constant.ts` (IP/hostname literals — IP-layer).

---

### [nit] `Object.freeze` return type is not fully captured at the type level

**File:** `app/shared/constants/network.constant.ts:1,9,34,41`, `app/shared/constants/timing.constant.ts:1`
**Skill / criterion:** typescript-magician (`as const` + `typeof` for literal narrowing) + plan focus "as const is on the object literal, not on the freeze wrapper"

The pattern in use is `Object.freeze({...} as const)`, which is what the plan asks for. One subtlety: TypeScript's standard-library `ObjectConstructor.freeze` is typed as `freeze<T>(o: T): Readonly<T>` and **does not preserve the deep readonly literal type** in older `lib.d.ts` versions — though current TS resolves it to `Readonly<{ readonly K: V; ... }>` which is fine here.

If consumers ever want the inferred type (`typeof HTTP_STATUS`) to be assignable to a function parameter typed as `Readonly<Record<string, number>>`, that already works. But if a consumer wants the **union of values** (e.g. `type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]`), they get the literal union as expected — the current pattern is fine for that use case.

No change required; this is an FYI that the pattern compiles to the right shape. The reason it's listed as a nit rather than info: there's a marginally clearer alternative if these are ever needed as a typed union:

**Suggested (optional) refinement** — expose the value-union as a named type to save downstream duplication:

```ts
const HTTP_STATUS = Object.freeze({ /* ... */ } as const);
type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export { HTTP_STATUS };
export type { HttpStatus };
```

Add only when a consumer actually needs `HttpStatus` — don't speculate.

---

### [info] Many `TIMING` keys are currently unused

**File:** `app/shared/constants/timing.constant.ts:1-20`
**Skill / criterion:** code-review-and-quality "Dead Code Hygiene" + plan focus "is this truly constant?"

Only 5 of the 18 TIMING keys are referenced outside the file itself (all by `app/server/modules/bootstrap/constants/bootstrap.constant.ts`):

| Used                                                                                                       | Unused                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SECONDS_FIVE_IN_MS`, `SECONDS_ONE_TENTH_IN_MS`, `SECONDS_TEN_IN_MS`, `SECONDS_THREE_IN_MS`, `SECONDS_TWO_IN_MS` | `DAYS_SEVEN_IN_S`, `MINUTES_FIFTEEN_IN_MS`, `MINUTES_FIFTEEN_IN_S`, `MINUTES_FIVE_IN_MS`, `MINUTES_FIVE_IN_S`, `MINUTES_ONE_IN_MS`, `MINUTES_TEN_IN_MS`, `MINUTES_TEN_IN_S`, `SECONDS_HALF_IN_MS`, `SECONDS_ONE_IN_MS`, `SECONDS_TEN_IN_S`, `SECONDS_THIRTY_IN_MS`, `YEARS_ONE_IN_S` |

This is the kind of file where a "primitives library" defense applies: durations are universal vocabulary, and pre-defining them all avoids drive-by additions later. The plan tolerates that framing. However, the standard dead-code-hygiene practice from `code-review-and-quality` is to surface this explicitly and ask. Two reasonable resolutions:

1. **Trim.** Delete every key with zero references; reintroduce on first use. Smallest surface, easiest to grok.
2. **Keep, and accept it as a vocabulary list.** Document the policy ("this file is a duration vocabulary — entries don't need a consumer to exist") in the file or in `state-management.md`-style rules so future reviewers don't re-flag it.

**Suggested fix:** Pick a policy. If unsure, default to (1) — primitive durations are cheap to add when actually needed, and a leaner file is easier to scan.

---

### [info] Currently only one consumer of TIMING and TimingHelper

**File:** `app/shared/constants/timing.constant.ts`, `app/shared/helpers/timing.helper.ts`
**Skill / criterion:** plan focus "A constant that ends up consumed by exactly one module belongs in that module's own `constants/`, not in `shared`"

`TIMING` is consumed only by `app/server/modules/bootstrap/constants/bootstrap.constant.ts` (it composes the bootstrap-specific timing constants out of the shared primitives). `TimingHelper.delay` is consumed only by `app/server/modules/bootstrap/helpers/listen.helper.ts`.

By the strict reading of the plan, both could move down into the bootstrap module. But:

- `TIMING` is a duration **vocabulary** (5,000 ms, 10,000 ms, etc.), not a duration **policy** (timeout for cooperative handover, etc.). The vocabulary is genuinely module-agnostic; the bootstrap module's role is to compose policy values from it. That mapping is exactly how the layer is supposed to work.
- `delay` (a promise-based sleep) is a textbook cross-cutting helper — it just happens that only one module needs it today.

So this is an observation, not a fix request: the shared layer is doing its job, but a future reviewer should re-evaluate if `TIMING` / `TimingHelper` is **still** the only thing in `shared/` after the next module lands. If a second module never consumes them, the "two-consumer" justification is just theoretical.

**Suggested fix:** None. Re-evaluate on next module addition.

---

## Strengths observed

- Every constants object uses `Object.freeze({...} as const)` — the `as const` is correctly placed on the object literal so consumers get literal-type narrowing, and the runtime freeze is real.
- Timing constants consistently follow the `<UNIT>_<AMOUNT>_IN_<UNIT>` pattern, including the explicit disambiguation `ONE_TENTH` (ordinal vs fractional, per plan focus).
- Named exports throughout — no default exports, tree-shaking-friendly, no top-level side effects in any file.
- Consumers correctly destructure at module scope (e.g. `const { LOOPBACK_IPV6 } = HOSTS;` in `shutdown.route.ts`), avoiding deep accessor chains at use sites — matches the plan's "Exports and consumption" guidance.
- Helper-namespace name mirrors the filename (`timing.helper.ts` → `TimingHelper`), matching the project's convention used by `ListenHelper`, `CloseHelper`, `KillHelper`, etc.

## Out of scope

- The `BOOTSTRAP_TIMING` object in `app/server/modules/bootstrap/constants/bootstrap.constant.ts` re-wraps shared `TIMING` values into bootstrap-specific names; whether that wrapping layer is the right shape (vs. consuming `TIMING` directly at the call site, vs. exposing the timeouts through server options) is a bootstrap-module / configuration concern.
- The `SIGNALS` and `SIGNALS_ERROR_MESSAGES` constants in the same bootstrap file mix a `Record<Signals, Signals>` (typed for completeness) with a `Map<Signals, string>` (which loses literal types) — a typing-consistency point that belongs to the bootstrap review.
- Whether `BIND_ALL_IPV4` and the loopback host should flow through the server's options layer (per the plan's "would you change this in `.env.staging`?" test) rather than being hard-coded shared constants — depends on the server-composition design and is a configuration review concern.
- The `@shared/` path alias mapping (in `tsconfig.json` or equivalent) — wiring belongs to the build / TypeScript configuration review, not this one.
