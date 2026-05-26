# 0006. pnpm supply-chain stance — playground posture

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

The npm ecosystem has two recurring supply-chain failure modes the package manager can defend against: malicious or compromised packages published recently (where the community has not yet had time to flag or yank them — the "left-pad-style" class of incident) and packages whose dependency graph reaches sideways into git-, file-, or http-specifier resolutions that bypass the registry's normal review surface. Modern pnpm offers a defaults-and-toggles surface for both: a minimum release-age gate that delays installing recently-published versions, an exotic-subdep block, an opt-in postinstall-script allowlist, and a self-management toggle that keeps every contributor on the same pnpm version regardless of their global install.

Each toggle has a posture cost. The release-age gate trades freshness for safety: a project that accepts only packages published 24+ hours ago cannot adopt a same-day patch release. The script allowlist trades convenience for opt-in: a dependency that needs a native build step has to be audited and added by hand. The exotic-subdep block trades flexibility for predictability: a dep tree that reaches into a git fork cannot install at all.

This project is a learning playground with no external deployment surface. The trade-off between freshness and safety reads differently than it would for a deployed service: the cost of waiting 24 hours on a same-day fix is high (it blocks the inner loop), and the cost of being briefly exposed to a recently-published bad version is low (no production blast radius). The decision below picks the playground-appropriate posture explicitly, with a precondition recorded so the posture has to be revisited the moment the project gains any external surface.

## Decision

The project pins the following pnpm settings as a single posture:

- **`minimumReleaseAge: 0`** — accept zero-day packages; do not block on the recently-published gate.
- **`blockExoticSubdeps: true`** — reject any dependency in the resolution graph whose specifier is `git+`, `file:`, or `http:`-based.
- **`allowBuilds: []`** — empty install-script allowlist; no package may run its postinstall or build script during install without an explicit entry added by audit.
- **`manage-package-manager-versions: true`** — pnpm self-updates to the version pinned in `package.json#packageManager` on every install, so contributors converge on the project's pinned pnpm regardless of their global install.

The combination is the playground posture; per-setting rationales live in inline comments in the workspace config file. The precondition for this posture is that the project has **no external deployment surface**. The first PR that gives the project one — a deployed service, a published package, a public-facing build — has to revisit this ADR.

## Alternatives considered

### pnpm defaults (`minimumReleaseAge` of 24 hours)

The conservative posture: install only packages published at least 24 hours ago, leaving the rest of the toggles at their defaults. Rejected for this stage of the project because the inner loop benefits from same-day patches and the production blast radius does not yet exist; the gate becomes correct again once external deployment lands.

### Stricter — minimum release age plus full allowlist audit

Combine the recently-published gate (24-hour or longer) with a fully audited install-script allowlist and the exotic-subdep block. Rejected as premature: the project is small enough that the audit surface today is essentially the package count, and the audit work pays off when the dep tree grows or the deployment surface appears, not before.

### Looser — drop the exotic-subdep block and the empty allowlist

The most permissive posture: accept any specifier, let any postinstall script run. Rejected on defence-in-depth grounds: both toggles are nearly free at this dep-tree size, and the cost of removing a malicious or compromised script post-install is much higher than the cost of pinning the toggles on. The release-age gate is the only setting where the freshness/safety trade flips for this project; the other defences are kept on.

### Per-package overrides instead of a global posture

Keep the defaults and override per-package as friction arises (whitelist this package's build script, allow this exotic subdep). Rejected because it produces an unreviewable patchwork — every exception lives in a different surface (overrides, allowlists, resolution patches) and the cumulative posture becomes opaque. A single declared stance is easier to read, easier to revisit, and easier to flip when the deployment surface changes.

## Consequences

- **Same-day patches install immediately.** The inner loop is not gated on a release-age window; a freshly published patch can land in the next install. The risk window for a malicious or compromised same-day version is accepted.
- **Postinstall scripts do not run.** A new dependency that needs to compile a native binary or run a build step at install time fails loudly; the response is an audit and a deliberate entry in the allowlist, never a silent enable.
- **Exotic specifiers fail at install.** A dependency that pulls in a git, file, or http subdep — directly or transitively — cannot install. The expected fix is upstream (file an issue, pin to a registry release), not loosening the toggle.
- **Pnpm versions are uniform across contributors.** A contributor without Corepack installed still converges on the version the project pins, removing a class of "works on my machine" install drift.
- **The posture has a precondition.** The moment the project has any external deployment surface — a deployed service, a published package, a build that consumers run — this ADR has to be revisited. The release-age gate, in particular, flips from "blocks the inner loop" to "is the cheapest supply-chain defence available" the moment there is a production blast radius.
- **Per-setting rationales stay in the workspace config.** Inline comments record why each toggle is set the way it is at the granularity a contributor will hit when they touch the file; this ADR records the **overall posture** and the precondition, not the per-setting prose.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the build configuration this dependency tree feeds.
- [`../code-reviews/plans/configuration.plan.md`](../code-reviews/plans/configuration.plan.md) — review criteria for changes to the workspace configuration.
