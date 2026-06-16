# 0004. pnpm dependency and supply-chain stance

- **Status:** Proposed
- **Date:** 2026-06-14

## Context

This repository is a learning playground that tracks the leading edge of its tooling by hand and is explicitly not built for production deployment. That single premise reshapes every dependency-management trade-off below, so the choices are recorded as one stance rather than scattered conventions.

Four forces are in tension:

- **Supply-chain safety.** The package manager ships install-time defences — a release-age floor that quarantines freshly published versions, a block on dependencies declared with exotic specifiers anywhere in the resolution graph, and a gate that stops dependencies running install/postinstall scripts unless allowlisted. Their value depends on whether a compromised release can reach something deployed.
- **Leading-edge workflow.** The whole point of the repo is to install new versions the day they land; a defence that delays that is friction, not protection, here.
- **Reproducibility and visibility.** Two installs of the same manifest, on two machines or two days apart, should resolve the same tree, and any version move should be a deliberate, reviewable diff — not a silent consequence of when an install ran.
- **Onboarding and config legibility.** Every contributor and CI run must use the same package-manager version without a fragile per-machine setup step, and the whole stance should be readable from the config files alone.

## Decision

Adopt one premise-bound dependency stance: relax exactly the defence whose strictness impedes the leading-edge workflow, keep every other supply-chain gate strict, pin everything else, and make the package-manager version self-converge. Its facets:

- **Install-time supply-chain posture — one relaxation, two strict gates.** Set the release-age floor to zero so leading-edge versions install the day they publish; this is the sole relaxation, justified only by the no-deploy premise, and it carries an inline tripwire to revisit before any external release. Pin the exotic-subdep block on (already the default, pinned so a future loosening shows as a visible diff rather than an inherited default change). Pin the install/postinstall-script allowlist explicitly empty: no dependency runs build scripts, and a package earns an entry only after its build script is audited. The empty list is enforceable today because nothing in the tree needs to build.
- **Exact-version pinning, lockfile as backstop.** Pin every direct dependency and devDependency in the manifest to an exact version — no caret, no tilde. The committed lockfile pins the resolved transitive tree for reproducibility; exact specifiers make the human-facing manifest agree with it, so every version move is an explicit manifest edit a reviewer approves. One deliberate carve-out: the Node type-definitions devDependency carries a caret on its major, letting the ambient typings follow upstream corrections without a hand-bump each release. It is types-only with no runtime footprint, and the lockfile still records the single resolved version.
- **Corepack-free version convergence.** Name the exact package-manager version in the manifest and enable the package manager's self-management flag so it self-converges to that pin on every install. The pin and the flag are a unit — neither works alone — and the onboarding contract is one command: install any recent package manager globally, run an install, and it swaps to the pinned version. No Corepack enable step.
- **One config home.** All package-manager-specific settings live in the workspace settings file (the supported location since the package manager narrowed the npm-config file to registry/auth only); there is no npm-config file in the repo. The settings file carries no workspace-members field — there is no monorepo — and its header records that absence as intentional so a reader does not "fix" it.

## Alternatives considered

### Keep all install-time defences at their shipped defaults

Leave the release-age floor at its day-long value and say nothing in config. Rejected: the floor's benefit (a quarantine window before a compromised release reaches a deployment) is not collected here, while its cost is paid on every leading-edge bump; and saying nothing leaves the two strict gates resting on inherited defaults a future upgrade could flip without a diff.

### Relax everything because it is "just a playground"

Drop the release-age floor, allow exotic subdeps, and let build scripts run unrestricted. Rejected: the exotic-subdep block and the empty build-script allowlist cost nothing given the current tree, so relaxing them trades real attack surface (install-time code execution; resolution from untrusted sources) for no workflow benefit.

### Block build scripts globally with no allowlist mechanism

Disable install scripts entirely rather than maintaining an explicit (currently empty) allowlist. Rejected: a flat global disable offers no audited path to enable a single package that genuinely needs to build, so the first legitimate native dependency would force a coarse policy reversal. An explicit empty allowlist keeps the default at "deny" with a per-package, audit-gated escape hatch.

### Record the posture in a comment, not as explicit settings

Document intent in prose and rely on defaults for the strict gates. Rejected: pinning the strict gates as explicit settings is what makes a future loosening a reviewable diff; a comment over an implicit default does not survive a defaults change on upgrade.

### Caret (or tilde) ranges on dependencies

