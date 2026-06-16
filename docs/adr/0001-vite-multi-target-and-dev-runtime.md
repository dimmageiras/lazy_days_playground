# 0001. Multi-target Vite config and the vite-node dev runtime

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The project drives more than one thing through Vite's resolve-and-transform pipeline and intends to drive more. Today a Node-side framework server runs through that pipeline in development, and the test runner reuses the same resolution; a browser runtime is a plausible future addition. These targets agree on how module specifiers resolve (one alias scheme) but disagree on the rest — each needs its own export conditions, externals, and plugin set.

Two questions must be answered together: how to lay out the Vite configuration so shared truth stays shared while per-runtime concerns stay isolated, and which mechanism actually runs the server source in development given that it is server-side TypeScript, not a browser bundle. The forces:

- **One alias map, not several.** Every target — including tests — must resolve path aliases identically, or imports drift between runtime and tests.
- **No cross-contamination.** A value correct for one runtime (a Node export condition) must not silently bleed into a sibling that merges from the same base.
- **Independent lifecycles.** Each runtime owns its own watch set, restart triggers, and failure modes; coupling them into one orchestrated build is a regression in operability.
- **One transpilation path.** The host engine can strip TypeScript types natively, so the server could run on plain Node — but its source resolves aliases through, and reads its environment from, the Vite pipeline. Running it any other way means maintaining a second, parallel resolution story for the same source tree.

## Decision

Lay Vite configuration out as a **small shared base plus one thin config file per runtime composed with `mergeConfig`**, and run the server in development through the pipeline's **on-demand module runner** in watch mode — with **no production Vite build of the server at all**.

The decision has these facets:

- **Shared base holds only universal resolve truth.** It opts in to the bundler's built-in tsconfig-paths resolution, making the TypeScript `paths` block the single alias map for every target. It is imported as a module, never loaded directly by a CLI.
- **Each runtime config merges from the base and layers only its own concerns.** The server config adds the Node resolve condition on top; a future browser config would add its own conditions, externals, and plugins.
- **The base deliberately omits `resolve.conditions`** (and, by the same logic, externals and plugin sets). `mergeConfig` deep-merges but **concatenates arrays**, so any condition placed in the base would be inherited by every merging runtime — a Node condition would leak into a browser config and vice versa. Anything a sibling must not inherit stays in the runtime file.
- **One config file per runtime** — not one config that branches on mode, not the bundler's Environments API. The grounds are lifecycle isolation: each runtime keeps its own file and its own runner process, so its watch, restart, and failure lifecycle stay independent.
- **The same base feeds the test runner**, which merges from it exactly as a runtime config does. A spec resolves an alias the same way the running server does, so a spec cannot pass against resolution the runtime does not use.
- **The dev runtime is the on-demand module runner in watch mode.** It transforms each TypeScript module on demand through the shared pipeline — so the server resolves identically to everything else — and reloads on source change by restarting the process, not by in-process hot replacement.
- **Runtime transpilation and type checking are split and never overlap.** The transform pipeline turns TypeScript into running code and owns alias resolution; the standalone solution-references type-checker owns type checking and declaration emit and never produces runtime output. There is no root-level bundler build config, no build command, and no emitted server bundle.
- **Explicit-mode selection drives file naming.** Because module and environment selection is driven by an explicit mode flag passed to the runner rather than the tool's conventional default mode, per-mode files are named by that explicit mode suffix, not by the tool's conventional environment names. The explicit flag is what selects which file loads.

## Alternatives considered

