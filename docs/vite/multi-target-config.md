# Vite multi-target config layout

> **Scope of this doc.** This file documents the multi-target Vite layout decided in [ADR-0001](../adr/0001-vite-multi-target-and-dev-runtime.md): one shared Vite base plus one thin config per runtime, composed via `mergeConfig`. The wired runtime is the Fastify server, run through `vite-node` in development. The shared base sets the contract any additional per-runtime config merges from; this doc describes the layout so a contributor adding a second runtime config drops it into a shape the base already supports.

The layout is built around one shared base plus one thin Vite config per runtime, composed via `mergeConfig` from `vite`:

- **Shared base** — owns the keys every runtime pays for (alias resolution, and any env / define defaults a runtime config would inherit). Kept small: every key here is one both a current and a future runtime agree on.
- **Server config** — layers Node-side resolve on top of the base. It drives the Fastify entry through `vite-node` in development (`vite-node` loads TypeScript and applies the Vite plugin/transform pipeline on demand; pair with `--watch` for reload).

Each runtime's concerns diverge — plugin set, externals, output format, and `resolve.conditions` differ between a Node runtime and a browser one — which is why the convention is one config per runtime rather than one config with `mode` branching.

## What the server runtime needs from Vite

| Concern              | Server (Fastify, `vite-node`)                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite plugin set      | Alias resolution via the shared base; nothing visual.                                                                                               |
| `resolve.conditions` | `node`.                                                                                                                                             |
| Alias resolution     | Inherited from the shared base, which opts in to Vite's built-in tsconfig-paths resolution so the TypeScript `paths` block is the single alias map. |

A Node runtime layers `resolve.conditions: ["node"]` in its own config; the shared base stays free of `resolve.conditions` so a browser runtime added later does not inherit `node` (and vice versa) through `mergeConfig`'s array concatenation.

## File layout

Two files today, related by composition:

- A **shared base** — common resolve options (including the tsconfig-paths opt-in), and any define / envPrefix defaults a runtime would inherit.
- A **server config** — Node-side resolve layered on the base.

Both live together in a single tooling directory (location is a project choice). Neither is loaded by a CLI that needs the repo root: `vite-node` takes an explicit `--config` flag for the server config, and the shared base is imported as a module, never loaded directly. Keep both out of source globs so application code never imports from them.

Adding a runtime is mechanical: drop another `<name>.config.ts` next to the shared base, merge from it via `mergeConfig`, and point the runner at it. A runtime whose CLI relies on Vite's default config discovery (which looks for `vite.config.ts` at the repo root) would place its config at the root; a runner that accepts an explicit `--config` flag can keep its config in the tooling directory.

## Shape of each file

The blocks below are **outlines**, not runnable snippets — comments stand in for keys a real config would set. `mergeConfig` from `vite` deep-merges; arrays (`plugins`, `resolve.conditions`) are concatenated, so items unique to a runtime live in that runtime's file, not in the base.

### Shared base

The base owns everything every runtime agrees on. Keep it small — every key here is a key every runtime pays for.

```ts
// Outline — not runnable
import { defineConfig } from "vite";

export default defineConfig({
  // resolve options shared by every runtime, e.g. the built-in
  // tsconfig-paths opt-in (built into Vite 8+; pre-8 needs a plugin);
  // any define / envPrefix defaults a runtime would inherit.
});
```

### Server config

Drives `vite-node` in development. Imports the base and adds Node-specific resolve on top.

```ts
// Outline — not runnable
import { defineConfig, mergeConfig } from "vite";

import sharedConfig from "./shared.config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    resolve: {
      conditions: ["node"],
    },
  }),
);
```

## Dev runtime — the server through `vite-node`

In development, `vite-node` runs the Fastify entry against the server config (passed via its `--config` flag). The server file imports Fastify, registers plugins, and starts listening. `vite-node` transforms each TypeScript module on demand using that Vite config — alias resolution and TS handling come from there. Pairing the runner with `--watch` reloads on source change.

## Why this layout

- **Each runtime's config reads on its own.** Opening the server config shows only server concerns; there are no `mode === "..."` branches to filter mentally.
- **Tooling jumps to the right file.** `vite-node` takes a `--config` flag; one file per command, found via the path the runner expects.
- **Externals stay honest.** Any server-side `noExternal` / `external` overrides live in the server config alone; a second runtime config cannot accidentally inherit them.
- **Adding a runtime is mechanical.** Drop another `<name>.config.ts`, merge from the same base, point the runner at it.

## Alternatives

### Vite Environments API (single config, named environments)

First-class in Vite 6+, stable in Vite 8. One config defines `environments: { … }`, and a single `vite build` builds them all. Rejected on **lifecycle-isolation** grounds: separate runtimes watch different file sets, restart on different signals, and have independent failure modes — folding them into one `environments` map ties their startup, watch, and restart lifecycles together. Keeping each runtime in its own file (and its own runner process) preserves that isolation.

### Single `defineConfig(({ mode }) => …)` with mode branching

One file, big ternary on `mode`. Plugin arrays get spliced, externals get conditionally added, the file becomes a config DSL rather than a config. Rejected because it scales by adding cleverness instead of files.

### No Vite on the server — a Vite-free alternative

Run the server with `node` directly (Node ≥22 native TS stripping). Works, but server code can't use Vite-resolved aliases without a parallel `tsconfig.paths` mirror, and dev-time TS loading is whatever Node's stripper supports — no Vite plugins, no env defines applied to server modules. Rejected because `vite-node` collapses the dev-time toolchain to a single tool and aligns dev-time TS handling with the rest of the Vite pipeline.

**Forward note.** The upstream direction is Vite's own Module Runner (the Environments API). Vitest 4 dropped its `vite-node` dependency in favour of Vite's Module Runner; `vite-node` remains usable as a standalone package today, which is what this project's dev runner uses. The pattern here (one Vite config per runtime) survives that shift; only the dev-time runner swaps.

## Related

- The decision to take this layout (over the Environments API, mode branching, or the plain-Node server) is recorded in [ADR-0001](../adr/0001-vite-multi-target-and-dev-runtime.md). This file documents the **pattern**; the ADR records the **decision** and the alternatives weighed.