The conventional posture: float ranges on everything, lean on the lockfile. Rejected: it splits the source of truth — the manifest says "up to the next major/minor" while the lockfile says one version — and a later update can float a direct dependency and rewrite the lockfile with no manifest diff to anchor review. Tilde narrows the drift but keeps a range in the manifest for a benefit (unreviewed patch updates) the project does not want.

### Exact pins with no committed lockfile

Exact specifiers everywhere but no lockfile. Rejected: direct dependencies would be pinned while the larger, more security-relevant transitive tree still floats. The lockfile is what pins transitives; dropping it defeats the reproducibility goal.

### Exact pin on the type-definitions package too

Apply the no-exception rule uniformly. Rejected as friction with no payoff: the package is types-only and never reaches runtime, so pinning its patch would force a manual bump every upstream typings release; the caret on its major is the smaller, intentional surface.

### Corepack-based version convergence

Enable Corepack and let it provision the package manager from the manifest field. Rejected: it adds a per-contributor enabling step that must be performed once and re-verified after runtime upgrades, with reliability depending on how the runtime was installed. Self-management removes that step and keeps onboarding to one install command. Corepack stays viable; choosing it later means flipping the flag off and rewriting the onboarding instructions.

### Pin the version but skip self-management

Declare the version field but trust contributors to match it manually. Rejected: nothing enforces the match — a contributor on a different global version silently produces lockfile diffs, the exact drift the pin exists to prevent.

### Keep package-manager settings in the npm-config file

Retain the npm-config file for package-manager settings as in older setups. Rejected: the newer major narrowed that file to registry/auth only, so package-manager-specific keys placed there are no longer guaranteed to be read and a setting can silently stop taking effect after an upgrade.

### Add a workspace-members field to satisfy the file's name

Treat the workspace settings file as implying a members declaration and add one. Rejected as misleading: there are no sibling packages, and an empty or self-referential declaration invites a reader to assume a monorepo that does not exist; the intentional-absence note is the clearer signal.

## Consequences

**Positive**

- The whole stance is legible from the config files: a reviewer sees which defence was relaxed, which were hardened, the exact pins, the version pin, and the self-converge flag, with no second config surface to keep in sync.
- Leading-edge version bumps install the day they publish, removing the friction the release-age floor would impose.
- The two strict gates are pinned, so any future weakening surfaces as an explicit diff rather than an inherited default change; the empty allowlist keeps install-time code execution at zero with a per-package, audit-gated path to enable a build when genuinely needed.
- Manifest and lockfile tell the same story: reading the manifest tells a reviewer exactly what is installed, and every version move is a deliberate, reviewable diff that lands with its lockfile delta and any code change. Reproducibility holds across machines and time without relying on install timing.
- Onboarding is one command — any recent global package manager converges to the pinned version automatically — and the pinned version is enforced, not merely advertised, so resolution behaviour is consistent across machines and CI without a separate provisioning tool.

**Accepted negative**

- The repo forgoes the quarantine window that lets the ecosystem catch a compromised release before install; a malicious zero-day version can be pulled in. Acceptable only because nothing is deployed, and only until that stops being true — the relaxation is premise-bound and must be reconsidered as part of any move to ship externally, not after it.
- The empty allowlist requires an explicit, audited edit the first time a dependency with a legitimate native build step is added; that friction is intentional.
- Routine dependency maintenance is manual: every patch, minor, and major is a hand-edited bump with no "free" patch arriving on the next install. The project accepts this as the price of visibility, and it scales only because the dependency set is small. The single caret carve-out is a documented inconsistency a reader must know about so it is not copied as licence to add more ranges.
- The version pin and self-management flag are coupled and must be edited together; touching one without the other leaves the project half-configured. Reversing to Corepack is a deliberate, multi-part change (flip the flag off, decide how Corepack is enabled, rewrite onboarding). A reader expecting package-manager settings in the npm-config file (the older habit) will not find them; the workspace settings file is the only place to look, and the missing members field is the cue that this is a deliberate single-package layout.

## Related

- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the runtime input contract this stance does not own; complementary fail-fast discipline at a different layer.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the static-analysis side of supply-chain and code-quality defence; a sibling control surface to these install-time gates.
- [`../../README.md`](../../README.md) — states the no-production-deploy, leading-edge premise the entire stance depends on.
- [`../pnpm/parallel-script-execution.md`](../pnpm/parallel-script-execution.md) — operational pnpm notes, including the configuration-migration summary this decision relies on.
- [`./README.md`](./README.md) — ADR template, status, and lifecycle conventions.