- **Single config that branches on mode.** One file with a large conditional on `mode` — plugin arrays spliced, conditions and externals behind ternaries. Rejected: the file becomes a config DSL you must mentally filter by mode to read, and it scales by adding cleverness instead of adding files; per-runtime concerns stop reading on their own.
- **The bundler's Environments API (single config, named environments).** One config declares all environments and a single build command drives them together. Rejected on lifecycle-isolation grounds: separate runtimes watch different file sets, restart on different signals, and fail independently; folding them into one environments map ties those lifecycles together.
- **A condition (or all conditions) in the shared base** to "save repetition." Rejected: array concatenation means a base-level condition is inherited by every merging runtime. The repetition saved is small; the silent cross-contamination it invites is not.
- **A separate resolve config for tests.** Rejected: two sources of resolve truth drift, and tests would no longer prove the runtime's own resolution works. Merging from the one base keeps tests and runtime honest about the same alias map.
- **Plain Node with native type stripping and the process environment.** Run the server directly on Node, reading config from the process environment. Rejected: the server source resolves aliases through, and reads its build-time environment object from, the Vite pipeline; plain Node would require mirroring alias resolution separately and would not populate that environment object. This is a knowing divergence from the native-no-build-step guidance the Node and framework references otherwise recommend.
- **A production bundle for the server.** Add a build step emitting an optimised server bundle. Rejected as unwarranted complexity: a server-side runtime gains little from bundling, and a build artifact adds a second runtime-transpilation path to keep in sync with the dev one.
- **Files named by the tool's conventional mode names.** Rejected: selection is driven by an explicit mode flag, not the conventional default — naming files after names the runner never resolves to would leave them silently unused and mislead the next reader about which file is live.

## Consequences

**Positive**

- Each runtime config reads on its own — opening it shows only that runtime's concerns, with no mode branches to filter mentally.
- Adding a runtime is mechanical: drop another thin config beside the base, `mergeConfig` from it, point a runner at it.
- One alias map across runtime and tests, because both inherit the same base; a spec cannot pass against resolution the runtime does not use.
- Cross-contamination is structurally prevented for the array-valued keys (conditions, plugins, externals): a runtime can only inherit what the base actually holds, and the base holds only universally-agreed resolve options.
- One mechanism owns dev-time transpilation and alias resolution, with no parallel alias map to maintain and a short edit-to-run loop; no build artifact means no bundle to keep in sync.
- Type errors are caught by the dedicated type-checker rather than masked by a transpile-only runtime, keeping the two concerns independently ownable.

**Negative (accepted)**

- Genuinely shared per-runtime keys are repeated across runtime files rather than hoisted, because hoisting an array into the base would leak it via concatenation. This is the deliberate cost of the isolation guarantee.
- Each runtime needs its own runner invocation (its own explicit config flag or default-discovery placement) instead of one orchestrated command — more entry points to wire, traded for independent lifecycles.
- The array-concatenation rule is a sharp edge a contributor must know before editing the base; the omitted conditions look like an oversight unless this reasoning is understood.
- The dev runtime couples to a single standalone runner whose upstream future is uncertain: the ecosystem is moving toward the bundler's own module-runner mechanism, and a sibling tool in the same family has already dropped this runner in favour of it. The pattern survives that shift — only the dev-time runner would swap — but a migration is foreseeable.
- Choosing the pipeline over native execution, and the explicit-mode-suffixed file naming over the tool's documented convention, are deliberate divergences a contributor arriving with general Node/framework background has to learn.

## Related

- [`./0002-typescript-compiler-stance.md`](./0002-typescript-compiler-stance.md) — the solution-references type-checker that owns type checking and declaration emit, the other half of the transpile/type-check split.
- [`./0003-path-alias-scheme.md`](./0003-path-alias-scheme.md) — the path-alias scheme the shared base opts into as the single alias map.
- [`./0005-test-runner-worker-model.md`](./0005-test-runner-worker-model.md) — how the test runner uses the inherited base beyond resolve (worker model, isolation, concurrency).
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the startup validation gate that runs against the environment this runtime injects, before any framework instance exists.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the server lifecycle and readiness boundary the dev runtime starts.
- [`../vite/multi-target-config.md`](../vite/multi-target-config.md) — the pattern documentation: file layout, the shape of each config, and the contributor walkthrough for adding a runtime.
